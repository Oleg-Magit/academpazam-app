import { getMeta, saveMeta } from '../db/db';
import { isAttemptPassed } from './courseLifecycle';
import type { SemesterGroup } from '../models/types';

export interface SupportPromptState {
    status: 'visible' | 'maybe_later' | 'dismissed_permanently';
    lastDismissedAt: number | null;
    eligibilityMetAt: number | null;
}

const SUPPORT_STATE_KEY = 'support_prompt_state';
const COOLDOWN_DAYS = 30;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

/**
 * Retrieves the support prompt state from IndexedDB meta store.
 */
export const getSupportState = async (): Promise<SupportPromptState> => {
    const meta = await getMeta(SUPPORT_STATE_KEY);
    return meta?.value || {
        status: 'visible',
        lastDismissedAt: null,
        eligibilityMetAt: null
    };
};

/**
 * Updates the support prompt state in IndexedDB meta store.
 */
export const updateSupportState = async (state: Partial<SupportPromptState>) => {
    const currentState = await getSupportState();
    await saveMeta(SUPPORT_STATE_KEY, { ...currentState, ...state });
};

/**
 * Stricter eligibility check for the support milestone.
 * A semester counts ONLY if every course attempt in that semester is resolved by a pass.
 * This is more conservative than the roadmap logic which allows active retakes.
 */
export const calculateStrictlyCompletedSemesters = (
    semesterGroups: SemesterGroup[],
    passingThreshold: number
): number => {
    return semesterGroups.filter(group => {
        // Must have courses to be "completed"
        if (group.courses.length === 0) return false;

        // Every course in this semester must be resolved by a PASS in its lineage.
        // We use isAttemptPassed to check if either this attempt passed or a later one did.
        // Actually, isAttemptPassed checks if THIS attempt passed. 
        // For the "meaningful completion" of THIS semester, we want to know if all courses
        // associated with this semester's load are now PASSED.
        
        return group.courses.every(course => isAttemptPassed(course, passingThreshold));
    }).length;
};

/**
 * Determines if the support prompt should be displayed.
 */
export const shouldShowSupportPrompt = (
    strictlyCompletedCount: number,
    state: SupportPromptState
): boolean => {
    if (state.status === 'dismissed_permanently') return false;
    
    // Check threshold
    if (strictlyCompletedCount < 2) return false;

    // Check "Maybe later" cooldown
    if (state.status === 'maybe_later' && state.lastDismissedAt) {
        const now = Date.now();
        if (now - state.lastDismissedAt < COOLDOWN_MS) {
            return false;
        }
    }

    return true;
};
