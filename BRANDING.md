# BRANDING.md — MGC Global Consulting
# AI Memory: Design System, Typography, Spacing & Visual Identity

This file is the authoritative reference for all visual decisions on mgcglobalconsulting.com.
Read before touching any HTML, CSS, or layout. All tokens are live in `index.html` `:root`.

---

## Design Identity

**Aesthetic:** Deep-ocean premium dark. The feeling of advanced technology operating beneath the surface — controlled, precise, slightly awe-inspiring. A journey from pitch-black ocean floor to electric cyan sky.

**Tone:** Authoritative but accessible. Enterprise-grade without cold corporate distance.

**One-sentence brief:** "The ocean at night — elegant, deep, and lit from within by electric-blue intelligence."

---

## Color System — CSS Custom Properties

All pages inherit these from `index.html :root`. Never hardcode hex values. Always use the token.

### Background Depth Scale (darkest → lightest)

| Token | Hex | Role |
|---|---|---|
| `--abyss` | `#010C1A` | Page background — darkest depth |
| `--ocean` | `#02111F` | Alternate section background |
| `--deep` | `#031525` | Dark section background |
| `--navy` | `#041C35` | Card backgrounds, panels |
| `--mid` | `#062B52` | Subtle fills, hover states |

### Brand Blue Scale (action → accent)

| Token | Hex | Role |
|---|---|---|
| `--royal` | `#0047CC` | Primary action color |
| `--electric` | `#0066FF` | CTA gradients, links |
| `--sky` | `#0099FF` | Mid-range accents |
| `--bright` | `#00BBFF` | Active states, glows |
| `--cyan` | `#00D4FF` | Hero highlights, stat numbers |

### Text Colors

| Token | Hex | Role |
|---|---|---|
| `--white` | `#FFFFFF` | Headlines, high-contrast |
| `--ice` | `#B8D8F0` | Body text, soft contrast |
| `--fog` | `#7AB8E0` | Muted text |

### Accent

| Token | Hex | Role |
|---|---|---|
| `--gold` | `#FFB347` | Premium tier accents, "Client Portal" nav link |
| `--gold-dim` | `#C98A2A` | Gold hover / subdued gold |

### Opacity Text Scale

| Token | Value | Use |
|---|---|---|
| `--t-dim` | `rgba(180,215,240,0.45)` | Labels, captions, metadata |
| `--t-mid` | `rgba(180,215,240,0.72)` | Body text, descriptions |
| `--t-hi` | `rgba(180,215,240,0.92)` | Readable body text |

### Border Scale

| Token | Value | Use |
|---|---|---|
| `--b-lo` | `rgba(0,153,255,0.07)` | Subtle dividers |
| `--b-mid` | `rgba(0,153,255,0.16)` | Card borders, nav scroll border |
| `--b-hi` | `rgba(0,187,255,0.32)` | Prominent borders, chip outlines |
| `--b-gold` | `rgba(255,179,71,0.25)` | Elite tier card borders |

### Glow Scale

| Token | Value | Use |
|---|---|---|
| `--glow` | `rgba(0,102,255,0.35)` | Primary button shadow |
| `--glow-sky` | `rgba(0,153,255,0.28)` | Ghost button hover shadow |
| `--glow-cyan` | `rgba(0,212,255,0.22)` | Subtle ambient glow |

---

## Typography

### Font Stack (Google Fonts — load order matters)

| Token | Family | Role |
|---|---|---|
| `--display` | **Raleway** | All headlines: hero H1, section H2, card H3, mobile nav |
| `--ui` | **Plus Jakarta Sans** | Navigation links, buttons, labels, eyebrows |
| `--body` | **Outfit** | Body copy, descriptions, running text |
| `--mono` | **JetBrains Mono** | Eyebrows, data chips, code-style labels, stats |

Loaded via Google Fonts with `font-display: swap`. Load order: Raleway → Plus Jakarta Sans → Outfit → JetBrains Mono.

### Type Scale

