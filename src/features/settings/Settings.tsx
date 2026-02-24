
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Input } from '@/ui/Input';
import { Select } from '@/ui/Select';
import { exportDataToJSON, importDataFromJSON } from '@/core/services/importExport';
import { usePlans } from '@/core/hooks/useData';
import { clearAllData, savePlan } from '@/core/db/db';
import { Download, Upload, Trash2, Edit2, Save, X, Moon, Sun, FileDown } from 'lucide-react';
import { useTranslation } from '@/app/i18n/useTranslation';
import { useTheme } from '@/app/providers/ThemeProvider';
import { LANGUAGES } from '../../app/i18n';
import type { Language } from '../../app/i18n';
import { useCourses } from '@/core/hooks/useData';
import { generateDegreePDF } from '@/core/services/pdfGenerator';

export const Settings: React.FC = () => {
    const { t, language, setLanguage, direction, setDirection } = useTranslation();
    const { theme, toggleTheme } = useTheme();
    const { plans, refresh: refreshPlans } = usePlans();
    const currentPlan = plans[0];
    const { courses } = useCourses(currentPlan?.id || null);
    const [importing, setImporting] = useState(false);
    const [message, setMessage] = useState('');

    // Plan editing
    const [isEditingPlan, setIsEditingPlan] = useState(false);
    const [planName, setPlanName] = useState('');
    const [planThreshold, setPlanThreshold] = useState(56);

    const mergeInputRef = useRef<HTMLInputElement>(null);
    const replaceInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (currentPlan) {
            setPlanName(currentPlan.name);
            setPlanThreshold(currentPlan.passing_exam_threshold);
        }
        console.debug("LANG", language, "DIR", document.documentElement.dir);
    }, [currentPlan, language]);

    const handleSavePlan = async () => {
        if (!currentPlan) return;

        await savePlan({
            ...currentPlan,
            name: planName,
            passing_exam_threshold: planThreshold,
            updatedAt: Date.now()
        });
        refreshPlans();
        setIsEditingPlan(false);
        setMessage(t('msg.saved_success'));
        setTimeout(() => setMessage(''), 3000);
    };

    const handleExportPDF = async () => {
        if (!currentPlan || !courses) return;
        try {
            const pdfBytes = await generateDegreePDF(currentPlan.name, courses, language);
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${currentPlan.name}-Progress.pdf`;
            a.click();
            URL.revokeObjectURL(url);
            setMessage(t('msg.saved_success'));
            setTimeout(() => setMessage(''), 3000);
        } catch (e) {
            console.error(e);
            setMessage(t('msg.pdf_export_failed'));
        }
    };

    const handleExportJSON = async () => {
        try {
            const blob = await exportDataToJSON();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `academ-pazam-backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            setMessage(t('msg.export_success'));
            setTimeout(() => setMessage(''), 3000);
        } catch (e) {
            console.error(e);
            setMessage(t('msg.export_failed'));
        }
    };

    const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>, mode: 'replace' | 'merge') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (mode === 'replace' && !confirm(t('msg.replace_confirm'))) {
            return;
        }

        setImporting(true);
        const text = await file.text();
        const result = await importDataFromJSON(text, mode);
        setImporting(false);
        setMessage(result.message);
        if (result.success) {
            refreshPlans();
            setTimeout(() => window.location.reload(), 1000);
        }
        e.target.value = '';
    };


    const handleReset = async () => {
        const confirmation = prompt(t('msg.reset_confirm') + ' ' + t('msg.reset_confirm_suffix'));
        if (confirmation === 'DELETE') {
            await clearAllData();
            window.location.reload();
        }
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
                {/* Language */}
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

                {/* Theme */}
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

                {/* Direction */}
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

                {/* Degree Settings */}
                <Card style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isEditingPlan ? '16px' : '0' }}>
                        <div>
                            <h2 style={{ fontSize: '1rem', margin: 0 }}>{t('settings.degree_name')}</h2>
                            {!isEditingPlan && (
                                <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    {currentPlan?.name} (Pass &gt; {currentPlan?.passing_exam_threshold})
                                </p>
                            )}
                        </div>
                        {!isEditingPlan && (
                            <Button variant="ghost" size="sm" onClick={() => setIsEditingPlan(true)}>
                                <Edit2 size={16} />
                            </Button>
                        )}
                    </div>

                    {isEditingPlan && (
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                            <Input
                                id="plan-name"
                                name="planName"
                                label={t('settings.degree_name')}
                                value={planName}
                                onChange={e => setPlanName(e.target.value)}
                            />
                            <Input
                                id="plan-threshold"
                                name="planThreshold"
                                label={t('settings.passing_grade')}
                                type="number"
                                value={planThreshold}
                                onChange={e => setPlanThreshold(Number(e.target.value))}
                            />
                            <div style={{ display: 'flex', gap: '8px', paddingBottom: '2px' }}>
                                <Button variant="ghost" onClick={() => setIsEditingPlan(false)} title="Cancel">
                                    <X size={20} />
                                </Button>
                                <Button onClick={handleSavePlan} title="Save">
                                    <Save size={20} />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Data Management */}
                <Card style={{ padding: '16px' }}>
                    <h2 style={{ fontSize: '1rem', marginBottom: '20px' }}>{t('settings.data_management')}</h2>

                    <div style={{ display: 'grid', gap: '24px' }}>
                        {/* Export Group */}
                        <div>
                            <h3 style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {t('settings.export_group')}
                            </h3>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <Button variant="primary" onClick={handleExportPDF} style={{ flex: '1 1 160px' }}>
                                    <FileDown size={16} style={{ marginRight: '8px' }} />
                                    {t('action.export_pdf')}
                                </Button>
                                <Button variant="secondary" onClick={handleExportJSON} style={{ flex: '1 1 160px' }}>
                                    <Download size={16} style={{ marginRight: '8px' }} />
                                    {t('action.export_json')}
                                </Button>
                            </div>
                        </div>

                        {/* Import Group */}
                        <div>
                            <h3 style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {t('settings.restore_group')}
                            </h3>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <Button variant="secondary" onClick={() => mergeInputRef.current?.click()} disabled={importing} style={{ flex: '1 1 160px' }}>
                                    <Upload size={16} style={{ marginRight: '8px' }} />
                                    {t('action.import_json')} ({t('settings.merge')})
                                </Button>
                                <Button variant="secondary" onClick={() => replaceInputRef.current?.click()} disabled={importing} style={{ flex: '1 1 160px' }}>
                                    <Upload size={16} style={{ marginRight: '8px' }} />
                                    {t('action.import_json')} ({t('settings.replace')})
                                </Button>
                                <input id="restore-merge-input" ref={mergeInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={e => handleImportJSON(e, 'merge')} />
                                <input id="restore-replace-input" ref={replaceInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={e => handleImportJSON(e, 'replace')} />
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                                <div>
                                    <h3 style={{ fontSize: '0.85rem', color: 'var(--color-danger)', fontWeight: 600, margin: 0 }}>
                                        Danger Zone
                                    </h3>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                        Irreversible actions. Be careful.
                                    </p>
                                </div>
                                <Button variant="danger" onClick={handleReset}>
                                    <Trash2 size={16} style={{ marginRight: '8px' }} />
                                    {t('action.reset_all_data')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* PDF Export */}
            </div>
        </div>
    );
};
