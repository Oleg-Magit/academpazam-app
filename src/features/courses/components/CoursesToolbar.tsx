import React from 'react';
import { Button } from '@/ui/Button';
import { Search, Plus, FileText } from 'lucide-react';
import { useTranslation } from '@/app/i18n/useTranslation';

interface CoursesToolbarProps {
    searchTerm: string;
    onSearchChange: (val: string) => void;
    statusFilter: string;
    onStatusFilterChange: (val: string) => void;
    onAddCourse: () => void;
    onBulkAdd: () => void;
}

export const CoursesToolbar: React.FC<CoursesToolbarProps> = ({
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    onAddCourse,
    onBulkAdd
}) => {
    const { t } = useTranslation();

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                    <input
                        type="text"
                        placeholder={t('label.search_placeholder')}
                        aria-label={t('label.search_placeholder')}
                        value={searchTerm}
                        onChange={e => onSearchChange(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 12px 10px 36px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-secondary)',
                            color: 'var(--color-text-primary)'
                        }}
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={e => onStatusFilterChange(e.target.value)}
                    aria-label={t('label.filter_status')}
                    style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-primary)'
                    }}
                >
                    <option value="all">{t('status.all')}</option>
                    <option value="completed">{t('status.completed')}</option>
                    <option value="in_progress">{t('status.in_progress')}</option>
                    <option value="not_started">{t('status.not_started')}</option>
                </select>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="secondary" onClick={onBulkAdd}>
                    <FileText size={18} style={{ marginRight: '8px' }} />
                    {t('action.import_json')}
                </Button>
                <Button variant="primary" onClick={onAddCourse}>
                    <Plus size={18} style={{ marginRight: '8px' }} />
                    {t('dashboard.add_course')}
                </Button>
            </div>
        </div>
    );
};
