import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';
import { useTranslation } from '@/app/i18n/useTranslation';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
    const { t } = useTranslation();
    const modalRef = React.useRef<HTMLDivElement>(null);
    const lastFocusedElement = React.useRef<HTMLElement | null>(null);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        const handleTab = (e: KeyboardEvent) => {
            if (!modalRef.current) return;
            const focusable = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusable.length === 0) return;

            const first = focusable[0] as HTMLElement;
            const last = focusable[focusable.length - 1] as HTMLElement;

            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            }
        };

        if (isOpen) {
            lastFocusedElement.current = document.activeElement as HTMLElement;
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleEsc);
            window.addEventListener('keydown', handleTab);

            // Initial focus
            const focusable = modalRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusable && focusable.length > 0) {
                // Focus the second element if the first is the close button, 
                // but for general modals first is fine.
                (focusable[0] as HTMLElement).focus();
            }
        } else {
            document.body.style.overflow = 'unset';
            if (lastFocusedElement.current) {
                lastFocusedElement.current.focus();
            }
        }

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEsc);
            window.removeEventListener('keydown', handleTab);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose} role="presentation">
            <div
                className={styles.modal}
                onClick={e => e.stopPropagation()}
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <div className={styles.header}>
                    <h2 id="modal-title" className={styles.title}>{title}</h2>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label={t('label.close')}
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>
                <div className={styles.body}>
                    {children}
                </div>
                {footer && (
                    <div className={styles.footer}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
