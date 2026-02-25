import React, { useRef, useState } from 'react';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { Download, Upload, Trash2, FileDown } from 'lucide-react';
import { useTranslation } from '@/app/i18n/useTranslation';
import { exportDataToJSON, importDataFromJSON } from '@/core/services/importExport';
import { clearAllData } from '@/core/db/db';
import { generateDegreePDF } from '@/core/services/pdfGenerator';
import { ConfirmationModal } from '@/ui/ConfirmationModal';
import type { Plan, CourseWithTopics } from '@/core/models/types';
import type { Language } from '@/app/i18n';

interface DataSettingsProps {
    plan: Plan | undefined;
    courses: CourseWithTopics[] | null;
    onRefresh: () => void;
    onMessage: (msg: string) => void;
    language: Language;
}

export const DataSettings: React.FC<DataSettingsProps> = ({ plan, courses, onRefresh, onMessage, language }) => {
    const { t } = useTranslation();
    const [importing, setImporting] = useState(false);
    const [pendingReplace, setPendingReplace] = useState<File | null>(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const mergeInputRef = useRef<HTMLInputElement>(null);
    const replaceInputRef = useRef<HTMLInputElement>(null);

    const handleExportPDF = async () => {
        if (!plan || !courses) return;
        try {
            const pdfBytes = await generateDegreePDF(plan.name, courses, language);
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${plan.name}-Progress.pdf`;
            a.click();
            URL.revokeObjectURL(url);
            onMessage(t('msg.saved_success'));
        } catch (e) {
            console.error(e);
            onMessage(t('msg.pdf_export_failed'));
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
            onMessage(t('msg.export_success'));
        } catch (e) {
            console.error(e);
            onMessage(t('msg.export_failed'));
        }
    };

    const performImport = async (file: File, mode: 'replace' | 'merge') => {
        try {
            setImporting(true);
            const text = await file.text();
            const result = await importDataFromJSON(text, mode);
            setImporting(false);
            onMessage(result.message);
            if (result.success) {
                onRefresh();
                setTimeout(() => window.location.reload(), 1000);
            }
        } catch (e) {
            console.error(e);
            onMessage(t('msg.saved_error'));
            setImporting(false);
        } finally {
            setPendingReplace(null);
        }
    };

    const handleImportClick = (e: React.ChangeEvent<HTMLInputElement>, mode: 'replace' | 'merge') => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (mode === 'replace') {
            setPendingReplace(file);
        } else {
            performImport(file, mode);
        }
        e.target.value = '';
    };

    const confirmReset = async () => {
        await clearAllData();
        window.location.reload();
    };

    return (
        <>
            <Card style={{ padding: '16px' }}>
                <h2 style={{ fontSize: '1rem', marginBottom: '20px' }}>{t('settings.data_management')}</h2>

                <div style={{ display: 'grid', gap: '24px' }}>
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
                            <input ref={mergeInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={e => handleImportClick(e, 'merge')} />
                            <input ref={replaceInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={e => handleImportClick(e, 'replace')} />
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                            <div>
                                <h3 style={{ fontSize: '0.85rem', color: 'var(--color-danger)', fontWeight: 600, margin: 0 }}>Danger Zone</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Irreversible actions. Be careful.</p>
                            </div>
                            <Button variant="danger" onClick={() => setShowResetConfirm(true)}>
                                <Trash2 size={16} style={{ marginRight: '8px' }} />
                                {t('action.reset_all_data')}
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            <ConfirmationModal
                isOpen={!!pendingReplace}
                onClose={() => setPendingReplace(null)}
                onConfirm={() => pendingReplace && performImport(pendingReplace, 'replace')}
                title={t('settings.replace')}
                message={t('msg.replace_confirm')}
                variant="danger"
            />

            <ConfirmationModal
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                onConfirm={confirmReset}
                title={t('action.reset_data')}
                message={t('msg.reset_confirm')}
                variant="danger"
                confirmLabel={t('action.delete')}
            />
        </>
    );
};
