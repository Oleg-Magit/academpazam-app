import React from 'react';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { Heart } from 'lucide-react';
import { useTranslation } from '@/app/i18n/useTranslation';

interface SupportBannerProps {
    onSupport: () => void;
    onMaybeLater: () => void;
    onDismissPermanently: () => void;
}

export const SupportBanner: React.FC<SupportBannerProps> = ({
    onSupport,
    onMaybeLater,
    onDismissPermanently
}) => {
    const { t } = useTranslation();

    return (
        <Card style={{
            padding: 'var(--space-md) var(--space-lg)',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(31, 41, 55, 0.4) 100%)',
            border: '1px solid rgba(37, 99, 235, 0.2)',
            marginBottom: 'var(--space-md)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                flexWrap: 'wrap',
                position: 'relative',
                zIndex: 2
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    backgroundColor: 'rgba(37, 99, 235, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-accent)',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}>
                    <Heart size={24} fill="currentColor" fillOpacity={0.2} />
                </div>

                <div style={{ flex: 1, minWidth: '280px' }}>
                    <h3 style={{
                        margin: '0 0 4px 0',
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        color: 'var(--color-text-primary)'
                    }}>
                        {t('support.title')}
                    </h3>
                    <p style={{
                        margin: 0,
                        fontSize: '0.9rem',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.5,
                        maxWidth: '600px'
                    }}>
                        {t('support.mission')}
                    </p>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                }}>
                    <Button variant="primary" size="sm" onClick={onSupport}>
                        {t('support.action_primary')}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={onMaybeLater}>
                        {t('support.action_later')}
                    </Button>
                    <button 
                        onClick={onDismissPermanently}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-text-secondary)',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            textDecoration: 'underline',
                            opacity: 0.7,
                            transition: 'opacity 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseOut={(e) => e.currentTarget.style.opacity = '0.7'}
                    >
                        {t('support.action_dismiss')}
                    </button>
                </div>
            </div>
            
            {/* Soft decorative glow */}
            <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-10%',
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(37, 99, 235, 0.05) 0%, transparent 70%)',
                pointerEvents: 'none',
                zIndex: 1
            }} />
        </Card>
    );
};
