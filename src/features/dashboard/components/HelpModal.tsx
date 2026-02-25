import React from 'react';
import { Modal } from '@/ui/Modal';
import { useTranslation } from '@/app/i18n/useTranslation';
import { Info, Plus, FileText, Database, ShieldCheck } from 'lucide-react';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();

    const sections = [
        {
            icon: <Plus size={20} className="text-accent" />,
            title: t('help.workflow.step1'),
            body: t('help.workflow.step1_body')
        },
        {
            icon: <FileText size={20} className="text-accent" />,
            title: t('help.workflow.step2'),
            body: t('help.workflow.step2_body')
        },
        {
            icon: <Database size={20} className="text-accent" />,
            title: t('help.workflow.step3'),
            body: t('help.workflow.step3_body')
        },
        {
            icon: <ShieldCheck size={20} className="text-accent" />,
            title: t('help.workflow.step4'),
            body: t('help.workflow.step4_body')
        },
        {
            icon: <Plus size={20} className="text-accent" />,
            title: t('help.privacy.title'),
            body: t('help.privacy.body')
        }
    ];

    const troubleshooting = [
        t('help.troubleshooting.no_add_course'),
        t('help.troubleshooting.not_updating')
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('footer.help') || 'Help & Getting Started'}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '12px 0' }}>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                    {t('help.welcome_desc') || 'Welcome to AcademPazam! Here is a quick guide to help you manage your academic journey.'}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {sections.map((section, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '16px' }}>
                            <div style={{
                                minWidth: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                backgroundColor: 'var(--color-bg-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--color-accent)'
                            }}>
                                {section.icon}
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 600 }}>{section.title}</h3>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                                    {section.body}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{
                    marginTop: '8px',
                    padding: '20px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '12px',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Info size={18} className="text-danger" />
                        {t('help.troubleshooting.title')}
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {troubleshooting.map((item, idx) => (
                            <li key={idx}>{item}</li>
                        ))}
                    </ul>
                </div>

                <div style={{
                    marginTop: '8px',
                    padding: '16px',
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    border: '1px solid var(--color-border)'
                }}>
                    <Info size={18} style={{ color: 'var(--color-accent)' }} />
                    <span style={{ fontSize: '0.85rem' }}>{t('help.footer_hint') || 'You can always access this help from the footer.'}</span>
                </div>
            </div>
        </Modal>
    );
};
