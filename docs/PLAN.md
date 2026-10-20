# Expandia Labs: implementation plan

The one-page site for **Equanimity Engineering AB** at **expandialabs.com**,
hosted on Loopia. Brand reasoning: [BRAND.md](BRAND.md).

## Where things stand

| Piece | Status |
|---|---|
| Front-end design | ✅ Working prototype in `site/`: real content, responsive, accessible, no build step |
| Brand archetype | ✅ Explorer + Sage, see [BRAND.md](BRAND.md) |
| Credentials file | ✅ `.env` at the repo root, git-ignored, waiting for your FTP password |
| Content | ⚠️ Drafted from LinkedIn's public view and your identity deck. Your full Experience section is hidden when signed out, and placeholders carry a dashed brass underline (`.todo`) |
| Production hardening, deploy, launch | ⏳ Phases 1–4 below |

**Preview locally:** `python -m http.server 5180 --directory site`, then open
<http://localhost:5180> (also saved as the `site` entry in `.claude/launch.json`).

### Page structure

| # | Section | Purpose |
|---|---|---|
| | Hero | "See clearly. Go further. Stay level." The logo's construction drawing, breathing |
| 01 | Expand | The four expansions: Business, Growth, Mindset, Breath |
| 02 | Clients | Full-width carousel of real client logos: two in focus, in colour; the rest turn away, grey and faded |
| 03 | Projects | Full-width carousel of project cards, two in focus (**not attributed**) |
| 04 | Newest project | gotteftermaten.se, built with agentic AI (Claude): real desktop and phone screenshots; Loopia website, PrestaShop e-shop, Svea payments |
| 05 | About | Marcus, the business cards from the deck, facts, two short testimonials |
| 06 | Contact | "What's your biggest pain point today?" Talk, Map, Expand |

**Focus carousels.** Each section is one full-width row. The two middle items
are flat and in focus; the others turn away and fade the further out they are.
Every few seconds the row glides one step to the right. Visitors can also use
the arrows, click a faded item, or press the arrow keys. On phones, clients
keep two small logo tiles in focus and projects show one card. The rows hold
while hovered or focused, while off screen, and when motion is paused; with
reduced motion they become static lists.

**Keeping projects unattributed.** The two carousels step at different
intervals (3.2 s and 4.4 s), hold different numbers of items, and are ordered
so no project lines up with its client. Project copy names domains
("Automotive · Imaging"), never companies.

## Decisions

| Topic | Choice | Why |
|---|---|---|
| Stack | Plain HTML, CSS and vanilla JS, no framework, no build | One page, edited a few times a year. Upload as-is. Own code is about 68 KB before compression |
| Hosting | Loopia, existing account | Already in use; FTPS supported |
| Language | English first | Matches LinkedIn and an Øresund/international audience. Swedish later if wanted |
| Fonts | Inter, **self-hosted** at launch | Prototype uses Google Fonts. A German court (2022) found embedding Google Fonts breached GDPR |
| Tracking | None, or cookieless analytics | No cookie banner needed |
| Contact | `mailto:` link | No backend to maintain. A form can come later |
| Motion | CSS animations and transitions; a small script steps the carousels | Pauses off-screen, honours reduced motion, has a pause control |

## Open questions for you

These block final content. Placeholders are in the page until they're answered.

1. **Experience.** Sign in to LinkedIn in the browser pane (or paste your
   Experience section) so I can complete the client and project lists. The
   public view hides it.
2. **Clients.** Confirm each name and that you may name it publicly.
   Consultancy contracts sometimes forbid naming end clients. Current list:
   Sony, Asker Healthcare Group, Volvo Cars, Axis Communications, CellaVision,
   Den anspråkslösa Cigarraffären.
3. **Projects.** Confirm the five cards and add 2–4 more, e.g. your Asker
   Healthcare work and the 2021–2022 and 2014–2017 roles.
4. ~~Email address~~ Done: Marcus@expandialabs.com.
5. ~~Org.nr~~ Done: 559467-0068. Still open: show *Godkänd för F-skatt*?
6. **Breath or breadth** for the fourth pillar? (See BRAND.md §8.)
7. ~~Testimonials~~ Done: the quotes are approved. Optionally show full names.
8. **Portrait.** Add a photo in About (recommended for a one-person firm), or
   keep the business-card visual?
