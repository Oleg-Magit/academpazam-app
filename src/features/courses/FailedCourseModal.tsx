import React, { useState, useMemo } from 'react';
import { Modal } from '@/ui/Modal';
import { Button } from '@/ui/Button';
import { Select } from '@/ui/Select';
import type { Semester } from '@/core/models/types';
import { useTranslation } from '@/app/i18n/useTranslation';

interface FailedCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onKeepFailed: () => void;
    onCreateRepeat: (semesterId: string, initMode: 'copy_structure' | 'empty') => void;
    semesters: Semester[];
    sourceSemesterId: string;
}

export const FailedCourseModal: React.FC<FailedCourseModalProps> = ({
    isOpen, onClose, onKeepFailed, onCreateRepeat, semesters, sourceSemesterId
}) => {
    const { t } = useTranslation();
    const [step, setStep] = useState<'choice' | 'config'>('choice');
    const [targetSemesterId, setTargetSemesterId] = useState('');
    const [initMode, setInitMode] = useState<'copy_structure' | 'empty'>('copy_structure');

    // Filter out the source semester for the repeat
    const otherSemesters = useMemo(() => {
        return semesters.filter(s => s.id !== sourceSemesterId).sort((a, b) => {
            const yearA = a.year || 1;
            const yearB = b.year || 1;
            if (yearA !== yearB) return yearA - yearB;
            return a.orderIndex - b.orderIndex;
        });
    }, [semesters, sourceSemesterId]);

    const SEMESTER_OPTIONS = useMemo(() => {
        return otherSemesters.map(s => ({
            value: s.id,
            label: `${t('label.year')} ${s.year || 1} / ${t(`term.${(s.term || 'A').toLowerCase()}` as any)} ${s.name ? `— ${s.name}` : ''}`
        }));
    }, [otherSemesters, t]);

    const INIT_OPTIONS = [
        { value: 'copy_structure', label: t('option.copy_topics_reset') },
        { value: 'empty', label: t('option.empty_repeat') }
    ];

    React.useEffect(() => {
        if (isOpen) {
            setStep('choice');
            setTargetSemesterId(otherSemesters.length > 0 ? otherSemesters[0].id : '');
        }
    }, [isOpen, otherSemesters]);

    const handleBack = () => setStep('choice');
    const handleNext = () => {
        if (otherSemesters.length === 0) return;
        setStep('config');
    };

    const handleConfirmRepeat = () => {
        if (!targetSemesterId) return;
        onCreateRepeat(targetSemesterId, initMode);
        onClose();
    };

    const footer = (
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', width: '100%', flexWrap: 'wrap-reverse' }}>
            {step === 'choice' ? (
                <>
                    <Button variant="ghost" onClick={onClose} style={{ flex: '1 1 auto' }}>{t('action.cancel')}</Button>
                    <Button variant="secondary" onClick={onKeepFailed} style={{ flex: '1 1 auto' }}>{t('action.keep_failed')}</Button>
                    <Button onClick={handleNext} style={{ flex: '1 1 auto' }}>{t('action.create_repeat')}</Button>
                </>
            ) : (
                <>
                    <Button variant="ghost" onClick={handleBack} style={{ flex: '1 1 auto' }}>{t('common.back')}</Button>
                    <Button onClick={handleConfirmRepeat} disabled={!targetSemesterId} style={{ flex: '1 1 auto' }}>{t('action.save')}</Button>
                </>
            )}
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('modal.failed_course.title')}
            footer={footer}
        >
            {step === 'choice' ? (
                <div>
                    <p style={{ marginBottom: 'var(--space-md)' }}>{t('modal.failed_course.desc')}</p>
                    {otherSemesters.length === 0 && (
                        <p style={{ color: 'var(--color-warning)', fontSize: '0.875rem' }}>
                            {t('msg.no_target_semesters')}
                        </p>
                    )}
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                    <Select
                        id="target-semester"
                        label={t('label.target_semester')}
                        value={targetSemesterId}
                        onChange={e => setTargetSemesterId(e.target.value)}
                        options={SEMESTER_OPTIONS}
                        required
                    />
                    <Select
                        id="init-mode"
                        label={t('label.init_mode')}
                        value={initMode}
                        onChange={e => setInitMode(e.target.value as any)}
                        options={INIT_OPTIONS}
                        required
                    />
                </div>
            )}
        </Modal>
    );
};
