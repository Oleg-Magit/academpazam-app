import type { Plan } from '@/core/models/types';
type TFunction = (key: string, options?: any) => string;

export const isLegacyDefaultDegreeName = (name?: string): boolean => {
    if (!name || name.trim() === '') return true;
    // Matches exactly "My Degree" or "My Degree (Pass > 56)" including variations in spacing
    const regex = /^My Degree(?:\s*\(\s*Pass\s*>\s*\d+\s*\))?$/i;
    return regex.test(name.trim());
};

export const getLocalizedDegreeName = (plan: Plan, t: TFunction): string => {
    if (isLegacyDefaultDegreeName(plan.name)) {
        return t('degree.defaultName', { pass: plan.passing_exam_threshold || 56 });
    }
    return plan.name;
};
