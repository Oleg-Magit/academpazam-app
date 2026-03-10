import React, { useState } from 'react';
import { Modal } from '@/ui/Modal';
import { Button } from '@/ui/Button';
import { Select } from '@/ui/Select';
import { useTranslation } from '@/app/i18n/useTranslation';
import type { Semester } from '@/core/models/types';

interface AddSemesterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (year: number, term: 'A' | 'B' | 'SUMMER') => Promise<string | null>;
    semesters: Semester[];
}

export const AddSemesterModal: React.FC<AddSemesterModalProps> = ({
    isOpen, onClose, onAdd, semesters
}) => {
    const { t } = useTranslation();

    // Default to the next logical year/term
    const lastSem = semesters.length > 0 ? semesters[semesters.length - 1] : null;
    let defaultYear = lastSem ? lastSem.year || 1 : 1;
    let defaultTerm: 'A' | 'B' | 'SUMMER' = 'A';

    if (lastSem) {
        if (lastSem.term === 'A') {
            defaultTerm = 'B';
        } else if (lastSem.term === 'B') {
            defaultTerm = 'SUMMER';
        } else if (lastSem.term === 'SUMMER') {
            defaultYear += 1;
            defaultTerm = 'A';
        }
    }

    const [year, setYear] = useState<number>(defaultYear);
    const [term, setTerm] = useState<'A' | 'B' | 'SUMMER'>(defaultTerm);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const yearOptions = Array.from({ length: 10 }, (_, i) => ({
        value: (i + 1).toString(),
        label: `${t('label.year')} ${i + 1}`
    }));

    const termOptions = [
        { value: 'A', label: t('term.a') },
        { value: 'B', label: t('term.b') },
        { value: 'SUMMER', label: t('term.summer') }
    ];

    const handleSave = async () => {
        setError(null);
        setIsSaving(true);
        try {
            const resultId = await onAdd(year, term);
            if (resultId) {
                onClose();
            } else {
                setError(t('msg.semester_exists'));
            }
        } catch (e) {
            console.error(e);
            setError(t('msg.error_general'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('modal.add_semester.title') || 'Add Semester'}
            footer={
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-md)', width: '100%' }}>
                    <Button variant="ghost" onClick={onClose} disabled={isSaving} style={{ flex: '1 1 auto' }}>
                        {t('action.cancel')}
                    </Button>
                    <Button variant="primary" onClick={handleSave} disabled={isSaving} style={{ flex: '1 1 auto' }}>
                        {isSaving ? t('label.loading') : t('action.save')}
                    </Button>
                </div>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Select
                    id="select-year"
                    name="selectYear"
                    label={t('label.select_year')}
                    value={year.toString()}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    options={yearOptions}
                />
                <Select
                    id="select-term"
                    name="selectTerm"
                    label={t('label.select_term')}
                    value={term}
                    onChange={(e) => setTerm(e.target.value as any)}
                    options={termOptions}
                />
                {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.9rem', margin: 0 }}>{error}</p>}
            </div>
        </Modal>
    );
};