| Element | Font | Weight | Size | Line-height | Letter-spacing |
|---|---|---|---|---|---|
| **Hero H1** | Raleway | 800 | `clamp(3.2rem, 5.8vw, 5.4rem)` | 1.02 | -1.5px |
| **Section H2** | Raleway | 800 | `clamp(2.4rem, 4.5vw, 3.8rem)` | 1.05 | -1px |
| **Card H3** | Raleway | 700–800 | 1.3–1.5rem | — | — |
| **Body lead** | Outfit | 300 | 1.05rem | 1.8 | — |
| **Hero body** | Outfit | — | — | 2.0 | 0.015em |
| **Button** | Plus Jakarta Sans | 700 | 0.82rem | — | 0.05em (uppercase) |
| **Eyebrow** | JetBrains Mono | 700 | 0.65rem | — | 4px (uppercase) |
| **Data chip value** | JetBrains Mono | 700 | 0.8rem | — | — |
| **Nav link** | Plus Jakarta Sans | 500 | 0.8rem | — | 0.02em |
| **Nav wordmark** | Plus Jakarta Sans | 700 | 0.9rem | — | -0.01em |
| **Nav subline** | Plus Jakarta Sans | 500 | 0.57rem | — | 2.5px (uppercase) |

### Gradient Text Utilities

```css
.sky-text   /* white → bright → cyan → ice at 135° — hero headlines */
.ocean-text /* sky → cyan → white at 135° — secondary highlights */
```

---

## Geometry & Spacing

### Border Radius

| Token | Value | Use |
|---|---|---|
| `--radius` | `20px` | Cards, panels, large containers |
| `--r-sm` | `12px` | Small cards, inner elements |
| `--pill` | `100px` | All buttons, nav CTA, badges |

### Layout Rhythm

| Element | Value |
|---|---|
| Container max-width | `1260px` |
| Container padding | `0 2.5rem` |
| Section padding | `7.5rem 0` |
| Section header max-width | `760px` (centered) |
| Hero padding | `9rem 2.5rem 6rem` |
| Hero grid gap | `4rem` |

### Easing

| Token | Value | Use |
|---|---|---|
| `--ease` | `cubic-bezier(0.16, 1, 0.3, 1)` | All transitions — spring-like deceleration |

---

## Header / Navigation

**Layout:** Fixed, full-width. Three-zone: Logo left / Links center / Portal+CTA right.

**State — default (top of page):**
- Transparent background
- Padding: `1.5rem 0`

**State — scrolled (`.scrolled` class):**
- Background: `rgba(1,12,26,0.95)`
- `backdrop-filter: blur(28px)`
- Padding: `1rem 0`
- Border bottom: `1px solid var(--b-mid)`
- Box shadow: `0 4px 60px rgba(0,0,0,0.7)`
- Transition: `all 0.45s var(--ease)`

**Logo:**
- Image: `assets/mgc-logo-transparent.png` — 62×62px, `border-radius: 50%`
- Filter: `drop-shadow(0 0 12px rgba(0,187,255,0.45)) drop-shadow(0 2px 8px rgba(0,0,0,0.6))`
- Hover filter: stronger cyan glow
- Wordmark: Plus Jakarta Sans 700, 0.9rem, white
- Sub-line: "Making Global Connections" — 0.57rem, `--t-dim`, 2.5px letter-spacing, uppercase

**Nav links:**
- Font: Plus Jakarta Sans 500, 0.8rem, `--t-mid`
- Hover: color → white + underline slides in from left (scaleX 0→1)
- Underline: 1.5px, `--sky` color, `transform-origin: left`

**Client Portal link:**
- Color: `--gold`, font-weight 600, brightness(1.2) on hover

**"Get Started" CTA pill:**
- Background: `linear-gradient(135deg, --royal, --sky)`
- Padding: `0.58rem 1.5rem`
- Border-radius: `--pill`
- Font: Plus Jakarta Sans 700, 0.78rem, uppercase, 0.06em letter-spacing
- Shadow: `0 4px 20px var(--glow), 0 0 0 1px rgba(0,187,255,0.2)`
- Hover: brightness(1.15) + stronger glow + `translateY(-1px)`

