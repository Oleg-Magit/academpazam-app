import React, { useMemo } from 'react';
import type { Semester } from '@/core/models/types';
import { useTranslation } from '@/app/i18n/useTranslation';
import { academicImportText } from './i18n';
import { revalidateAcademicImportRow } from './reviewValidation';
import type { AcademicImportMode, AcademicImportReviewRow, ImportAction } from './types';

interface AcademicImportReviewProps {
    rows: AcademicImportReviewRow[];
    semesters: Semester[];
    mode: AcademicImportMode;
    passingThreshold: number;
    onChange: (rows: AcademicImportReviewRow[]) => void;
}

export const AcademicImportReview: React.FC<AcademicImportReviewProps> = ({ rows, semesters, mode, passingThreshold, onChange }) => {
    const { language } = useTranslation();
    const text = (key: Parameters<typeof academicImportText>[1]) => academicImportText(language, key);

    const semesterOptions = useMemo(() => {
        const map = new Map<string, Semester>();
        semesters.forEach(semester => map.set(semester.id, semester));
        rows.forEach(row => {
            const proposed = row.semesterResolution.proposedSemester;
            if (proposed) map.set(proposed.id, proposed);
        });
        return Array.from(map.values()).sort((a, b) => a.orderIndex - b.orderIndex);
    }, [rows, semesters]);

    const replaceRow = (index: number, next: AcademicImportReviewRow) => {
        const copy = [...rows];
        copy[index] = revalidateAcademicImportRow(next, mode, passingThreshold);
        onChange(copy);
    };

    const setAction = (index: number, action: ImportAction) => replaceRow(index, { ...rows[index], action });

    return (
        <div style={{ display: 'grid', gap: '12px' }}>
            {rows.map((row, index) => {
                const active = row.action !== 'skip';
                const relationshipMessage = row.duplicateRisk === 'possible'
                    ? text('possibleDuplicate')
                    : row.targetCourseId && row.action === 'skip'
                        ? text('existingSkipped')
                        : row.targetCourseId && row.action === 'update'
                            ? text('matchedExisting')
                            : '';

                return (
                    <div key={row.sourceRowId} style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '12px', opacity: active ? 1 : 0.72 }}>
                        {relationshipMessage && (
                            <div role="status" style={{ marginBottom: '8px', fontSize: '0.8rem', color: row.duplicateRisk === 'possible' ? 'var(--color-warning)' : 'var(--color-text-secondary)' }}>
                                {relationshipMessage}
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', marginBottom: '8px' }}>
                            <label style={{ display: 'grid', gap: '4px', fontSize: '0.8rem' }}>
                                {text('course')}
                                <input
                                    value={row.proposed.name}
                                    disabled={!active}
                                    onChange={event => replaceRow(index, { ...row, proposed: { ...row.proposed, name: event.target.value } })}
                                    style={{ width: '100%', minWidth: 0, minHeight: '38px', padding: '8px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                />
                            </label>
                            <label style={{ display: 'grid', gap: '4px', fontSize: '0.8rem' }}>
                                {text('code')}
                                <input
                                    value={row.proposed.code ?? ''}
                                    disabled={!active}
                                    onChange={event => replaceRow(index, { ...row, proposed: { ...row.proposed, code: event.target.value || undefined } })}
                                    style={{ width: '100%', minWidth: 0, minHeight: '38px', padding: '8px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                />
                            </label>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
                            <label style={{ display: 'grid', gap: '4px', fontSize: '0.8rem' }}>
                                {text('credits')}
                                <input
                                    type="number"
                                    step="0.5"
                                    value={row.proposed.credits ?? ''}
                                    disabled={!active}
                                    onChange={event => {
                                        const value = event.target.value === '' ? null : Number(event.target.value);
                                        replaceRow(index, { ...row, proposed: { ...row.proposed, credits: value } });
                                    }}
                                    style={{ minWidth: 0, minHeight: '38px', padding: '8px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                />
                            </label>

                            <label style={{ display: 'grid', gap: '4px', fontSize: '0.8rem' }}>
                                {text('semester')}
                                <select
                                    value={row.semesterResolution.semesterId ?? ''}
                                    disabled={!active}
                                    onChange={event => {
                                        const semesterId = event.target.value || null;
                                        const existing = semesters.find(semester => semester.id === semesterId);
                                        const proposed = semesterOptions.find(semester => semester.id === semesterId) ?? null;
                                        replaceRow(index, {
                                            ...row,
                                            semesterResolution: semesterId
                                                ? existing
                                                    ? { kind: 'existing', semesterId, proposedSemester: null }
                                                    : { kind: 'new', semesterId, proposedSemester: proposed }
                                                : { kind: 'unresolved', semesterId: null, proposedSemester: null },
                                        });
                                    }}
                                    style={{ minWidth: 0, minHeight: '38px', padding: '8px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                >
                                    <option value="">—</option>
                                    {semesterOptions.map(semester => <option key={semester.id} value={semester.id}>{semester.name}</option>)}
                                </select>
                            </label>

                            {mode === 'academic_results' && (
                                <label style={{ display: 'grid', gap: '4px', fontSize: '0.8rem' }}>
                                    {text('grade')}
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={row.proposed.grade ?? ''}
                                        disabled={!active}
                                        onChange={event => {
                                            const value = event.target.value === '' ? null : Number(event.target.value);
                                            replaceRow(index, { ...row, proposed: { ...row.proposed, grade: value } });
                                        }}
                                        style={{ minWidth: 0, minHeight: '38px', padding: '8px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                    />
                                </label>
                            )}

                            <label style={{ display: 'grid', gap: '4px', fontSize: '0.8rem' }}>
                                {text('action')}
                                <select
                                    value={row.action}
                                    onChange={event => setAction(index, event.target.value as ImportAction)}
                                    style={{ minWidth: 0, minHeight: '38px', padding: '8px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                >
                                    <option value="add">{text('add')}</option>
                                    {row.targetCourseId && <option value="update">{text('update')}</option>}
                                    <option value="skip">{text('skip')}</option>
                                </select>
                            </label>
                        </div>

                        {(row.warnings.length > 0 || (active && row.blockingReasons.length > 0)) && (
                            <div role="status" style={{ marginTop: '8px', fontSize: '0.78rem', color: active && row.blockingReasons.length > 0 ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                                <strong>{text('warnings')}:</strong>{' '}
                                {[...row.warnings, ...(active ? row.blockingReasons : [])].join(' · ')}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
