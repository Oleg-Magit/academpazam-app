import React, { useMemo } from 'react';
import type { SemesterGroup } from '@/core/models/types';
import { SemesterNode } from './SemesterNode';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useTranslation } from '@/app/i18n/useTranslation';

interface SemesterRoadmapProps {
    semesters: SemesterGroup[];
    selectedSemester: string | null;
    onSelectSemester: (semesterId: string) => void;
}

export const SemesterRoadmap: React.FC<SemesterRoadmapProps> = ({
    semesters,
    selectedSemester,
    onSelectSemester
}) => {
    const { t, language } = useTranslation();
    const isRtl = language === 'he';

    const semestersWithStatus = useMemo(() => {
        let firstIncompleteFound = false;

        return semesters.map((sem) => {
            const isCompleted = sem.totalCredits > 0 && sem.completedCredits === sem.totalCredits;

            let status: 'completed' | 'current' | 'upcoming' = 'upcoming';

            if (isCompleted) {
                status = 'completed';
            } else if (!firstIncompleteFound) {
                status = 'current';
                firstIncompleteFound = true;
            } else {
                status = 'upcoming';
            }

            return {
                ...sem,
                status
            };
        });
    }, [semesters]);

    const groupedByYear = useMemo(() => {
        const groups: Record<number, typeof semestersWithStatus> = {};
        semestersWithStatus.forEach(sem => {
            const y = sem.year || 1;
            if (!groups[y]) groups[y] = [];
            groups[y].push(sem);
        });
        return Object.entries(groups)
            .sort((a, b) => Number(a[0]) - Number(b[0]))
            .map(([year, yearSemesters]) => ({ year: Number(year), yearSemesters }));
    }, [semestersWithStatus]);

    return (
        <div style={{
            display: 'flex',
            gap: '24px',
            overflowX: 'auto',
            padding: '16px var(--space-md)',
            scrollBehavior: 'smooth',
            alignItems: 'flex-start',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
        }} className="roadmap-scroller">
            {groupedByYear.map(({ year, yearSemesters }, yearIndex) => (
                <div key={year} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: 'var(--color-text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        paddingLeft: '4px',
                        marginBottom: '4px',
                        borderBottom: '1px solid var(--color-border)',
                        paddingBottom: '4px'
                    }}>
                        {t('label.year')} {year}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {yearSemesters.map((sem, index) => (
                            <React.Fragment key={sem.semesterId}>
                                <SemesterNode
                                    semesterId={sem.semesterId}
                                    label={(() => {
                                        const termName = t(`term.${(sem.term || 'A').toLowerCase()}` as any);
                                        const defaultPrefix = t('semester.semester');
                                        const isDefault = !sem.semesterName ||
                                            sem.semesterName.startsWith(defaultPrefix) ||
                                            /^\d+$/.test(sem.semesterName);

                                        return isDefault ? termName : `${termName} (${sem.semesterName})`;
                                    })()}
                                    status={sem.status}
                                    totalCredits={sem.totalCredits}
                                    completedCredits={sem.completedCredits}
                                    isSelected={selectedSemester === sem.semesterId}
                                    onClick={() => onSelectSemester(sem.semesterId)}
                                />
                                {(index < yearSemesters.length - 1 || yearIndex < groupedByYear.length - 1) && (
                                    <div style={{
                                        flex: '0 0 16px',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        color: 'var(--color-border)'
                                    }}>
                                        {isRtl ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            ))}
            <style>{`
                .roadmap-scroller::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};
