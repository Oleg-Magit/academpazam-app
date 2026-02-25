import React, { useState, useEffect } from 'react';
import { Modal } from '@/ui/Modal';
import { Input } from '@/ui/Input';
import { Select } from '@/ui/Select';
import { Button } from '@/ui/Button';
import type { Course, CourseStatus, Semester } from '@/core/models/types';
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
    semesters: Semester[];
}

export const CourseModal: React.FC<CourseModalProps> = ({
    isOpen, onClose, onSave, planId, courseToEdit, initialData, semesters
}) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [credits, setCredits] = useState('3');
    const [semesterId, setSemesterId] = useState('');
    const [notes, setNotes] = useState('');
    const [manualStatus, setManualStatus] = useState<CourseStatus>('not_started');
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (courseToEdit) {
            setName(courseToEdit.name);
            setCode(courseToEdit.code || '');
            setCredits(courseToEdit.credits.toString());
            setSemesterId(courseToEdit.semesterId);
            setNotes(courseToEdit.notes || '');
            setManualStatus(courseToEdit.manualStatus || 'not_started');
        } else {
            setName(initialData?.name || '');
            setCode(initialData?.code || '');
            setCredits(initialData?.credits?.toString() || '3');
            setSemesterId(initialData?.semesterId || (semesters.length > 0 ? semesters[0].id : ''));
            setNotes(initialData?.notes || '');
            setManualStatus(initialData?.manualStatus || 'not_started');
        }
        setErrors({});
    }, [courseToEdit, isOpen, initialData, semesters]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!name.trim()) {
            newErrors.name = t('error.name_required');
        }

        const creditsNum = parseFloat(credits);
        if (isNaN(creditsNum) || creditsNum <= 0) {
            newErrors.credits = t('error.credits_positive');
        } else if (creditsNum > 30) {
            newErrors.credits = t('error.credits_range', { min: 0.5, max: 30 });
        }

        if (!semesterId) {
            newErrors.semesterId = t('error.semester_required');
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const course: Course = {
            id: courseToEdit?.id || uuidv4(),
            degreePlanId: planId,
            name,
            code,
            credits: creditsNum,
            semesterId,
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
            setErrors({ submit: t('msg.saved_error') });
        }
    };

    const SEMESTER_OPTIONS = React.useMemo(() => {
        return semesters.map(s => ({
            value: s.id,
            label: s.name
        }));
    }, [semesters]);

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
            footer={
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 'var(--space-md)',
                    flexWrap: 'wrap-reverse'
                }}>
                    {errors.submit && <div style={{ color: 'var(--color-danger)', fontSize: '0.875rem', width: '100%', marginBottom: 'var(--space-sm)' }}>{errors.submit}</div>}
                    <Button type="button" variant="ghost" onClick={onClose} style={{ flex: '1 1 100px' }}>{t('action.cancel')}</Button>
                    <Button type="submit" form="course-form" style={{ flex: '1 1 100px' }}>{t('action.save')}</Button>
                </div>
            }
        >
            <form id="course-form" onSubmit={handleSubmit}>
                <Input
                    id="course-code"
                    name="course-code"
                    label={`${t('label.course_code')} (Optional)`}
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="e.g. CS101"
                    autoComplete="off"
                />
                <Input
                    id="course-name"
                    name="course-name"
                    label={t('label.course_name')}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    error={errors.name}
                    required
                    autoComplete="off"
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                    <Input
                        id="course-credits"
                        name="course-credits"
                        label={t('label.credits')}
                        type="number"
                        step="0.5"
                        value={credits}
                        onChange={e => setCredits(e.target.value)}
                        error={errors.credits}
                        required
                    />
                    <Select
                        id="course-semester"
                        name="course-semester"
                        label={t('label.semester')}
                        value={semesterId}
                        onChange={e => setSemesterId(e.target.value)}
                        options={SEMESTER_OPTIONS}
                        error={errors.semesterId}
                    />
                </div>

                {(!courseToEdit) && (
                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <Select
                            id="course-status"
                            name="course-status"
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
                    name="course-notes"
                    label={t('label.notes')}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    autoComplete="off"
                />
            </form>
        </Modal>
    );
};
