# Restocked

**The buying agent for independent shops.** Know what pops before you buy.

Paste a supplier's brand list, tell Restocked where your shop is and what your customers already love, and get every
brand sorted into **stock**, **consider** or **skip**, with the evidence. Then ask follow-ups: why a brand landed
where it did, what changes in another city, who buys a brand, how two brands compare, or which new brands your crowd
would like.

Built for the Qloo Agentic Hackathon 2026. **Live: https://restocked-beryl.vercel.app** · one-click demo: [/app/demo](https://restocked-beryl.vercel.app/app/demo)

## For judges

**60-second path:** open [/app/demo](https://restocked-beryl.vercel.app/app/demo). It loads a real Denver drop (recorded
from Qloo's API) without sign-up. Click any row for its reasons, open **Review** to make your own calls, **Order** to turn
them into a supplier email, **Map** for the 12-city market map, and **Qloo calls** to see every request behind it. Ask
the agent on the right: "Why skip Baggu?", "What if I opened in Austin?", "Who buys Stanley?".

| Criterion | Where to see it |
|---|---|
| **Technological implementation** | 7 Qloo capabilities used together (search, insights by taste, insights by city, explainability, demographics, compare, similar brands), asked as separate questions and combined by position (`lib/grade.js`); a paced, allow-listed client (`lib/qloo.js`); an MCP server with 5 tools (`/api/mcp`); 66 tests (`npm test`) |
| **Design** | A full workspace: shop setup → paste a line sheet → agent run → drop table → review → order draft → share link / CSV. Light and dark themes, works on phones |
| **Potential impact** | 585,925 US retailers with under 20 staff buy stock months ahead on instinct; cost of inventory is their #2 problem of 75 (NFIB). Sources on the landing page |
| **Quality of the idea** | Qloo is used on the *supply* side of retail: deciding what to buy, not what to recommend to a shopper. Validated against real stockist lists (below) |
| **"Would it work without Qloo?"** | No. The landing page shows one supplier list sorted for four shops: a bestseller list gives all four the same answer; with Qloo, 21 of 23 brands get a different call depending on the crowd |

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
   `sort_brand_list`, `find_similar_brands`, `describe_audience`, `map_brand_cities` and `compare_brands`. The assistant does the talking;
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

### Against real shops

We also checked Restocked against three real independent shops, using the brands each lists on its own public brands
page (`data/boutiques.json`, copied 27 Oct 2026). For each shop we mixed brands it carries with brands from our sample
supplier list that it doesn't, gave Restocked the shop's city and two of its own favourite brands (never scored), and
measured how often a carried brand is ranked above a not-carried one (AUC; 0.5 is chance). Re-run with
`node scripts/boutiques.mjs`.

| Shop | Carried vs not | Restocked | Bestseller list |
|---|---|---|---|
| [Cumberland Transit](https://www.cumberlandtransit.com/pages/brands), Nashville (outdoor) | 9 vs 20 | **0.61** | 0.38 |
| [Stag Provisions](https://www.stagprovisions.com/pages/brands), Austin (menswear) | 8 vs 21 | **0.54** | 0.25 |
| [Pipe and Row](https://pipeandrow.com/pages/brands), Seattle (womenswear) | 6 vs 21 | 0.35 | 0.21 |

Restocked beat the bestseller list at all three, and beat chance at two. Pipe and Row is below chance: many of its
brands are small labels Qloo doesn't know, and the brands it doesn't carry (Glossier, Aesop, Le Labo) suit its crowd
well. With 6 to 9 carried brands per shop this is a small test, not proof.

## How the sheet is decided

Taste and place are asked as two separate questions, because with a city signal Qloo returns only brands it has
local data for. Each brand gets a third (top, middle, bottom) on each. Taste leads; a top local reading lifts a brand
one group and a bottom one lowers it. A missing reading never counts against a brand. Brands with no reading at all
are "no signal", not "skip". See `lib/grade.js`.

## Run it

```bash
npm install
export QLOO_API_KEY=...        # a Qloo hackathon key; never commit it
npm test                       # 66 tests
npm run build && npm start     # http://localhost:3000
node scripts/examples.mjs      # re-record the sample shops from the live API
```

Qloo answers 429 to parallel requests, so the client sends one call at a time with a short gap and a bounded retry
(`lib/qloo.js`). Unknown parameters are refused before they reach Qloo, because Qloo silently ignores them.

## Limits

- Rankings describe what groups of people tend to like. They are not sales forecasts.
- No data for India, and about half of very small indie brands are missing.
- The grouping rule has not been tested against actual sales.
- The in-app agent understands the phrasings shown in its suggestions; unusual wording gets a help message.
- No shop owner has used it yet.
- Workspaces are saved in the browser until accounts launch.

## Licence

MIT. Built on Qloo's Taste AI API.
