# Mahjong Quick Guide 麻将小白助手

[中文](./README.md)

A quick-reference guide to **Hainan mahjong** rules, built for people who have never played. Every rule comes with real tile faces, so you can pick it up before sitting down at the table.

<p align="center">
  <img src="docs/assets/readme/home.png" width="200" alt="Home: common questions and small tools">
  <img src="docs/assets/readme/qwin.png" width="200" alt="When can I win: hand structure, the pair, fan and the four conditions, all with tile faces">
  <img src="docs/assets/readme/seat.png" width="200" alt="Seat table: name the four seats, pick the dealer, rotate each round">
</p>

## What this is

A quick-reference teaching tool for **Hainan mahjong** rules, made for complete beginners.

It is not a full encyclopedia of scoring patterns. It answers the things that actually block you before your first game:

- **When can this hand win?**
- **Why can't this hand win?**
- What do people mean by *sequence*, *triplet*, *pung*, *chow*, *kong*, *ready hand* and *flower tile*?

Every rule is shown with **real tile faces**, and each term is explained in plain language the first time it appears.

## What it does

| Feature | Description |
|---|---|
| When can I win | One page: the winning shape (four groups + one pair), what the "eye" (the pair) is, what "fan" does, and the four Hainan conditions — the pair is 2/5/8, your seat matches your flowers, winds or dragons form a triplet, and fan decides whether you can win off a discard |
| Why can't I win | Walks through concrete hands: the difference between 13 and 14 tiles, an invalid shape, and unmet conditions |
| 8 real hands | Each hand gets a can/cannot-win verdict, the reason, what it is missing, and the next step; flower tiles are kept apart from the hand |
| Glossary | Sequence, triplet, pung, chow, kong, ready hand, flower tile, missing suit… each with real tile faces |
| Seat table (tool) | Name the four seats, tap who is the dealer, and see how the winds rotate round by round |
| Table screen (tool) | Cast seats and winds to a big screen so all four players can see |

Plus:

- **Bilingual** (Simplified Chinese / English), with a follow-system language option that falls back to Simplified Chinese.
- **Light / dark / follow-system** themes; switching never loses the page you are on.
- **Installable and offline**: add it to your phone's home screen and it opens like an app, even with no network.
- **Zero dependencies, zero network calls**: plain static pages, no framework and no build step — you can open `index.html` by double-clicking it.

## Getting Started

### Option 1: open the hosted version (recommended, works on phones)

<https://p046-mahjong-guide.vercel.app/index.html>

On a phone you can use "Add to Home Screen" and then open it like an app, offline included.

### Option 2: run it locally

```bash
cd prototype
python3 -m http.server 8080
# then open http://localhost:8080/
```

You can also double-click `prototype/index.html` (a `file://` page). All content still works; only offline caching and "install to desktop" need an `http(s)` origin.

## Scope and limitations

- Only **Hainan mahjong** is covered; other regional rule sets are not included in this version.
- **Not a hand-evaluation engine**: it does not judge arbitrary hands live. It presents 8 reviewed static examples (E01–E07, E16).
- Rules come from public sources and local play; tables differ, so **ask at your own table**. Sources and evidence grades are listed in the in-app "About" page.
- No betting, scoring, or gambling features of any kind.
- Tile images are PNG, so extreme zoom levels look soft.

## Technical notes

- Plain static site: `index.html` + `app.js` + `app.css` + `i18n.js` + `data/*.js`. No framework, no build, no external links.
- Data is duplicated on purpose: `data/rules.js` and `data/examples.js` are the runtime source, `data/*.json` the record source. Change both together and keep them JSON-equivalent.
- PWA: `manifest.webmanifest` + `sw.js`; `SW_VERSION` controls the cache version, and the page reloads itself once a new version takes over.
- Deployment: `prototype/` is a complete static site and can be hosted anywhere (this project uses Vercel).

## Layout

| Path | Contents |
|---|---|
| `prototype/` | The product itself: the runnable, installable, offline static site |
| `docs/pm/` | Product plan, UX contract, design freeze draft |
| `docs/qa/` | Product acceptance tracking matrix |
| `docs/plan/` | Handoff package and brand assets |
| `docs/handoff/` | Project status and handoff notes |

> Files such as `AGENTS.md`, `docs/roles/` and `docs/sop/` at the repository root are development and governance conventions. They are unrelated to using the product and can be ignored.
