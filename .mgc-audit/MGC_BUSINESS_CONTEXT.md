# MGC Business Context

Reference file for the MGC website audit. Section A holds stable facts confirmed by the owner. Section B holds dated observations, which must be re-verified before reuse.

> Storage note: this folder is a dot-directory. Netlify does not publish dot-paths from this site. On 2026-09-30, git-tracked dotfiles such as `/.gitignore` and `/.obsidian/app.json` returned 404 on the live domain. This folder is **not** gitignored. If it is committed, it will be in the GitHub repo but not on the website.

---

## A. Stable facts confirmed by the owner (source: owner brief, 2026-09-30)

**Identity statement (use exactly as written):**

> “Mark G. Cartwright, also known as Mark Cartwright or M.G.C., owner and Founder of MGC Global Consulting.”

| Item | Value | Use |
|---|---|---|
| Legal company name | MGC Global Consulting LLC | Public |
| Website | https://www.mgcglobalconsulting.com | Public (live host currently redirects `www` → apex, see B) |
| Public email | mark@mgcglobalconsulting.com | Public, the single contact email to use |
| Public office telephone | 443.208.8178 | Public (`tel:+14432088178`) |
| Direct telephone | 240.962.9982 | **Private.** For direct follow-up only. Do not publish or recommend publishing by default |
| Primary website objective | Help visitors explore our services, understand our expertise, and trust our work | Guides all recommendations |
| Priorities | Accuracy, professional presentation, practical recommendations, low operating costs, efficient token usage | Guides all recommendations |

## B. Dated observations (verified 2026-09-30; re-verify before reuse)

- **Hosting:** Netlify. The `server: Netlify` header is present, and deploys come from GitHub `mgcglobalconsulting/mgc`. `netlify.toml` publishes the repo root (`publish = "."`). Firebase is **not** used: no `firebase.json`, `.firebaserc` or code references. Vercel config files exist, but Vercel is not the production host. Two homepage videos are stored on Vercel Blob.
- **Stack:** static HTML/CSS/JS, Netlify Functions (`lead-intake`, `request-invoice`, `create-checkout`, `payment-webhook`), Supabase (portal auth/DB), Stripe Checkout, HubSpot tracking script (portal 245294674), Notion CRM.
- **Canonical host:** `www` → 301 → `https://mgcglobalconsulting.com`. Page canonicals and `robots.txt` still point to `www`.
- **Contact details currently on the live site (not owner-confirmed):**
  - Phone 410-952-2846. This is outdated; the owner-confirmed office line is 443.208.8178.
  - Emails info@, sales@, billing@ and mark@.
  - Addresses "Owings Mills, Maryland" on the homepage and "101 W Lombard St, Baltimore, MD 21202" in the service page footers.
  - The owner has not confirmed any street address. **Ask before publishing one.**
- **Published prices (live, 2026-09-30):**
  - AI Readiness Assessment $750
  - 90-Day AI Roadmap $2,450
  - Automation Starter $1,500
  - Full Automation Build $4,500
  - CRM Audit $950
  - Full CRM Build $3,800
  - Half-Day AI Briefing $1,200
  - Full-Day Workshop $2,900
  - Systems Architecture $2,200
  - Retainer $1,950/mo (3-month minimum)
  - Membership $199 / $499 / $1,299 per month
- **Claims on the site that need owner evidence before they are relied on:**
  - "47+ automations deployed"
  - "23 hrs average weekly time savings per client"
  - "100% documented"
  - "Zapier Certified"
- **Social profiles linked from the site:** x.com/just_mgc, x.com/_onedopementor, facebook.com/share/17imWSpAHB, youtube.com/@markcartwright-k8l, pin.it/11vaJWC4c. These were not verified as owner-controlled.

## C. Design tokens to respect (from BRANDING.md / DESIGN.md)

- **Colors:**
  - `--abyss #010C1A`, `--navy #041C35`
  - `--electric #0066FF`, `--cyan #00D4FF`
  - `--ice #B8D8F0` (body text)
  - `--gold #FFB347` (premium accent)
- **Fonts:** Raleway (display, non-negotiable), Plus Jakarta Sans (UI), Outfit, JetBrains Mono (data).
- **Logo:** `assets/mgc-logo-transparent.png`. Brand rule: no emojis; use inline SVG icons instead.
