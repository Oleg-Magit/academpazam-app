import type { Topic } from '@/core/models/types';
import type { ExtractedCourseTopic } from '@/core/services/ai';

export interface CourseBlueprintProposal {
    id: string;
    title: string;
    description: string;
    selected: boolean;
    isValid: boolean;
    isDuplicate: boolean;
}

/** Normalizes only the title noise that should not affect exact duplicate checks. */
export const normalizeTopicTitle = (title: string): string => title
    .trim()
    .toLocaleLowerCase()
    .replace(/[.,;:!?()[\]{}"'`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const prepareCourseBlueprintProposals = (
    extracted: ExtractedCourseTopic[],
    existingTopics: Topic[],
): CourseBlueprintProposal[] => {
    const existingTitles = new Set(existingTopics.map(topic => normalizeTopicTitle(topic.title)));
    const seenTitles = new Set<string>();

    return extracted.map((topic, index) => {
        const title = topic.title.trim().replace(/\s+/g, ' ');
        const normalizedTitle = normalizeTopicTitle(title);
        const isValid = normalizedTitle.length > 0;
        const isDuplicate = isValid && (existingTitles.has(normalizedTitle) || seenTitles.has(normalizedTitle));
        if (isValid) seenTitles.add(normalizedTitle);

        return {
            id: `proposal-${index}`,
            title,
            description: topic.description?.trim() ?? '',
            selected: isValid && !isDuplicate,
            isValid,
            isDuplicate,
        };
    });
};

export const validateCourseBlueprintProposals = (
    proposals: CourseBlueprintProposal[],
    existingTopics: Topic[],
): CourseBlueprintProposal[] => prepareCourseBlueprintProposals(
    proposals.map(({ title, description }) => ({ title, description })),
    existingTopics,
).map((proposal, index) => ({
    ...proposal,
    selected: proposals[index].selected && proposal.isValid,
}));
