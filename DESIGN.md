# DESIGN.md — MGC Global Consulting

This document covers the complete visual design system for MGC Global Consulting.
It is structured around Stitch's **Idea / Theme / Content / Image** prompt formula so every section can be fed directly into Stitch for iteration without rewriting the brief from scratch.

> **Stitch ideation principle:** Don't start with a perfect prompt. Describe the specific content you want and the general vibe — then iterate. Make one major change at a time. Each section below follows that formula.

---

## Design Identity

**Core aesthetic:** Deep-sea premium. A journey from pitch-black ocean floor to electric cyan sky. The feeling of advanced technology operating beneath the surface — controlled, precise, and slightly awe-inspiring.

**Tone:** Authoritative but accessible. Enterprise-grade without the cold corporate distance. Every visual choice reinforces trust, intelligence, and momentum.

**One-sentence design brief:**
> "The ocean at night — elegant, deep, and lit from within by electric-blue intelligence."

---

## Color System

### Ocean-to-Sky Palette

These are the exact CSS custom properties defined across all pages. Never hardcode hex values — always reference the token.

| Token | Hex | Role |
|---|---|---|
| `--abyss` | `#010C1A` | Page background, darkest depth |
| `--ocean` | `#02111F` | Section alternate background |
| `--deep` | `#031525` | Dark section background |
| `--navy` | `#041C35` | Card backgrounds, panels |
| `--mid` | `#062B52` | Subtle fills, hover states |
| `--royal` | `#0047CC` | Primary action color |
| `--electric` | `#0066FF` | CTA gradients, links |
| `--sky` | `#0099FF` | Mid-range accents |
| `--bright` | `#00BBFF` | Active states, glows |
| `--cyan` | `#00D4FF` | Hero highlights, stat numbers |
| `--ice` | `#B8D8F0` | Body text, soft contrast |
| `--fog` | `#7AB8E0` | Muted text |
| `--gold` | `#FFB347` | Premium tier accents, "Portal" nav link |
| `--gold-dim` | `#C98A2A` | Gold hover / subdued gold |
| `--white` | `#FFFFFF` | Headlines, high-contrast text |

### Text Opacity Scale

| Token | Value | Use |
|---|---|---|
| `--t-dim` | `rgba(180,215,240, 0.45)` | Labels, captions, metadata |
| `--t-mid` | `rgba(180,215,240, 0.72)` | Body text, descriptions |
| `--t-hi` | `rgba(180,215,240, 0.92)` | Readable body text |

### Border Scale

| Token | Value | Use |
|---|---|---|
| `--b-lo` | `rgba(0,153,255, 0.07)` | Subtle dividers |
| `--b-mid` | `rgba(0,153,255, 0.16)` | Card borders, nav scroll border |
| `--b-hi` | `rgba(0,187,255, 0.32)` | Prominent borders, chip outlines |
| `--b-gold` | `rgba(255,179,71, 0.25)` | Elite tier card borders |

### Glow Scale

| Token | Value | Use |
|---|---|---|
| `--glow` | `rgba(0,102,255, 0.35)` | Primary button shadow |
| `--glow-sky` | `rgba(0,153,255, 0.28)` | Ghost button hover shadow |
| `--glow-cyan` | `rgba(0,212,255, 0.22)` | Subtle ambient glow |

---

## Typography

### Font Stack

| Token | Family | Role |
|---|---|---|
| `--display` | Raleway | All headlines, hero H1, section H2, card H3 |
| `--ui` | Plus Jakarta Sans | Navigation, buttons, labels, UI chrome |
| `--body` | Outfit | Body copy, descriptions, running text |
| `--mono` | JetBrains Mono | Eyebrows, data chips, code-style labels |

**Google Fonts load order:** Raleway → Plus Jakarta Sans → Outfit → JetBrains Mono
All loaded with `font-display: swap` via the preconnect pattern in `<head>`.

### Type Scale

| Use | Properties |
|---|---|
| Hero H1 | Raleway 800, `clamp(3.2rem, 5.8vw, 5.4rem)`, line-height 1.02, letter-spacing -1.5px |
| Section H2 | Raleway 800, `clamp(2.4rem, 4.5vw, 3.8rem)`, line-height 1.05, letter-spacing -1px |
| Card H3 | Raleway 700–800, 1.3–1.5rem |
| Body lead | Outfit 300, 1.05rem, line-height 1.8 |
| Button | Plus Jakarta Sans 700, 0.82rem, letter-spacing 0.05em, uppercase |
| Eyebrow | JetBrains Mono 700, 0.65rem, letter-spacing 4px, uppercase |
| Data chip value | JetBrains Mono 700, 0.8rem |
| Nav link | Plus Jakarta Sans 500, 0.8rem, letter-spacing 0.02em |

