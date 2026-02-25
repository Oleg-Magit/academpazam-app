import React from 'react';
import { Modal } from '@/ui/Modal';
import { useTranslation } from '@/app/i18n/useTranslation';
import { Button } from '@/ui/Button';

export type LegalPageType = 'about' | 'privacy' | 'terms';

interface LegalModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: LegalPageType;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, type }) => {
    const { t } = useTranslation();

    const getTitle = () => {
        switch (type) {
            case 'about': return t('legal.about.title');
            case 'privacy': return t('legal.privacy.title');
            case 'terms': return t('legal.terms.title');
            default: return '';
        }
    };

    const renderContent = () => {
        switch (type) {
            case 'about':
                return (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        <p style={{ whiteSpace: 'pre-line' }}>{t('legal.about.body')}</p>
                    </div>
                );
            case 'privacy':
                return (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        <div style={{ fontSize: '0.925rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                            {t('legal.privacy.date', { year: new Date().getFullYear() })}
                        </div>
                        <p style={{ fontWeight: 500 }}>{t('legal.privacy.intro')}</p>

                        <section>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{t('legal.privacy.sections.dataLocalOnly.title')}</h3>
                            <p style={{ fontSize: '0.925rem', color: 'var(--color-text-secondary)' }}>{t('legal.privacy.sections.dataLocalOnly.body')}</p>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{t('legal.privacy.sections.noTracking.title')}</h3>
                            <p style={{ fontSize: '0.925rem', color: 'var(--color-text-secondary)' }}>{t('legal.privacy.sections.noTracking.body')}</p>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{t('legal.privacy.sections.backup.title')}</h3>
                            <p style={{ fontSize: '0.925rem', color: 'var(--color-text-secondary)' }}>{t('legal.privacy.sections.backup.body')}</p>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{t('legal.privacy.sections.dataResponsibility.title')}</h3>
                            <p style={{ fontSize: '0.925rem', color: 'var(--color-text-secondary)' }}>{t('legal.privacy.sections.dataResponsibility.body')}</p>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{t('legal.privacy.sections.openSource.title')}</h3>
                            <p style={{ fontSize: '0.925rem', color: 'var(--color-text-secondary)', whiteSpace: 'pre-line' }}>{t('legal.privacy.sections.openSource.body')}</p>
                        </section>
                    </div>
                );
            case 'terms':
                return (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        <p style={{ fontWeight: 500 }}>{t('legal.terms.intro')}</p>

                        <section>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{t('legal.terms.sections.use.title')}</h3>
                            <p style={{ fontSize: '0.925rem', color: 'var(--color-text-secondary)' }}>{t('legal.terms.sections.use.body')}</p>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{t('legal.terms.sections.disclaimer.title')}</h3>
                            <p style={{ fontSize: '0.925rem', color: 'var(--color-text-secondary)' }}>{t('legal.terms.sections.disclaimer.body')}</p>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{t('legal.terms.sections.userResponsibility.title')}</h3>
                            <p style={{ fontSize: '0.925rem', color: 'var(--color-text-secondary)' }}>{t('legal.terms.sections.userResponsibility.body')}</p>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{t('legal.terms.sections.liability.title')}</h3>
                            <p style={{ fontSize: '0.925rem', color: 'var(--color-text-secondary)' }}>{t('legal.terms.sections.liability.body')}</p>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{t('legal.terms.sections.modifications.title')}</h3>
                            <p style={{ fontSize: '0.925rem', color: 'var(--color-text-secondary)' }}>{t('legal.terms.sections.modifications.body')}</p>
                        </section>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={getTitle()}
            footer={
                <Button variant="primary" onClick={onClose} style={{ width: '100%' }}>
                    {t('share.close')}
                </Button>
            }
        >
            {renderContent()}
        </Modal>
    );
};
