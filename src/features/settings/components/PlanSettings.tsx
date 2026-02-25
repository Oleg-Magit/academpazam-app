import React, { useState, useEffect } from 'react';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { Edit2, Save, X } from 'lucide-react';
import { useTranslation } from '@/app/i18n/useTranslation';
import { savePlan } from '@/core/db/db';
import type { Plan } from '@/core/models/types';

interface PlanSettingsProps {
    plan: Plan | undefined;
    onRefresh: () => void;
    onMessage: (msg: string) => void;
}

export const PlanSettings: React.FC<PlanSettingsProps> = ({ plan, onRefresh, onMessage }) => {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState('');
    const [threshold, setThreshold] = useState(56);

    useEffect(() => {
        if (plan) {
            setName(plan.name);
            setThreshold(plan.passing_exam_threshold);
        }
    }, [plan]);

    const handleSave = async () => {
        if (!plan) return;
        await savePlan({
            ...plan,
            name,
            passing_exam_threshold: threshold,
            updatedAt: Date.now()
        });
        onRefresh();
        setIsEditing(false);
        onMessage(t('msg.saved_success'));
    };

    return (
        <Card style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isEditing ? '16px' : '0' }}>
                <div>
                    <h2 style={{ fontSize: '1rem', margin: 0 }}>{t('settings.degree_name')}</h2>
                    {!isEditing && (
                        <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            {plan?.name} (Pass &gt; {plan?.passing_exam_threshold})
                        </p>
                    )}
                </div>
                {!isEditing && (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit2 size={16} />
                    </Button>
                )}
            </div>

            {isEditing && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                    <Input
                        id="plan-name"
                        name="planName"
                        label={t('settings.degree_name')}
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                    <Input
                        id="plan-threshold"
                        name="planThreshold"
                        label={t('settings.passing_grade')}
                        type="number"
                        value={threshold}
                        onChange={e => setThreshold(Number(e.target.value))}
                    />
                    <div style={{ display: 'flex', gap: '8px', paddingBottom: '2px' }}>
                        <Button variant="ghost" onClick={() => setIsEditing(false)} title="Cancel">
                            <X size={20} />
                        </Button>
                        <Button onClick={handleSave} title="Save">
                            <Save size={20} />
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
};
