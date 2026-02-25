import React from 'react';
import { Button } from '@/ui/Button';
import { Plus, MoreHorizontal, FileDown, Database, Upload, List } from 'lucide-react';
import { useTranslation } from '@/app/i18n/useTranslation';

interface DashboardHeaderProps {
    title: string;
    showExportSuccess: boolean;
    showActions: boolean;
    setShowActions: (show: boolean) => void;
    onAddCourse: () => void;
    onExportPDF: () => void;
    onExportJSON: () => void;
    onImportClick: () => void;
    language: string;
    actionsRef: React.RefObject<HTMLDivElement | null>;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    title,
    showExportSuccess,
    showActions,
    setShowActions,
    onAddCourse,
    onExportPDF,
    onExportJSON,
    onImportClick,
    language,
    actionsRef
}) => {
    const { t } = useTranslation();

    const MenuLink = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => (
        <a href={to} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            textDecoration: 'none',
            color: 'var(--color-text)',
            fontSize: '0.9rem',
            transition: 'background-color 0.2s'
        }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            {icon}
            {label}
        </a>
    );

    const MenuButton = ({ onClick, icon, label }: { onClick: () => void, icon: React.ReactNode, label: string }) => (
        <button onClick={onClick} style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            background: 'none',
            border: 'none',
            color: 'var(--color-text)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            textAlign: 'left',
            transition: 'background-color 0.2s'
        }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            {icon}
            {label}
        </button>
    );

    return (
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{title}</h1>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
                {showExportSuccess && (
                    <div style={{
                        color: 'var(--color-success)',
                        fontSize: '0.85rem',
                        fontWeight: 500
                    }}>
                        {t('msg.export_success')}
                    </div>
                )}
                <div style={{ display: 'flex', gap: '8px', position: 'relative' }} ref={actionsRef}>
                    <Button
                        size="sm"
                        variant="primary"
                        onClick={onAddCourse}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                    >
                        <Plus size={16} />
                        {t('dashboard.add_course')}
                    </Button>

                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setShowActions(!showActions)}
                        style={{ padding: '0 8px' }}
                    >
                        <MoreHorizontal size={18} />
                    </Button>

                    {showActions && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            [language === 'he' ? 'left' : 'right']: 0,
                            marginTop: '8px',
                            backgroundColor: 'var(--color-bg-secondary)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                            zIndex: 100,
                            minWidth: '180px',
                            overflow: 'hidden'
                        }}>
                            <MenuLink to="/courses" icon={<List size={16} />} label={t('label.manage_courses')} />
                            <MenuButton onClick={onExportPDF} icon={<FileDown size={16} />} label={t('action.export_pdf')} />
                            <MenuButton onClick={onExportJSON} icon={<Database size={16} />} label={t('action.export_json')} />
                            <MenuButton onClick={onImportClick} icon={<Upload size={16} />} label={t('action.import_json')} />
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
