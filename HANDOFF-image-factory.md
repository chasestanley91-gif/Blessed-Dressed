# Handoff — continue in VS Code (Claude Code)
Updated 2026-07-02 from the Cowork session.

## Where everything lives (file-based state — any session can resume from these)

| Thing | Path |
|---|---|
| The skill (operating manual + all scripts) | `.claude/skills/shirt-image-factory/` — installed in BOTH `claude-vscode/` and `brand_assets/blessed-dressed/` |
| Sprint plan (Phase 0 + 5 sprints + adopted additions) | `claude-vscode/shirt-assets/SPRINT_PLAN.md` |
| Single source of truth (audit) | `claude-vscode/shirt-assets/inventory.json` + `dashboard.html` — rerun `scripts/audit.py <site> <shirt-assets>` before quoting numbers |
| Review gallery (Dustin's accept/remake UI) | `blessed-dressed/public/images/review.html` |
| Remake/discard/bad-pack queue | `blessed-dressed/public/images/review-remake-queue.json` |
| Shirt workbook catalog (1,149 options + statuses) | `claude-vscode/shirt-assets/catalog.json` |
| True shirt tech packs (extracted + wired) | `claude-vscode/shirt-assets/illustrations/` + `blessed-dressed/public/images/techpacks/` (map: `techpack-map.json`) |
| Cropped supplier tiles (jacket/trouser blueprints, unlabeled) | `claude-vscode/shirt-assets/supplier-crops/{trousers,jacket,jacket-monogram}` |
| Lessons + spend log (read before generating!) | `claude-vscode/shirt-assets/reports/failure-log.md` |
| Vest v2 remakes awaiting swap | `blessed-dressed/public/images/generated/vest/*-v2.png` |

## Generation facts
Model: `gpt_image_2` quality=low resolution=1k = **0.5 credits/image** (verified). Escalation: `nano_banana_pro` 2k (2 cr). Blueprint ALWAYS attached as reference image (upload via `media_upload` → `scripts/hf_upload.py` → `media_confirm`). Credits ~372 at handoff; whole remaining plan ≈ 260–330 cr. Higgsfield MCP must be connected in Claude Code.

## Standing decisions Dustin has NOT yet given (do not act without them)
1. Swap the 4 vest v2s into the site (or accept in gallery)
2. Confirm the 2 shirt cuff-splicing discards (site-data edit)
3. Green-light Sprint 1 shirt remake batch — 26 options, ~17 credits
4. Duplicate-file cleanup — 130 files in 36 groups (see inventory.json)

## First job in VS Code (Sprint 1 P0): unify the review builders
Two builders exist: the skill's `scripts/build_review.py` (photos[]/illustration schema) and this repo's newer role-based builder (cards keyed `garment|fieldId|id`, `images[]` with builder/candidate roles — the richer one; adopt it as canonical). Fold the skill's features into it (true-techpack override + demote old image to example, verdicts incl. discard/bad-pack, decisions export format 2, legacy-key migration), and port `apply_review.py` to the same schema. Only 145/490 wired shirt tech packs surface in the newer build — fixing that is part of this task.

## Rules that keep the project safe (from CLAUDE.md + hard experience)
- Blueprint law; QA per feature (pass/fail, no fake percentages); 3 strikes then needs-human.
- Never overwrite an approved/production image — new versions are `-v2`, `-v3`; swaps only with Dustin's explicit OK.
- Budget guard: >10 images or projected cost near balance → show numbers, get approval.
- One session per work stream at a time (Cowork + VS Code both edit these files — drift happened once already). Rerun the audit after switching sessions.
- Read `reports/failure-log.md` before generating; append lessons + spend after.

## Paste-ready kickoff prompt for Claude Code

> Read shirt-assets/HANDOFF.md, shirt-assets/SPRINT_PLAN.md, shirt-assets/inventory.json and the shirt-image-factory skill, then run the audit to refresh the dashboard. Start Sprint 1: unify the two review builders onto the role-based schema (keep all verdict/export features), hand-match the 28 unmatched shirt tech packs, and wait for my go on the 26-option shirt remake batch before generating anything.
