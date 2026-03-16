import { describe, it, expect } from 'vitest';
import { calculateStrictlyCompletedSemesters, shouldShowSupportPrompt, type SupportPromptState } from './supportService';
import type { SemesterGroup, CourseWithTopics } from '../models/types';

describe('supportService logic verification (Strict Mode)', () => {
    const passingThreshold = 60;

    it('should only count semesters where EVERY course is explicitly Passed', () => {
        const semesters: SemesterGroup[] = [
            {
                semesterId: 'sem1',
                courses: [
                    { id: 'c1', grade: 80, attemptStatus: 'passed' } as any as CourseWithTopics
                ],
            } as any,
            {
                semesterId: 'sem2',
                courses: [
                    { id: 'c2', grade: 40, attemptStatus: 'failed' } as any as CourseWithTopics
                ],
            } as any
        ];

        // Only 1 semester is strictly passed
        expect(calculateStrictlyCompletedSemesters(semesters, passingThreshold)).toBe(1);

        // Even if we add a planned retake for Sem 2 course in a different semester group,
        // the Sem 2 group itself remains "failed" in its courses list.
        const semestersWithPlannedRetake: SemesterGroup[] = [
            ...semesters,
            {
                semesterId: 'sem3',
                courses: [
                    { id: 'c2-retake', repeatedFromCourseId: 'c2', attemptStatus: 'planned' } as any as CourseWithTopics
                ]
            } as any
        ];
        
        // Count should still be 1 because Sem 2 is not resolved by a PASS yet.
        expect(calculateStrictlyCompletedSemesters(semestersWithPlannedRetake, passingThreshold)).toBe(1);

        // Now mark Sem 2 course as Passed
        semesters[1].courses[0].attemptStatus = 'passed';
        semesters[1].courses[0].grade = 90;
        expect(calculateStrictlyCompletedSemesters(semesters, passingThreshold)).toBe(2);
    });

    it('should enforce the >= 2 threshold and respect dismissal states', () => {
        const visibleState: SupportPromptState = {
            status: 'visible',
            lastDismissedAt: null,
            eligibilityMetAt: null
        };

        expect(shouldShowSupportPrompt(0, visibleState)).toBe(false);
        expect(shouldShowSupportPrompt(1, visibleState)).toBe(false);
        expect(shouldShowSupportPrompt(2, visibleState)).toBe(true);
        expect(shouldShowSupportPrompt(3, visibleState)).toBe(true);

        const permanentDismissState: SupportPromptState = {
            status: 'dismissed_permanently',
            lastDismissedAt: Date.now(),
            eligibilityMetAt: Date.now()
        };
        expect(shouldShowSupportPrompt(2, permanentDismissState)).toBe(false);

        const cooldownState: SupportPromptState = {
            status: 'maybe_later',
            lastDismissedAt: Date.now() - (1000 * 60 * 60 * 24 * 10), // 10 days ago
            eligibilityMetAt: Date.now()
        };
        expect(shouldShowSupportPrompt(2, cooldownState)).toBe(false);

        const expiredCooldownState: SupportPromptState = {
            status: 'maybe_later',
            lastDismissedAt: Date.now() - (1000 * 60 * 60 * 24 * 31), // 31 days ago
            eligibilityMetAt: Date.now()
        };
        expect(shouldShowSupportPrompt(2, expiredCooldownState)).toBe(true);
    });
});
