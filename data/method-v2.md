# Real-shop test: method v2 (declared before running, 29 Oct 2026)

Version 1 scored 0.50 on average (AUC) against 0.79 for an LLM alone and 0.28 for a bestseller list.
Two weaknesses were obvious before looking at any new numbers, so version 2 changes exactly these and nothing else:

1. **Use Qloo's full ranking, not three groups.** Version 1 collapsed Qloo's taste ranking into stock / consider / skip
   before scoring, which throws most of the order away. Version 2 scores each brand as
   `taste percentile + 0.25 × city percentile`, where a percentile is 1 for the top of the list and 0 for the bottom,
   and a missing reading counts as 0.5 (neutral), the same "missing never counts against a brand" rule the app uses.
2. **Give Qloo all of the shop's favourites.** Version 1 passed two of the four favourites taken from each shop's own
   brand page. Version 2 passes all four. All four are still left out of scoring.

Unchanged: the same three shops, the same brand lists, the same carried / not-carried labels, the same AUC, and the
same LLM-alone answers (which were given two favourites; noted as a difference in the write-up).
Whatever version 2 scores is published next to version 1, the LLM alone and the bestseller list.
