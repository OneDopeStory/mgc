# Hero Loop: Storyboard, Script, and Generation Prompts

Status: draft for review. Nothing has been generated. Generation waits for your approval.

Written for: the owner (Mark), to approve before any Higgsfield credits are spent.

## 1. Decision

- Keep the hero layout as it is now: text left, visual right, same stats, same trust bar.
- Replace only the visual inside `.globe-container` on [index.html](../index.html): the current `assets/globe-connected.mp4` is 21 MB, too heavy for a hero loop.
- One video (6 seconds, seamless loop, 16:9, no audio, no text) and one still (poster and reduced-motion fallback).

## 2. Concept in one line

"Every connected system lights up at once." A chrome electrical grid wraps a blue Earth. Pulses travel through it and resolve back to where they started.

Why this fits MGC: the logo is a chrome ring around a blue globe. The loop extends that identity into motion. The grid is the operations message: systems that were disconnected now move as one.

## 3. Palette (from the live tokens)

| Role | Token | Hex |
|---|---|---|
| Background space | `--abyss` | `#010C1A` |
| Ocean navy | `--navy` / `--mid` | `#041C35` / `#062B52` |
| Electric pulse | `--electric` | `#0066FF` |
| Cyan highlight | `--cyan` | `#00D4FF` |
| Chrome highlight | (neutral) | `#E8F2FA` to `#8FA6BD` |
| Warm accent (sparingly) | `--gold` | `#FFB347` |

Keep gold out of the loop itself. It belongs to the page's UI accents.

## 4. Storyboard (6 seconds, loops back to frame 0)

| Time | Shot | What the viewer sees | Camera | Light and motion |
|---|---|---|---|---|
| 0.0 to 1.2 s | Dark void | A single cyan pulse runs along one chrome grid line in deep navy space. The globe is barely visible. | Locked, slightly low | One pulse, faint star field |
| 1.2 to 3.2 s | Grid ignites | Pulses spread outward from that line. Grid nodes flash as the wave passes them. The Earth shows its continents in blue. | Slow orbit, about 8 degrees | Blue wave front, chrome highlights sweep the rings |
| 3.2 to 5.0 s | Convergence | Pulses from every region converge on one bright node over North America, the home base. The rings catch a chrome glint. | Orbit eases to a stop | Brightest moment of the loop; a soft lens glow |
| 5.0 to 6.0 s | Return | The light drains back along the grid to the opening pulse position. The frame matches frame 0. | Orbit completes one full turn | Lights dim to the opening state |

Loop seam rule: frame 6.0 must equal frame 0.0. Pulse positions, rotation angle, and glow level all match. Check this by playing the file in a loop and watching the seam.

## 5. Video prompt (paste into Higgsfield, model `seedance_2_5`)

Settings: t2v mode, 6 seconds, 16:9, 720p (the web hero is about 1280x720), audio off.
Preflight: run with `get_cost: true` first. The account shows 10 credits on the free plan, so confirm the cost before submitting.

> Seamless looping intro. Slow orbit of a photoreal Earth globe in deep ocean-navy space, wrapped in a glowing brushed-chrome electrical grid of thin lines and nodes. Starts with one cyan light pulse running along a single grid line in darkness. Blue (#0066FF) pulse waves spread outward, nodes flash as the wave passes, continents appear in blue. Pulses converge on one bright node over North America with a soft lens glow and chrome highlights sweeping the metal rings. Light drains back along the grid and the motion returns exactly to the opening frame so it loops without a cut. Dark premium cinematic mood, subtle star field, volumetric glow. No text, no logos, no people, no camera shake.

Negative guidance to add if the tool supports it: no text, no watermark, no logo, no people, no flicker, no hard cuts.

## 6. Still image prompt (one image, the poster and reduced-motion fallback)

Settings: 16:9, one frame from the loop's convergence moment (about 4 seconds), highest quality.

> Photoreal Earth globe in deep ocean-navy space, wrapped in a glowing brushed-chrome electrical grid. One bright cyan node over North America with a soft lens glow, blue pulse lines radiating outward, chrome ring highlights. Cinematic, premium, dark. No text, no logo, no people.

## 7. Web delivery (after approval and download)

- Encode to H.264 MP4 at 1280x720, about 3 MB or less, and WebM (VP9) as a second source. The current 21 MB file should not ship in the hero.
- Use the still as the `poster` attribute, so the first paint is an image and the video starts after it loads.
- `muted autoplay loop playsinline` on the `<video>`, which is already the pattern in the hero.
- Honor `prefers-reduced-motion`: show the still and do not autoplay.
- Keep the existing fallback `<img>` pattern, pointing at the still.
- Files go in `assets/` as `hero-loop.mp4`, `hero-loop.webm`, and `hero-loop-poster.jpg`. Old `globe-connected.mp4` can be removed from the page after the swap, not deleted from disk until you confirm.

## 8. Checks before it ships

1. The loop seam is invisible at normal speed.
2. The chrome grid is legible at phone width (test at 390 px).
3. Text on the left stays readable over the video (contrast of `--t-hi` on the dark background is already passing).
4. File size under 3 MB, first frame appears in under 1 s on a normal connection.
5. Reduced-motion users see the still, not the moving loop.

## 9. Decisions I need from you

1. Approve generating one video (6 s, 720p, the prompt in section 5) and one still (section 6). I'll run the cost preflight first and report the credits before submitting.
2. Confirm the convergence point. The draft puts it over North America because it's the home base. Say the word if you want a different focal point.
3. Confirm 720p is enough, or ask for 1080p (higher cost).
4. Approve the swap in `index.html` after you've reviewed the result. Nothing deploys without your approval.
