export const meta = {
  name: 'generation-wave',
  description: 'Generate one wave of craft-option candidates through the three-skill pipeline; owner reviews everything, nothing publishes',
  whenToUse: 'Pass args: { craftIds: ["product|section|field|option", ...], wave: "wave-NN" }. Derive craftIds from data-store/generation-queue.json states B/C.',
  phases: [{ title: 'Generate' }],
}

const REPO = 'C:/Users/ChaseStanley/Downloads/files/brand_assets/blessed-dressed'

const RESULT = {
  type: 'object', additionalProperties: false,
  properties: {
    craftId: { type: 'string' },
    outcome: { type: 'string', enum: ['generated', 'skipped', 'failed'] },
    attempt: { type: ['integer', 'null'] },
    jobId: { type: ['string', 'null'] },
    candidatePath: { type: ['string', 'null'] },
    sha1: { type: ['string', 'null'] },
    qcVerdict: { type: ['string', 'null'] },
    note: { type: 'string' },
  },
  required: ['craftId', 'outcome', 'attempt', 'jobId', 'candidatePath', 'sha1', 'qcVerdict', 'note'],
}

const ids = Array.isArray(args?.craftIds) ? args.craftIds : []
const wave = args?.wave ?? 'wave'
if (!ids.length) return { error: 'args.craftIds is empty — derive it from data-store/generation-queue.json states B/C' }

phase('Generate')
log(`${wave}: ${ids.length} craft options`)

const results = await pipeline(ids, (craftId, _item, i) =>
  agent(`You are generating ONE craft-option photograph for the Blessed & Dressed catalog, inside an unattended wave. Repo: ${REPO}. Work ONLY on this craft; touch nothing else.

Craft: ${craftId} (format product|sectionId|fieldId|optionId).

Ground truth to load first:
- Its entry in ${REPO}/data-store/generation-queue.json (find entries[] where craftId === "${craftId}"): carries illustration path/status, pipeline artifact flags, rejectionContext (owner + July rejection reasons — THE failure data your prompt must correct), and descriptionHazards (when present, the catalog prose is unreliable — the tech-pack drawing and the ledger's rejection context are the geometry authority, NOT the description).
- Its ledger record in ${REPO}/data-store/image-decision-ledger.json (crafts["${craftId}"]) for decision history.
- Pipeline folder ${REPO}/.craft-pipeline/<product>/<option>/ — spec.json/prompt.json may or may not exist.

Stages, IN ORDER:
1. If spec.json is missing or lacks this craft's sectionId, invoke the tech-pack-interpreter skill for this option first.
2. Invoke the garment-image-director skill. The generation prompt MUST be unique to this craft and MUST encode the rejection failure data: every rejectionContext tag/note becomes an explicit locked constraint (wrong count -> lock the exact count; wrong side -> state the side and forbid the mirror; looks-identical-to-sibling -> name the discriminator that separates it). Owner reference photos listed in prompt.json ownerCorrections[].references OUTRANK the drawing. Use the tech-pack illustration as the geometry reference image via the Higgsfield MCP.
3. THE HAZARD RULE this project has paid for: the credit is spent at generate_image; the artifact becomes durable only at record_generation. Download the result to candidate-<N>.png and update generation.json IMMEDIATELY after generation, before QC, before anything. On any failure after generation, report jobId + result URL — NEVER regenerate.
4. Invoke the garment-image-qc skill; write qc.json. QC is advisory (the owner decides publishes) — record the verdict either way.
5. NEVER touch ${REPO}/data-store/options/*.json. NEVER publish. One generation attempt only — if QC fails, record the verdict and stop (the correction loop is a later, human-visible pass).

If the craft's queue entry is missing, or its illustration status is not verified-match/drawing-unverified, or the illustration file does not exist on disk: outcome=skipped with the reason — do not spend a credit.

Return the structured result. note = one sentence: what the prompt locked, and any lesson for later waves.`,
    { label: `gen:${craftId.split('|').pop()}`, phase: 'Generate', schema: RESULT }))

const flat = results.filter(Boolean)
return {
  wave,
  generated: flat.filter((r) => r.outcome === 'generated').length,
  skipped: flat.filter((r) => r.outcome === 'skipped'),
  failed: flat.filter((r) => r.outcome === 'failed'),
  results: flat,
}
