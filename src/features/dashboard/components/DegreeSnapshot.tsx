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
    needsImprovementCount: number;
    gpa: number | null;
}

export const DegreeSnapshot: React.FC<DegreeSnapshotProps> = memo(({
    degreeName,
    totalCredits,
    completedCredits,
    remainingCredits,
    percentage,
    completedCount,
    inProgressCount,
    needsRepeatCount,
    needsImprovementCount,
    gpa
}) => {
    const { t } = useTranslation();

    return (
        <Card className="degree-snapshot-card" style={{ padding: 'var(--space-lg)', position: 'relative' }}>
            <div className="snapshot-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 1. Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h1 className="degree-title" style={{
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            margin: 0,
                            color: 'var(--color-text-primary)'
                        }}>
                            {degreeName}
                        </h1>
                        <Link to="/settings" className="edit-plan-link" aria-label={t('action.edit')}>
                            <Edit2 size={16} />
                        </Link>
                    </div>
                </div>

                {/* AREA A: Degree Progress */}
                <div className="degree-progress-block">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h2 style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {t('dashboard.degree_progress')}
                        </h2>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {completedCredits} / {totalCredits} <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{t('label.credits')}</span>
                        </div>
                    </div>

                    <ProgressBar value={percentage} height={20} labelInside={true} showValue={true} labelThreshold={8} />
                </div>

                {/* Status Stats Row - Unified and Compact */}
                <div className="stats-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    <StatChip label={t('status.completed')} value={completedCount} color="var(--color-success)" />
                    <StatChip label={t('status.in_progress')} value={inProgressCount} color="var(--color-warning)" />
                    {needsRepeatCount > 0 && (
                        <StatChip label={t('status.needs_repeat')} value={needsRepeatCount} color="var(--color-danger)" />
                    )}
                    <StatChip 
                        label={t('label.average')} 
                        value={gpa !== null ? gpa.toFixed(1) : t('label.not_available')} 
                        color="var(--color-accent)" 
                    />
                    {needsImprovementCount > 0 && (
                        <StatChip 
                            label={t('label.needs_improvement')} 
                            value={needsImprovementCount} 
                            color="var(--color-warning)" 
                        />
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
                    
                    .percentage-desktop, .percentage-mobile {
                        display: none !important;
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
