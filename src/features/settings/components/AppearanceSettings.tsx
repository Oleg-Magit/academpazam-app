import React from 'react';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { Select } from '@/ui/Select';
import { Moon, Sun } from 'lucide-react';
import { useTranslation } from '@/app/i18n/useTranslation';
import { useTheme } from '@/app/providers/ThemeProvider';
import { LANGUAGES } from '@/app/i18n';
import type { Language } from '@/app/i18n';

export const AppearanceSettings: React.FC = () => {
    const { t, language, setLanguage, direction, setDirection } = useTranslation();
    const { theme, toggleTheme } = useTheme();

    return (
        <div style={{ display: 'grid', gap: '16px' }}>
            <Card style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h2 style={{ fontSize: '1rem', margin: 0 }}>{t('settings.language')}</h2>
                    <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        {language === 'he' ? t('label.rtl_mode') : t('label.ltr_mode')}
                    </p>
                </div>
                <div style={{ width: '150px' }}>
                    <Select
                        id="language-select"
                        name="language"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as Language)}
                        options={LANGUAGES.map(l => ({ value: l.code, label: l.label }))}
                    />
                </div>
            </Card>

            <Card style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h2 style={{ fontSize: '1rem', margin: 0 }}>{t('settings.theme')}</h2>
                    <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        {theme === 'dark' ? t('label.dark_mode') : t('label.light_mode')}
                    </p>
                </div>
                <Button variant="secondary" onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                    {theme === 'dark' ? t('action.switch_light') : t('action.switch_dark')}
                </Button>
            </Card>

            <Card style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1rem', margin: 0 }}>{t('label.direction')}</h2>
                        <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            {direction === 'auto' ? t('label.dir_auto') :
                                direction === 'rtl' ? t('label.dir_rtl') : t('label.dir_ltr')}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                            variant={direction === 'auto' ? 'primary' : 'secondary'}
                            onClick={() => setDirection('auto')}
                            size="sm"
                        >
                            {t('label.dir_auto').split(' ')[0]}
                        </Button>
                        <Button
                            variant={direction === 'rtl' ? 'primary' : 'secondary'}
                            onClick={() => setDirection('rtl')}
                            size="sm"
                        >
                            RTL
                        </Button>
                        <Button
                            variant={direction === 'ltr' ? 'primary' : 'secondary'}
                            onClick={() => setDirection('ltr')}
                            size="sm"
                        >
                            LTR
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};
