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
            <div className="snapshot-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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

                    <ProgressBar value={percentage} height={20} labelInside={true} showValue={true} />
                </div>

                <div style={{ height: '1px', background: 'var(--color-border)', opacity: 0.5, margin: '0 -4px' }} />

                {/* AREA B: Academic Status */}
                <div className="academic-status-block">
                    <h2 style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                        {t('label.academic_status')}
                    </h2>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ 
                            flex: '1 1 140px', 
                            padding: '10px', 
                            backgroundColor: 'var(--color-bg-secondary)', 
                            borderRadius: '10px',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            opacity: 0.8
                        }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{t('label.weighted_gpa')}</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-accent)' }}>
                                {gpa !== null ? gpa.toFixed(1) : t('label.not_available')}
                            </span>
                        </div>
                        
                        <div style={{ 
                            flex: '1 1 140px', 
                            padding: '10px', 
                            backgroundColor: 'var(--color-bg-secondary)', 
                            borderRadius: '10px',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            opacity: 0.8
                        }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{t('label.courses_for_improvement')}</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: needsImprovementCount > 0 ? 'var(--color-warning)' : 'var(--color-text-primary)' }}>
                                {needsImprovementCount}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 4. Status Stats Row - Restored to original position and content */}
                <div className="stats-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    <StatChip label={t('status.completed')} value={completedCount} color="var(--color-success)" />
                    <StatChip label={t('status.in_progress')} value={inProgressCount} color="var(--color-warning)" />
                    {needsRepeatCount > 0 && (
                        <StatChip label={t('status.needs_repeat')} value={needsRepeatCount} color="var(--color-danger)" />
                    )}
                    <StatChip label={t('label.average')} value={gpa !== null ? gpa.toFixed(1) : t('label.not_available')} color="var(--color-accent)" />
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
