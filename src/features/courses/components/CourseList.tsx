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
}

export const CourseList: React.FC<CourseListProps> = ({
    courses,
    onEdit,
    onDelete,
    onNavigate
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
            padding: '4px'
        }}>
            {courses.map(course => (
                <Card
                    key={course.id}
                    onClick={() => onNavigate(course.id)}
                    style={{
                        padding: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        position: 'relative',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        border: '1px solid var(--color-border)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>
                                {course.code}
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {course.name}
                            </h3>
                        </div>
                        <Badge variant={course.effectiveStatus === 'completed' ? 'success' : course.effectiveStatus === 'in_progress' ? 'warning' : 'neutral'}>
                            {t(`status.${course.effectiveStatus}`)}
                        </Badge>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                            {course.credits} {t('label.credits')}
                            {course.grade !== null && course.grade !== undefined && (
                                <span style={{ marginLeft: '8px', color: 'var(--color-accent)', fontWeight: 600 }}>
                                    · {course.grade}
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <Button
                                variant="ghost"
                                size="sm"
                                style={{ padding: '4px' }}
                                onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    onEdit(course);
                                }}
                            >
                                <Edit2 size={16} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                style={{ padding: '4px', color: 'var(--color-danger)' }}
                                onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    onDelete(course);
                                }}
                            >
                                <Trash2 size={16} />
                            </Button>
                            <div style={{ marginLeft: '4px', opacity: 0.5 }}>
                                <ChevronRight size={18} />
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
};
