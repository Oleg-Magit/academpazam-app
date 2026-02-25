import React from 'react';
import { Card } from '@/ui/Card';
import { Skeleton } from '@/ui/Skeleton';

export const DashboardSkeleton: React.FC = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {/* Header Skeleton */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton width="250px" height="2rem" />
                <Skeleton width="100px" height="2.5rem" borderRadius="var(--radius-md)" />
            </div>

            {/* Progress Card Skeleton */}
            <Card style={{ padding: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <Skeleton width="60%" height="1.5rem" style={{ marginBottom: '12px' }} />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Skeleton width="80px" height="24px" borderRadius="6px" />
                                <Skeleton width="90px" height="24px" borderRadius="6px" />
                                <Skeleton width="70px" height="24px" borderRadius="6px" />
                            </div>
                        </div>
                        <Skeleton width="80px" height="3rem" />
                    </div>
                    <div style={{ marginTop: 'var(--space-xs)' }}>
                        <Skeleton width="100%" height="8px" style={{ marginBottom: '8px' }} />
                        <Skeleton width="150px" height="0.8rem" />
                    </div>
                </div>
            </Card>

            {/* Quick Actions Skeleton */}
            <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                <Skeleton width="130px" height="2.5rem" borderRadius="30px" />
                <Skeleton width="130px" height="2.5rem" borderRadius="30px" />
                <Skeleton width="130px" height="2.5rem" borderRadius="30px" />
            </div>

            {/* Roadmap Skeleton */}
            <div style={{ marginTop: 'var(--space-md)' }}>
                <Skeleton width="200px" height="1.25rem" style={{ marginBottom: 'var(--space-md)' }} />
                <div style={{ display: 'flex', gap: '16px', overflow: 'hidden' }}>
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} width="160px" height="100px" borderRadius="12px" />
                    ))}
                </div>
            </div>
        </div>
    );
};
