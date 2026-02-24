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
    const { language } = useTranslation();
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

    return (
        <div style={{
            display: 'flex',
            gap: '16px',
            overflowX: 'auto',
            padding: '16px 4px',
            scrollBehavior: 'smooth',
            alignItems: 'center',
            // Hide scrollbar but allow scroll
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
        }} className="roadmap-scroller">
            {semestersWithStatus.map((sem, index) => (
                <React.Fragment key={sem.semester}>
                    <SemesterNode
                        semester={sem.semester}
                        label={sem.label}
                        status={sem.status}
                        totalCredits={sem.totalCredits}
                        completedCredits={sem.completedCredits}
                        isSelected={selectedSemester === sem.semester}
                        onClick={() => onSelectSemester(sem.semester)}
                    />
                    {index < semestersWithStatus.length - 1 && (
                        <div style={{
                            flex: '0 0 24px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: 'var(--color-border)'
                        }}>
                            {isRtl ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                        </div>
                    )}
                </React.Fragment>
            ))}
            <style>{`
                .roadmap-scroller::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};