**Mobile nav:**
- Hamburger: 3 bars, 22px wide, 1.5px height, white — animates to × on open
- Mobile overlay: `rgba(1,12,26,0.99)`, `backdrop-filter: blur(30px)`
- Mobile links: Raleway 700, 1.6rem, white → `--cyan` hover

**Scroll progress bar:**
- `#scrollBar` — fixed, top 0, 2px height, `linear-gradient(90deg, --royal, --sky, --cyan)`

---

## Hero Section

**Background layers (bottom to top):**
1. `--abyss` base
2. Radial gradient: electric blue ellipse at 60%/30% (royal, 0.25 opacity)
3. Radial gradient: subtle blue at 10%/80%
4. Radial gradient: subtle cyan at 90%/10%
5. Grid overlay: 72×72px lines at `rgba(0,153,255,0.025)`
6. Star field: CSS radial-gradient particles, animated drift

**Ambient orbs:** Absolutely positioned glowing ellipses (royal/electric colors, blur 80–100px) that float via `orbFloat` keyframe.

**Hero layout:** Full viewport height, two-column grid (content left, globe visual right).

**Hero content structure:**
1. Eyebrow chip: JetBrains Mono, uppercase, cyan dot animation
2. H1: Raleway 800, clamp fluid size, gradient text (`.sky-text`)
3. Tagline: brand name + location, JetBrains Mono, `--t-dim`
4. Body: Outfit 300, line-height 2.0, letter-spacing 0.015em
5. CTA row: `.btn-primary` + `.btn-ghost` buttons
6. Stat strip: 3 metrics (JetBrains Mono values, Outfit labels)

---

## Buttons

### Primary (`.btn-primary`)
- Background: `linear-gradient(135deg, --royal, --sky, --bright)`
- Padding: `0.9rem 2rem`
- Border-radius: `--pill`
- Font: Plus Jakarta Sans 700, uppercase, 0.05em letter-spacing
- Shadow: `0 4px 20px var(--glow)`
- Hover: `brightness(1.15)` + `translateY(-2px)` + stronger glow
- Arrow icon: slides right 4px on hover

### Ghost (`.btn-ghost`)
- Background: `rgba(4,28,53,0.6)` (navy, 60%)
- Border: `1px solid var(--bright)`
- Color: `--ice`
- Backdrop-filter: `blur(12px)`
- Border-radius: `--pill`
- Hover: brighter border + slight royal fill overlay

---

## Cards (`.card`)

- Background: `--navy` (`#041C35`)
- Border: `1px solid var(--b-mid)`
- Border-radius: `--radius` (20px)
- Padding: 2–2.5rem
- Hover: border-color → `--b-hi` + `translateY(-4px)` + glow shadow
- Transition: `all 0.4s var(--ease)`

**Service cards:** Add glowing icon container — royal/sky gradient, 52×52px, 14px radius.

---

## Animation System

### Keyframes

| Keyframe | Duration | Effect |
|---|---|---|
| `orbFloat` | 14–24s | Ambient glow orbs drift in hero and sections |
| `starsDrift` | 45s linear | Star field slow parallax drift |
| `ringRotate` | 22–35s linear | Globe orbit rings rotate |
| `chipFloat` | 8–10s | Floating data chips bob vertically |
| `glowPulse` | 5s | Globe glow ring breathes |
| `blink` | 2s | Hero eyebrow cyan dot pulses |

### Scroll Entrance (JS IntersectionObserver)

- Class: `.animate-in`
- Initial state: `translateY(30px)`, `opacity: 0`
- Triggered state: `translateY(0)`, `opacity: 1`
- Transition: `0.75s var(--ease)`
- Stagger: `0.1s` delay increment per sibling

---

## Global Rules for All Pages

- **No emojis anywhere** — replaced with custom inline SVGs
- **Raleway is non-negotiable** — never substitute the display font
- **All nav links** must appear on every page, consistent structure
- **Scroll progress bar** (`#scrollBar`) must remain on every page
- **Logo path:** `assets/mgc-logo-transparent.png` (not `assets/images/`)
- **Color palette is unified** — all pages use index.html root variables
- **No hardcoded hex values** in inline styles — always use CSS custom property tokens
- **Hero body text:** `line-height: 2.0; letter-spacing: 0.015em`
