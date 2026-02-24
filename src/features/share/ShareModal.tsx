import React, { useState } from 'react';
import { Modal } from '@/ui/Modal';
import { Button } from '@/ui/Button';
import { useTranslation } from '@/app/i18n/useTranslation';
import {
    Copy,
    Check,
    Share2,
    MessageCircle,
    Send,
    Linkedin,
    Facebook,
    Mail,
    Twitter,
    LayoutGrid,
    ExternalLink
} from 'lucide-react';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const [isOptionsExpanded, setIsOptionsExpanded] = useState(false);

    // Detect Web Share API support
    const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

    // Use deployed URL from environment or window location with base path
    const shareUrl = import.meta.env.VITE_APP_URL || (window.location.origin + import.meta.env.BASE_URL);
    const shareText = t('share.subtitle');
    const fullMessage = `${shareText} ${shareUrl}`;

    const handleWebShare = async () => {
        if (canNativeShare) {
            try {
                await navigator.share({
                    title: t('share.title'),
                    text: shareText,
                    url: shareUrl,
                });
            } catch (err) {
                console.log('Share failed or cancelled:', err);
            }
        }
    };

    const handleCopyLink = async () => {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(shareUrl);
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = shareUrl;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const shareLinks = [
        {
            id: 'whatsapp',
            name: t('share.whatsapp'),
            icon: <MessageCircle size={20} />,
            url: `https://wa.me/?text=${encodeURIComponent(fullMessage)}`,
            color: '#25D366'
        },
        {
            id: 'telegram',
            name: t('share.telegram'),
            icon: <Send size={20} />,
            url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
            color: '#0088cc'
        },
        {
            id: 'linkedin',
            name: t('share.linkedin'),
            icon: <Linkedin size={20} />,
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
            color: '#0077b5'
        },
        {
            id: 'facebook',
            name: t('share.facebook'),
            icon: <Facebook size={20} />,
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
            color: '#1877F2'
        },
        {
            id: 'twitter',
            name: t('share.x'),
            icon: <Twitter size={20} />,
            url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
            color: '#000000'
        },
        {
            id: 'reddit',
            name: t('share.reddit'),
            icon: <LayoutGrid size={20} />,
            url: `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(t('share.title'))}`,
            color: '#FF4500'
        },
        {
            id: 'email',
            name: t('share.email'),
            icon: <Mail size={20} />,
            url: `mailto:?subject=${encodeURIComponent(t('share.title'))}&body=${encodeURIComponent(fullMessage)}`,
            color: '#EA4335'
        },
    ];

    const showPlatformOptions = !canNativeShare || isOptionsExpanded;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('share.title')}>
            <div style={{ display: 'grid', gap: '24px' }}>
                <div style={{ textAlign: 'center', padding: '0 8px' }}>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', margin: '0 0 16px 0' }}>
                        {t('share.subtitle')}
                    </p>

                    {canNativeShare && (
                        <Button
                            onClick={handleWebShare}
                            style={{ width: '100%', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                        >
                            <Share2 size={20} />
                            {t('share.primaryCta')}
                        </Button>
                    )}

                    <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: canNativeShare ? '1fr' : 'repeat(auto-fill, minmax(100px, 1fr))' }}>
                        <button
                            onClick={handleCopyLink}
                            style={{
                                display: 'flex',
                                flexDirection: canNativeShare ? 'row' : 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '12px 8px',
                                borderRadius: '12px',
                                border: '1px solid var(--color-border)',
                                backgroundColor: copied ? 'var(--color-success-bg)' : 'var(--color-bg-secondary)',
                                color: copied ? 'var(--color-success)' : 'var(--color-text-primary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                width: '100%'
                            }}
                        >
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                                {copied ? t('share.copied') : t('share.copyLink')}
                            </span>
                        </button>
                    </div>

                    {canNativeShare && (
                        <button
                            onClick={() => setIsOptionsExpanded(!isOptionsExpanded)}
                            aria-expanded={isOptionsExpanded}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-accent)',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                marginTop: '12px',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            {isOptionsExpanded ? 'Less options' : 'More options'}
                        </button>
                    )}
                </div>

                {showPlatformOptions && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                        gap: '12px',
                        animation: 'fadeIn 0.2s ease-out'
                    }}>
                        <style>{`
                            @keyframes fadeIn {
                                from { opacity: 0; transform: translateY(-5px); }
                                to { opacity: 1; transform: translateY(0); }
                            }
                        `}</style>
                        {shareLinks.map(link => (
                            <a
                                key={link.id}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 8px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--color-border)',
                                    textDecoration: 'none',
                                    color: 'var(--color-text-primary)',
                                    transition: 'all 0.2s ease',
                                    backgroundColor: 'var(--color-bg-secondary)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = link.color;
                                    e.currentTarget.style.backgroundColor = `${link.color}10`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--color-border)';
                                    e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                                }}
                            >
                                <span style={{ color: link.color }}>{link.icon}</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{link.name}</span>
                            </a>
                        ))}
                    </div>
                )}

                <div style={{ padding: '16px 0 0 0', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                            {t('share.supportTitle')}
                        </h3>
                    </div>

                    <a
                        href="https://paypal.me/OlegMagit"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            padding: '12px',
                            borderRadius: '10px',
                            backgroundColor: 'var(--color-bg-secondary)',
                            color: 'var(--color-accent)',
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            border: '1px dashed var(--color-accent)'
                        }}
                    >
                        <ExternalLink size={18} />
                        {t('share.donateSecondary')}
                    </a>
                </div>

                <Button variant="ghost" onClick={onClose} style={{ width: '100%' }}>
                    {t('share.close')}
                </Button>
            </div>
        </Modal>
    );
};
