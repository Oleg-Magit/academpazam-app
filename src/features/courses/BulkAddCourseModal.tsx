import React, { useState } from 'react';
import { Modal } from '@/ui/Modal';
import { Button } from '@/ui/Button';
import { Select } from '@/ui/Select';
import { saveCourse, saveSemester } from '@/core/db/db';
import { groupCoursesBySemester } from '@/core/services/dataService';
import { DEFAULT_PASSING_THRESHOLD } from '@/core/constants/grades';
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
    const [pendingSemesters, setPendingSemesters] = useState<Semester[]>([]);
    const [step, setStep] = useState<'input' | 'preview'>('input');
    const [pacing, setPacing] = useState<'2-term' | '3-term'>('3-term');

    const SEMESTER_OPTIONS = React.useMemo(() => {
        const all = [...semesters, ...pendingSemesters].sort((a, b) => a.orderIndex - b.orderIndex);
        return all.map(s => ({
            value: s.id,
            label: s.name
        }));
    }, [semesters, pendingSemesters]);

    const matchSemester = (str: string, currentPending: Semester[] = []) => {
        str = str.toLowerCase().trim();
        if (!str) return null;

        const allSems = [...semesters, ...currentPending];

        // Exact match
        let m = allSems.find(s => s.name.toLowerCase() === str);
        if (m) return m.id;

        // Match by standard numeric position explicitly (e.g., "^1$", "^01$", "^Semester 1$", "^סמסטר 1$")
        // We ensure we only extract if the string is EXACTLY a number or a standard semester format
        const exactNumberMatch = str.match(/^\d+$/);
        const labeledSemesterMatch = str.match(/^(?:semester|sem|סמסטר)\s*(\d+)$/i);

        let semNum = null;
        if (exactNumberMatch) semNum = parseInt(exactNumberMatch[0], 10);
        else if (labeledSemesterMatch) semNum = parseInt(labeledSemesterMatch[1], 10);

        if (semNum !== null) {
            const targetIndex = semNum - 1; // "1" -> orderIndex 0
            if (targetIndex >= 0) {
                // Find by orderIndex (which matches the display order/expected semester)
                const byIndex = allSems.find(s => s.orderIndex === targetIndex);
                if (byIndex) return byIndex.id;

                // Did not exist! We must create a new pending semester.
                const newId = uuidv4();

                // Fetch the translated string for "Semester" if available, else fallback
                const tWord = t('semester.semester') || 'Semester';

                // Calculate next logical metadata
                let nextYear = 1;
                let nextTerm: 'A' | 'B' | 'SUMMER' = 'A';

                const maxOrder = allSems.length > 0 ? Math.max(...allSems.map(s => s.orderIndex)) : -1;
                const lastSem = allSems.find(s => s.orderIndex === maxOrder);

                if (lastSem) {
                    const lastYear = lastSem.year || 1;
                    const lastTerm = lastSem.term || 'A';
                    
                    if (pacing === '2-term') {
                        if (lastTerm === 'A') {
                            nextYear = lastYear;
                            nextTerm = 'B';
                        } else {
                            nextYear = lastYear + 1;
                            nextTerm = 'A';
                        }
                    } else {
                        // 3-term logic
                        if (lastTerm === 'A') {
                            nextYear = lastYear;
                            nextTerm = 'B';
                        } else if (lastTerm === 'B') {
                            nextYear = lastYear;
                            nextTerm = 'SUMMER';
                        } else {
                            nextYear = lastYear + 1;
                            nextTerm = 'A';
                        }
                    }
                }

                // Safeguard: Check if this Year/Term already exists under a different name
                const duplicate = allSems.find(s => s.year === nextYear && s.term === nextTerm);
                if (duplicate) return duplicate.id;

                const newSem: Semester = {
                    id: newId,
                    name: `${tWord} ${semNum}`,
                    orderIndex: targetIndex,
                    createdAt: Date.now(),
                    year: nextYear,
                    term: nextTerm
                };

                currentPending.push(newSem);
                return newId;
            }
        }

        // Fallback to substring matching if numeric extraction didn't work
        m = allSems.find(s => s.name.toLowerCase().endsWith(str) || s.name.toLowerCase().startsWith(str));
        if (m) return m.id;

        return null;
    };

    const handlePreview = () => {
        const lines = text.split('\n');
        const parsed: ParsedCourse[] = [];
        let currentSemesterId = semesters.length > 0 ? semesters[0].id : '';
        const newPendingSemesters: Semester[] = [];

        for (let rawLine of lines) {
            const line = rawLine.trim();
            if (!line) continue;

            const semMatchId = matchSemester(line, newPendingSemesters);
            if (semMatchId) {
                currentSemesterId = semMatchId;
                continue;
            }

            let name = line;
            let credits = 3;
            let inlineSemId = currentSemesterId;

            const pipeParts = line.split('|');
            if (pipeParts.length === 3) {
                name = pipeParts[0].trim();
                credits = parseFloat(pipeParts[1].trim()) || 0;
                const match = matchSemester(pipeParts[2].trim(), newPendingSemesters);
                if (match) inlineSemId = match;
            } else {
                const dashParts = line.split('-').map(s => s.trim());
                if (dashParts.length >= 2) {
                    const lastPart = dashParts[dashParts.length - 1];
                    const possibleCred = parseFloat(lastPart);
                    if (!isNaN(possibleCred)) {
                        credits = possibleCred;
                        name = dashParts.slice(0, dashParts.length - 1).join(' - ');
                    } else if (dashParts.length >= 3) {
                        const secondLastPart = dashParts[dashParts.length - 2];
                        const possibleCred2 = parseFloat(secondLastPart);
                        if (!isNaN(possibleCred2)) {
                            credits = possibleCred2;
                            name = dashParts.slice(0, dashParts.length - 2).join(' - ');
                            const match = matchSemester(lastPart, newPendingSemesters);
                            if (match) inlineSemId = match;
                        }
                    }
                } else {
                    const regexParen = /^(.*)\((\d+(?:\.\d+)?)\)\s*(.*)$/;
                    const matchPattern = line.match(regexParen);
                    if (matchPattern) {
                        name = matchPattern[1].trim();
                        credits = parseFloat(matchPattern[2]);
                        const semPart = matchPattern[3].trim();
                        if (semPart) {
                            const match = matchSemester(semPart, newPendingSemesters);
                            if (match) inlineSemId = match;
                        }
                    }
                }
            }

            parsed.push({
                id: uuidv4(),
                name,
                credits,
                semesterId: inlineSemId
            });
        }
        setPendingSemesters(newPendingSemesters);
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

        // Save any pending semesters we dynamically created and actually used
        const usedPending = pendingSemesters.filter(ps => newPreview.some(course => course.semesterId === ps.id));
        if (usedPending.length > 0) {
            for (const ps of usedPending) {
                await saveSemester(ps);
            }
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
        setPendingSemesters([]);
        setStep('input');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={t('modal.paste_courses.title')}
            closeOnOverlayClick={false}
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
                    <div style={{ marginBottom: 'var(--space-md)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <Select
                                id="bulk-pacing"
                                name="bulkPacing"
                                label={t('label.academic_pacing')}
                                value={pacing}
                                onChange={e => setPacing(e.target.value as any)}
                                options={[
                                    { value: '2-term', label: t('label.pacing_2term') },
                                    { value: '3-term', label: t('label.pacing_3term') }
                                ]}
                            />
                        </div>
                    </div>
                    
                    <label htmlFor="bulk-courses-textarea" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                        {t('modal.paste_courses.title')}
                    </label>
                    <textarea
                        id="bulk-courses-textarea"
                        name="bulkCoursesText"
                        value={text}
                        onChange={e => setText(e.target.value)}
                        style={{ width: '100%', minHeight: '150px', height: '25vh', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-md)' }}
                        placeholder={t('modal.paste_courses.placeholder')}
                    />
                </div>
            ) : (
                <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ overflowX: 'auto', marginBottom: 'var(--space-md)' }}>
                        {groupCoursesBySemester(preview.map(p => ({ id: p.id, degreePlanId: planId, name: p.name, credits: p.credits, semesterId: p.semesterId, createdAt: 0, updatedAt: 0, topics: [], effectiveStatus: 'not_started' as any })), [...semesters, ...pendingSemesters], DEFAULT_PASSING_THRESHOLD).filter(g => g.courses.length > 0).map(group => (
                            <div key={group.semesterId} style={{ marginBottom: '16px' }}>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>{group.semesterName}</h3>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: '400px' }}>
                                    <thead style={{ background: 'var(--color-bg-secondary)' }}>
                                        <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                                            <th style={{ padding: '8px' }}>{t('label.course_name')}</th>
                                            <th style={{ padding: '8px', width: '80px' }}>{t('label.credits')}</th>
                                            <th style={{ padding: '8px', width: '120px' }}>{t('label.semester')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {group.courses.map((c: any) => {
                                            const item = preview.find(p => p.id === c.id)!;
                                            const idx = preview.indexOf(item);
                                            return (
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
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Modal>
    );
};
