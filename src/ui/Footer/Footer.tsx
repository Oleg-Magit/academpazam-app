import React from 'react';
import { useTranslation } from '@/app/i18n/useTranslation';
import type { LegalPageType } from '@/features/legal/LegalModal';
import styles from './Footer.module.css';

// @ts-ignore
const appVersion = __APP_VERSION__ || '0.0.0';
const isDev = import.meta.env.DEV;

interface FooterProps {
    onOpenShare: () => void;
    onOpenLegal: (type: LegalPageType) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenShare, onOpenLegal }) => {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={styles.section}>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{t('footer.appName')}</span>
                <span className={styles.separator}>•</span>
                <span>{t('footer.version', { version: appVersion })}</span>
                {isDev && <span className={styles.devBadge}>{t('footer.devBadge')}</span>}
            </div>

            <nav className={styles.section}>
                <ul className={styles.links}>
                    <li>
                        <button onClick={() => onOpenLegal('about')} className={styles.linkButton} aria-label={t('footer.about')}>
                            {t('footer.about')}
                        </button>
                    </li>
                    <li>
                        <button onClick={() => onOpenLegal('privacy')} className={styles.linkButton} aria-label={t('footer.privacy')}>
                            {t('footer.privacy')}
                        </button>
                    </li>
                    <li>
                        <button onClick={() => onOpenLegal('terms')} className={styles.linkButton} aria-label={t('footer.terms')}>
                            {t('footer.terms')}
                        </button>
                    </li>
                    <li>
                        <button onClick={onOpenShare} className={styles.linkButton} aria-label={t('footer.shareLabel')}>
                            {t('footer.shareLabel')}
                        </button>
                    </li>
                </ul>
            </nav>

            <div className={styles.section}>
                <span>{t('footer.copyright', { year: currentYear })}</span>
                <span className={styles.separator}>•</span>
                <span>{t('footer.localFirst')}</span>
            </div>
        </footer>
    );
};
