import React, { useState } from 'react';
import { Modal } from '@/ui/Modal';
import { Button } from '@/ui/Button';
import { Select } from '@/ui/Select';
import type { CourseWithTopics } from '@/core/models/types';


interface DeleteSemesterModalProps {
    isOpen: boolean;
    onClose: () => void;
    semesterId: string;
    semesterLabel: string;
    courses: CourseWithTopics[];
    totalSemesters: number;
    onDelete: (targetSemesterId: string | null) => Promise<void>;
}

export const DeleteSemesterModal: React.FC<DeleteSemesterModalProps> = ({
    isOpen, onClose, semesterId, semesterLabel, courses, totalSemesters, onDelete
}) => {
    const [migrationTarget, setMigrationTarget] = useState<string>('prev');
    const [isDeleting, setIsDeleting] = useState(false);

    const hasCourses = courses.length > 0;
    const semIndex = parseInt(semesterId);

    // Options for migration
    const migrationOptions = [
        { value: 'prev', label: `Move to previous semester (Semester ${semIndex - 1})` },
        ...Array.from({ length: totalSemesters }, (_, i) => {
            const id = (i + 1).toString();
            if (id === semesterId) return null;
            return { value: id, label: `Move to Semester ${id}` };
        }).filter(Boolean) as { value: string, label: string }[]
    ];

    if (semIndex === 1) {
        // Can't move to previous if it's semester 1.
        // Remove 'prev' option.
        if (migrationOptions[0].value === 'prev') migrationOptions.shift();
    }

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
            title={`Delete ${semesterLabel}`}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p>
                    Are you sure you want to delete <strong>{semesterLabel}</strong>?
                </p>

                {hasCourses && (
                    <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                        <p style={{ margin: '0 0 12px 0', color: 'var(--color-warning)', fontWeight: 500 }}>
                            Warning: This semester contains {courses.length} courses.
                        </p>
                        <Select
                            id="migration-target"
                            name="migrationTarget"
                            label="Migrate courses to:"
                            value={migrationTarget}
                            onChange={(e) => setMigrationTarget(e.target.value)}
                            options={migrationOptions}
                        />
                    </div>
                )}

                {!hasCourses && (
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                        This semester is empty and can be safely deleted.
                    </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                    <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? 'Deleting...' : 'Delete Semester'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
