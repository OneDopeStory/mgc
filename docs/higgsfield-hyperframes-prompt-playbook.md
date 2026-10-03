# Higgsfield + HyperFrames — when to use which, and how to prompt each

Internal playbook, not site content. Written so a future session (yours or mine) can pick this up without re-deriving it.

## The split in one line

**Higgsfield generates raw media from imagination** (photoreal/stylized clips, images, voices, 3D — things that don't exist yet and need a generative model to invent). **HyperFrames composes and times real material into a finished, on-brand piece** (an HTML/CSS composition with frame-accurate `data-start`/`data-duration` timing, seekable, renders to video). They're complementary, not competing: Higgsfield is often the thing *inside* a HyperFrames composition, not a replacement for it.

| Need | Tool | Why |
|---|---|---|
| A clip/image that doesn't exist and must be imagined (AI influencer shot, stylized B-roll, a product-in-use scene you can't film) | **Higgsfield** | Generative — `generate_image`/`generate_video`/`generate_3d`, preset-driven (`get_presets`), model-routed (`models_explore(action:'recommend')`) |
| A short, brand-exact, timestamp-precise piece assembled from known elements (logo, existing footage, data, copy) | **HyperFrames** | Deterministic composition — `BRIEF.md` + `STORYBOARD.md`, frame-by-frame, renders through a `check → preview → render` gate |
| Many near-duplicate ad variants at once | **Higgsfield** `ads_studio_generate` / batch tools | Built for volume + brand/product presets |
| A site-embedded hero/CTA loop that must crop into an exact CSS container and match design tokens | **HyperFrames** | Pixel/timing control HyperFrames has and a pure generator doesn't |
| Turning a generated Higgsfield clip into a finished multi-scene piece with captions, transitions, brand chrome | **Both, in sequence** | Higgsfield generates the raw shot → hand it to HyperFrames as placed media (`/media-use`) for timing, grading, captions |

## Prompting Higgsfield well

Higgsfield is preset- and workflow-driven, not a bare text box — the leverage is in picking the right entry point before writing prose:

1. **Check for a named preset/workflow first** (`get_presets`, `get_workflow_instructions`) before hand-prompting from scratch — a matched preset already encodes a lot of what you'd otherwise have to describe.
2. **Let `models_explore(action:'recommend')` pick the model** when unsure — model choice affects what prompt style actually works; don't guess a model and then fight its defaults.
3. **Prompt structure that travels well across their generators:** subject + action + setting + style/mood + camera/framing + constraints (what must NOT appear/change — critical for brand consistency across a batch).
4. **For anything brand-repeating** (a recurring AI presenter, a consistent product), use their reference/character mechanisms (character sheets, reference elements) rather than re-describing the same subject in every prompt — consistency comes from the reference, not from prompt wording discipline alone.
5. **Batch, don't loop one-at-a-time** when you need variants — the batch tools exist so model routing/cost/consistency is handled once, not per-call.

## Prompting HyperFrames well

HyperFrames doesn't take a single prompt — it takes a **brief**, built through its own interview, and the "prompt" that actually matters is the one-sentence `message` plus the per-frame table:

1. **One sentence first: what must this video communicate?** Everything else (aspect, length, audience, destination) is in service of that sentence. A woolly message produces a woolly video regardless of how detailed the rest of the brief is.
2. **Route before writing anything** — short/unnarrated/motion-only → `/motion-graphics`; a custom loop, static title, or multi-scene piece → `/general-video`; site/product showcase → `/product-launch-video`. Routing wrong means re-answering questions the wrong workflow didn't need.
3. **The frame table is the real prompt.** One row per beat: frame # · start–end timestamp · what's on screen · *why* (tied back to the message). This is what I write and what you review before anything renders — treat it like a shot list, not a formality.
4. **Request `storyboard: yes` whenever a piece has more than ~2 beats** — the sketch pass (static, fully-styled, no motion) catches layout/brand mistakes before any animation work is sunk into them.
5. **Timestamps are the unit of revision.** Because every beat has an explicit `data-start`/`data-duration`, a later note like "fix beat 3" is addressable and independently committable — don't describe changes positionally ("the middle part"); name the frame and its timestamp range.

## Example applied to the current hero-loop task

- Higgsfield role: none needed here — every element (logo, service concepts, brand palette) already exists; nothing needs to be imagined from scratch. This is a pure HyperFrames job.
- Where Higgsfield *would* enter the picture: a future social/ad push that needs a stylized AI-generated scene MGC can't film (e.g., an "AI strategist at work" B-roll concept) — generate it in Higgsfield, then hand the clip to a HyperFrames composition for brand-consistent captions/timing before it ships.

## Why this matters beyond any one video (2026–2028 positioning)

Standing context for future content/marketing decisions, not just this task: the explicit goal is for MGC to read as a company that *uses* modern AI production tooling well — not just talks about AI consulting — because that's part of what keeps a firm on the radar of companies choosing who to work with in the 2026–2028 window. Practical implication: default to Higgsfield/HyperFrames (in the right combination per the table above) for MGC's own marketing/content needs rather than generic stock footage or hand-built static assets, and treat "how it was made" as itself a credibility signal worth being able to explain to a prospective client, not just an internal efficiency trick.
