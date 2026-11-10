# Suspension catalog

`dist/catalog.json` is bundled into both apps. It holds manufacturer starting points:

- Fox 36 / 36SL / 38 forks and FLOAT X2, FLOAT X, DPX2, DPS, FLOAT SL, DHX2, DHX, VAN shocks, model years 2016-2027,
  taken from the owner's manuals on tech.ridefox.com (every model links its source page).
- RockShox Pike / Lyrik / ZEB forks and Vivid / Super Deluxe / Deluxe shocks: adjusters and SRAM's starting rules only.
  SRAM publishes no weight tables; the numbers come from the TrailHead app or the chart on the fork leg.

Rebuild after Fox updates its manuals:

```
python3 tools/build_catalog.py <cache-dir>
```

The build downloads the manual pages into the cache directory, parses the tables and refuses to write the file when
`tools/validate.py` finds a problem (non-contiguous weight ranges, pressure dropping with weight, rebound clicks
growing with load, starting clicks above the known maximum).

RockShox entries are maintained by hand in `rockshox.json`.

Ranges are `[min, max]`; `null` means open-ended (for example `<100 psi` or `22-Open` clicks).
Clicks are always counted from fully closed.
