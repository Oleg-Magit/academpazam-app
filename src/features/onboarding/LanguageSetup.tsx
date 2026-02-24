import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/app/i18n/useTranslation';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { LANGUAGES } from '@/app/i18n';
import type { Language } from '@/app/i18n';

export const LanguageSetup: React.FC = () => {
    const { setLanguage, setInitialized } = useTranslation();
    const navigate = useNavigate();

    const handleSelect = async (lang: Language) => {
        const dir = (lang === 'he' ? 'rtl' : 'ltr');

        // Immediate side effects for zero-flicker transition
        document.documentElement.lang = lang;
        document.documentElement.dir = dir;
        localStorage.setItem('i18nextLng', lang);
        localStorage.setItem('app_language_initialized', 'true');

        await setLanguage(lang);
        await setInitialized(true);

        console.debug("LANG_SELECTED", lang, "DIR", document.documentElement.dir);
        navigate('/', { replace: true });
    };

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
                            onClick={() => handleSelect(lang.code)}
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
};
