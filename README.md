# Restocked

**The buying agent for independent shops.** Know what pops before you buy.

Paste a supplier's brand list, tell Restocked where your shop is and what your customers already love, and get every
brand sorted into **stock**, **consider** or **skip**, with the evidence. Then ask follow-ups: why a brand landed
where it did, what changes in another city, who buys a brand, how two brands compare, or which new brands your crowd
would like.

Built for the Qloo Agentic Hackathon 2026.

## The problem

Independent shops commit their cash to stock months ahead, usually on instinct and a sales rep's word. Sales history
can't help with a brand a shop has never carried. A wrong buy becomes dead stock.

## What makes it Qloo-powered

Every call comes from Qloo's taste data. Without Qloo there is nothing to rank.

| Question | Qloo call |
|---|---|
| Which brands on this list do fans of what your customers love also love? | `/v2/insights` with `signal.interests.entities`, limited to the list |
| How does each brand rank in your city? | `/v2/insights` with `signal.location.query`, limited to the list |
| Why did a brand land there? | `feature.explainability`: which of your customers' favourites drove the match |
| Who buys a brand? | `/v2/insights` with `filter.type=urn:demographics` |
| How do two brands' audiences differ? | `/v2/insights/compare` plus demographics |
| What else does this crowd love? | `/v2/insights` for brands, leaving out the most famous |
| Is this the right brand? | `/search`, with exact, doubtful and unknown matches kept apart |

Each drop also shows what a **generic bestseller list** (overall popularity alone) would have said, so the difference
your crowd makes is visible.

## Two ways in: an agent

1. **In the app** (`/app`): a planning agent that reads plain messages, asks when something is unclear (for example
   whether "Kapital" means Kapital Bank), runs the right Qloo calls in order, and keeps track of the shop. It plans with
   fixed rules, not a language model, so it needs no AI key and never invents a brand.
2. **As an MCP server** (`/api/mcp`): any assistant that speaks MCP, such as Claude or ChatGPT, can call
   `sort_brand_list`, `find_similar_brands`, `describe_audience` and `compare_brands`. The assistant does the talking;
   Restocked brings the taste data.

```json
{ "mcpServers": { "restocked": { "type": "http", "url": "https://<your-domain>/api/mcp" } } }
```

## Does it hold up?

We compared Qloo's city rankings with real public stockist lists for 7 brands (Filson, Snow Peak, Stanley, Cotopaxi,
Darn Tough, Rifle Paper Co., Herschel) across 12 US cities. After removing overall city and brand effects, Qloo's
brand-by-city ranking agreed with stockist density (r = +0.32 over 84 brand-city pairs; a shuffle test puts the chance
of that by luck at about 1 in 1,000). Agreement was strong for "which cities suit this brand" (average rank correlation
+0.64) and weak for "which brands suit this city" (+0.20), which is why the buy sheet shows groups, not a precise order.

## How the sheet is decided

Taste and place are asked as two separate questions, because with a city signal Qloo returns only brands it has
local data for. Each brand gets a third (top, middle, bottom) on each. Taste leads; a top local reading lifts a brand
one group and a bottom one lowers it. A missing reading never counts against a brand. Brands with no reading at all
are "no signal", not "skip". See `lib/grade.js`.

## Run it

```bash
npm install
export QLOO_API_KEY=...        # a Qloo hackathon key; never commit it
npm test                       # 46 tests
npm run build && npm start     # http://localhost:3000
node scripts/examples.mjs      # re-record the two example conversations from the live API
```

Qloo answers 429 to parallel requests, so the client sends one call at a time with a short gap and a bounded retry
(`lib/qloo.js`). Unknown parameters are refused before they reach Qloo, because Qloo silently ignores them.

## Limits

- Rankings describe what groups of people tend to like. They are not sales forecasts.
- No data for India, and about half of very small indie brands are missing.
- The grouping rule has not been tested against actual sales.
- The in-app agent understands the phrasings shown in its suggestions; unusual wording gets a help message.
- No shop owner has used it yet.

## Licence

MIT. Built on Qloo's Taste AI API.
