import React, { useState, useEffect } from 'react';
import { Modal } from '@/ui/Modal';
import { Button } from '@/ui/Button';
import { useTranslation } from '@/app/i18n/useTranslation';
import type { Semester } from '@/core/models/types';

interface EditSemesterModalProps {
    isOpen: boolean;
    onClose: () => void;
    semester: Semester | null;
    onSave: (semesterId: string, updates: Partial<Semester>) => Promise<void>;
}

export const EditSemesterModal: React.FC<EditSemesterModalProps> = ({
    isOpen,
    onClose,
    semester,
    onSave
}) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [year, setYear] = useState(1);
    const [term, setTerm] = useState<'A' | 'B' | 'SUMMER' | 'OTHER'>('A');

    useEffect(() => {
        if (semester) {
            setName(semester.name || '');
            setYear(semester.year || 1);
            setTerm(semester.term || 'A');
        }
    }, [semester]);

    const handleSave = async () => {
        if (!semester) return;
        await onSave(semester.id, {
            name,
            year,
            term
        });
        onClose();
    };

    if (!semester) return null;

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '10px 12px',
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
        fontSize: '0.95rem',
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)'
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '0.9rem',
        fontWeight: 600,
        marginBottom: '6px',
        color: 'var(--color-text-secondary)'
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('action.edit')}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '12px 0' }}>
                <div>
                    <label style={labelStyle}>{t('label.custom_name')}</label>
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder={t('label.semester')}
                        style={inputStyle}
                        autoFocus
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        {t('label.optional')}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>{t('label.year')}</label>
                        <select
                            value={year}
                            onChange={e => setYear(Number(e.target.value))}
                            style={inputStyle}
                        >
                            {[1, 2, 3, 4, 5, 6, 7].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ flex: 2 }}>
                        <label style={labelStyle}>{t('label.select_term')}</label>
                        <select
                            value={term}
                            onChange={e => setTerm(e.target.value as any)}
                            style={inputStyle}
                        >
                            <option value="A">{t('term.a')}</option>
                            <option value="B">{t('term.b')}</option>
                            <option value="SUMMER">{t('term.summer')}</option>
                            <option value="OTHER">{t('term.other')}</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                    <Button variant="ghost" onClick={onClose}>{t('action.cancel')}</Button>
                    <Button variant="primary" onClick={handleSave}>{t('action.save')}</Button>
                </div>
            </div>
        </Modal>
    );
};
