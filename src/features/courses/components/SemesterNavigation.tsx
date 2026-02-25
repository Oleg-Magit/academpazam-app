import React from 'react';
import { Button } from '@/ui/Button';
import { Plus, Edit2, Trash2, Save } from 'lucide-react';
import { useTranslation } from '@/app/i18n/useTranslation';
import type { SemesterGroup } from '@/core/models/types';

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
    onPromptDelete: (semId: string, label: string) => void;
    semesterCount: number;
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
    semesterCount,
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
            {bySemester.map(sem => (
                <div
                    key={sem.semester}
                    onClick={() => onSelectSemester(sem.semester)}
                    style={{
                        padding: isMobile ? '12px 16px' : '8px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor: selectedSemester === sem.semester ? 'var(--color-bg-secondary)' : 'transparent',
                        border: selectedSemester === sem.semester ? '1px solid var(--color-border)' : '1px solid transparent',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s ease',
                        minHeight: isMobile ? '56px' : '42px',
                        position: 'relative'
                    }}
                    className="semester-row"
                >
                    {editingSemesterId === sem.semester ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }} onClick={e => e.stopPropagation()}>
                            <input
                                id={`rename-semester-${sem.semester}`}
                                name={`renameSemester-${sem.semester}`}
                                value={tempLabel}
                                onChange={e => setTempLabel(e.target.value)}
                                autoFocus
                                aria-label={`Rename semester ${sem.semester}`}
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
                            <Button size={isMobile ? 'md' : 'sm'} variant="ghost" onClick={onSaveRename} style={{ padding: '4px' }}>
                                <Save size={isMobile ? 20 : 14} />
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
                                <span style={{
                                    fontWeight: selectedSemester === sem.semester ? 600 : 400,
                                    fontSize: isMobile ? '1.1rem' : '1rem',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {sem.label || `${t('label.semester')} ${sem.semester}`}
                                </span>
                                {selectedSemester === sem.semester && (
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            style={{ padding: '4px', height: 'auto' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onStartRenaming(sem.semester, sem.label || `${t('label.semester')} ${sem.semester}`);
                                            }}
                                            aria-label={t('action.edit')}
                                        >
                                            <Edit2 size={isMobile ? 18 : 12} style={{ opacity: 0.7 }} />
                                        </Button>

                                        {semesterCount > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                style={{ padding: '4px', height: 'auto', color: 'var(--color-danger)' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onPromptDelete(sem.semester, sem.label || `${t('label.semester')} ${sem.semester}`);
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

            <Button
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
