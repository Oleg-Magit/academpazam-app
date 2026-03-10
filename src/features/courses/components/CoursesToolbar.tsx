import React from 'react';
import { Button } from '@/ui/Button';
import { Search, Plus, FileText } from 'lucide-react';
import { useTranslation } from '@/app/i18n/useTranslation';

interface CoursesToolbarProps {
    searchTerm: string;
    onSearchChange: (val: string) => void;
    statusFilter: string;
    onStatusFilterChange: (val: string) => void;
    yearFilter: string;
    onYearFilterChange: (val: string) => void;
    termFilter: string;
    onTermFilterChange: (val: string) => void;
    availableYears: number[];
    availableTerms: string[];
    onAddCourse: () => void;
    onBulkAdd: () => void;
    isMobile?: boolean;
}

export const CoursesToolbar: React.FC<CoursesToolbarProps> = ({
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    yearFilter,
    onYearFilterChange,
    termFilter,
    onTermFilterChange,
    availableYears,
    availableTerms,
    onAddCourse,
    onBulkAdd,
    isMobile = false
}) => {
    const { t } = useTranslation();

    return (
        <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '12px' : '0',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'center',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--color-border)'
        }}>
            <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: '12px',
                alignItems: isMobile ? 'stretch' : 'center',
                flex: 1,
                flexWrap: 'wrap'
            }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: isMobile ? '100%' : '300px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                    <input
                        id="search-courses"
                        name="searchCourses"
                        type="text"
                        placeholder={t('label.search_placeholder')}
                        aria-label={t('label.search_placeholder')}
                        value={searchTerm}
                        onChange={e => onSearchChange(e.target.value)}
                        style={{
                            width: '100%',
                            padding: isMobile ? '12px 12px 12px 40px' : '10px 12px 10px 36px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-secondary)',
                            color: 'var(--color-text-primary)',
                            fontSize: isMobile ? '1rem' : 'initial'
                        }}
                    />
                </div>

                <select
                    id="year-filter"
                    name="yearFilter"
                    value={yearFilter}
                    onChange={e => onYearFilterChange(e.target.value)}
                    aria-label={t('label.filter_year' as any) || 'Filter by Year'}
                    style={{
                        padding: isMobile ? '12px' : '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-primary)',
                        flex: isMobile ? '1' : '0 1 auto',
                        fontSize: isMobile ? '1rem' : 'initial'
                    }}
                >
                    <option value="all">{t('label.all_years')}</option>
                    {availableYears.map(y => <option key={y} value={y.toString()}>{t('label.year')} {y}</option>)}
                </select>

                <select
                    id="term-filter"
                    name="termFilter"
                    value={termFilter}
                    onChange={e => onTermFilterChange(e.target.value)}
                    aria-label={t('label.filter_term' as any) || 'Filter by Term'}
                    style={{
                        padding: isMobile ? '12px' : '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-primary)',
                        flex: isMobile ? '1' : '0 1 auto',
                        fontSize: isMobile ? '1rem' : 'initial'
                    }}
                >
                    <option value="all">{t('label.all_terms')}</option>
                    {availableTerms.map(tOption => (
                        <option key={tOption} value={tOption}>
                            {t(`term.${tOption.toLowerCase()}` as any)}
                        </option>
                    ))}
                </select>

                <select
                    id="status-filter"
                    name="statusFilter"
                    value={statusFilter}
                    onChange={e => onStatusFilterChange(e.target.value)}
                    aria-label={t('label.filter_status')}
                    style={{
                        padding: isMobile ? '12px' : '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-primary)',
                        flex: isMobile ? 'none' : '0 1 auto',
                        fontSize: isMobile ? '1rem' : 'initial'
                    }}
                >
                    <option value="all">{t('status.all')}</option>
                    <option value="completed">{t('status.completed')}</option>
                    <option value="in_progress">{t('status.in_progress')}</option>
                    <option value="not_started">{t('status.not_started')}</option>
                </select>
            </div>
            <div style={{
                display: 'flex',
                gap: '8px',
                justifyContent: isMobile ? 'flex-end' : 'flex-start',
                marginTop: isMobile ? '8px' : '0'
            }}>
                <Button
                    variant="secondary"
                    onClick={onBulkAdd}
                    title={isMobile ? t('action.add_list') : undefined}
                >
                    <FileText size={isMobile ? 20 : 18} style={{ marginRight: isMobile ? '0' : '8px' }} />
                    {!isMobile && t('action.add_list')}
                </Button>
                <Button
                    variant="primary"
                    onClick={onAddCourse}
                    title={isMobile ? t('dashboard.add_course') : undefined}
                    style={{ flex: isMobile ? 1 : 'none' }}
                >
                    <Plus size={isMobile ? 20 : 18} style={{ marginRight: isMobile ? '0' : '8px' }} />
                    {!isMobile && t('dashboard.add_course')}
                    {isMobile && <span style={{ marginLeft: '8px' }}>{t('dashboard.add_course')}</span>}
                </Button>
            </div>
        </div>
    );
};
