import React from 'react';
import { Button } from '@/ui/Button';
import { Plus, Edit2, Trash2, Save, ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/app/i18n/useTranslation';
import type { SemesterGroup, Semester } from '@/core/models/types';

interface SemesterNavigationProps {
    bySemester: SemesterGroup[];
    selectedSemester: string;
    onSelectSemester: (semId: string) => void;
    editingSemesterId: string | null;
    setEditingSemesterId: (id: string | null) => void;
    tempLabel: string;
    setTempLabel: (label: string) => void;
    onAddSemester: () => void;
    onStartRenaming: (semId: string, currentLabel: string) => void;
    onSaveRename: () => void;
    onPromptDelete: (semester: Semester) => void;
    onReorder: (semesterId: string, direction: 'up' | 'down') => void;
    semesters: Semester[];
    isMobile?: boolean;
}

export const SemesterNavigation: React.FC<SemesterNavigationProps> = ({
    bySemester,
    selectedSemester,
    onSelectSemester,
    editingSemesterId,
    setEditingSemesterId,
    tempLabel,
    setTempLabel,
    onAddSemester,
    onStartRenaming,
    onSaveRename,
    onPromptDelete,
    onReorder,
    semesters,
    isMobile = false
}) => {
    const { t } = useTranslation();

    return (
        <div style={{
            width: isMobile ? '100%' : '240px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            overflowY: isMobile ? 'visible' : 'auto',
            paddingRight: isMobile ? '0' : '8px',
            borderRight: isMobile ? 'none' : '1px solid var(--color-border)',
            paddingBottom: isMobile ? '16px' : '0'
        }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', paddingLeft: '8px' }}>{t('label.semesters')}</h2>

            <div
                onClick={() => onSelectSemester('all')}
                style={{
                    padding: isMobile ? '12px 16px' : '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: selectedSemester === 'all' ? 'var(--color-bg-secondary)' : 'transparent',
                    border: selectedSemester === 'all' ? '1px solid var(--color-border)' : '1px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: isMobile ? '56px' : '42px',
                    marginBottom: '8px',
                    transition: 'all 0.2s ease',
                }}
            >
                <span style={{ fontWeight: selectedSemester === 'all' ? 600 : 400, marginLeft: '4px' }}>
                    {t('label.all_semesters')}
                </span>
            </div>

            {(() => {
                const groups: Record<number, SemesterGroup[]> = {};
                bySemester.forEach(sem => {
                    const y = sem.year || 1;
                    if (!groups[y]) groups[y] = [];
                    groups[y].push(sem);
                });

                return Object.entries(groups)
                    .sort((a, b) => Number(a[0]) - Number(b[0]))
                    .map(([year, yearSemesters]) => (
                        <div key={year} style={{ marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '8px', paddingLeft: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {t('label.year')} {year}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {yearSemesters.map((sem) => (
                                    <div
                                        key={sem.semesterId}
                                        onClick={() => onSelectSemester(sem.semesterId)}
                                        style={{
                                            padding: isMobile ? '12px 16px' : '8px 12px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            backgroundColor: selectedSemester === sem.semesterId ? 'var(--color-bg-secondary)' : 'transparent',
                                            border: selectedSemester === sem.semesterId ? '1px solid var(--color-border)' : '1px solid transparent',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            transition: 'all 0.2s ease',
                                            minHeight: isMobile ? '56px' : '42px',
                                            position: 'relative',
                                            marginLeft: '8px'
                                        }}
                                        className="semester-row"
                                    >
                                        {editingSemesterId === sem.semesterId ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }} onClick={e => e.stopPropagation()}>
                                                <input
                                                    id={`rename-semester-${sem.semesterId}`}
                                                    name={`renameSemester-${sem.semesterId}`}
                                                    value={tempLabel}
                                                    onChange={e => setTempLabel(e.target.value)}
                                                    autoFocus
                                                    aria-label={`Rename semester ${sem.semesterId}`}
                                                    style={{
                                                        width: '100%',
                                                        padding: isMobile ? '10px' : '4px',
                                                        borderRadius: '4px',
                                                        border: '1px solid var(--color-accent)',
                                                        fontSize: isMobile ? '1rem' : '0.9rem',
                                                        backgroundColor: 'var(--color-bg-primary)',
                                                        color: 'var(--color-text-primary)'
                                                    }}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') onSaveRename();
                                                        if (e.key === 'Escape') setEditingSemesterId(null);
                                                    }}
                                                />
                                                <Button size={isMobile ? 'md' : 'sm'} variant="ghost" onClick={onSaveRename} style={{ padding: '4px' }} aria-label={t('action.save')}>
                                                    <Save size={isMobile ? 20 : 14} />
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, overflow: 'hidden' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={bySemester.findIndex(x => x.semesterId === sem.semesterId) === 0}
                                                            style={{ padding: 0, height: '14px', visibility: selectedSemester === sem.semesterId ? 'visible' : 'hidden' }}
                                                            onClick={(e) => { e.stopPropagation(); onReorder(sem.semesterId, 'up'); }}
                                                            aria-label="Move Up"
                                                        >
                                                            <ChevronUp size={12} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={bySemester.findIndex(x => x.semesterId === sem.semesterId) === bySemester.length - 1}
                                                            style={{ padding: 0, height: '14px', visibility: selectedSemester === sem.semesterId ? 'visible' : 'hidden' }}
                                                            onClick={(e) => { e.stopPropagation(); onReorder(sem.semesterId, 'down'); }}
                                                            aria-label="Move Down"
                                                        >
                                                            <ChevronDown size={12} />
                                                        </Button>
                                                    </div>

                                                    <span style={{
                                                        fontWeight: selectedSemester === sem.semesterId ? 600 : 400,
                                                        fontSize: isMobile ? '1.1rem' : '1rem',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        marginLeft: '4px'
                                                    }}>
                                                        {(() => {
                                                            const termName = t(`term.${(sem.term || 'A').toLowerCase()}` as any);
                                                            // Structural check: empty name or matches known default patterns
                                                            const isDefault = !sem.semesterName ||
                                                                /^(Semester|סמסטר|Семестр)\s+\d+$/i.test(sem.semesterName);

                                                            return isDefault ? termName : `${termName} (${sem.semesterName})`;
                                                        })()}
                                                    </span>
                                                    {selectedSemester === sem.semesterId && (
                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                style={{ padding: '4px', height: 'auto' }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onStartRenaming(sem.semesterId, sem.semesterName);
                                                                }}
                                                                aria-label={t('action.edit')}
                                                            >
                                                                <Edit2 size={isMobile ? 18 : 12} style={{ opacity: 0.7 }} />
                                                            </Button>

                                                            {semesters.length > 1 && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    style={{ padding: '4px', height: 'auto', color: 'var(--color-danger)' }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const fullSem = semesters.find(s => s.id === sem.semesterId);
                                                                        if (fullSem) onPromptDelete(fullSem);
                                                                    }}
                                                                    aria-label={t('action.delete')}
                                                                >
                                                                    <Trash2 size={isMobile ? 18 : 12} style={{ opacity: 0.7 }} />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                    {(sem.courses.length > 0) && (
                                                        <span style={{
                                                            fontSize: isMobile ? '0.9rem' : '0.75rem',
                                                            color: 'var(--color-text-secondary)',
                                                            backgroundColor: 'var(--color-bg-primary)',
                                                            padding: isMobile ? '4px 10px' : '2px 6px',
                                                            borderRadius: '12px'
                                                        }}>
                                                            {sem.courses.length}
                                                        </span>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
            })()}

            < Button
                variant="ghost"
                onClick={onAddSemester}
                style={{
                    marginTop: '8px',
                    justifyContent: 'flex-start',
                    minHeight: isMobile ? '48px' : 'auto',
                    padding: isMobile ? '12px 16px' : '8px 12px'
                }}
            >
                <Plus size={isMobile ? 20 : 16} style={{ marginRight: '8px' }} />
                {t('action.add_semester')}
            </Button>
        </div >
    );
};
