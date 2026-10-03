---
title: "MGC Lycoris visual experience"
type: spec
status: draft
owner: "Mark Garcia Cartwright"
created: "2026-10-03"
updated: "2026-10-03"
tags: [mgc, design, webgl, static-site]
---

# MGC Lycoris visual experience

## Call this task

> Read CLAUDE.md, BRANDING.md, and wiki/pages/lycoris-experience-spec.md. Build the proposed standalone static MGC demo using the saved Lycoris source as reference. Preserve the production site's architecture. Verify mobile, keyboard, reduced motion, and graphics fallback. Report the preview and checks before any production integration.

Prepared for Mark Garcia Cartwright; design proposals below are not final approved copy. Related: [QuickBooks spec](quickbooks-account-spec.md) · [index](../index.md).

## Source and compatibility

The [immutable supplied brief](../raw/2026-10-03-lycoris-component.txt) contains `lycoris-specimen.tsx` and `demo.tsx`. It is a six-scene scroll specimen: cover, crown, specimen, fan, bloom, ligatures. A procedural lily uses raw WebGL, scroll-controlled camera poses, staggered type, pointer motion, and a 2D fallback path.

The component imports React, uses TypeScript/JSX, relies on Tailwind utility classes, and loads Federant through an injected font link. It does not import shadcn components. The current [root package](../../package.json) does not establish a React/Tailwind/shadcn application; [app/page.tsx](../../app/page.tsx) is a separate scaffold, not the live Netlify entry point. No existing `components/` directory was found during this study.

Recommended route: port the behavior into static HTML/CSS/JS. Proposed files: `lycoris-demo.html`, `assets/css/mgc-lycoris.css`, and `assets/js/mgc-lycoris.js`. Leave root package/build configuration unchanged. Do not replace `index.html` automatically.

If Mark later explicitly selects a React prototype, first agree on an isolated app location and its deployment target. In that app, use `components/ui/lycoris-specimen.tsx`, configure the `@/` alias, and translate the utility classes through a verified Tailwind setup. `components/ui` is an organizational/import convention, not a runtime requirement. Obtain current framework/CLI instructions then; no React project or dependencies were installed for this documentation task.

## MGC design proposal

Audience: business leaders evaluating Mark's AI consulting and systems work. Goal: communicate the progression from strategy to usable systems and direct qualified visitors to booking.

| Scene | Proposed message and content |
|---|---|
| Cover | Eyebrow “MGC GLOBAL CONSULTING”; headline “Strategy into systems.”; subhead “AI strategy, automation, and connected operations for your next stage of growth.” |
| Crown | “Built around your business.” Three principles: clarity, connected workflows, practical delivery. |
| Specimen | “Mark Garcia Cartwright.” Founder, MGC Global Consulting. Use verified biography copy; no invented credentials or metrics. |
| Fan | “Expertise that connects.” Six service families: AI strategy, workshops, automation, CRM, systems design, retainers. |
| Bloom | “From idea to implementation.” Sequence: discover, design, deliver. |
| Finale | “Build what comes next.” Primary CTA “Book a strategy session” → `/book`; secondary “Explore services” → `/services`. |

Use [BRANDING.md](../../BRANDING.md) and the target page's real tokens: background `--abyss`, text `--ice`/`--white`, primary accent `--cyan`, selective `--gold`; headings `--display`, UI `--ui`, body `--body`, data `--mono`. Retain `assets/mgc-logo-transparent.png`, existing navigation structure, and the target page's scroll-progress convention. Replace the specimen's studio branding and demo links in the adaptation; preserve the raw source and confirm its license/attribution before distribution.

The long personal name needs a responsive layout; do not force it into the original single-word “Lycoris” cover geometry. A shorter MGC wordmark can carry the letter animation. Use existing spacing tokens; proposed fallbacks for this demo are 24 px mobile gutters and 64 px desktop gutters, defined as CSS properties. Keep the booking CTA reachable without traversing the full animation.

## Implementation details worth retaining

- Source props cover name/studio/copy, links, fonts, three colors, viewport height, scroll distance, florets, seed, and idle motion. Preserve useful configuration, but replace type-specimen controls and editable glyph copy with business content.
- Six scenes with default `sceneScroll=1.2` produce a root height of seven stage heights. Treat that as a prototype default; shorten or flatten it for mobile and reduced motion.
- CSS color variables cannot simply be handed to a WebGL hex parser. Resolve computed colors and convert them into the numeric representation the shaders need.
- Replace Tailwind classes with scoped CSS and convert React lifecycle/ref/state behavior explicitly. Preserve WebGL resource cleanup, observers, font remeasurement, visibility pause, and pointer listener cleanup.
- The source pauses when offscreen or the document is hidden and caps device pixel ratio at two. Retain these controls; measure on a real mobile device before choosing mesh density.
- Source reduced-motion handling stops some idle motion, but still changes scenes with scrolling. Provide a readable static sequence when motion is reduced; important text/links must remain available with JavaScript disabled.
- Verify both unavailable-WebGL and shader/link failure cases. The source tries `getContext('2d')` on the same canvas after WebGL initialization fails; use a separate fallback canvas or static artwork when context acquisition prevents that fallback.
- Avoid duplicate SVG/filter IDs if mounted twice. Keep keyboard focus out of hidden scenes and provide visible focus on navigation/CTAs. Decorative canvas is hidden from assistive technology; real headings/text carry the message.

## Short implementation sequence

1. Read this page, branding, and the saved raw component only. Inspect the target navigation and tokens; preserve unrelated pane changes.
2. Build the standalone static demo with complete readable HTML before animation. Add MGC copy, logo, responsive spacing, and working links.
3. Port procedural graphics and scroll behavior into the proposed scoped assets. Keep progressive enhancement, graphics fallback, and resource cleanup.
4. Check 360 px, 768 px, and desktop widths; keyboard-only use; reduced motion; JavaScript/WebGL disabled; context loss/restoration; resize; hidden-tab pause; and repeated initialization. No horizontal overflow or inaccessible CTAs.
5. Preview with `python3 -m http.server 3456`, then open `/lycoris-demo.html`. Record screenshots and console/performance findings. Integrate into a production page only when the destination and design are chosen.

## Done and open decisions

Done means an independently reviewable local static demo, MGC-consistent styling, all six messages accessible, and checks recorded. No accounting data belongs in this visual component.

Still to choose: final placement, whether the lily remains the central motif, final biography/copy, animation length, and source licensing. The original component has not been rendered or runtime-tested in this documentation pass.
