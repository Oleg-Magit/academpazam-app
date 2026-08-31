import { describe, expect, it } from 'vitest';
import type { Topic } from '@/core/models/types';
import { normalizeTopicTitle, prepareCourseBlueprintProposals, toggleCourseBlueprintProposal, updateCourseBlueprintProposal } from './courseBlueprintNormalizer';

const existingTopic: Topic = {
    id: 'existing', courseId: 'course', title: 'Linear Algebra', description: 'Existing',
    status: 'done', createdAt: 1, updatedAt: 1,
};

describe('course blueprint normalization', () => {
    it('makes a valid topic selectable', () => {
        expect(prepareCourseBlueprintProposals([{ title: 'Probability', description: null }], []).at(0)).toMatchObject({
            title: 'Probability', isValid: true, selected: true, isDuplicate: false,
        });
    });

    it('normalizes whitespace for display and duplicate checks', () => {
        expect(prepareCourseBlueprintProposals([{ title: '  Linear   Algebra  ', description: '  Notes  ' }], []).at(0)).toMatchObject({
            title: 'Linear Algebra', description: 'Notes',
        });
        expect(normalizeTopicTitle('Linear,   Algebra!')).toBe('linear algebra');
    });

    it('marks blank titles invalid and unselected', () => {
        expect(prepareCourseBlueprintProposals([{ title: '   ', description: null }], []).at(0)).toMatchObject({
            isValid: false, selected: false,
        });
    });

    it('detects exact existing duplicates and defaults them to unselected', () => {
        expect(prepareCourseBlueprintProposals([{ title: ' linear algebra ', description: null }], [existingTopic]).at(0)).toMatchObject({
            isDuplicate: true, selected: false,
        });
    });

    it('keeps non-duplicates selected and detects duplicate proposals deterministically', () => {
        const proposals = prepareCourseBlueprintProposals([
            { title: 'Probability', description: null },
            { title: 'Probability', description: null },
        ], []);
        expect(proposals.map(({ selected, isDuplicate }) => ({ selected, isDuplicate }))).toEqual([
            { selected: true, isDuplicate: false },
            { selected: false, isDuplicate: true },
        ]);
    });

    it('does not mutate existing topics when a proposal changes', () => {
        const before = { ...existingTopic };
        const proposal = prepareCourseBlueprintProposals([{ title: existingTopic.title, description: null }], [existingTopic])[0];
        proposal.title = 'Changed';
        expect(existingTopic).toEqual(before);
    });

    it('deselects a selected proposal edited into an existing duplicate', () => {
        const proposal = prepareCourseBlueprintProposals([{ title: 'New Topic', description: null }], [existingTopic])[0];
        const edited = updateCourseBlueprintProposal([proposal], 0, 'title', ' Linear   Algebra ', [existingTopic]);
        expect(edited[0]).toMatchObject({
            title: 'Linear Algebra', isDuplicate: true, selected: false,
        });
        expect(toggleCourseBlueprintProposal(edited, 0)[0].selected).toBe(true);
    });

    it('preserves selection when only the description is edited', () => {
        const proposal = prepareCourseBlueprintProposals([{ title: 'New Topic', description: null }], [existingTopic])[0];
        expect(updateCourseBlueprintProposal([proposal], 0, 'description', 'Updated', [existingTopic])[0]).toMatchObject({
            description: 'Updated', selected: true,
        });
    });
});
