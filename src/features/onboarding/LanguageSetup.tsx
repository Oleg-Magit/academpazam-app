import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/app/i18n/useTranslation';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { LANGUAGES } from '@/app/i18n';
import type { Language } from '@/app/i18n';
import { usePwa } from '@/app/providers/PwaProvider';
import { Smartphone } from 'lucide-react';

export const LanguageSetup: React.FC = () => {
    const { t, setLanguage, setInitialized } = useTranslation();
    const { canInstall, install } = usePwa();
    const navigate = useNavigate();
    const [step, setStep] = useState<0 | 1>(0);

    const handleSelectLanguage = async (lang: Language) => {
        const dir = (lang === 'he' ? 'rtl' : 'ltr');

        // Immediate side effects for zero-flicker transition
        document.documentElement.lang = lang;
        document.documentElement.dir = dir;
        localStorage.setItem('i18nextLng', lang);

        await setLanguage(lang);

        // Move to PWA step or skip if cannot install
        if (canInstall) {
            setStep(1);
        } else {
            completeOnboarding();
        }
    };

    const handleInstall = async () => {
        await install();
        completeOnboarding();
    };

    const completeOnboarding = () => {
        localStorage.setItem('app_language_initialized', 'true');
        setInitialized(true);
        navigate('/', { replace: true });
    };

    if (step === 0) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                padding: 'var(--space-md)',
                backgroundColor: 'var(--color-bg-secondary)'
            }}>
                <Card style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: 'var(--space-xl)' }}>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-md)' }}>
                        Pick your language / בחר שפה
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
                        Welcome! Please select your language.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {LANGUAGES.map((lang) => (
                            <Button
                                key={lang.code}
                                onClick={() => handleSelectLanguage(lang.code)}
                                variant="secondary"
                                style={{ padding: '16px', fontSize: '1.1rem' }}
                            >
                                {lang.label}
                            </Button>
                        ))}
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: 'var(--space-md)',
            backgroundColor: 'var(--color-bg-secondary)'
        }}>
            <Card style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: 'var(--space-xl)' }}>
                <div style={{ marginBottom: 'var(--space-lg)', display: 'flex', justifyContent: 'center' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-bg-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-accent)'
                    }}>
                        <Smartphone size={32} />
                    </div>
                </div>

                <h1 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-md)' }}>
                    {t('onboarding.install_title')}
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)', fontSize: '0.95rem' }}>
                    {t('onboarding.install_desc')}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Button
                        onClick={handleInstall}
                        variant="primary"
                        style={{ padding: '16px', fontSize: '1.1rem' }}
                    >
                        {t('onboarding.install_button')}
                    </Button>
                    <Button
                        onClick={completeOnboarding}
                        variant="ghost"
                        style={{ padding: '12px' }}
                    >
                        {t('onboarding.skip_button')}
                    </Button>
                </div>
            </Card>
        </div>
    );
};
