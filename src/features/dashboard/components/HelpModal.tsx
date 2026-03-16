import React from 'react';
import { Modal } from '@/ui/Modal';
import { Button } from '@/ui/Button';
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
            icon: <Plus size={20} className="text-accent" />, // Keeping icon consistent for GPA
            title: t('help.workflow.step3'),
            body: t('help.workflow.step3_body')
        },
        {
            icon: <Database size={20} className="text-accent" />,
            title: t('help.workflow.step4'),
            body: t('help.workflow.step4_body')
        },
        {
            icon: <ShieldCheck size={20} className="text-accent" />,
            title: t('help.workflow.step5'),
            body: t('help.workflow.step5_body')
        },
        {
            icon: <Info size={20} className="text-accent" />,
            title: t('help.workflow.step6'),
            body: t('help.workflow.step6_body')
        }
    ];

    const troubleshooting = [
        t('help.troubleshooting.q1'),
        t('help.troubleshooting.q2')
    ];

    const parseLinks = (text: string) => {
        const parts = text.split(/(\[.*?\]\(.*?\))/g);
        return parts.map((part, i) => {
            const match = part.match(/\[(.*?)\]\((.*?)\)/);
            if (match) {
                return (
                    <a
                        key={i}
                        href={match[2]}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--color-accent)', fontWeight: 500 }}
                    >
                        {match[1]}
                    </a>
                );
            }
            return part;
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('footer.help') || 'Help & Getting Started'}
            footer={
                <Button variant="primary" onClick={onClose} style={{ width: '100%' }}>
                    {t('share.close')}
                </Button>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                    {parseLinks(t('help.welcome_desc') || 'Welcome to AcademPazam! Here is a quick guide to help you manage your academic journey.')}
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
                                    {parseLinks(section.body)}
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
                            <li key={idx}>{parseLinks(item)}</li>
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
                    <span style={{ fontSize: '0.85rem' }}>{parseLinks(t('help.footer_hint') || 'You can always access this help from the footer.')}</span>
                </div>
            </div>
        </Modal>
    );
};
