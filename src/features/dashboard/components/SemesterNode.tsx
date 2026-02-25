import React, { memo, useMemo } from 'react';
import { useTranslation } from '@/app/i18n/useTranslation';
import { ProgressBar } from '@/ui/ProgressBar';

interface SemesterNodeProps {
    semester: string;
    label?: string;
    status: 'completed' | 'current' | 'upcoming';
    totalCredits: number;
    completedCredits: number;
    isSelected: boolean;
    onClick: () => void;
}

export const SemesterNode: React.FC<SemesterNodeProps> = memo(({
    semester,
    label,
    status,
    totalCredits,
    completedCredits,
    isSelected,
    onClick
}) => {
    const { t } = useTranslation();
    const progress = totalCredits > 0 ? (completedCredits / totalCredits) * 100 : 0;

    const styles = useMemo(() => {
        switch (status) {
            case 'completed':
                return {
                    borderColor: 'var(--color-success)',
                    icon: '✓',
                    accentColor: 'var(--color-success)'
                };
            case 'current':
                return {
                    borderColor: 'var(--color-accent)',
                    icon: '●',
                    accentColor: 'var(--color-accent)'
                };
            default:
                return {
                    borderColor: 'var(--color-border)',
                    icon: '',
                    accentColor: 'var(--color-text-secondary)'
                };
        }
    }, [status]);

    return (
        <div
            onClick={onClick}
            role="button"
            aria-label={`${label || t('label.semester') + ' ' + semester} - ${progress.toFixed(0)}%`}
            style={{
                flex: '0 0 auto',
                width: '180px',
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-lg)',
                border: `2px solid ${isSelected ? 'var(--color-accent)' : styles.borderColor}`,
                backgroundColor: isSelected ? 'var(--color-bg-primary)' : 'var(--color-bg-secondary)',
                boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                position: 'relative',
                userSelect: 'none',
                transform: isSelected ? 'translateY(-2px)' : 'none'
            }}
        >
            <div style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '120px'
                }}>
                    {label || `${t('label.semester')} ${semester}`}
                </span>
                {status === 'completed' && (
                    <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-success)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px'
                    }}>✓</div>
                )}
                {status === 'current' && (
                    <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-accent)',
                        boxShadow: '0 0 8px var(--color-accent)'
                    }} />
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 500 }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                        {completedCredits} / {totalCredits} {t('label.pts')}
                    </span>
                    <span style={{ color: styles.accentColor }}>
                        {progress.toFixed(0)}%
                    </span>
                </div>
                <ProgressBar value={progress} height={6} />
            </div>

            {isSelected && (
                <div style={{
                    position: 'absolute',
                    bottom: '-2px',
                    left: '20%',
                    right: '20%',
                    height: '2px',
                    backgroundColor: 'var(--color-accent)',
                    borderRadius: '2px 2px 0 0'
                }} />
            )}
        </div>
    );
});
