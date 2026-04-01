/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ZAP #5 — INVOICE GENERATOR & PAYMENT TRACKER              ║
 * ║  Trigger: New row in Google Sheets "Invoices" tab           ║
 * ║  OR: Gmail — new email with subject containing "invoice"    ║
 * ║  Actions: Claude drafts invoice cover letter → Slack alert  ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * ZAPIER SETUP (Option A — Google Sheets trigger):
 * 1. Trigger:  Google Sheets — New Spreadsheet Row (Invoices sheet)
 * 2. Action 1: Code by Zapier — paste THIS file
 * 3. Action 2: Slack — Post to #mgc-finance
 * 4. Action 3: Gmail — Send email (invoice cover letter to client)
 *
 * ZAPIER SETUP (Option B — Gmail trigger):
 * 1. Trigger:  Gmail — New email matching "subject:invoice OR payment"
 * 2. Action 1: Code by Zapier — paste THIS file
 * 3. Action 2: Slack — Post to #mgc-finance
 *
 * ZAPIER INPUT VARIABLES:
 *   inputData.clientName       — client name (e.g. "Anthony Harris")
 *   inputData.clientEmail      — client email
 *   inputData.invoiceNumber    — e.g. "#01-02-042026"
 *   inputData.invoiceDate      — date issued
 *   inputData.dueDate          — due date
 *   inputData.lineItems        — JSON string or plain text of items
 *   inputData.subtotal         — subtotal amount
 *   inputData.tax              — tax amount
 *   inputData.grandTotal       — grand total
 *   inputData.discountRate     — discount if any
 *   inputData.status           — "pending" / "paid" / "overdue"
 *   inputData.CLAUDE_KEY       — Claude API key
 */

const SYSTEM_PROMPT = `You are the financial communications agent for MGC Global Consulting LLC ("Making Global Connections"), Mark G. Cartwright, CEO.

Company: MGC Global Consulting LLC | 101 W. Lombard St., Baltimore, MD 21202
Payment: Capital One Bank | Account: #36059083952 | A/c Name: Mark Cartwright
Terms: Payment due upon receipt. 5% late fee after 7 days past due.
Contact: mark@mgcglobalconsulting.com | 410.952.2846

Produce JSON only (no markdown, no preamble):
{
  "coverLetter": "Professional invoice cover letter from Mark to the client. Plain English breakdown of what they're paying for and the value received. Warm but firm on payment timeline. Include payment instructions.",
  "slackFinanceCard": "Formatted Slack message for #mgc-finance with invoice summary, amount, due date, status emoji (🟢 paid / 🟡 pending / 🔴 overdue)",
  "paymentReminderEmail": "A polite but firm payment reminder email (use if status is overdue)",
  "nextMoves": "3 recommended actions for Mark regarding this invoice"
}`;

async function runZap() {
  const {
    clientName = "Client",
    clientEmail = "",
    invoiceNumber = "N/A",
    invoiceDate = "",
    dueDate = "",
    lineItems = "",
    subtotal = "0",
    tax = "0",
    grandTotal = "0",
    discountRate = "0",
    status = "pending",
    CLAUDE_KEY
  } = inputData;

  if (!CLAUDE_KEY) throw new Error("Missing CLAUDE_KEY");

  const statusEmoji = status === "paid" ? "🟢" : status === "overdue" ? "🔴" : "🟡";
  const isOverdue = status.toLowerCase() === "overdue";

  const userMsg = `Invoice details:
Client: ${clientName} (${clientEmail})
Invoice #: ${invoiceNumber}
Issued: ${invoiceDate}
Due: ${dueDate}
Status: ${statusEmoji} ${status.toUpperCase()}
Line Items: ${lineItems}
Subtotal: $${subtotal}
Tax: $${tax}
Grand Total: $${grandTotal}
Discount: $${discountRate}
Overdue: ${isOverdue}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CLAUDE_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMsg }]
    })
  });

  if (!response.ok) throw new Error(`Claude error: ${response.status}`);
  const data = await response.json();
  const raw = data.content[0].text;

  let parsed;
  try {
    parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    parsed = { coverLetter: raw, slackFinanceCard: `${statusEmoji} Invoice ${invoiceNumber} — ${clientName} — $${grandTotal}`, paymentReminderEmail: "", nextMoves: "" };
  }

  return {
    coverLetter:          parsed.coverLetter,
    slackFinanceCard:     parsed.slackFinanceCard,
    paymentReminderEmail: parsed.paymentReminderEmail,
    nextMoves:            parsed.nextMoves,
    invoiceNumber:        invoiceNumber,
    clientName:           clientName,
    clientEmail:          clientEmail,
    grandTotal:           grandTotal,
    status:               status,
    isOverdue:            String(isOverdue)
  };
}

return await runZap();
