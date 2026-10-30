#!/usr/bin/env python3
"""
Alex Dispatch Webhook Server
============================
Runs on the Hostinger VPS at /opt/hermes-agent/dispatch/webhook_server.py
Receives HMAC-signed event POSTs from MGC Netlify functions and routes each
event to Hermes / Alex for processing.

Env vars (set in /data/.env or via systemd EnvironmentFile):
  ALEX_DISPATCH_SECRET     Shared HMAC-SHA256 secret (required)
  HERMES_BIN               Path to hermes binary  (default: hermes)
  ALEX_QUEUE_DIR           Durable queue directory (default: /data/alex-dispatch/queue)
  ALEX_LOG_DIR             Log directory           (default: /data/alex-dispatch/logs)
  ALEX_DISPATCH_PORT       Listening port          (default: 8080)

Wire-up:
  POST /webhook            Accepts signed event from Netlify
  GET  /health             Returns {"ok": true, "queued": <n>} — no auth required

Security:
  Every POST must carry header  X-MGC-Signature: sha256=<hex>
  computed as  HMAC-SHA256(key=ALEX_DISPATCH_SECRET, msg=raw_body)
  Requests with missing/wrong signatures are rejected 401 before the body is parsed.
"""

import hashlib
import hmac
import http.server
import json
import logging
import os
import pathlib
import queue
import subprocess
import sys
import threading
import time
from datetime import datetime, timezone

# ── Configuration ─────────────────────────────────────────────────────────────

SHARED_SECRET: str = os.environ.get("ALEX_DISPATCH_SECRET", "")
HERMES_BIN: str = os.environ.get("HERMES_BIN", "hermes")
QUEUE_DIR = pathlib.Path(os.environ.get("ALEX_QUEUE_DIR", "/data/alex-dispatch/queue"))
LOG_DIR = pathlib.Path(os.environ.get("ALEX_LOG_DIR", "/data/alex-dispatch/logs"))
PORT = int(os.environ.get("ALEX_DISPATCH_PORT", "8080"))

QUEUE_DIR.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOG_DIR / "webhook_server.log"),
    ],
)
log = logging.getLogger("alex-dispatch")

# In-memory work queue (backed by filesystem for durability)
_work_queue: queue.Queue = queue.Queue()

# ── Event → Alex prompt templates ─────────────────────────────────────────────
# Each template is passed to: hermes run --prompt "<text>"
# Keep prompts concise — Alex reads roles.json for routing details.

PROMPT_TEMPLATES = {
    "lead.submitted": (
        "MGC website lead submission received.\n"
        "Name: {name}\nEmail: {email}\nCompany: {company}\n"
        "Service interest: {service}\nMessage: {message}\n"
        "Source: {source}\n\n"
        "Action: You are Alex. Log this lead for Elena (BizDev). "
        "Send Mark a brief owner notification via Telegram with name, email, "
        "service interest, and source. Do not send customer email yet."
    ),
    "lead.qualified": (
        "MGC lead qualified for follow-up.\n"
        "Contact: {name} ({email}) — {company}\n"
        "Interest: {service}\nReadiness: {readiness_score}/100 ({readiness_category})\n"
        "Timeline: {timeline} | Budget: {budget_range}\n\n"
        "Action: You are Alex. Route to Elena (BizDev). "
        "Prepare a discovery follow-up draft using elena-rostova-bizdev/emails/templates/welcome.md. "
        "Set draft status READY_FOR_REVIEW. Notify Mark."
    ),
    "customer.onboarding_confirmed": (
        "MGC customer onboarding confirmed.\n"
        "Contact: {name} ({email}) — {company}\n"
        "Engagement: {engagement_id}\nConfirmed: {confirmed_at}\n\n"
        "Action: You are Alex. Route to Jordan (CustOps). "
        "Prepare one welcome-board draft using jordan-hayes-custops/emails/templates/welcome.md. "
        "Set draft status READY_FOR_REVIEW. Notify Mark."
    ),
    "support.ticket_created": (
        "MGC support ticket created.\n"
        "Ticket: {ticket_id}\nClient: {name} ({email})\n"
        "Subject: {subject}\nDetails: {message}\n\n"
        "Action: You are Alex. Route to David (TechSupport). "
        "Prepare a support acknowledgment draft using david-kim-techsupport/emails/templates/support-acknowledgment.md. "
        "Set draft status READY_FOR_REVIEW. Notify Mark."
    ),
    "invoice.issued": (
        "MGC invoice issued.\n"
        "Invoice: {invoice_id}\nClient: {name} ({email}) — {company}\n"
        "Amount: {amount} {currency} | Due: {due_date}\n\n"
        "Action: You are Alex. Route to Julian (Accounting). "
        "Verify the invoice record then prepare an invoice cover note draft "
        "using julian-vance-accounting/emails/templates/invoice-cover.md. "
        "Set draft status READY_FOR_REVIEW. Notify Mark."
    ),
    "technical.milestone_changed": (
        "MGC technical milestone update.\n"
        "Project: {project}\nMilestone: {milestone}\nStatus: {status}\n"
        "Details: {details}\n\n"
        "Action: You are Alex. Route to Marcus (CTO). "
        "Prepare a technical update draft using marcus-vance-cto/emails/templates/update.md. "
        "Set draft status READY_FOR_REVIEW. Notify Mark if action is needed."
    ),
    "escalation.requested": (
        "TrueAssist chat escalation — human review needed.\n"
        "Session: {session_id}\nVisitor: {visitor}\n"
        "Reason: {reason}\nTranscript excerpt:\n{transcript}\n\n"
        "Action: You are Alex. Send Mark an urgent owner brief via Telegram. "
        "Include session ID, visitor description, and the reason. "
        "Do not contact the visitor directly."
    ),
    "owner.update_requested": (
        "Owner status update requested by Mark.\n"
        "Scope: {scope}\nRequested at: {requested_at}\n\n"
        "Action: You are Alex. Consolidate verified status across all specialist roles. "
        "Prepare an owner brief using emails/channels/owner-brief.md. "
        "Deliver to Mark via Telegram."
    ),
}

