import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useTranslation } from '@/app/i18n/useTranslation';
import { useCourses, usePlans, useSemesters } from '@/core/hooks/useData';
import { DEFAULT_PASSING_THRESHOLD } from '@/core/constants/grades';
import { notifyAcademPazamDataChanged } from '@/core/events/dataEvents';
import { Button } from '@/ui/Button';
import { AcademicImportModal } from './AcademicImportModal';
import { academicImportText } from './i18n';

interface AcademicImportToolbarActionProps {
    isMobile?: boolean;
}

export const AcademicImportToolbarAction: React.FC<AcademicImportToolbarActionProps> = ({ isMobile = false }) => {
    const { language } = useTranslation();
    const { plans } = usePlans();
    const currentPlan = plans[0];
    const { courses } = useCourses(currentPlan?.id ?? null);
    const { semesters } = useSemesters();
    const [isOpen, setIsOpen] = useState(false);
    const label = academicImportText(language, 'open');

    return (
        <>
            <Button
                variant="secondary"
                onClick={() => setIsOpen(true)}
                disabled={!currentPlan}
                title={isMobile ? label : undefined}
                style={{ height: '42px', flex: isMobile ? '1 1 42px' : 'none' }}
            >
                <Sparkles size={isMobile ? 20 : 18} style={{ marginRight: isMobile ? '0' : '8px' }} />
                {!isMobile && label}
            </Button>

            {currentPlan && (
                <AcademicImportModal
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    onSave={notifyAcademPazamDataChanged}
                    planId={currentPlan.id}
                    passingThreshold={currentPlan.passing_exam_threshold ?? DEFAULT_PASSING_THRESHOLD}
                    courses={courses}
                    semesters={semesters}
                />
            )}
        </>
    );
};
