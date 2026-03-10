import React, { memo } from 'react';
import { Card } from '@/ui/Card';
import { ProgressBar } from '@/ui/ProgressBar';
import { useTranslation } from '@/app/i18n/useTranslation';

interface YearSnapshotProps {
    year: number;
    totalCredits: number;
    completedCredits: number;
    remainingCredits: number;
    percentage: number;
}

export const YearSnapshot: React.FC<YearSnapshotProps> = memo(({
    year,
    totalCredits,
    completedCredits,
    percentage
}) => {
    const { t } = useTranslation();

    return (
        <Card style={{ padding: 'var(--space-md)', flex: 1, minWidth: 'min(100%, 280px)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        margin: 0,
                        color: 'var(--color-text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-accent)' }} />
                        {t('label.year')} {year}
                    </h3>

                    <span style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: 'var(--color-accent)',
                        lineHeight: 1
                    }}>
                        {percentage.toFixed(0)}%
                    </span>
                </div>

                <div style={{ marginTop: '4px' }}>
                    <ProgressBar value={percentage} height={6} showValue={false} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                        <span>
                            <span style={{ color: 'var(--color-text-primary)' }}>{completedCredits}</span> / {totalCredits} {t('label.total_credits')}
                        </span>
                    </div>
                </div>
            </div>
        </Card>
    );
});
