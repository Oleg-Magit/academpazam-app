import React, { useEffect, useRef } from 'react';
import type { SemesterGroup } from '@/core/models/types';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { useTranslation } from '@/app/i18n/useTranslation';
import { X, Info } from 'lucide-react';
import { Button } from '@/ui/Button';
import { Link } from 'react-router-dom';

interface SemesterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    semesterGroup: SemesterGroup | null;
}

export const SemesterDrawer: React.FC<SemesterDrawerProps> = ({
    isOpen,
    onClose,
    semesterGroup
}) => {
    const { t } = useTranslation();
    const drawerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (drawerRef.current && !drawerRef.current.contains(event.target as Node) && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!semesterGroup) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            pointerEvents: isOpen ? 'auto' : 'none',
        }}>
            {/* Backdrop */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                opacity: isOpen ? 1 : 0,
                transition: 'opacity 0.3s ease',
            }} />

            {/* Drawer Panel */}
            <div ref={drawerRef} style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                maxWidth: '450px',
                backgroundColor: 'var(--color-bg-primary)',
                boxShadow: '-4px 0 16px rgba(0,0,0,0.1)',
                transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                // Responsive override for mobile to come from bottom could be done via clean CSS classes or media query hook
                // For simplicity here keeping right-side for all or adding basic JS detection?
                // Request said: "Mobile: Drawer slides from bottom. Desktop: Drawer slides from right."
                // Since we are inline styles, we need a media query or a hook.
                // Using a CSS class is better for this.
            }} className="drawer-panel">

                {/* Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ margin: 0 }}>{semesterGroup.label || `${t('label.semester')} ${semesterGroup.semester}`}</h2>
                    <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
                        <X size={24} />
                    </Button>
                </div>

                {/* Content */}
                <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{
                            display: 'flex',
                            gap: '16px',
                            marginBottom: '24px',
                            padding: '16px',
                            backgroundColor: 'var(--color-bg-secondary)',
                            borderRadius: '8px'
                        }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t('label.total_credits')}</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{semesterGroup.totalCredits}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t('label.completed')}</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-success)' }}>{semesterGroup.completedCredits}</div>
                            </div>
                        </div>

                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {semesterGroup.courses.map(course => (
                                <li key={course.id}>
                                    <Card style={{ padding: 'var(--space-md)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)' }}>{course.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{course.code || '-'}</div>
                                            </div>
                                            <Badge variant={
                                                course.effectiveStatus === 'completed' ? 'success' :
                                                    course.effectiveStatus === 'in_progress' ? 'warning' : 'neutral'
                                            }>
                                                {t(`status.${course.effectiveStatus}`)}
                                            </Badge>
                                        </div>

                                        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontSize: '0.85rem' }}>
                                                {t('label.credits')}: <b style={{ color: 'var(--color-text-primary)' }}>{course.credits}</b>
                                            </div>
                                            <Link to={`/courses/${course.id}`} style={{ textDecoration: 'none' }}>
                                                <Button variant="ghost" size="sm" style={{ height: '24px', fontSize: '0.75rem' }}>
                                                    {t('action.edit')}
                                                </Button>
                                            </Link>
                                        </div>

                                        {course.topics.length === 0 && (
                                            <div style={{
                                                marginTop: '12px',
                                                padding: '8px 12px',
                                                backgroundColor: 'var(--color-bg-secondary)',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                color: 'var(--color-accent)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                border: '1px dashed var(--color-accent)'
                                            }}>
                                                <Info size={14} />
                                                <span>{t('msg.add_topics_hint')}</span>
                                            </div>
                                        )}
                                    </Card>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Sheet Style Overrides */}
            <style>{`
                @media (max-width: 768px) {
                    .drawer-panel {
                        top: auto !important;
                        bottom: 0 !important;
                        left: 0 !important;
                        right: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        height: 80vh !important;
                        border-radius: 16px 16px 0 0;
                        transform: ${isOpen ? 'translateY(0)' : 'translateY(100%)'} !important;
                    }
                }
            `}</style>
        </div>
    );
};
