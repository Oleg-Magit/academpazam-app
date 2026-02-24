import React, { useState } from 'react';
import { Modal } from '@/ui/Modal';
import { Button } from '@/ui/Button';
import { saveCourse } from '@/core/db/db';
import { v4 as uuidv4 } from 'uuid';
import type { Course } from '@/core/models/types';
import { useTranslation } from '@/app/i18n/useTranslation';

interface BulkAddCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    planId: string;
}

interface ParsedCourse {
    id: string;
    name: string;
    credits: number;
    semester: string;
    error?: string;
}

export const BulkAddCourseModal: React.FC<BulkAddCourseModalProps> = ({ isOpen, onClose, onSave, planId }) => {
    const { t } = useTranslation();
    const [text, setText] = useState('');
    const [preview, setPreview] = useState<ParsedCourse[]>([]);
    const [step, setStep] = useState<'input' | 'preview'>('input');

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
        return { name: line, credits: 0, semester: '1' };
    };

    const handlePreview = () => {
        const lines = text.split('\n');
        const parsed: ParsedCourse[] = lines.map(line => {
            const result = parseLine(line);
            if (!result) return null;
            return {
                id: uuidv4(),
                ...result
            };
        }).filter((x): x is ParsedCourse => x !== null);

        setPreview(parsed);
        setStep('preview');
    };

    const handleSave = async () => {
        for (const item of preview) {
            const course: Course = {
                id: item.id,
                degreePlanId: planId,
                name: item.name,
                credits: item.credits,
                semester: item.semester,
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
        <Modal isOpen={isOpen} onClose={handleClose} title={t('modal.paste_courses.title')}>
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
                        style={{ width: '100%', height: '300px', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                        placeholder={t('modal.paste_courses.placeholder')}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-md)' }}>
                        <Button onClick={handlePreview}>{t('action.preview')}</Button>
                    </div>
                </div>
            ) : (
                <div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: 'var(--space-md)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                                    <th style={{ padding: '8px' }}>{t('label.course_name')}</th>
                                    <th style={{ padding: '8px' }}>{t('label.credits')}</th>
                                    <th style={{ padding: '8px' }}>{t('label.semester')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {preview.map((item, idx) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '8px' }}>
                                            <input
                                                id={`preview-name-${idx}`}
                                                name={`previewName-${idx}`}
                                                value={item.name}
                                                onChange={e => {
                                                    const newPreview = [...preview];
                                                    newPreview[idx].name = e.target.value;
                                                    setPreview(newPreview);
                                                }}
                                                style={{ width: '100%', border: 'none', background: 'transparent', color: 'inherit' }}
                                                aria-label={t('label.course_name')}
                                            />
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <input
                                                id={`preview-credits-${idx}`}
                                                name={`previewCredits-${idx}`}
                                                type="number"
                                                value={item.credits}
                                                onChange={e => {
                                                    const newPreview = [...preview];
                                                    newPreview[idx].credits = parseFloat(e.target.value) || 0;
                                                    setPreview(newPreview);
                                                }}
                                                style={{ width: '50px', border: 'none', background: 'transparent', color: 'inherit' }}
                                                aria-label={t('label.credits')}
                                            />
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <input
                                                id={`preview-sem-${idx}`}
                                                name={`previewSem-${idx}`}
                                                value={item.semester}
                                                onChange={e => {
                                                    const newPreview = [...preview];
                                                    newPreview[idx].semester = e.target.value;
                                                    setPreview(newPreview);
                                                }}
                                                style={{ width: '80px', border: 'none', background: 'transparent', color: 'inherit' }}
                                                aria-label={t('label.semester')}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Button variant="ghost" onClick={() => setStep('input')}>{t('action.back')}</Button>
                        <Button onClick={handleSave}>{t('action.save_courses')} ({preview.length})</Button>
                    </div>
                </div>
            )}
        </Modal>
    );
};
