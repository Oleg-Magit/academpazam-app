
interface SemesterSubset {
    name?: string;
    semesterName?: string;
    year?: number;
    term?: 'A' | 'B' | 'SUMMER' | 'OTHER';
}

/**
 * Robustly detects if a semester has been renamed by the user.
 */
export const isSemesterRenamed = (semester: SemesterSubset): boolean => {
    const name = semester.name || semester.semesterName;
    if (!name) return false;

    // Check for legacy numeric patterns: "Semester X", "סמסטר X", "Семестр X"
    const defaultPatterns = [
        /^(Semester|סמסטר|Семестр)\s+\d+$/i,
        /^\d+$/ // Just a number (very old legacy)
    ];

    const isLegacyDefault = defaultPatterns.some(pattern => pattern.test(name));
    return !isLegacyDefault;
};

/**
 * Returns strictly the translated academic term label.
 */
export const getSemesterDefaultLabel = (semester: SemesterSubset, t: (key: any) => string): string => {
    const tm = semester.term || 'A';
    return t(`term.${tm.toLowerCase()}` as any);
};

/**
 * Returns the primary visible title for a semester.
 * Custom name if renamed, otherwise the default academic label.
 */
export const getSemesterTitle = (semester: SemesterSubset, t: (key: any) => string): string => {
    if (isSemesterRenamed(semester)) {
        return (semester.name || semester.semesterName) as string;
    }
    return getSemesterDefaultLabel(semester, t);
};

/**
 * Returns secondary academic context (e.g. "Year 1 / Term A")
 */
export const getSemesterContext = (semester: SemesterSubset, t: (key: any) => string): string => {
    const y = semester.year || 1;
    const termLabel = getSemesterDefaultLabel(semester, t);
    return `${t('label.year')} ${y} / ${termLabel}`;
};