9. **Header name.** Keep the Equanimity logo with "Expandia Labs" as the site
   name, or design an "EXPANDIA LABS" lockup with the same construction rules?
10. **Personal lines** in About (Vipassana, mentoring, sheep): keep or trim?

## Phases

### Phase 0: Content lock (you, 1–2 h)

- [ ] Answer the open questions above.
- [ ] Final client list, final project cards (unattributed), final copy.
- **Done when** `site/index.html` contains no `.todo` and no TODO comments.

### Phase 1: Production hardening (about half a day)

- [ ] Self-host Inter as variable WOFF2 (latin + latin-ext for å, ä, ö), with
      `font-display: swap` and a preload. Remove the Google Fonts links.
- [ ] Run the SVG logos through SVGO. (It strips the embedded C2PA metadata;
      the masters stay in OneDrive.) Delete unused assets.
- [ ] Icons: `favicon.ico` (16/32), `apple-touch-icon.png` (180×180),
      `site.webmanifest`.
- [ ] Open Graph image, 1200×630: Midnight, symbol, "See clearly. Go further.
      Stay level." Then update `og:image`.
- [ ] `404.html` in the same style, plus `robots.txt` and `sitemap.xml`.
- [ ] A short privacy note (no cookies, no tracking), if that holds.
- [ ] Cache-busting: `?v=YYYYMMDD` on the CSS/JS links, because assets will be
      cached for a long time.
- **Done when** the page makes no third-party requests and Lighthouse
  (mobile) scores ≥ 95 in all four categories.

### Phase 2: Quality pass (about half a day)

- [ ] Accessibility: Lighthouse + axe DevTools (0 violations), a keyboard-only
      run, and a quick NVDA pass.
- [ ] Reduced motion: turn off *Settings → Accessibility → Visual effects →
      Animation effects* in Windows and confirm nothing moves.
- [ ] No-JS: content visible and carousels show as static lists. (Already
      designed in; verify.)
- [ ] Browsers: Chrome, Edge, Firefox, iOS Safari. Watch container-query
      units (business cards), `mask-image` and SVG `transform-box`.
- [ ] Budget: HTML < 40 KB, CSS < 30 KB, JS < 10 KB, fonts < 120 KB, LCP < 1.5 s
      on 4G.
- [ ] Validate HTML at validator.w3.org; proofread all copy.

### Phase 3: Deploy pipeline ✅ live since 20 Oct 2026

Done: `scripts/deploy.mjs` (system `curl`, FTPS, upload-only, path guard),
`npm run deploy:dry` / `npm run deploy`, and `site/.htaccess` forcing HTTPS.
The `experimentsoul` FTP user only sees the expandialabs.com folder.
Loopia redirects the bare domain to `www`, so the canonical URL is
<https://www.expandialabs.com/>. Remaining from the list below: caching,
compression and security headers in `.htaccess`.

Original plan:

- [ ] **Loopia:** confirm expandialabs.com is on the account and find its
      folder, which Loopia uses as `/<domain>/public_html`. Confirm the
      free SSL certificate is active.
- [ ] **Dedicated FTP user.** Loopia recommends a separate FTP user for
      developers. If possible, scope it to the expandialabs.com folder so a
      mistake can never touch gotteftermaten.se.
- [ ] **`scripts/deploy.mjs`** (Node 24, one dependency: `basic-ftp`):
  - reads `.env` via Node's built-in `--env-file`
  - connects with explicit FTPS and fails if TLS can't be negotiated
  - **refuses to run** unless `FTP_REMOTE_DIR` ends in
    `/expandialabs.com/public_html`
  - uploads only `site/` (never `docs/`, `.env` or `.git`)
  - `npm run deploy:dry` lists what would change; `npm run deploy` uploads
