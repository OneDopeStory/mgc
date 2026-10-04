# MGC Site Experience Plan: Loops, Promos, and UX

Status: draft for review. Nothing is generated, deployed, or published.

Written for: the owner (Mark), to choose directions before any credits are spent or any file ships.

## 1. The objective

A visitor should understand in five seconds that MGC turns scattered work into connected systems, and feel that the site itself is one of those systems. The live TrueAssist agent is the proof: visitors can ask it a real question on the page.

## 2. The story (one problem, one promise)

**The problem every growth-stage owner recognizes:** the work lives in six apps that don't talk to each other. Leads land in one place, follow-ups happen in another, invoices sit in a third, and the owner is the integration layer at 11 p.m.

**The promise:** MGC connects the systems, and an AI advisor answers the questions in between.

Every visual below tells that same arc: fragments, then a signal, then a connected grid.

## 3. Reference inspiration (what the existing graphics already say)

- `unified-ecosystem.jpeg` and `logo-integration-hub.jpeg` (in `mgc-site-graphics`): glass panels of app icons (Slack, Notion, Gmail, Sheets) on the left, a chrome "MGC" hub, and clean fiber lines on the right. This is the story in one frame. Keep the structure, but carry it into motion.
- The logo itself: a chrome ring around a blue globe. The new visuals should echo that ring rather than invent a new mark.
- Palette discipline: `BRANDING.md` treats gold as a premium accent. The reference images use gold light streams heavily. Use gold only on the single "connected" moment, not across the whole frame.

## 4. Three new loop and welcome concepts

### Concept A: "Signal Chain" (website hero alternate or section loop)

- **Look:** a dark ocean-navy field. Six glass app tiles drift and dim. A single cyan pulse runs from one tile into a chrome hub. The hub fires a fan of blue light lines that snap each tile into a tidy chrome grid.
- **Motion:** 8-second seamless loop, 16:9. Tiles resolve in sequence, left to right.
- **Tool:** HyperFrames (HTML/GSAP composition, deterministic, no credits). The tiles and grid are crisp vector-like graphics, which HyperFrames renders cleanly. Use Higgsfield only for an optional glow pass.
- **Why it works:** it shows the problem and the fix in one loop, with no people and no text needed.

### Concept B: "Lighthouse at Night" (brand loop for the welcome section)

- **Look:** the "ocean at night" from `BRANDING.md`. A slow beam sweeps across a dark sea. Data packets (small glowing shapes) drift toward a distant harbor lit in cyan. The harbor is the connected system.
- **Motion:** 10-second cinematic loop. Camera drifts over the water, beam sweeps once per loop.
- **Tool:** Higgsfield (cinematic generative motion; best for atmosphere). Credits apply: the account is on the free plan with 10 credits, so one clip at a time.
- **Why it works:** it speaks to the owner working late, which is the exact pain point.

### Concept C: "Welcome, from Mark" (presenter welcome)

- **Look:** a clean studio frame, one presenter (an avatar of Mark), a 20-second welcome. Lower-third shows the three services. A small card at the end points to the TrueAssist chat.
- **Motion:** talking-head, locked camera, brand palette in the background.
- **Tool:** HeyGen (avatar video API, embeddable). Requires your consent for a digital twin of yourself and a HeyGen plan that includes avatars.
- **Why it works:** a human face converts better for a first visit. It should sit beside the chat, not replace it.

## 5. Three social and promo spots

Each is built for vertical (9:16) and landscape (16:9) cuts, with a like/follow end card.

### Spot 1: "3 A.M." (Higgsfield, 10 seconds)

- **Hook (0 to 2 s):** a laptop glow in a dark room, six tabs open, a notification badge climbing.
- **Turn (2 to 6 s):** the tabs fold into one chrome panel; the grid lights up.
- **Close (6 to 10 s):** "Stop being the integration layer." End card: "Like and follow for the systems that run themselves" with a follow button.

### Spot 2: "Connected by Design" (HyperFrames, 15 seconds, kinetic type)

