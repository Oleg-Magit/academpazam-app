import React, { useRef, useState } from 'react';
import type { Course, Semester } from '@/core/models/types';
import { useTranslation } from '@/app/i18n/useTranslation';
import { Button } from '@/ui/Button';
import { Modal } from '@/ui/Modal';
import {
    AcademicImportApiError,
    analyzeAcademicImport,
    isAcademicImportConfigured,
} from '@/core/services/academicImportApiClient';
import { academicImportText } from './i18n';
import { normalizeAcademicImport } from './academicImportNormalizer';
import { AcademicImportReview } from './AcademicImportReview';
import { persistAcademicImport } from './persistAcademicImport';
import { revalidateAcademicImportRows } from './reviewValidation';
import type { AcademicImportMode, AcademicImportReviewRow } from './types';

interface AcademicImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    planId: string;
    passingThreshold: number;
    courses: Course[];
    semesters: Semester[];
}

type ImportStep = 'mode' | 'source' | 'consent' | 'analyzing' | 'review' | 'saving' | 'success' | 'error';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const AcademicImportModal: React.FC<AcademicImportModalProps> = ({
    isOpen,
    onClose,
    onSave,
    planId,
    passingThreshold,
    courses,
    semesters,
}) => {
    const { language } = useTranslation();
    const text = (key: Parameters<typeof academicImportText>[1]) => academicImportText(language, key);
    const [step, setStep] = useState<ImportStep>('mode');
    const [mode, setMode] = useState<AcademicImportMode>('degree_plan');
    const [file, setFile] = useState<File | null>(null);
    const [pastedText, setPastedText] = useState('');
    const [rows, setRows] = useState<AcademicImportReviewRow[]>([]);
    const [documentWarnings, setDocumentWarnings] = useState<string[]>([]);
    const [errorMessage, setErrorMessage] = useState('');
    const abortRef = useRef<AbortController | null>(null);

    const configured = isAcademicImportConfigured();

    const reset = () => {
        abortRef.current?.abort();
        abortRef.current = null;
        setStep('mode');
        setMode('degree_plan');
        setFile(null);
        setPastedText('');
        setRows([]);
        setDocumentWarnings([]);
        setErrorMessage('');
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const selectMode = (nextMode: AcademicImportMode) => {
        setMode(nextMode);
        setStep('source');
        setErrorMessage('');
    };

    const sourceReady = Boolean(file) !== Boolean(pastedText.trim());

    const handleFile = (nextFile: File | null) => {
        if (nextFile && nextFile.size > MAX_FILE_SIZE) {
            setFile(null);
            setErrorMessage(text('fileTooLarge'));
            return;
        }
        setErrorMessage('');
        setFile(nextFile);
        if (nextFile) setPastedText('');
    };

    const handleAnalyze = async () => {
        if (!configured || !sourceReady) return;
        const controller = new AbortController();
        abortRef.current = controller;
        setStep('analyzing');
        setErrorMessage('');

        try {
            const result = await analyzeAcademicImport({
                mode,
                file,
                text: file ? '' : pastedText,
                signal: controller.signal,
            });
            if (result.data.courses.length === 0) {
                setErrorMessage(text('noRows'));
                setStep('error');
                return;
            }

            const normalized = normalizeAcademicImport({
                extraction: result.data,
                planId,
                passingThreshold,
                courses,
                semesters,
            });
            setRows(revalidateAcademicImportRows(normalized, mode, passingThreshold));
            setDocumentWarnings([
                ...result.data.warnings,
                ...(result.meta.truncated ? ['Source text was truncated to the safe processing limit.'] : []),
            ]);
            setStep('review');
        } catch (error) {
            const message = error instanceof AcademicImportApiError ? error.message : text('error');
            setErrorMessage(message);
            setStep('error');
        } finally {
            abortRef.current = null;
        }
    };

    const handleSave = async () => {
        const validated = revalidateAcademicImportRows(rows, mode, passingThreshold);
        setRows(validated);
        const invalid = validated.some(row => row.action !== 'skip' && row.blockingReasons.length > 0);
        const activeCount = validated.filter(row => row.action !== 'skip').length;
        if (invalid || activeCount === 0) {
            setErrorMessage(invalid ? text('warnings') : text('noRows'));
            return;
        }

        setStep('saving');
        setErrorMessage('');
        try {
            await persistAcademicImport({ planId, rows: validated, existingCourses: courses });
            onSave();
            setStep('success');
        } catch (error) {
            console.error('[AI Academic Import] Save failed', error);
            setErrorMessage(text('error'));
            setStep('review');
        }
    };

    const footer = (() => {
        if (step === 'mode' || step === 'analyzing' || step === 'saving' || step === 'success') return undefined;
        if (step === 'source') {
            return (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', width: '100%' }}>
                    <Button variant="ghost" onClick={() => setStep('mode')}>{text('back')}</Button>
                    <Button disabled={!sourceReady || !configured} onClick={() => setStep('consent')}>{text('analyze')}</Button>
                </div>
            );
        }
        if (step === 'consent') {
            return (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', width: '100%' }}>
                    <Button variant="ghost" onClick={() => setStep('source')}>{text('back')}</Button>
                    <Button onClick={handleAnalyze}>{text('analyze')}</Button>
                </div>
            );
        }
        if (step === 'review') {
            return (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', width: '100%' }}>
                    <Button variant="ghost" onClick={() => setStep('source')}>{text('back')}</Button>
                    <Button onClick={handleSave}>{text('save')}</Button>
                </div>
            );
        }
        if (step === 'error') {
            return (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', width: '100%' }}>
                    <Button variant="ghost" onClick={handleClose}>{text('cancel')}</Button>
                    <Button onClick={() => setStep('source')}>{text('back')}</Button>
                </div>
            );
        }
        return undefined;
    })();

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={text('title')} footer={footer} closeOnOverlayClick={step !== 'analyzing' && step !== 'saving'}>
            {step === 'mode' && (
                <div style={{ display: 'grid', gap: '12px' }}>
                    <p style={{ marginTop: 0 }}>{text('mode')}</p>
                    <Button onClick={() => selectMode('degree_plan')}>{text('degreePlan')}</Button>
                    <Button variant="secondary" onClick={() => selectMode('academic_results')}>{text('academicResults')}</Button>
                    {!configured && <div role="alert" style={{ color: 'var(--color-warning)' }}>{text('missingConfig')}</div>}
                </div>
            )}

            {step === 'source' && (
                <div style={{ display: 'grid', gap: '12px' }}>
                    <strong>{mode === 'degree_plan' ? text('degreePlan') : text('academicResults')}</strong>
                    <p style={{ margin: 0 }}>{text('source')}</p>
                    <label style={{ display: 'grid', gap: '6px' }}>
                        {text('upload')}
                        <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,.txt,application/pdf,image/png,image/jpeg,text/plain"
                            onChange={event => handleFile(event.target.files?.[0] ?? null)}
                        />
                    </label>
                    <label style={{ display: 'grid', gap: '6px' }}>
                        {text('paste')}
                        <textarea
                            rows={7}
                            value={pastedText}
                            disabled={Boolean(file)}
                            onChange={event => {
                                setPastedText(event.target.value);
                                if (event.target.value.trim()) setFile(null);
                            }}
                            style={{ width: '100%', resize: 'vertical', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                        />
                    </label>
                    {errorMessage && <div role="alert" style={{ color: 'var(--color-danger)' }}>{errorMessage}</div>}
                    {!configured && <div role="alert" style={{ color: 'var(--color-warning)' }}>{text('missingConfig')}</div>}
                </div>
            )}

            {step === 'consent' && (
                <div style={{ display: 'grid', gap: '10px' }}>
                    <strong>{text('consentTitle')}</strong>
                    <p style={{ margin: 0, lineHeight: 1.6 }}>{text('consentBody')}</p>
                </div>
            )}

            {(step === 'analyzing' || step === 'saving') && (
                <div role="status" style={{ padding: '24px 0', textAlign: 'center' }}>
                    {step === 'analyzing' ? text('processing') : text('save') + '…'}
                </div>
            )}

            {step === 'review' && (
                <div style={{ display: 'grid', gap: '12px' }}>
                    <strong>{text('reviewTitle')}</strong>
                    {documentWarnings.length > 0 && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--color-warning)' }}>{documentWarnings.join(' · ')}</div>
                    )}
                    {errorMessage && <div role="alert" style={{ color: 'var(--color-danger)' }}>{errorMessage}</div>}
                    <AcademicImportReview
                        rows={rows}
                        semesters={semesters}
                        mode={mode}
                        passingThreshold={passingThreshold}
                        onChange={setRows}
                    />
                </div>
            )}

            {step === 'success' && (
                <div style={{ display: 'grid', gap: '16px', textAlign: 'center', padding: '16px 0' }}>
                    <div>{text('success')}</div>
                    <Button onClick={handleClose}>{text('cancel')}</Button>
                </div>
            )}

            {step === 'error' && <div role="alert" style={{ color: 'var(--color-danger)' }}>{errorMessage || text('error')}</div>}
        </Modal>
    );
};