### Gradient Text Helpers

Two utility classes produce clipped gradient text:

```css
.sky-text   /* white → bright → cyan → ice (135°) — hero headlines */
.ocean-text /* sky → cyan → white (135°) — secondary highlights */
```

---

## Geometry & Spacing

| Token | Value | Use |
|---|---|---|
| `--radius` | `20px` | Cards, panels, large containers |
| `--r-sm` | `12px` | Small cards, inner elements |
| `--pill` | `100px` | All buttons, nav CTA, badges |

### Spacing Rhythm

- **Section padding:** `7.5rem 0`
- **Container max-width:** `1260px`, padded `0 2.5rem`
- **Section header max-width:** `760px` (centered)
- **Hero grid gap:** `4rem`, padding `9rem 2.5rem 6rem`

---

## Animation System

### Easing

| Token | Value | Use |
|---|---|---|
| `--ease` | `cubic-bezier(0.16, 1, 0.3, 1)` | All transitions — spring-like deceleration |

### Named Keyframes

| Keyframe | Duration | What it does |
|---|---|---|
| `orbFloat` | 14–24s | Ambient glow orbs drift in hero and sections |
| `starsDrift` | 45s linear | Star field slow parallax drift |
| `ringRotate` | 22–35s linear | Globe orbit rings rotate |
| `chipFloat` | 8–10s | Floating data chips bob vertically |
| `glowPulse` | 5s | Globe glow ring breathes |
| `blink` | 2s | Hero eyebrow cyan dot pulses |

### Scroll Entrance (JS-driven)

Elements with `.animate-in` class receive `translateY(0) opacity(1)` when they enter the viewport via `IntersectionObserver`. Default offset: `translateY(30px)`, `opacity: 0`, transition `0.75s --ease`. Stagger delay increments: `0.1s` per sibling.

---

## Component Library

### Navigation

**Behavior:** Fixed, transparent on load → `rgba(1,12,26,0.95)` with `backdrop-filter: blur(28px)` on scroll (`.scrolled` class).

**Structure:**
- Left: Logo image (`mgc-logo-transparent.png`, 62×62px, circular, cyan drop-shadow) + wordmark
- Center: Nav links (Plus Jakarta Sans, 0.8rem, hover underline slides in from left)
- Right: "Client Portal" link (gold color) + "Get Started" CTA pill

**CTA pill:** Royal-to-sky gradient, pill radius, uppercase, 700 weight, blue glow shadow.

**Mobile:** Hamburger (3 lines, 22px wide, animated to ×) → full-screen overlay menu (dark, Raleway 1.6rem links).

---

### Buttons

**Primary (`.btn-primary`):**
```
Royal → Sky → Bright gradient · Pill radius · Plus Jakarta Sans 700
Padding: 0.9rem 2rem · Uppercase · Blue glow shadow
Hover: brightness(1.15) + translateY(-2px) + stronger glow
Arrow icon slides right 4px on hover
```

**Ghost (`.btn-ghost`):**
```
Dark navy fill (60% opacity) · Bright border · Ice text
Backdrop blur: 12px · Pill radius
Hover: Brighter border + slight royal fill overlay
```

---

### Cards (`.card`)

```
Background: navy (#041C35)
Border: --b-mid (16% blue opacity)
Border-radius: --radius (20px)
Padding: 2–2.5rem
Hover: border-color → --b-hi + translateY(-4px) + glow shadow
Transition: all 0.4s --ease
```

**Service cards** add a glowing icon container (royal/sky gradient, 52×52px, 14px radius).

**Pricing cards** use a vertical layout with feature lists. Elite tier uses gold border (`--b-gold`) and a "MOST POPULAR" badge.

---

### Eyebrow Labels (`.eyebrow`)

```
JetBrains Mono 700 · 0.65rem · 4px letter-spacing · Uppercase · --bright color
Decorative lines: 28px each side (linear gradient, 70% opacity)
Centered above section H2
```

---

### Data Chips (`.data-chip`)

Floating badge-style elements used in hero and stats sections:

```
Background: rgba(2,17,31,0.88) · Backdrop blur 20px
Border: --b-hi · Pill radius
Label: --t-dim, 0.59rem, mono, letter-spacing 2px
Value: JetBrains Mono 700, 0.8rem, --bright
Animation: chipFloat (vertical bob, 8–10s)
```

---

### Scroll Progress Bar (`#scrollBar`)

```
Fixed · Top · Height: 2px · Full width (JS-driven)
Gradient: Royal → Sky → Cyan (left to right)
z-index: 10001
```

---

### Vision Section

Full-bleed image (480px height) with a horizontal gradient overlay:
```
Left edge: abyss at 92% opacity
Center: abyss at 70% fading to royal/blue at 25%
Right edge: abyss at 60%
```
Text renders left-aligned on top of overlay at container max-width.

