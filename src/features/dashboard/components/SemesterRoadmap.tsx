import React, { useMemo } from 'react';
import type { SemesterGroup } from '@/core/models/types';
import { SemesterNode } from './SemesterNode';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useTranslation } from '@/app/i18n/useTranslation';
import { getSemesterTitle } from '@/core/utils/semesterUtils';

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
            {groupedByYear.map(({ year, yearSemesters }) => (
                <div key={year} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    padding: 'var(--space-md)',
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    minWidth: 'fit-content'
                }}>
                    <div style={{
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        color: 'var(--color-accent)',
                        textTransform: 'uppercase',
                        letterSpacing: '1.2px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span style={{
                            width: '4px',
                            height: '14px',
                            backgroundColor: 'var(--color-accent)',
                            borderRadius: '2px'
                        }} />
                        {t('label.year')} {year}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {yearSemesters.map((sem, index) => (
                            <React.Fragment key={sem.semesterId}>
                                <SemesterNode
                                    semesterId={sem.semesterId}
                                    label={getSemesterTitle(sem, t)}
                                    status={sem.status}
                                    totalCredits={sem.totalCredits}
                                    completedCredits={sem.completedCredits}
                                    attemptFailedCount={sem.attemptFailedCount}
                                    isSelected={selectedSemester === sem.semesterId}
                                    onClick={() => onSelectSemester(sem.semesterId)}
                                />
                                {index < yearSemesters.length - 1 && (
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
