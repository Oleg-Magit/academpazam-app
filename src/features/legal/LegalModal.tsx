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
        return (
            <div style={{ display: 'grid', gap: '20px' }}>
                {type === 'privacy' && (
                    <div style={{ fontSize: '0.925rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                        {t('legal.privacy.date')}
                    </div>
                )}
                <p style={{ whiteSpace: 'pre-line', fontSize: '0.925rem', lineHeight: 1.6 }}>
                    {t(`legal.${type}.body`)}
                </p>
            </div>
        );
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
