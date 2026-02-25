import React, { useState } from 'react';
import { Modal } from '@/ui/Modal';
import { Button } from '@/ui/Button';
import { Select } from '@/ui/Select';
import { useTranslation } from '@/app/i18n/useTranslation';
import type { CourseWithTopics, Semester } from '@/core/models/types';

interface DeleteSemesterModalProps {
    isOpen: boolean;
    onClose: () => void;
    semesterId: string;
    semesterName: string;
    courses: CourseWithTopics[];
    semesters: Semester[];
    onDelete: (targetSemesterId: string | null) => Promise<void>;
}

export const DeleteSemesterModal: React.FC<DeleteSemesterModalProps> = ({
    isOpen, onClose, semesterId, semesterName, courses, semesters, onDelete
}) => {
    const { t } = useTranslation();
    const [migrationTarget, setMigrationTarget] = useState<string>('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Default migration target to the first available semester that isn't this one
    useState(() => {
        const firstOther = semesters.find(s => s.id !== semesterId);
        if (firstOther) setMigrationTarget(firstOther.id);
    });

    const hasCourses = courses.length > 0;

    // Options for migration
    const migrationOptions = semesters
        .filter(s => s.id !== semesterId)
        .map(s => ({
            value: s.id,
            label: `${t('action.move_to')} ${s.name}`
        }));

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onDelete(hasCourses ? migrationTarget : null);
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${t('action.delete')} ${semesterName}`}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p>
                    {t('msg.delete_semester_confirm', { name: semesterName }) || `Are you sure you want to delete ${semesterName}?`}
                </p>

                {hasCourses && (
                    <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                        <p style={{ margin: '0 0 12px 0', color: 'var(--color-warning)', fontWeight: 500 }}>
                            {t('msg.semester_contains_courses', { count: courses.length }) || `Warning: This semester contains ${courses.length} courses.`}
                        </p>
                        <Select
                            id="migration-target"
                            name="migrationTarget"
                            label={t('label.migrate_to') || "Migrate courses to:"}
                            value={migrationTarget}
                            onChange={(e) => setMigrationTarget(e.target.value)}
                            options={migrationOptions}
                        />
                    </div>
                )}

                {!hasCourses && (
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                        {t('msg.semester_empty_safe') || "This semester is empty and can be safely deleted."}
                    </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                    <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
                        {t('action.cancel')}
                    </Button>
                    <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? t('label.loading') : t('action.delete')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
