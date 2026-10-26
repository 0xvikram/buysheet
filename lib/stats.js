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