FALLBACK_PROMPT = (
    "MGC dispatch event received.\n"
    "Event type: {event_type}\n"
    "Payload: {payload_summary}\n\n"
    "Action: You are Alex. Log this event, notify Mark via Telegram with a brief summary, "
    "and flag it for review if the event type is unrecognized."
)

# ── Signature verification ────────────────────────────────────────────────────

def verify_signature(raw_body: bytes, header: str) -> bool:
    """Constant-time HMAC-SHA256 check against X-MGC-Signature header."""
    if not SHARED_SECRET:
        log.error("ALEX_DISPATCH_SECRET is not set — rejecting all requests")
        return False
    if not header or not header.startswith("sha256="):
        return False
    expected = hmac.new(
        SHARED_SECRET.encode(), raw_body, hashlib.sha256
    ).hexdigest()
    given = header[len("sha256="):]
    return hmac.compare_digest(expected, given)

# ── Prompt builder ────────────────────────────────────────────────────────────

def build_prompt(event_type: str, payload: dict) -> str:
    template = PROMPT_TEMPLATES.get(event_type, FALLBACK_PROMPT)
    safe = {k: str(v)[:500] if v is not None else "" for k, v in payload.items()}
    safe["event_type"] = event_type
    safe["payload_summary"] = json.dumps(payload, default=str)[:800]
    try:
        return template.format_map(safe)
    except KeyError:
        return FALLBACK_PROMPT.format_map(safe)

# ── Queue persistence ─────────────────────────────────────────────────────────

def enqueue_event(event_type: str, payload: dict, event_id: str) -> pathlib.Path:
    """Write event to durable queue file, then add to in-memory queue."""
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    safe_type = event_type.replace(".", "-").replace("/", "-")
    path = QUEUE_DIR / f"{ts}_{safe_type}_{event_id[:12]}.json"
    record = {
        "event_id": event_id,
        "event_type": event_type,
        "received_at": datetime.now(timezone.utc).isoformat(),
        "payload": payload,
        "status": "queued",
    }
    path.write_text(json.dumps(record, indent=2))
    _work_queue.put(path)
    log.info("Queued %s → %s", event_type, path.name)
    return path

def mark_done(path: pathlib.Path, status: str, detail: str = ""):
    try:
        record = json.loads(path.read_text())
        record["status"] = status
        record["completed_at"] = datetime.now(timezone.utc).isoformat()
        if detail:
            record["detail"] = detail[:2000]
        path.write_text(json.dumps(record, indent=2))
    except Exception as e:
        log.error("Could not update queue file %s: %s", path, e)

# ── Hermes invocation ─────────────────────────────────────────────────────────