---

### Trust Bar

Positioned at hero bottom edge. Dark glass strip with centered items separated by cyan dots:
```
Background: rgba(1,12,26,0.7) · Backdrop blur 24px
Top border: --b-mid
Items: Plus Jakarta Sans 600, 0.67rem, letter-spacing 2px, uppercase, --t-dim
Hover: brightens to --bright
```

---

## Asset Inventory

### Images (`assets/images/`)

| File | Used In | Description |
|---|---|---|
| `mgc-logo-transparent.png` | All pages (nav) | Circular logo, transparent BG, no white fill |
| `mgc-logo-full.png` | Footer (some pages) | Full wordmark with background |
| `official-M-logo.png` | Meta/OG fallback | Square M logo |
| `mgc-ai-city.png` | `index.html` Vision section | Aerial AI city visualization |
| `mgc-global-image-2.jpg` | About / process sections | Team/consulting environment |
| `mgc-services-hero.png` | `services.html` hero | Services overview graphic |
| `mgc-globe-pic.jpeg` | Hero visual (fallback) | Globe/earth connectivity image |
| `mgc-pricing-bg.png` | Pricing section background | Dark blue gradient texture |
| `m-globe-sphere.png` | Hero / features | Wireframe globe sphere |
| `unified-ecosystem.jpeg` | Integrations section | Connected systems diagram |
| `logo-integration-hub.jpeg` | Integration hub feature | Hub and spoke visualization |
| `unify-1.png` | Unification feature | Data unification graphic |
| `earn-commission.jpeg` | Partner program | Commission/partnership imagery |
| `get-paid-image.png` | Partner program | Payment flow visualization |
| `Broken-Glass-Effect-PSD.jpg` | Background texture | Dark cracked glass texture |
| `mgc-screw-graphic.jpeg` | Operational systems | Mechanical precision graphic |

### Videos (`assets/video/`)

| File | Used In | Description |
|---|---|---|
| `globe-connected.mp4` | `index.html` hero | Spinning connected globe, circular crop |
| `m-one-shot.mp4` | Secondary hero / features | MGC brand motion asset |

**Globe video implementation:**
```html
<video class="globe-video" autoplay muted loop playsinline>
  <source src="assets/video/globe-connected.mp4" type="video/mp4">
</video>
```
Circular crop via `border-radius: 50%`, `object-fit: cover`, 380×380px. Rendered inside `.globe-container` (480×480px) with two animated orbit rings layered on top.

---

## Page-by-Page Stitch Prompts

Use these as starting prompts when redesigning individual pages in Stitch. Follow the **Idea / Theme / Content** formula, then make one targeted change at a time.

---

### Homepage (`index.html`)

```
Idea:     Enterprise AI consulting firm homepage — the primary conversion surface.

Theme:    Deep ocean premium dark. Black background (#010C1A) shifting to electric
          blue (#0066FF) and cyan (#00D4FF) accents. Raleway display font. The
          aesthetic of advanced technology operating beneath the surface —
          controlled, intelligent, and slightly awe-inspiring.

Content:  Hero with headline "Intelligent Systems. Accelerated Growth." and a
          spinning globe video. Trust bar below hero with social proof labels.
          Services grid (AI Strategy, Automation, CRM, Systems Design, Workshops,
          Retainer). Vision section with full-bleed AI city image. Process steps
          (Discover → Architect → Build → Optimize). Pricing tiers. Integration
          logos. CTA section. Footer.

Image:    Reference assets/images/mgc-ai-city.png for the vision section tone.
          Reference assets/video/globe-connected.mp4 for hero visual style.
```

---

### Client Portal (`dashboard.html`)

```
Idea:     Password-protected client dashboard — authenticated members see their
          active projects, deliverables, invoices, and can book sessions.

Theme:    Same ocean palette as the main site but more utilitarian. Heavier use
          of navy card backgrounds. Sidebar navigation. Data-dense but breathable.
          Cyan accents for active states and progress indicators.

Content:  Auth screen (email/Google login). Sidebar with 6 panels: Overview
          (KPI stats + activity feed), Projects (phase/progress bars), Deliverables
          (file download list), Invoices (billing table), Schedule (calendar +
          booking form), Settings (profile edit form).
```

---

### Services Gallery (`services.html`)

```
Idea:     Full catalog of all service offerings with a filter UI.

Theme:    Dark ocean. Cards on navy backgrounds. Filter tabs use pill-style
          buttons with electric blue active state. Each card has a glowing icon,
          short description, and a CTA.

Content:  Page hero. Filter bar (All / AI Strategy / Automation / CRM / Systems /
          Training). 6+ service cards. Each card: icon, title, 2-line description,
          price indicator (if applicable), "Learn More" button.
```

