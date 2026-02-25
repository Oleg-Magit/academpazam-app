import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useTranslation } from '@/app/i18n/useTranslation';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'primary' | 'danger';
    children?: React.ReactNode;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel,
    cancelLabel,
    variant = 'primary',
    children
}) => {
    const { t } = useTranslation();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <p style={{ margin: 0, lineHeight: 1.5 }}>{message}</p>
                {children}
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 'var(--space-md)',
                    marginTop: 'var(--space-md)'
                }}>
                    <Button variant="ghost" onClick={onClose}>
                        {cancelLabel || t('action.cancel')}
                    </Button>
                    <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={() => {
                        onConfirm();
                        onClose();
                    }}>
                        {confirmLabel || t('action.ok')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
