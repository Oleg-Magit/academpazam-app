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
    onAddSemester: () => void;
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
    onAddSemester,
    onBulkAdd,
    isMobile = false
}) => {
    const { t } = useTranslation();

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'row', // Always row but wraps
            gap: isMobile ? '12px' : '16px',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--color-border)',
            flexWrap: 'wrap'
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '16px',
                alignItems: 'center',
                flex: '1 1 auto',
                flexWrap: 'wrap',
                width: isMobile ? '100%' : 'auto'
            }}>
                <div style={{
                    position: 'relative',
                    flex: isMobile ? '1 1 100%' : '1 1 250px',
                    maxWidth: isMobile ? '100%' : '350px',
                    order: isMobile ? 1 : 0
                }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
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
                            padding: isMobile ? '12px 12px 12px 40px' : '11px 12px 11px 40px',
                            borderRadius: '10px',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-secondary)',
                            color: 'var(--color-text-primary)',
                            fontSize: isMobile ? '1rem' : '0.95rem',
                            transition: 'border-color 0.2s, box-shadow 0.2s'
                        }}
                    />
                </div>

                <div style={{
                    display: 'flex',
                    gap: isMobile ? '8px' : '12px',
                    flexWrap: 'wrap',
                    flex: isMobile ? '1 1 100%' : '0 1 auto',
                    order: isMobile ? 3 : 2
                }}>
                    <select
                        id="year-filter"
                        name="yearFilter"
                        value={yearFilter}
                        onChange={e => onYearFilterChange(e.target.value)}
                        aria-label={t('label.filter_year' as any) || 'Filter by Year'}
                        style={{
                            padding: isMobile ? '10px 8px' : '10px 16px',
                            borderRadius: '10px',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-secondary)',
                            color: 'var(--color-text-primary)',
                            fontSize: isMobile ? '0.85rem' : '0.9rem',
                            cursor: 'pointer',
                            flex: isMobile ? '1' : 'none'
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
                            padding: isMobile ? '10px 8px' : '10px 16px',
                            borderRadius: '10px',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-secondary)',
                            color: 'var(--color-text-primary)',
                            fontSize: isMobile ? '0.85rem' : '0.9rem',
                            cursor: 'pointer',
                            flex: isMobile ? '1' : 'none'
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
                            padding: isMobile ? '10px 8px' : '10px 16px',
                            borderRadius: '10px',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-secondary)',
                            color: 'var(--color-text-primary)',
                            fontSize: isMobile ? '0.85rem' : '0.9rem',
                            cursor: 'pointer',
                            flex: isMobile ? '1' : 'none'
                        }}
                    >
                        <option value="all">{t('status.all')}</option>
                        <optgroup label={t('filter.group_attempts')}>
                            <option value="failed">{t('status.failed')}</option>
                            <option value="in_progress">{t('status.in_progress')}</option>
                            <option value="repeated">{t('status.repeated')}</option>
                            <option value="planned">{t('status.planned')}</option>
                        </optgroup>
                        <optgroup label={t('label.academic_status')}>
                            <option value="passed_academic">{t('status.passed_academic')}</option>
                            <option value="not_completed">{t('status.not_completed')}</option>
                            <option value="needs_repeat">{t('status.needs_repeat')}</option>
                        </optgroup>
                    </select>
                </div>
            </div>
            <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: isMobile ? 'stretch' : 'flex-start',
                alignItems: 'center',
                flexShrink: 0,
                width: isMobile ? '100%' : 'auto',
                order: isMobile ? 2 : 3,
                marginTop: isMobile ? '4px' : '0'
            }}>
                {isMobile && (
                    <Button
                        variant="secondary"
                        onClick={onAddSemester}
                        title={t('action.add_semester')}
                        style={{ height: '42px', flex: isMobile ? 1 : 'none' }}
                    >
                        <Plus size={20} />
                    </Button>
                )}
                <Button
                    variant="secondary"
                    onClick={onBulkAdd}
                    title={isMobile ? t('action.add_list') : undefined}
                    style={{ height: '42px', flex: isMobile ? 1 : 'none' }}
                >
                    <FileText size={isMobile ? 20 : 18} style={{ marginRight: isMobile ? '0' : '8px' }} />
                    {!isMobile && t('action.add_list')}
                </Button>
                <Button
                    variant="primary"
                    onClick={onAddCourse}
                    title={isMobile ? t('dashboard.add_course') : undefined}
                    style={{ flex: isMobile ? 2 : 'none', height: '42px' }}
                >
                    <Plus size={isMobile ? 20 : 18} style={{ marginRight: isMobile ? '0' : '8px' }} />
                    {!isMobile && t('dashboard.add_course')}
                    {isMobile && <span style={{ marginLeft: '8px' }}>{t('dashboard.add_course')}</span>}
                </Button>
            </div>
        </div>
    );
};
