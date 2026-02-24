import React from 'react';
import { Modal } from '@/ui/Modal';
import { useTranslation } from '@/app/i18n/useTranslation';
import { Info, Plus, FileText, Database, ShieldCheck, Download } from 'lucide-react';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();

    const sections = [
        {
            icon: <Plus size={20} className="text-accent" />,
            title: t('help.adding_courses.title') || 'Adding Courses',
            body: t('help.adding_courses.body') || 'Create your degree plan by adding courses to semesters. You can use the "Add Course" button on the Courses page or the shortcut in the Dashboard semester drawer.'
        },
        {
            icon: <FileText size={20} className="text-accent" />,
            title: t('help.bulk_add.title') || 'Bulk Import',
            body: t('help.bulk_add.body') || 'Import multiple courses at once using the "Bulk Add" tool. We support various text formats: "Course | 3.0 | Semester 1", "Course - 3.0 - Sem 1", etc.'
        },
        {
            icon: <Database size={20} className="text-accent" />,
            title: t('help.tracking.title') || 'Tracking Progress',
            body: t('help.tracking.body') || 'Add topics to each course to track your weekly progress. The course status automatically updates from "Not Started" to "In Progress" as you complete topics.'
        },
        {
            icon: <ShieldCheck size={20} className="text-accent" />,
            title: t('help.privacy.title') || 'Data Privacy',
            body: t('help.privacy.body') || 'Your data is 100% private and stored only on your device (IndexedDB). No data ever leaves your browser or is sent to any server.'
        },
        {
            icon: <Download size={20} className="text-accent" />,
            title: t('help.backup.title') || 'Backups & PDF',
            body: t('help.backup.body') || 'Export your data as a JSON file for backup in Settings. You can also generate a beautiful PDF summary of your degree progress for offline use.'
        }
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