- [ ] **`site/.htaccess`** (verify Loopia's Apache support): force HTTPS, 301
      `www` to the bare domain, long cache for versioned assets and short for
      HTML, compression, and security headers (CSP `default-src 'self'` once
      fonts are local, `X-Content-Type-Options`, `Referrer-Policy`,
      `Permissions-Policy`, `frame-ancestors 'none'`).
- [ ] First deploy: dry run, review, deploy, then verify with `curl -I` and a
      browser.
- **Done when** <https://expandialabs.com> serves the site over valid TLS, the
  redirects work, and the headers are present.

### Phase 4: Launch (about 1 h)

- [ ] Smoke test on phone and desktop; click every link.
- [ ] Google Search Console: verify the domain (DNS TXT record at Loopia) and
      submit the sitemap.
- [ ] LinkedIn: the company page already links expandialabs.com; add it to
      your profile's websites too.

### Phase 5: Later (optional)

- Swedish version at `/sv/` with `hreflang`.
- One page per project (still unattributed) for depth and SEO.
- Contact form: PHP on Loopia with a honeypot and rate limit, or a hosted form.
- Official logo files from each client's press page.
- Cookieless analytics (Plausible or Umami) if you want numbers.
- If the site grows to many pages, move to Astro and keep the same design.

## Editing content

- **Clients:** each logo is an `<li class="carousel__item client client--…">`
  in `#clients` in `site/index.html`, with the file in `site/assets/clients/`.
  Tune its optical size with `--logo-h` in `styles.css`. The script clones the
  list for the endless loop.
- **Logo sources:** Sony, Volvo, Axis and CellaVision from Wikimedia Commons;
  Asker from asker.com; the shop badge from gotteftermaten.se. Swap in official
  files from each company's press page if you have them.
- **Shop screenshots:** `site/assets/work/gotteftermaten-desktop.jpg`
  (1440×900 at 1.5×) and `-mobile.jpg` (390×844 at 2×), captured with the age
  gate, welcome popup and cookie banner hidden. Retake them after design changes.
- **Projects:** copy an `<li class="project">` block. Keep company names out,
  don't order them like the client list, and describe the domain rather than
  anything that identifies the company.
- **Pace:** `data-interval` (milliseconds between steps) on each `.carousel`;
  the glide itself is `--glide` in `styles.css`.

## Safety and compliance

- **Shared FTP account.** If `experimentsoul` also hosts gotteftermaten.se, a
  wrong path would overwrite a live shop. The script's path guard and the
  dedicated FTP user are the two protections. Never mirror-with-delete from
  the account root.
- **Credentials.** The password goes only in `.env` (git-ignored, confirmed
  with `git check-ignore`). Never in chat or commits. Rotate it if it leaks.
- **Client confidentiality.** Confirm before naming any client.
- **Unattributed means hard to map, not impossible.** "Image sensors" next to
  "Sony" is guessable. The award is mentioned only on the project card for
  that reason.
- **Trademarks.** The site now shows client logos. Showing them as "worked with" is common, but check each client's brand guidelines or ask, especially where you worked through a consultancy.
- **Tobacco marketing.** Swedish rules call for *särskild måttfullhet*
  (special moderation). The case study now shows the shop's home page, which
  includes products, so keep the copy neutral and about the build.
- **Testimonials** are approved for use.
- **Moving content** is pausable and stops under reduced motion (WCAG 2.2.2).

## Repository layout

```
expandialabs/
├─ site/                  ← everything that is deployed (= public_html)
│  ├─ index.html
│  └─ assets/
│     ├─ css/styles.css   ← tokens at the top, sections in page order
│     ├─ js/main.js       ← header, menu, carousels, level, reveal, pause
│     ├─ clients/         ← client logos
│     ├─ work/            ← gotteftermaten.se screenshots
│     └─ brand/           ← logos and icons copied from the OneDrive masters
├─ docs/
│  ├─ PLAN.md             ← this file
│  └─ BRAND.md            ← archetype and design rationale
├─ .env                   ← FTP credentials (git-ignored)
├─ .env.example           ← the same keys, no secrets (committed)
└─ .claude/launch.json    ← local preview server
```

## Launch checklist

- [ ] No `.todo` placeholders left
- [ ] Lighthouse ≥ 95 in all four categories (mobile)
- [ ] axe: 0 violations; keyboard-only run passes
- [ ] Nothing moves with reduced motion; the pause control works
- [ ] Readable without JavaScript
- [ ] No third-party requests
- [ ] HTTPS, redirects and security headers in place
- [ ] Deployed with the script, after a dry run
