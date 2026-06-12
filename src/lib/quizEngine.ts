/**
 * quizEngine — the dynamic, metadata-driven craft discovery engine.
 *
 * Pure functions over a live ProductDesignConfig. No hardcoded questions,
 * categories, or options: a category (DesignField) earns a discovery question
 * when it has >= QUESTION_THRESHOLD options AND carries a `quiz` config, and
 * answering scores/reorders options (soft) rather than hiding them.
 */

import type {
  DesignField,
  DesignOption,
  FieldQuiz,
  ProductDesignConfig,
  QuizAnswer,
} from "@/data/options/types";

/** Categories with this many options or more earn a discovery question. */
export const QUESTION_THRESHOLD = 5;

/** Relevance score tiers. */
export const SCORE_EXACT = 100;
export const SCORE_RELATED = 60;
export const SCORE_OTHER = 25;

/** A category is considered "resolved" (adaptive length) when its best-match
 *  set is this small — no further prompting is worthwhile. */
export const RESOLVED_AT = 4;

export type QuizQuestion = {
  /** Field id — also the key used in the styleQuiz answer map. */
  key: string;
  sectionId: string;
  sectionLabel: string;
  field: DesignField;
  quiz: FieldQuiz;
};

/** True when a field should surface a discovery question. */
export function fieldNeedsQuestion(field: DesignField): boolean {
  const hasConfig =
    !!field.quiz?.question && (field.quiz?.answers?.length ?? 0) > 0;
  if (!hasConfig) return false;
  // Explicit enabled flag overrides the option-count heuristic.
  return field.quiz!.enabled ?? field.options.length >= QUESTION_THRESHOLD;
}

/** Ordered list of every quizzable category across a product config. */
export function getQuestionsForConfig(
  config: ProductDesignConfig | null | undefined
): QuizQuestion[] {
  if (!config?.sections) return [];
  const out: QuizQuestion[] = [];
  for (const section of config.sections) {
    for (const field of section.fields) {
      if (fieldNeedsQuestion(field)) {
        out.push({
          key: field.id,
          sectionId: section.id,
          sectionLabel: section.label,
          field,
          quiz: field.quiz!,
        });
      }
    }
  }
  return out;
}

/** Look up the selected answer object for a field, if any. */
export function findAnswer(
  field: DesignField,
  answerId: string | undefined
): QuizAnswer | undefined {
  if (!answerId) return undefined;
  return field.quiz?.answers.find((a) => a.id === answerId);
}

/** Score a single option against a selected answer. */
export function scoreOption(option: DesignOption, answer: QuizAnswer): number {
  const groups = answer.matchGroups ?? [];
  const tags = answer.matchTags ?? [];
  // An answer with no match criteria (e.g. "Show all") treats everything as a match.
  if (groups.length === 0 && tags.length === 0) return SCORE_EXACT;
  if (option.group && groups.includes(option.group)) return SCORE_EXACT;
  if (option.tags && tags.some((t) => option.tags!.includes(t))) return SCORE_RELATED;
  return SCORE_OTHER;
}

export type RankedOptions = {
  /** All options, stable-sorted by relevance (best first). Nothing removed. */
  ranked: DesignOption[];
  /** Count of options scoring SCORE_EXACT — the "best matches". */
  bestCount: number;
  /** Whether an answer is actually narrowing the list. */
  filtered: boolean;
};

/**
 * Rank a field's options for the given answer. Soft: every option is kept,
 * reordered by score. `bestCount` is the size of the top (exact-match) tier.
 */
export function rankOptions(
  field: DesignField,
  answerId: string | undefined
): RankedOptions {
  const answer = findAnswer(field, answerId);
  if (!answer || (!answer.matchGroups?.length && !answer.matchTags?.length)) {
    return { ranked: field.options, bestCount: field.options.length, filtered: false };
  }
  const scored = field.options.map((option, i) => ({
    option,
    score: scoreOption(option, answer),
    i, // preserve original order within a score tier (stable sort)
  }));
  scored.sort((a, b) => (b.score - a.score) || (a.i - b.i));
  const bestCount = scored.filter((s) => s.score === SCORE_EXACT).length;
  return {
    ranked: scored.map((s) => s.option),
    bestCount: Math.max(bestCount, 1),
    filtered: bestCount < field.options.length,
  };
}

/** Adaptive length: is this category narrowed enough to skip extra prompting? */
export function isFieldResolved(
  field: DesignField,
  answerId: string | undefined
): boolean {
  const { bestCount, filtered } = rankOptions(field, answerId);
  return filtered && bestCount <= RESOLVED_AT;
}

/**
 * Pre-select the top-ranked option for each answered, quizzable field that has
 * no existing selection (Style DNA). Replaces the old hardcoded DNA_MAP.
 */
export function applyDesignDNA(
  config: ProductDesignConfig | null | undefined,
  answers: Record<string, string>,
  designSelections: Record<string, string>,
  setDesignSelection: (fieldId: string, optionId: string) => void
): void {
  for (const q of getQuestionsForConfig(config)) {
    const answerId = answers[q.key];
    if (!answerId) continue;
    if (designSelections[q.field.id]) continue;
    const { ranked, filtered } = rankOptions(q.field, answerId);
    if (filtered && ranked[0]) setDesignSelection(q.field.id, ranked[0].id);
  }
}

/** Human-readable chips/summary for answered questions. */
export function getDNAEntries(
  config: ProductDesignConfig | null | undefined,
  answers: Record<string, string>
): { key: string; section: string; value: string }[] {
  const out: { key: string; section: string; value: string }[] = [];
  for (const q of getQuestionsForConfig(config)) {
    const answerId = answers[q.key];
    if (!answerId) continue;
    const answer = findAnswer(q.field, answerId);
    if (!answer) continue;
    out.push({ key: q.key, section: q.field.label, value: answer.label });
  }
  return out;
}
