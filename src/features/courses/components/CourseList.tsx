import React from 'react';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { Edit2, Trash2, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/app/i18n/useTranslation';
import type { CourseWithTopics } from '@/core/models/types';

interface CourseListProps {
    courses: CourseWithTopics[];
    onEdit: (course: CourseWithTopics) => void;
    onDelete: (course: CourseWithTopics) => void;
    onNavigate: (courseId: string) => void;
    showSemesterLabel?: boolean;
    semesterLabels?: Record<string, string>;
    isMobile?: boolean;
}

export const CourseList: React.FC<CourseListProps> = ({
    courses,
    onEdit,
    onDelete,
    onNavigate,
    showSemesterLabel,
    semesterLabels,
    isMobile = false
}) => {
    const { t } = useTranslation();

    if (courses.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                {t('label.no_courses_found')}
            </div>
        );
    }

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
            padding: '4px'
        }}>
            {courses.map(course => (
                <Card
                    key={course.id}
                    onClick={() => onNavigate(course.id)}
                    style={{
                        padding: isMobile ? '20px' : '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        position: 'relative',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        border: '1px solid var(--color-border)',
                        minHeight: isMobile ? '140px' : 'auto'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontSize: isMobile ? '0.85rem' : '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>
                                {course.code && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(course.code) && course.code.length < 25 ? course.code : ''}
                            </div>
                            <h3 style={{
                                margin: 0,
                                fontSize: isMobile ? '1.1rem' : '1rem',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {course.name}
                            </h3>
                            {showSemesterLabel && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)', marginTop: '2px', fontWeight: 500 }}>
                                    {semesterLabels?.[course.semesterId] || t('label.semester')}
                                </div>
                            )}
                        </div>
                        <Badge variant={course.effectiveStatus === 'completed' ? 'success' : course.effectiveStatus === 'in_progress' ? 'warning' : 'neutral'}>
                            {t(`status.${course.effectiveStatus}`)}
                        </Badge>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                        <div style={{ fontSize: isMobile ? '0.95rem' : '0.85rem', color: 'var(--color-text-secondary)' }}>
                            {course.credits} {t('label.credits')}
                            {course.grade !== null && course.grade !== undefined && (
                                <span style={{ marginLeft: '8px', color: 'var(--color-accent)', fontWeight: 600 }}>
                                    · {course.grade}
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Button
                                variant="ghost"
                                size={isMobile ? 'md' : 'sm'}
                                style={{ padding: isMobile ? '8px' : '4px' }}
                                onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    onEdit(course);
                                }}
                                aria-label={t('action.edit')}
                            >
                                <Edit2 size={isMobile ? 20 : 16} />
                            </Button>
                            <Button
                                variant="ghost"
                                size={isMobile ? 'md' : 'sm'}
                                style={{ padding: isMobile ? '8px' : '4px', color: 'var(--color-danger)' }}
                                onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    onDelete(course);
                                }}
                                aria-label={t('action.delete')}
                            >
                                <Trash2 size={isMobile ? 20 : 16} />
                            </Button>
                            <div style={{ marginLeft: '4px', opacity: 0.5, display: 'flex', alignItems: 'center' }}>
                                <ChevronRight size={isMobile ? 22 : 18} />
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
};
