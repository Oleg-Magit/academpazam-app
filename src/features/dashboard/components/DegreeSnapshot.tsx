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
    needsRepeatCount: number;
}

export const DegreeSnapshot: React.FC<DegreeSnapshotProps> = memo(({
    degreeName,
    totalCredits,
    completedCredits,
    remainingCredits,
    percentage,
    completedCount,
    inProgressCount,
    needsRepeatCount
}) => {
    const { t } = useTranslation();

    return (
        <Card className="degree-snapshot-card" style={{ padding: 'var(--space-lg)', position: 'relative' }}>
            <div className="snapshot-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* 1. Title Row: Primary Element */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
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
                            padding: '2px'
                        }} className="edit-plan-link" aria-label={t('action.edit')}>
                            <Edit2 size={16} />
                        </Link>
                    </div>

                    {/* Desktop Percentage (Hidden on mobile if desired, or keep small) */}
                    <div className="percentage-desktop" style={{ textAlign: 'right' }}>
                        <span style={{
                            fontSize: '2rem',
                            fontWeight: 800,
                            color: 'var(--color-accent)',
                            lineHeight: 1
                        }}>
                            {percentage.toFixed(0)}%
                        </span>
                    </div>
                </div>

                {/* 2 & 3. Mobile Percentage + Progress Bar */}
                <div className="progress-section" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className="percentage-mobile" style={{ display: 'none', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-accent)' }}>
                            {percentage.toFixed(0)}%
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                            {t('label.completed')}
                        </span>
                    </div>

                    <ProgressBar value={percentage} height={8} showValue={false} />

                    <div className="credits-summary" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                        <span>{completedCredits} / {totalCredits} {t('label.total_credits')}</span>
                    </div>
                </div>

                {/* 4. Status Stats Row */}
                <div className="stats-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    <StatChip label={t('status.completed')} value={completedCount} color="var(--color-success)" />
                    <StatChip label={t('status.in_progress')} value={inProgressCount} color="var(--color-warning)" />
                    {needsRepeatCount > 0 && (
                        <StatChip label={t('status.needs_repeat')} value={needsRepeatCount} color="var(--color-danger)" />
                    )}
                    <StatChip label={t('label.remaining')} value={remainingCredits} color="var(--color-text-secondary)" />
                </div>
            </div>

            <style>{`
                .edit-plan-link:hover {
                    color: var(--color-accent) !important;
                }
                
                @media (max-width: 640px) {
                    .degree-snapshot-card {
                        padding: 16px !important;
                    }
                    
                    .snapshot-container {
                        gap: 10px !important;
                    }
                    
                    .percentage-desktop {
                        display: none !important;
                    }
                    
                    .percentage-mobile {
                        display: flex !important;
                    }
                    
                    .degree-title {
                        font-size: 1.15rem !important;
                    }
                    
                    .stats-row {
                        gap: 6px !important;
                        margin-top: 2px !important;
                    }
                    
                    .credits-summary {
                        margin-top: -2px;
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
        gap: '4px',
        padding: '3px 8px',
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '6px',
        fontSize: '0.7rem',
        fontWeight: 600,
        border: `1px solid var(--color-border)`
    }}>
        <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: color }} />
        <span style={{ color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{label}:</span>
        <span style={{ color: 'var(--color-text-primary)' }}>{value}</span>
    </div>
);
