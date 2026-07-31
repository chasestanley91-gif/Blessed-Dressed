#!/usr/bin/env python3
"""SUPERSEDED — the review gallery is now built by build_review.mjs (role-based schema).

The project briefly had two parallel builders (this photos[]/illustration one and the
role-based node builder); they drifted, so Sprint 1 unified on the richer role-based
schema. All of this script's features live on in the .mjs builder + the v3
apply_review.py:

  true-techpack override ......... techpack role + techpack-map.json fallback
  demote old image to example .... old image keeps its 'builder' role beside the techpack
  verdicts incl. discard/badtp ... unchanged in the v2 page (plus per-image keep/wrong)
  decisions export ............... format 3 (apply_review.py still accepts 2 + legacy)
  legacy-key migration ........... in-browser v1->v2 migration in the page itself

Run instead:
    node scripts/build_review.mjs <site_root>
"""
import sys

sys.exit(__doc__)
