import React, { useState } from 'react';
import { Modal } from '@/ui/Modal';
import { Button } from '@/ui/Button';
import { Select } from '@/ui/Select';
import { saveCourse } from '@/core/db/db';
import { v4 as uuidv4 } from 'uuid';
import type { Course, Semester } from '@/core/models/types';
import { useTranslation } from '@/app/i18n/useTranslation';

interface BulkAddCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    planId: string;
    semesters: Semester[];
}

interface ParsedCourse {
    id: string;
    name: string;
    credits: number;
    semesterId: string;
    error?: string;
}

export const BulkAddCourseModal: React.FC<BulkAddCourseModalProps> = ({ isOpen, onClose, onSave, planId, semesters }) => {
    const { t } = useTranslation();
    const [text, setText] = useState('');
    const [preview, setPreview] = useState<ParsedCourse[]>([]);
    const [step, setStep] = useState<'input' | 'preview'>('input');

    const SEMESTER_OPTIONS = React.useMemo(() => {
        return semesters.map(s => ({
            value: s.id,
            label: s.name
        }));
    }, [semesters]);

    const parseLine = (line: string): { name: string, credits: number, semester: string } | null => {
        line = line.trim();
        if (!line) return null;

        // Try "Name | Credits | Semester"
        const pipeParts = line.split('|');
        if (pipeParts.length === 3) {
            return {
                name: pipeParts[0].trim(),
                credits: parseFloat(pipeParts[1].trim()) || 0,
                semester: pipeParts[2].trim()
            };
        }

        // Try "Name - Credits - Semester"
        const dashParts = line.split('-').map(s => s.trim());
        if (dashParts.length >= 3) {
            const sem = dashParts.pop()!;
            const cred = dashParts.pop()!;
            const name = dashParts.join('-');
            const credits = parseFloat(cred);
            if (!isNaN(credits)) {
                return { name, credits, semester: sem };
            }
        }

        // Try "Name (Credits) Semester"
        const regexParen = /^(.*)\((\d+(?:\.\d+)?)\)\s*(.*)$/;
        const match = line.match(regexParen);
        if (match) {
            return {
                name: match[1].trim(),
                credits: parseFloat(match[2]),
                semester: match[3].trim()
            };
        }

        // Fallback: assume "Name"
        return { name: line, credits: 0, semester: semesters.length > 0 ? semesters[0].id : '' };
    };

    const handlePreview = () => {
        const lines = text.split('\n');
        const parsed: ParsedCourse[] = lines
            .map(line => {
                const result = parseLine(line);
                if (!result) return null;
                return {
                    id: uuidv4(),
                    name: result.name,
                    credits: result.credits,
                    semesterId: result.semester,
                } as ParsedCourse;
            })
            .filter((x): x is ParsedCourse => x !== null);

        setPreview(parsed);
        setStep('preview');
    };

    const handleSave = async () => {
        const newPreview = [...preview];
        let hasErrors = false;

        for (const item of newPreview) {
            item.error = '';
            if (!item.name.trim()) {
                item.error = t('error.name_required');
                hasErrors = true;
            } else if (item.credits <= 0 || item.credits > 30) {
                item.error = t('error.credits_range', { min: 0.5, max: 30 });
                hasErrors = true;
            } else if (!item.semesterId) {
                item.error = t('error.semester_required');
                hasErrors = true;
            }
        }

        if (hasErrors) {
            setPreview(newPreview);
            return;
        }

        for (const item of preview) {
            const course: Course = {
                id: item.id,
                degreePlanId: planId,
                name: item.name,
                credits: item.credits,
                semesterId: item.semesterId,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            await saveCourse(course);
        }
        onSave();
        handleClose();
    };

    const handleClose = () => {
        setText('');
        setPreview([]);
        setStep('input');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={t('modal.paste_courses.title')}
            footer={
                <div style={{ display: 'flex', justifyContent: step === 'input' ? 'flex-end' : 'space-between', width: '100%', gap: 'var(--space-md)' }}>
                    {step === 'input' ? (
                        <Button onClick={handlePreview}>{t('action.preview')}</Button>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={() => setStep('input')}>{t('action.back')}</Button>
                            <Button onClick={handleSave}>{t('action.save_courses')} ({preview.length})</Button>
                        </>
                    )}
                </div>
            }
        >
            {step === 'input' ? (
                <div>
                    <p style={{ marginBottom: 'var(--space-md)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        {t('modal.paste_courses.instruction')}
                        <br />
                        {t('modal.paste_courses.instruction_formats')}<br />
                        - {t('modal.paste_courses.format_1')}<br />
                        - {t('modal.paste_courses.format_2')}<br />
                        - {t('modal.paste_courses.format_3')}
                    </p>
                    <label htmlFor="bulk-courses-textarea" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                        {t('modal.paste_courses.title')}
                    </label>
                    <textarea
                        id="bulk-courses-textarea"
                        name="bulkCoursesText"
                        value={text}
                        onChange={e => setText(e.target.value)}
                        style={{ width: '100%', minHeight: '150px', height: '25vh', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                        placeholder={t('modal.paste_courses.placeholder')}
                    />
                </div>
            ) : (
                <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ overflowX: 'auto', marginBottom: 'var(--space-md)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: '400px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                                    <th style={{ padding: '8px' }}>{t('label.course_name')}</th>
                                    <th style={{ padding: '8px', width: '80px' }}>{t('label.credits')}</th>
                                    <th style={{ padding: '8px', width: '120px' }}>{t('label.semester')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {preview.map((item, idx) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '8px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <input
                                                    id={`preview-name-${idx}`}
                                                    name={`previewName-${idx}`}
                                                    value={item.name}
                                                    onChange={e => {
                                                        const newPreview = [...preview];
                                                        newPreview[idx].name = e.target.value;
                                                        setPreview(newPreview);
                                                    }}
                                                    style={{ width: '100%', border: 'none', background: 'transparent', color: 'inherit', fontWeight: 500 }}
                                                    aria-label={t('label.course_name')}
                                                />
                                                {item.error && <span style={{ fontSize: '0.7rem', color: 'var(--color-danger)' }}>{item.error}</span>}
                                            </div>
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <input
                                                id={`preview-credits-${idx}`}
                                                name={`previewCredits-${idx}`}
                                                type="number"
                                                step="0.5"
                                                value={item.credits}
                                                onChange={e => {
                                                    const newPreview = [...preview];
                                                    newPreview[idx].credits = parseFloat(e.target.value) || 0;
                                                    setPreview(newPreview);
                                                }}
                                                style={{ width: '60px', border: 'none', background: 'transparent', color: 'inherit' }}
                                                aria-label={t('label.credits')}
                                            />
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <Select
                                                id={`preview-sem-${idx}`}
                                                name={`previewSem-${idx}`}
                                                value={item.semesterId}
                                                onChange={e => {
                                                    const newPreview = [...preview];
                                                    newPreview[idx].semesterId = e.target.value;
                                                    setPreview(newPreview);
                                                }}
                                                options={SEMESTER_OPTIONS}
                                                required
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </Modal>
    );
};
