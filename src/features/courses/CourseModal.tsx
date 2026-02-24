import React, { useState, useEffect } from 'react';
import { Modal } from '@/ui/Modal';
import { Input } from '@/ui/Input';
import { Select } from '@/ui/Select';
import { Button } from '@/ui/Button';
import type { Course, CourseStatus } from '@/core/models/types';
import { saveCourse } from '@/core/db/db';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from '@/app/i18n/useTranslation';

interface CourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    planId: string;
    courseToEdit?: Course | null;
    initialData?: Partial<Course>;
}

export const CourseModal: React.FC<CourseModalProps> = ({
    isOpen, onClose, onSave, planId, courseToEdit, initialData
}) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [credits, setCredits] = useState('3');
    const [semester, setSemester] = useState('1');
    const [notes, setNotes] = useState('');
    const [manualStatus, setManualStatus] = useState<CourseStatus>('not_started');
    const [error, setError] = useState('');

    useEffect(() => {
        if (courseToEdit) {
            setName(courseToEdit.name);
            setCode(courseToEdit.code || '');
            setCredits(courseToEdit.credits.toString());
            setSemester(courseToEdit.semester);
            setNotes(courseToEdit.notes || '');
            setManualStatus(courseToEdit.manualStatus || 'not_started');
        } else {
            setName(initialData?.name || '');
            setCode(initialData?.code || '');
            setCredits(initialData?.credits?.toString() || '3');
            setSemester(initialData?.semester || '1');
            setNotes(initialData?.notes || '');
            setManualStatus(initialData?.manualStatus || 'not_started');
        }
        setError('');
    }, [courseToEdit, isOpen, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Course name is required');
            return;
        }
        const creditsNum = parseFloat(credits);
        if (isNaN(creditsNum) || creditsNum <= 0) {
            setError('Credits must be a positive number');
            return;
        }

        const course: Course = {
            id: courseToEdit?.id || uuidv4(),
            degreePlanId: planId,
            name,
            code,
            credits: creditsNum,
            semester,
            notes,
            manualStatus: manualStatus,
            createdAt: courseToEdit?.createdAt || Date.now(),
            updatedAt: Date.now(),
        };

        try {
            await saveCourse(course);
            onSave();
            onClose();
        } catch (err) {
            console.error(err);
            setError('Failed to save course');
        }
    };

    const SEMESTER_OPTIONS = React.useMemo(() => [
        ...Array.from({ length: 8 }, (_, i) => ({ value: (i + 1).toString(), label: `${t('label.semester')} ${i + 1}` })),
        { value: 'Summer', label: 'Summer' }
    ], [t]);

    const STATUS_OPTIONS: { value: CourseStatus; label: string }[] = React.useMemo(() => [
        { value: 'not_started', label: t('status.not_started') },
        { value: 'in_progress', label: t('status.in_progress') },
        { value: 'completed', label: t('status.completed') }
    ], [t]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={courseToEdit ? t('action.edit') : t('modal.add_course.title')}
        >
            <form onSubmit={handleSubmit}>
                <Input
                    id="course-code"
                    name="courseCode"
                    label={`${t('label.course_code')} (Optional)`}
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="e.g. CS101"
                />
                <Input
                    id="course-name"
                    name="courseName"
                    label={t('label.course_name')}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    error={error}
                    required
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                    <Input
                        id="course-credits"
                        name="courseCredits"
                        label={t('label.credits')}
                        type="number"
                        step="0.5"
                        value={credits}
                        onChange={e => setCredits(e.target.value)}
                        required
                    />
                    <Select
                        id="course-semester"
                        name="courseSemester"
                        label={t('label.semester')}
                        value={semester}
                        onChange={e => setSemester(e.target.value)}
                        options={SEMESTER_OPTIONS}
                    />
                </div>

                {(!courseToEdit) && (
                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <Select
                            id="course-status"
                            name="courseStatus"
                            label={t('label.initial_status')}
                            value={manualStatus}
                            onChange={e => setManualStatus(e.target.value as CourseStatus)}
                            options={STATUS_OPTIONS}
                        />
                        <small style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
                            {t('label.initial_status')} auto-calculated if topics added.
                        </small>
                    </div>
                )}

                <Input
                    id="course-notes"
                    name="courseNotes"
                    label={t('label.notes')}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                />

                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 'var(--space-md)',
                    marginTop: 'var(--space-lg)',
                    flexWrap: 'wrap-reverse'
                }}>
                    <Button type="button" variant="ghost" onClick={onClose} style={{ flex: '1 1 100px' }}>{t('action.cancel')}</Button>
                    <Button type="submit" style={{ flex: '1 1 100px' }}>{t('action.save')}</Button>
                </div>
            </form>
        </Modal>
    );
};
