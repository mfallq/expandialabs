# expandialabs

This is the website for my site, expandialabs.com, where I showcase my company
Equanimity Engineering AB's skill set and experience.

A one-page static site (HTML, CSS, vanilla JS, no build step), hosted on Loopia.

- **Design:** [`site/`](site/index.html). Everything in this folder is what gets deployed.
- **Plan:** [`docs/PLAN.md`](docs/PLAN.md). Decisions, open questions, phases, deploy.
- **Brand:** [`docs/BRAND.md`](docs/BRAND.md). Explorer + Sage archetype and the visual system.

## Preview locally

```bash
python -m http.server 5180 --directory site
```

Then open http://localhost:5180.

## Deploy

Live at https://www.expandialabs.com (Loopia). Uploads go over FTPS with the
system `curl`; nothing to install.

```bash
npm run deploy:dry
```

```bash
npm run deploy
```

The script uploads only `site/`, never deletes remote files, and refuses any
target other than `…/expandialabs.com/public_html`.

## Credentials

FTP details for Loopia live in `.env` (git-ignored). Copy `.env.example` if it's
missing, and never commit the real file.
