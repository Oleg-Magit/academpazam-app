import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/app/i18n/useTranslation';
import { BREAKING_DATA_VERSION, APP_VERSION } from '@/core/config/version';
import { exportDataToJSON } from '@/core/services/importExport';
import { clearAllData } from '@/core/db/db';
import { Modal } from '@/ui/Modal';
import { Button } from '@/ui/Button';
import { AlertTriangle, Download, Trash2, XCircle } from 'lucide-react';

const LAST_VERSION_KEY = 'last_seen_breaking_data_version';

export const UpgradeGuard: React.FC = () => {
    const { t } = useTranslation();
    const [showModal, setShowModal] = useState(false);
    const [showReminder, setShowReminder] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        const lastVersion = localStorage.getItem(LAST_VERSION_KEY);
        const currentVersion = BREAKING_DATA_VERSION.toString();

        if (lastVersion !== currentVersion) {
            setShowModal(true);
        }
    }, []);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const blob = await exportDataToJSON();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `academpazam_backup_v${APP_VERSION}_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            alert(t('msg.saved_error'));
        } finally {
            setIsExporting(false);
        }
    };

    const handleReset = async () => {
        const confirmed = window.confirm(t('msg.reset_confirm'));
        if (!confirmed) return;

        try {
            // Clear IndexedDB
            await clearAllData();

            // Clear relevant localStorage keys
            // We only clear keys we know belong to the app
            const keysToKeep = ['i18nextLng', 'theme']; // Example of what to keep
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && !keysToKeep.includes(key) && key !== LAST_VERSION_KEY) {
                    localStorage.removeItem(key);
                }
            }

            // Update version and reload
            localStorage.setItem(LAST_VERSION_KEY, BREAKING_DATA_VERSION.toString());
            window.location.reload();
        } catch (error) {
            console.error('Reset failed:', error);
            alert(t('msg.saved_error'));
        }
    };

    const handleNotNow = () => {
        setShowModal(false);
        setShowReminder(true);
    };

    if (showReminder && !showModal) {
        return (
            <div
                onClick={() => setShowModal(true)}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 9999,
                    backgroundColor: 'var(--color-warning)',
                    color: 'var(--color-white)',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontWeight: 600,
                    maxWidth: '300px',
                    animation: 'slideIn 0.3s ease-out'
                }}
            >
                <AlertTriangle size={20} />
                <span style={{ fontSize: '0.875rem' }}>{t('upgrade.reminder')}</span>
            </div>
        );
    }

    return (
        <Modal
            isOpen={showModal}
            onClose={handleNotNow}
            title={t('upgrade.title')}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0', maxWidth: '500px' }}>
                <div style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    padding: '16px',
                    borderRadius: '12px',
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'flex-start',
                    border: '1px solid var(--color-border)'
                }}>
                    <AlertTriangle size={32} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
                            {t('upgrade.description')}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                            {t('upgrade.backup_note')}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Button
                        onClick={handleExport}
                        variant="secondary"
                        disabled={isExporting}
                        style={{ height: '48px', width: '100%' }}
                    >
                        <Download size={20} style={{ marginRight: '8px' }} />
                        {t('upgrade.action.export')}
                    </Button>

                    <Button
                        onClick={handleReset}
                        variant="danger"
                        style={{ height: '48px', width: '100%' }}
                    >
                        <Trash2 size={20} style={{ marginRight: '8px' }} />
                        {t('upgrade.action.reset')}
                    </Button>

                    <Button
                        onClick={handleNotNow}
                        variant="ghost"
                        style={{ height: '48px', width: '100%' }}
                    >
                        <XCircle size={20} style={{ marginRight: '8px' }} />
                        {t('upgrade.action.not_now')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