---

### Membership Page (`membership.html`)

```
Idea:     Three-tier membership enrollment page — Starter, Pro, Elite.

Theme:    Dark. Pricing cards centered. Elite tier uses gold border and badge.
          Checkmark feature lists. Emphasized contrast between tiers to drive
          middle-tier selection (visual hierarchy).

Content:  Page hero. Three pricing cards (monthly/annual toggle). Feature
          comparison. FAQ accordion. CTA section. Footer.

Edit theme suggestion:  Increase the Elite card's container height and add a
                        stronger gold glow to create clear visual hierarchy between
                        the three tiers.
```

---

### Service Detail Pages

Applies to: `ai-consulting.html`, `ai-workshops.html`, `automation.html`,
`crm-optimization.html`, `systems-design.html`, `retainer-support.html`

```
Idea:     Individual service deep-dive — convince a qualified prospect to take
          the next step and contact or purchase.

Theme:    Dark ocean. Hero with service-specific gradient accent. Feature grid
          with glowing icon cards. Process timeline. Outcome/results section.
          Single strong CTA at bottom.

Content:  Hero (service name, tagline, primary CTA). What's included (feature
          cards). How it works (3–5 step process). Who it's for. Pricing or
          "get a quote" CTA. Related services.
```

---

### Error Pages (`403.html`, `404.html`, `500.html`)

```
Idea:     Error state pages that maintain brand while redirecting users.

Theme:    Same dark ocean. Minimal layout. Large error code in gradient text.
          Brief explanation. Single "Go Home" button.

Content:  Error number (full screen vertical center), short message, home
          button. Optional: animated orb or grid overlay for atmosphere.
```

---

## Background Techniques

### Multi-layer radial gradient hero background

```css
background:
  radial-gradient(ellipse 100% 80% at 60% 30%, rgba(0,71,204,0.25) 0%, transparent 60%),
  radial-gradient(ellipse 50% 40% at 10% 80%, rgba(0,153,255,0.08) 0%, transparent 55%),
  radial-gradient(ellipse 30% 25% at 90% 10%, rgba(0,212,255,0.06) 0%, transparent 45%),
  #010C1A;
```

Produces an asymmetric depth effect — brighter blue bloom to the right, subtle accents at corners, pure abyss underneath.

### Grid overlay

```css
background-image:
  linear-gradient(rgba(0,153,255,0.025) 1px, transparent 1px),
  linear-gradient(90deg, rgba(0,153,255,0.025) 1px, transparent 1px);
background-size: 72px 72px;
```

Creates a barely-visible technical grid suggesting precision and structure.

### Star/particle layer (CSS-only)

Two `::before` / `::after` pseudoelements on `.hero-stars` each contain 10 `radial-gradient` dots at different positions. The `::after` layer drifts via `starsDrift` keyframe (45s, `translateY(-25px) translateX(-10px)`). No JavaScript or canvas required.

### Ambient orbs

Blurred circular divs (300–700px) with `rgba` blue fills at 7–45% opacity, positioned absolutely and animated via `orbFloat`. Three orbs per hero: large top-right, medium bottom-left, small mid-center.

---

## Stitch Iteration Workflow

When making changes to this site using Stitch:

1. **Select** the screen you want to change
2. **Click Edit → Add to Chat**
3. **Pick one thing** — use the formula below:

```
Target: [specific component — "the hero CTA button", "the pricing card grid", "the nav bar"]
Change: [what to change and how — visual, not mechanical]
Keyword: [UI/UX term — "visual hierarchy", "whitespace", "contrast", "depth", "glassmorphism"]

Example:
"Update the services grid to increase whitespace between cards. Add a subtle
radial glow behind the active/hovered card. Reduce icon container size to
improve visual balance. Use depth layering to create a floating card effect."
```

4. **Edit Theme** for global changes: dark/light mode, accent color, corner radius, font swap
5. **Prototype** after 2–3 iteration rounds to validate interactive states (button hovers, scroll behavior, card reveals)
6. **Download HTML** and use an LLM to convert to the static HTML/CSS pattern used across this site

---

## Brand Rules

- `mgc-logo-transparent.png` is the **only** valid logo — circular, PNG with transparent background, cyan drop-shadow applied via CSS `filter: drop-shadow()`
- Raleway is **non-negotiable** as the display font — it carries the brand's premium-but-approachable identity
- Never use `mix-blend-mode` on the logo — the transparency handles it
- Gold (`#FFB347`) is reserved for the "Client Portal" nav link and Elite tier elements — do not use it as a general accent
- All CTAs use pill radius (`border-radius: 100px`) — no square or lightly-rounded buttons in the primary UI
- Section backgrounds alternate: `--abyss` → `--deep` → `--ocean` — never two identical adjacent section backgrounds
