import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { BookOpen, Home, Settings, GraduationCap } from 'lucide-react';
import styles from './Layout.module.css';
import { useTranslation } from '@/app/i18n/useTranslation';
import { Footer } from './Footer/Footer';
import { ShareModal } from '@/features/share/ShareModal';
import { LegalModal, type LegalPageType } from '@/features/legal/LegalModal';
import { HelpModal } from '@/features/dashboard/components/HelpModal';

export const Layout: React.FC = () => {
    const { t } = useTranslation();
    const [openModal, setOpenModal] = React.useState<{ kind: 'share' } | { kind: 'legal', type: LegalPageType } | { kind: 'help' } | null>(null);

    const handleOpenShare = () => setOpenModal({ kind: 'share' });
    const handleOpenLegal = (type: LegalPageType) => setOpenModal({ kind: 'legal', type });
    const handleOpenHelp = () => setOpenModal({ kind: 'help' });
    const handleCloseModal = () => setOpenModal(null);

    return (
        <div className={styles.layout}>
            <header className={styles.header}>
                <div className={styles.logo}>
                    <GraduationCap size={24} color="var(--color-accent)" />
                    <span className={styles.title}>{t('app.title')}</span>
                </div>
                <nav className={styles.nav}>
                    <NavLink to="/" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
                        <Home size={20} />
                        <span className={styles.linkText}>{t('nav.dashboard')}</span>
                    </NavLink>
                    <NavLink to="/courses" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
                        <BookOpen size={20} />
                        <span className={styles.linkText}>{t('nav.courses')}</span>
                    </NavLink>
                    <NavLink to="/settings" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
                        <Settings size={20} />
                        <span className={styles.linkText}>{t('nav.settings')}</span>
                    </NavLink>
                </nav>
            </header>
            <main className={styles.main}>
                <Outlet />
            </main>
            <Footer
                onOpenShare={handleOpenShare}
                onOpenLegal={handleOpenLegal}
                onOpenHelp={handleOpenHelp}
            />

            <ShareModal
                isOpen={openModal?.kind === 'share'}
                onClose={handleCloseModal}
            />
            {openModal?.kind === 'legal' && (
                <LegalModal
                    isOpen={true}
                    onClose={handleCloseModal}
                    type={openModal.type}
                />
            )}
            <HelpModal
                isOpen={openModal?.kind === 'help'}
                onClose={handleCloseModal}
            />
        </div>
    );
};
