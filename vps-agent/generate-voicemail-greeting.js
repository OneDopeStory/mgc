'use strict';
/**
 * DRAFT — scaffolded 2026-10-27, not deployed, not tested against a live xAI account.
 * See docs/grok-voice-architecture.md for open blockers before use.
 *
 * MGC Global Consulting — one-shot voicemail-greeting generator
 * ──────────────────────────────────────────────────────────────
 * Standalone script. NOT part of the persistent call bridge (grok-voice-bridge.js) and does
 * NOT need a call_id, a SIP trunk, or a phone number — it opens a plain realtime session,
 * asks Alex Romero's voice to read a fixed greeting script via a scripted `force_message`
 * item, captures the resulting audio, and writes it to output/alex-romero-greeting.mp3.
 *
 * This is the cheapest possible way to produce the "voicemail message" artifact the owner
 * asked for: it only needs XAI_API_KEY, no VPS/SIP/number setup. Run this FIRST, before
 * touching the live bridge, per vps-agent/README.md.
 *
 * Usage:
 *   XAI_API_KEY=... node generate-voicemail-greeting.js
 *
 * CONFIRMED 2026-10-27 against a live xAI realtime session: the audio output events are
 * `response.output_audio.delta` (base64 `delta` field per chunk) and `response.output_audio.done`
 * (stream complete) — NOT `response.audio.*` as originally guessed by analogy to OpenAI's
 * Realtime API. `force_message` + no `response.create` afterward was also confirmed live: the
 * server auto-generates `response.created` → audio deltas → `response.done` on its own.
 */

