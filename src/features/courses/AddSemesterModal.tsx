import React, { useState, useEffect } from 'react';
import { Modal } from '@/ui/Modal';
import { Button } from '@/ui/Button';
import { Select } from '@/ui/Select';
import { useTranslation } from '@/app/i18n/useTranslation';
import type { Semester } from '@/core/models/types';

interface AddSemesterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (semester: Omit<Semester, 'id' | 'createdAt' | 'orderIndex'>) => Promise<string | null>;
    semesters: Semester[];
    getNextProposal: (pacing: '2-term' | '3-term') => { year: number, term: 'A' | 'B' | 'SUMMER' | 'OTHER' };
}

export const AddSemesterModal: React.FC<AddSemesterModalProps> = ({
    isOpen, onClose, onAdd, getNextProposal
}) => {
    const { t } = useTranslation();

    const [pacing, setPacing] = useState<'2-term' | '3-term'>('3-term');
    const [year, setYear] = useState<number>(1);
    const [term, setTerm] = useState<'A' | 'B' | 'SUMMER' | 'OTHER'>('A');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Update defaults when pacing or isOpen changes
    useEffect(() => {
        if (isOpen) {
            const proposal = getNextProposal(pacing);
            setYear(proposal.year);
            setTerm(proposal.term);
            setName('');
            setError(null);
        }
    }, [isOpen, pacing, getNextProposal]);

    const yearOptions = Array.from({ length: 10 }, (_, i) => ({
        value: (i + 1).toString(),
        label: `${t('label.year')} ${i + 1}`
    }));

    const termOptions = [
        { value: 'A', label: t('term.a') },
        { value: 'B', label: t('term.b') },
        { value: 'SUMMER', label: t('term.summer') },
        { value: 'OTHER', label: t('term.other') }
    ];

    const pacingOptions = [
        { value: '2-term', label: t('label.pacing_2term') || '2 Terms (A, B)' },
        { value: '3-term', label: t('label.pacing_3term') || '3 Terms (A, B, Summer)' }
    ];

    const handleSave = async () => {
        setError(null);
        setIsSaving(true);
        try {
            const resultId = await onAdd({
                year,
                term,
                name
            });
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
                    id="select-pacing"
                    name="selectPacing"
                    label={t('label.academic_pacing') || 'Academic Pacing (Proposal Helper)'}
                    value={pacing}
                    onChange={(e) => setPacing(e.target.value as any)}
                    options={pacingOptions}
                />
                
                <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '4px 0' }} />

                <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                        <Select
                            id="select-year"
                            name="selectYear"
                            label={t('label.select_year')}
                            value={year.toString()}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            options={yearOptions}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <Select
                            id="select-term"
                            name="selectTerm"
                            label={t('label.select_term')}
                            value={term}
                            onChange={(e) => setTerm(e.target.value as any)}
                            options={termOptions}
                        />
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                        {t('label.custom_name') || 'Custom Name (Optional)'}
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('label.semester_name_placeholder') || 'e.g. Semester 1'}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: 'var(--color-bg-secondary)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            color: 'var(--color-text-primary)',
                            fontSize: '1rem'
                        }}
                    />
                </div>

                {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.9rem', margin: 0 }}>{error}</p>}
            </div>
        </Modal>
    );
};