def invoke_hermes(prompt: str, timeout: int = 120) -> tuple[bool, str]:
    """
    Call the Hermes CLI with a one-shot prompt.
    Returns (success, output_or_error).
    """
    cmd = [HERMES_BIN, "run", "--prompt", prompt, "--no-interactive"]
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        if result.returncode == 0:
            return True, result.stdout.strip()
        err = (result.stderr or result.stdout or "").strip()
        log.error("Hermes exit %d: %s", result.returncode, err[:500])
        return False, err
    except subprocess.TimeoutExpired:
        log.error("Hermes timed out after %ds", timeout)
        return False, f"timeout after {timeout}s"
    except FileNotFoundError:
        log.error("Hermes binary not found at: %s", HERMES_BIN)
        return False, "hermes binary not found"
    except Exception as e:
        log.error("Hermes invocation error: %s", e)
        return False, str(e)

# ── Worker thread ─────────────────────────────────────────────────────────────

def worker():
    log.info("Dispatch worker started")
    while True:
        try:
            path: pathlib.Path = _work_queue.get(timeout=5)
        except queue.Empty:
            continue
        try:
            record = json.loads(path.read_text())
            event_type = record["event_type"]
            payload = record["payload"]
            log.info("Processing %s (%s)", event_type, path.name)
            prompt = build_prompt(event_type, payload)
            ok, output = invoke_hermes(prompt)
            if ok:
                log.info("Hermes completed %s", path.name)
                mark_done(path, "completed", output[:1000])
            else:
                log.error("Hermes failed %s: %s", path.name, output)
                mark_done(path, "failed", output)
        except Exception as e:
            log.error("Worker error on %s: %s", path, e)
            try:
                mark_done(path, "error", str(e))
            except Exception:
                pass
        finally:
            _work_queue.task_done()

# ── HTTP handler ──────────────────────────────────────────────────────────────

class DispatchHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):  # redirect to Python logger
        log.info("HTTP %s %s %s", self.address_string(), fmt % args, "")

    def send_json(self, status: int, body: dict):
        data = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path == "/health":
            queued = _work_queue.qsize()
            pending = sum(
                1 for f in QUEUE_DIR.glob("*.json")
                if json.loads(f.read_text()).get("status") == "queued"
            )
            self.send_json(200, {"ok": True, "in_memory": queued, "pending_files": pending})
        else:
            self.send_json(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/webhook":
            self.send_json(404, {"error": "not found"})
            return

        length = int(self.headers.get("Content-Length", 0))
        if length > 64 * 1024:  # 64 KB max
            self.send_json(413, {"error": "payload too large"})
            return

        raw_body = self.rfile.read(length)
        sig_header = self.headers.get("X-MGC-Signature", "")

        if not verify_signature(raw_body, sig_header):
            log.warning("Rejected request from %s — bad signature", self.client_address[0])
            self.send_json(401, {"error": "unauthorized"})
            return

        try:
            payload = json.loads(raw_body)
        except json.JSONDecodeError:
            self.send_json(400, {"error": "invalid JSON"})
            return

        event_type = str(payload.get("event_type") or payload.get("type") or "").strip()
        event_id = str(payload.get("event_id") or payload.get("id") or
                       str(int(time.time() * 1000))).strip()
        data = payload.get("data") or payload.get("payload") or payload

        if not event_type:
            self.send_json(400, {"error": "event_type required"})
            return

        # Idempotency: skip if already queued/completed with this event_id
        existing = list(QUEUE_DIR.glob(f"*_{event_id[:12]}.json"))
        if existing:
            log.info("Duplicate event_id %s — skipped", event_id)
            self.send_json(200, {"received": True, "duplicate": True, "event_id": event_id})
            return

        enqueue_event(event_type, data if isinstance(data, dict) else payload, event_id)
        self.send_json(200, {"received": True, "event_id": event_id, "event_type": event_type})

# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    if not SHARED_SECRET:
        log.critical("ALEX_DISPATCH_SECRET must be set. Exiting.")
        sys.exit(1)

    # Reload any queued-but-unprocessed files from prior runs
    pending = sorted(QUEUE_DIR.glob("*.json"))
    for f in pending:
        try:
            record = json.loads(f.read_text())
            if record.get("status") == "queued":
                _work_queue.put(f)
                log.info("Reloaded pending event: %s", f.name)
        except Exception as e:
            log.error("Could not reload %s: %s", f, e)

    t = threading.Thread(target=worker, daemon=True)
    t.start()

    server = http.server.HTTPServer(("0.0.0.0", PORT), DispatchHandler)
    log.info("Alex Dispatch listening on port %d", PORT)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        log.info("Shutting down")

if __name__ == "__main__":
    main()