const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const XAI_API_KEY = process.env.XAI_API_KEY;
const OUTPUT_DIR = path.join(__dirname, 'output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'alex-romero-greeting.wav');

// Confirmed 2026-10-27: setting session.output_audio_format to 'mp3' had no effect on the
// realtime delta stream — byte count was identical with and without it, and the raw bytes are
// not a valid MP3 (afinfo fails to open them). The deltas are raw PCM, so we wrap them in a
// WAV header ourselves. Sample rate/channels/bit depth below are the common realtime-API
// default (24kHz mono 16-bit, same as OpenAI's Realtime API, which xAI's protocol mirrors
// structurally) and were corroborated by duration math (444960 bytes / 2 bytes-per-sample /
// 24000 Hz = 9.27s, a plausible length for the greeting sentence) — NOT from an explicit
// field in session.created/session.updated, which never named a sample rate. If the saved
// .wav sounds wrong-speed/pitched, this is the first thing to adjust.
const PCM_SAMPLE_RATE = 24000;
const PCM_CHANNELS = 1;
const PCM_BITS_PER_SAMPLE = 16;

function wrapPcmAsWav(pcmBuffer) {
  const byteRate = PCM_SAMPLE_RATE * PCM_CHANNELS * (PCM_BITS_PER_SAMPLE / 8);
  const blockAlign = PCM_CHANNELS * (PCM_BITS_PER_SAMPLE / 8);
  const header = Buffer.alloc(44);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16); // PCM fmt chunk size
  header.writeUInt16LE(1, 20); // audio format 1 = PCM
  header.writeUInt16LE(PCM_CHANNELS, 22);
  header.writeUInt32LE(PCM_SAMPLE_RATE, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(PCM_BITS_PER_SAMPLE, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(pcmBuffer.length, 40);
  return Buffer.concat([header, pcmBuffer]);
}

const GREETING_SCRIPT =
  "Thanks for calling MGC Global Consulting, this is Alex. " +
  "I can help you book a session, check pricing, or connect you with our team — " +
  "go ahead and tell me what you need.";

if (!XAI_API_KEY) {
  console.error('XAI_API_KEY is not set. Export it and re-run.');
  process.exit(1);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const audioChunks = [];
let finished = false;

function finish(ws, success, message) {
  if (finished) return;
  finished = true;
  if (success && audioChunks.length) {
    const pcmBuffer = Buffer.concat(audioChunks.map((b64) => Buffer.from(b64, 'base64')));
    const wavBuffer = wrapPcmAsWav(pcmBuffer);
    fs.writeFileSync(OUTPUT_FILE, wavBuffer);
    console.log(`Saved greeting audio (${pcmBuffer.length} bytes PCM, ${wavBuffer.length} bytes WAV) to ${OUTPUT_FILE}`);
  } else {
    console.error(message || 'No audio captured — greeting was NOT saved.');
  }
  try { ws.close(); } catch { /* already closing */ }
  process.exit(success ? 0 : 1);
}

console.log('Connecting to Grok Voice realtime API...');
// No call_id query param here — this is a standalone session for pre-generating static audio,
// not a live phone call.
const ws = new WebSocket('wss://api.x.ai/v1/realtime?model=grok-voice-latest', {
  headers: { Authorization: `Bearer ${XAI_API_KEY}` },
});

// Safety timeout so a hung connection doesn't leave this script running forever.
const timeout = setTimeout(() => finish(ws, false, 'Timed out waiting for audio output.'), 30_000);

ws.on('open', () => {
  console.log('Connected. Configuring Alex Romero voice/persona...');
  ws.send(JSON.stringify({
    type: 'session.update',
    session: {
      voice: process.env.GROK_VOICE_NAME || 'alloy', // placeholder — confirm available voice ids against docs.x.ai
      instructions: 'You are Alex Romero, the AI dispatcher for MGC Global Consulting. You are recording a single scripted voicemail greeting, not having a conversation.',
      // output_audio_format: tried 'mp3' — accepted in session.updated echo but had zero effect
      // on the actual delta bytes (identical size, not a valid MP3). Omitted here; we wrap the
      // raw PCM in a WAV header ourselves instead (see wrapPcmAsWav above).
    },
  }));

  console.log('Sending scripted greeting as a force_message item...');
  ws.send(JSON.stringify({
    type: 'conversation.item.create',
    item: {
      type: 'force_message',
      content: [{ type: 'text', text: GREETING_SCRIPT }],
    },
  }));
  // NOTE: deliberately no `response.create` after a force_message — per prior research, a
  // force_message is scripted TTS that plays on its own, unlike a normal conversational turn.
});

ws.on('message', (raw) => {
  let event;
  try {
    event = JSON.parse(raw.toString());
  } catch {
    console.error('Received non-JSON frame, ignoring.');
    return;
  }

  switch (event.type) {
    case 'session.created':
    case 'session.updated':
      console.log(`Server event: ${event.type}`, JSON.stringify(event.session || event));
      break;

    // Confirmed 2026-10-27 against a live session (xAI uses output_audio, not audio).
    case 'response.output_audio.delta':
      if (event.delta) {
        audioChunks.push(event.delta);
      } else {
        console.log('response.output_audio.delta had no delta field, keys:', Object.keys(event));
      }
      break;
    case 'response.output_audio.done':
      console.log(`Audio stream complete. ${audioChunks.length} chunk(s) captured.`);
      clearTimeout(timeout);
      finish(ws, true);
      break;
    case 'response.done':
      // Fallback completion signal in case output_audio.done doesn't fire for some reason.
      if (!finished) {
        console.log(`response.done received. ${audioChunks.length} chunk(s) captured.`);
        clearTimeout(timeout);
        finish(ws, audioChunks.length > 0, audioChunks.length ? undefined : 'response.done fired with no audio chunks captured.');
      }
      break;

    case 'error':
      clearTimeout(timeout);
      finish(ws, false, `Realtime API error: ${JSON.stringify(event)}`);
      break;

    default:
      // Log anything unrecognized — harmless now that the real event names are confirmed,
      // but useful if xAI changes the protocol later.
      console.log('Unrecognized event type (for diagnosis):', event.type);
      break;
  }
});

ws.on('close', (code, reason) => {
  clearTimeout(timeout);
  if (!finished) finish(ws, false, `Connection closed before audio was captured (code ${code}, ${reason?.toString() || 'no reason given'}).`);
});

ws.on('error', (err) => {
  clearTimeout(timeout);
  finish(ws, false, `Websocket error: ${err.message}`);
});
