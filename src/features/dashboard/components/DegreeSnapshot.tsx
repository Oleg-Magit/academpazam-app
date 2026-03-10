import React, { memo } from 'react';
import { Card } from '@/ui/Card';
import { ProgressBar } from '@/ui/ProgressBar';
import { useTranslation } from '@/app/i18n/useTranslation';
import { Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DegreeSnapshotProps {
    degreeName: string;
    totalCredits: number;
    completedCredits: number;
    remainingCredits: number;
    percentage: number;
    completedCount: number;
    inProgressCount: number;
}

export const DegreeSnapshot: React.FC<DegreeSnapshotProps> = memo(({
    degreeName,
    totalCredits,
    completedCredits,
    remainingCredits,
    percentage,
    completedCount,
    inProgressCount
}) => {
    const { t } = useTranslation();

    return (
        <Card className="degree-snapshot-card" style={{ padding: 'var(--space-lg)', position: 'relative' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                {/* Header: Name + Percentage */}
                <div className="snapshot-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-md)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <h1 className="degree-title" style={{
                                fontSize: '1.25rem',
                                fontWeight: 700,
                                margin: 0,
                                color: 'var(--color-text-primary)',
                                lineHeight: 1.2
                            }}>
                                {degreeName}
                            </h1>
                            <Link to="/settings" style={{
                                color: 'var(--color-text-secondary)',
                                transition: 'color 0.2s',
                                display: 'flex',
                                padding: '4px'
                            }} className="edit-plan-link" aria-label={t('action.edit')}>
                                <Edit2 size={16} />
                            </Link>
                        </div>

                        {/* Inline Chips Stat Row */}
                        <div className="stats-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '16px' }}>
                            <StatChip label={t('status.completed')} value={completedCount} color="var(--color-success)" />
                            <StatChip label={t('status.in_progress')} value={inProgressCount} color="var(--color-warning)" />
                            <StatChip label={t('label.remaining')} value={`${remainingCredits} ${t('label.pts')}`} color="var(--color-text-secondary)" />
                        </div>
                    </div>

                    <div className="percentage-container" style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span className="percentage-text" style={{
                            fontSize: '2.5rem',
                            fontWeight: 800,
                            color: 'var(--color-accent)',
                            lineHeight: 1
                        }}>
                            {percentage.toFixed(0)}%
                        </span>
                    </div>
                </div>

                <div style={{ marginTop: 'var(--space-xs)' }}>
                    <ProgressBar value={percentage} height={10} showValue={false} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                        <span>{completedCredits} / {totalCredits} {t('label.total_credits')}</span>
                    </div>
                </div>
            </div>
            <style>{`
                .edit-plan-link:hover {
                    color: var(--color-accent) !important;
                }
                
                @media (max-width: 640px) {
                    .degree-snapshot-card {
                        padding: var(--space-xl) !important;
                    }
                    
                    .snapshot-header {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: var(--space-lg) !important;
                    }
                    
                    .percentage-container {
                        text-align: inherit !important;
                        order: -1;
                        margin-bottom: -8px;
                    }
                    
                    .percentage-text {
                        font-size: 3rem !important;
                    }
                    
                    .degree-title {
                        font-size: 1.4rem !important;
                    }
                    
                    .stats-chips {
                        gap: 12px !important;
                        margin-top: 20px !important;
                    }
                }
            `}</style>
        </Card>
    );
});

const StatChip = ({ label, value, color }: { label: string, value: string | number, color: string }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 8px',
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '6px',
        fontSize: '0.75rem',
        fontWeight: 600,
        border: `1px solid var(--color-border)`
    }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color }} />
        <span style={{ color: 'var(--color-text-secondary)' }}>{label}:</span>
        <span style={{ color: 'var(--color-text-primary)' }}>{value}</span>
    </div>
);
