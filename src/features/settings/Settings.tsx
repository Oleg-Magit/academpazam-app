import React, { useState } from 'react';
import { usePlans, useCourses } from '@/core/hooks/useData';
import { useTranslation } from '@/app/i18n/useTranslation';

// Sub-components
import { AppearanceSettings } from './components/AppearanceSettings';
import { PlanSettings } from './components/PlanSettings';
import { DataSettings } from './components/DataSettings';

export const Settings: React.FC = () => {
    const { t, language } = useTranslation();
    const { plans, refresh: refreshPlans } = usePlans();
    const currentPlan = plans[0];
    const { courses } = useCourses(currentPlan?.id || null);
    const [message, setMessage] = useState('');

    const handleMessage = (msg: string) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 3000);
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '80px' }}>
            <h1 style={{ marginBottom: '24px', fontSize: '1.75rem' }}>{t('settings.title')}</h1>

            {message && (
                <div style={{
                    padding: '12px 16px',
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderLeft: '4px solid var(--color-accent)',
                    borderRadius: '4px',
                    marginBottom: '24px',
                    fontWeight: 500
                }}>
                    {message}
                </div>
            )}

            <div style={{ display: 'grid', gap: '16px' }}>
                <AppearanceSettings />

                <PlanSettings
                    plan={currentPlan}
                    onRefresh={refreshPlans}
                    onMessage={handleMessage}
                />

                <DataSettings
                    plan={currentPlan}
                    courses={courses}
                    onRefresh={refreshPlans}
                    onMessage={handleMessage}
                    language={language}
                />
            </div>
        </div>
    );
};
