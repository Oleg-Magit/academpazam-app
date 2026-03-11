/**
 * Centralized default passing threshold for legacy safety.
 * The authoritative source is always plan.passing_exam_threshold.
 * Use this ONLY when no plan context is available.
 */
export const DEFAULT_PASSING_THRESHOLD = 56;

/** @deprecated Use DEFAULT_PASSING_THRESHOLD or plan.passing_exam_threshold */
export const PASS_GRADE = DEFAULT_PASSING_THRESHOLD;
