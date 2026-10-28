// Numbers shown on the landing page. Every one needs a source a judge or investor can check.
// Market figures are added only once the research behind them has been verified.
export const PROOF = [
  {
    big: '1 in 1,000',
    line: 'chance that Qloo’s city rankings line up with where brands are really stocked by luck alone',
    source: '7 brands, 12 US cities, public stockist lists vs Qloo, permutation test (Oct 2026)',
  },
  {
    big: '38 / 46',
    line: 'real shop brands, from Patagonia to small labels like Story mfg., recognised by name',
    source: 'Test lookups against Qloo’s hackathon API (Oct 2026)',
  },
  {
    big: '3 of 3',
    line: 'real independent shops where Restocked matched what they carry better than a bestseller list',
    source: 'Small test, Oct 2026: 6 to 9 carried brands per shop from their public brand pages; one shop still below chance. Details in the README',
  },
  {
    big: '0',
    line: 'brands guessed. Doubtful matches are asked about; unknown ones are left out',
    source: 'How the agent is built',
  },
]

// Market numbers, each read on its primary source (market research, 17 Oct 2026).
export const MARKET = [
  {
    big: '585,925',
    line: 'US retail businesses with fewer than 20 employees, selling $915B a year',
    source: 'US Census, Statistics of US Businesses, 2022',
    href: 'https://www2.census.gov/programs-surveys/susb/tables/2022/us_state_6digitnaics_2022.txt',
  },
  {
    big: '3.2M',
    line: 'retail businesses across the EU with fewer than 20 employees',
    source: 'Eurostat structural business statistics, 2024 (sum of the 0–9 and 10–19 employee bands)',
    href: 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/sbs_sc_ovw',
  },
  {
    big: '#2',
    line: 'problem for US small businesses, out of 75: the cost of supplies and inventory',
    source: 'NFIB, Small Business Problems & Priorities, 2024',
    href: 'https://nfib.com/wp-content/uploads/2024/10/2024-Small-Business-Problems-Priorities.pdf',
  },
  {
    big: '+19%',
    line: 'year-on-year growth in wholesale buying by brick-and-mortar independents',
    source: 'Faire Independent Retail Report, 130k+ retailers, Q2 2025 to Q2 2026',
    href: 'https://www.faire.com/news/faire-independent-retail-report-july-22-2026',
  },
]

// The cost of buying wrong. Read on the sources linked (Oct 2026 research).
export const COST = [
  {
    big: '$1.73T',
    line: 'lost by retailers worldwide each year to inventory distortion; $572B of it is overstock, stock bought that nobody wanted',
    source: 'IHL Group 2025 study, as summarised by Board, 2025',
    href: 'https://www.board.com/resources/the-1-73-trillion-wake-up-call',
    viz: { type: 'split', part: 572, total: 1730, partLabel: '$572B overstock', restLabel: 'out-of-stocks and shrink' },
  },
  {
    big: '19 days',
    line: 'of cash the median small retailer holds in reserve. One wrong order can eat most of it',
    source: 'JPMorgan Chase Institute, Cash Flows, Balances and Buffer Days (2015 data)',
    href: 'https://www.jpmorganchase.com/institute/all-topics/business-growth-and-entrepreneurship/report-cash-flows-balances-and-buffer-days',
    viz: { type: 'days', filled: 19, of: 30 },
  },
]

// Why now, and why this can be a large company. Each figure was read on the source linked.
export const TAILWINDS = [
  { big: '65%', line: 'of UK retail is independent; independents are over half of retail locations in every US state', source: 'Faire Independent Retail Report, Jul 2026', href: 'https://investor.wedbush.com/wedbush/article/bizwire-2026-7-22-faire-unveils-first-of-its-kind-data-on-the-state-of-independent-retail', viz: { type: 'share', value: 65, label: 'UK retail that is independent' } },
  { big: '605', line: 'new US independent bookstores opened in 2025; booksellers’ association membership up 151% in six years', source: 'American Booksellers Association, May 2026', href: 'https://www.bookweb.org/node/1700609' },
  { big: '$1T', line: 'of US retail revenue AI agents could drive by 2030 ($3–5T globally)', source: 'McKinsey, Oct 2025, via Digital Commerce 360', href: 'https://www.digitalcommerce360.com/2025/10/20/mckinsey-forecast-5-trillion-agentic-commerce-sales-2030/' },
  { big: '600M+', line: 'entities and 30T+ cross-domain connections in Qloo’s taste graph, the data no buyer has today', source: 'Qloo, 2026', href: 'https://www.qloo.com/' },
]

export const COMPARABLES = [
  { big: '$12.4B', line: 'Faire’s valuation as the wholesale marketplace for independent shops', source: 'BetaKit, Nov 2021', href: 'https://betakit.com/faire-banks-400-million-usd-series-g-at-12-4-billion-valuation/' },
  { big: '$425M', line: 'Lightspeed paid for NuORDER, a B2B wholesale ordering platform', source: 'Retail Insider, Jun 2021', href: 'https://retail-insider.com/retail-insider/2021/06/lightspeed-announces-acquisition-of-two-global-digital-commerce-businesses/' },
  { big: '$378B', line: 'sold by Shopify merchants in 2025: small sellers are a giant market for software', source: 'Shopify FY2025 10-K', href: 'https://www.sec.gov/Archives/edgar/data/1594805/000159480526000007/shop-20251231.htm' },
]

// Simple arithmetic from the counts above and the Shop plan price. Illustrative, not a forecast.
const SHOPS = 585925 + 3200000
const PLAN_YEAR = 29 * 12
export const SIZING = {
  shops: SHOPS,
  plan: PLAN_YEAR,
  at: [1, 5].map((pct) => ({ pct, shops: Math.round((SHOPS * pct) / 100), arr: Math.round((SHOPS * pct * PLAN_YEAR) / 100) })),
}
