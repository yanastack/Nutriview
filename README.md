# NutriView 🦡

**Know before you go.** A front-end prototype that helps UW–Madison students decide where to eat — real student ratings, reviews, and trending dishes across dining halls, so you never waste a meal swipe on something mid.

> **A note on this repo:** This is a recreation — a small solo prototype of the original. The code from the hackathon was lost, so this is my attempt at remaking the concept from scratch. The front-end and UI here were built with AI assistance; the idea and product design are my own.

## What it does

- **Search + trending view** — see what dishes are actually trending across dining halls right now
- **Two view modes** (dropdown below the search bar):
  - **Trending items** — each dining hall tile shows only its trending dishes; click a hall to filter the "Top Rated" strip to that hall
  - **All menu** — tiles become gateways to each hall's full menu, with 🔥 badges on trending items
- **Rate / Review / Alert** — tap a dish to open a detail panel: leave a star rating, post a review (added to the list live), or set an alert for when a dish is back
- **Live busy tags** — each hall shows a crowd-sourced-style status (Busy / Empty / etc.) as static demo data

## Tech

- Plain **HTML / CSS / JavaScript** — no framework, no build step
- State-driven rendering: a single `viewMode` variable + a `selectedHall` filter drive what's shown
- All data is mocked in-memory (`dishes` and `halls` arrays) — no backend yet

## Run it

Just open `index.html` in a browser. That's it.

## Known limitations / next steps

- **No backend** — ratings/reviews live in memory and reset on refresh
- **Mock data** — the next step would be pulling live menus from Nutrislice (UW Dining's menu provider). That needs a small backend proxy, since the endpoint isn't CORS-friendly for direct browser calls
- **"Live line" (real-time busy status)** is stubbed as "coming soon" — would need crowd-sourced reporting to be real

## Note

Uses an original badger illustration, not UW's trademarked Bucky Badger artwork. Not affiliated with or endorsed by UW–Madison.