- **Hook:** the words "Your tools don't talk to each other." appear word by word.
- **Turn:** the reference panel from `unified-ecosystem.jpeg` animates: icons tumble into a hub.
- **Close:** "MGC connects them." Tagline and a subscribe end card.
- **Tool:** HyperFrames. Kinetic typography and layout animation are its strength, and it renders at no credit cost.

### Spot 3: "Ask Before You Book" (HeyGen presenter plus screen capture, 20 seconds)

- **Hook:** the presenter asks "What would you automate first?"
- **Proof:** a real screen capture of the live TrueAssist chat answering a question. This is the strongest proof point on the site, because it shows the agent working.
- **Close:** "Ask TrueAssist on mgcglobalconsulting.com." Subscribe card.
- **Tool:** HeyGen for the presenter, plus a screen recording of the real chat widget.

## 6. Site UX options (ranked by value versus risk)

1. **TrueAssist dock (high value, low risk).** A persistent "Ask TrueAssist" button on every page that opens the existing chat panel. The panel is already built on the home page; this extends it. Respect `prefers-reduced-motion`.
2. **Scroll-driven system map (high value, medium risk).** Between sections, nodes connect as the visitor scrolls, telling the problem-to-solution story without video. Built with CSS and IntersectionObserver, so it stays light.
3. **Hours-saved estimator (high value, medium risk).** A slider ("hours spent on manual follow-up each week") that returns a plain-language estimate and offers TrueAssist to explain it. Keep the math transparent and label it as an estimate.
4. **Hero performance fix (high value, low risk).** Replace the 21 MB hero video with the 6-second loop from `docs/hero-loop-storyboard.md`, with a poster image and reduced-motion fallback.
5. **Service cards with micro-interactions (medium value, low risk).** Hover lift and a glow that follows the cursor. Keep it subtle.
6. **Cursor-following grid light on the hero (low value, medium risk).** A small decorative effect. Cut it if it hurts performance on phones.

## 7. Tool routing (what each tool is best at)

| Need | Best tool | Why | Cost |
|---|---|---|---|
| Cinematic atmosphere, generative motion | Higgsfield | Strongest for photoreal motion | Credits (10 on free plan) |
| Kinetic type, HTML/GSAP motion graphics, exact layout | HyperFrames | Deterministic, renders MP4/WebM from HTML | No credits, runs locally |
| Presenter or welcome video with a face | HeyGen | Avatar video, embeddable | HeyGen plan, consent required |
| Live site answers | TrueAssist (Anthropic) | Already built; needs the key in Netlify | Anthropic usage |

## 8. Dependencies and blockers

- **Anthropic key:** TrueAssist needs `ANTHROPIC_API_KEY` in Netlify for production. Local dev returns a friendly fallback until it's set.
- **Higgsfield credits:** the free plan has 10 credits. Preflight every generation with the cost check before submitting.
- **HeyGen:** needs a paid plan and your written consent for the avatar.
- **Supabase:** the portal tables are written but not applied to the live project. The push was denied; it needs your approval.
- **Deploy:** nothing goes live until you approve a Netlify deploy.

## 9. Suggested order

1. Choose one loop (A, B, or C) and one social spot. Generate only those, one at a time.
2. Swap the hero video once the loop is approved (per the hero storyboard).
3. Add the TrueAssist dock across pages.
4. Build the scroll-driven system map.
5. Record the real TrueAssist chat for Spot 3 once the key is live.

## 10. Decisions for you

1. Which loop concept do you want first: A (Signal Chain), B (Lighthouse at Night), or C (Welcome from Mark)?
2. Which social spot first: 1 (3 A.M.), 2 (Connected by Design), or 3 (Ask Before You Book)?
3. Do you consent to a HeyGen avatar of yourself, and do you have a HeyGen plan?
4. Approve the TrueAssist dock and the hours-saved estimator for the site?
5. Keep gold as a single accent, or allow the heavier gold light streams from the reference images?

## Sources

- HyperFrames overview: https://www.hyperframes.dev/?view=videos
- HyperFrames rendering framework: https://dev.to/mech_app_ai/hyperframes-html-to-mp4-rendering-as-an-agent-first-primitive-33k7
- HeyGen API guide: https://www.heygen.com/blog/heygen-api-guide
- HeyGen developers: https://developers.heygen.com/
