import React from 'react';
import { useTranslation } from '@/app/i18n/useTranslation';
import { Github } from 'lucide-react';
import type { LegalPageType } from '@/features/legal/LegalModal';
import styles from './Footer.module.css';

// @ts-ignore
const appVersion = __APP_VERSION__ || '0.0.0';
const isDev = import.meta.env.DEV;

interface FooterProps {
    onOpenLegal: (type: LegalPageType) => void;
    onOpenHelp: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal, onOpenHelp }) => {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={styles.section}>
                <span>{t('footer.localFirst')}</span>
                <span className={styles.separator}>•</span>
                <a 
                    href="https://github.com/Oleg-Magit/academpazam-app" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={styles.linkButton}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                    <Github size={14} />
                    GitHub
                </a>
            </div>

            <nav className={styles.section}>
                <ul className={styles.links}>
                    <li>
                        <button onClick={onOpenHelp} className={styles.linkButton} aria-label={t('footer.help')}>
                            {t('footer.help')}
                        </button>
                    </li>
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
                </ul>
            </nav>

            <div className={styles.section}>
                <span>{t('footer.version', { version: appVersion })}</span>
                {isDev && <span className={styles.devBadge}>{t('footer.devBadge')}</span>}
                <span className={styles.separator}>•</span>
                <span>{t('footer.copyright', { year: currentYear })}</span>
            </div>
        </footer>
    );
};
