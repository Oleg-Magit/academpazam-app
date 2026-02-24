import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTopics } from '@/core/hooks/useData';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { TopicModal } from '@/features/topics/TopicModal';
import { BulkAddTopicModal } from '@/features/topics/BulkAddTopicModal';
import type { Topic, TopicStatus, Course } from '@/core/models/types';
import { saveTopic, deleteTopic, saveCourse, initDB } from '@/core/db/db';
import { Plus, ArrowLeft, Trash2, Edit2, CheckCircle, Circle, Clock, FileText } from 'lucide-react';
import { useTranslation } from '@/app/i18n/useTranslation';
import { PASS_GRADE } from '@/core/constants/grades';
import { Input } from '@/ui/Input';

export const CourseDetails: React.FC = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [course, setCourse] = useState<Course | null>(null);
    const { topics, refresh: refreshTopics } = useTopics(id || null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
    const [gradeInput, setGradeInput] = useState<string>('');

    // Fetch course effect
    React.useEffect(() => {
        if (id) {
            initDB().then(db => db.get('courses', id)).then(c => {
                setCourse(c || null);
                setGradeInput(c?.grade?.toString() || '');
            });
        }
    }, [id]);

    const handleEditTopic = (topic: Topic) => {
        setEditingTopic(topic);
        setIsModalOpen(true);
    };

    const handleDeleteTopic = async (topic: Topic) => {
        if (confirm(t('msg.delete_topic_prompt', { title: topic.title }))) {
            await deleteTopic(topic.id);
            refreshTopics();
        }
    };

    const handleToggleStatus = async (topic: Topic) => {
        const nextStatus: TopicStatus =
            topic.status === 'not_started' ? 'in_progress' :
                topic.status === 'in_progress' ? 'done' :
                    'not_started';

        await saveTopic({ ...topic, status: nextStatus, updatedAt: Date.now() });
        refreshTopics();
    };

    const handleSave = () => {
        refreshTopics();
        setEditingTopic(null);
    };

    const handleGradeBlur = async () => {
        if (!course) return;

        // If empty, save as null
        if (gradeInput.trim() === '') {
            if (course.grade !== null && course.grade !== undefined) {
                const updated = { ...course, grade: null, updatedAt: Date.now() };
                await saveCourse(updated);
                setCourse(updated);
            }
            return;
        }

        const num = parseFloat(gradeInput);
        if (!isNaN(num) && num >= 0 && num <= 100) {
            if (course.grade !== num) {
                const updated = { ...course, grade: num, updatedAt: Date.now() };
                await saveCourse(updated);
                setCourse(updated);
            }
        } else {
            // Revert if invalid
            setGradeInput(course.grade?.toString() || '');
            alert(t('msg.grade_invalid'));
        }
    };

    if (!course) return <div>{t('msg.loading_courses')}</div>;

    const isCourseCompleted = topics.length > 0 && topics.every(t => t.status === 'done');
    // If no topics, use manual status
    const effectiveStatus = topics.length === 0 ? course.manualStatus : (isCourseCompleted ? 'completed' : 'in_progress');
    const isGradeEnabled = effectiveStatus === 'completed';

    const gradeStatus = course.grade === null || course.grade === undefined ? 'ungraded' :
        (course.grade >= PASS_GRADE ? 'passed' : 'failed');

    return (
        <div>
            <Button variant="ghost" onClick={() => navigate('/courses')} style={{ marginBottom: 'var(--space-md)' }}>
                <ArrowLeft size={16} style={{ marginRight: '8px' }} aria-hidden="true" />
                {t('action.back')}
            </Button>

            <Card style={{ marginBottom: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xs)' }}>
                            <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{course.name}</h1>
                            {course.code && <Badge>{course.code}</Badge>}
                        </div>
                        <div style={{ color: 'var(--color-text-secondary)' }}>
                            {t('label.semester')} {course.semester} • {course.credits} {t('label.credits')}
                        </div>
                        {course.notes && (
                            <div style={{ marginTop: 'var(--space-md)', fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                                {t('label.notes')}: {course.notes}
                            </div>
                        )}

                        {/* Grade Section */}
                        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '120px' }}>
                                <Input
                                    id="course-grade"
                                    name="courseGrade"
                                    label={t('label.grade')}
                                    type="number"
                                    value={gradeInput}
                                    onChange={(e) => setGradeInput(e.target.value)}
                                    onBlur={handleGradeBlur}
                                    placeholder={isGradeEnabled ? "0-100" : "-"}
                                    disabled={!isGradeEnabled}
                                />
                            </div>
                            {course.grade !== null && course.grade !== undefined && (
                                <div style={{ paddingTop: '14px' }}>
                                    <Badge variant={gradeStatus === 'passed' ? 'success' : 'error'} aria-label={t(gradeStatus === 'ungraded' ? 'label.ungraded' : `status.${gradeStatus}`)}>
                                        {t(gradeStatus === 'ungraded' ? 'label.ungraded' : `status.${gradeStatus}`)}
                                    </Badge>
                                </div>
                            )}
                            {!isGradeEnabled && (
                                <div style={{ paddingTop: '14px', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                    {t('msg.grade_help')}
                                </div>
                            )}
                        </div>

                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                        <Button variant="secondary" onClick={() => setIsBulkModalOpen(true)}>
                            <FileText size={16} style={{ marginRight: '8px' }} />
                            {t('modal.bulk_topic.title')}
                        </Button>
                        <Button onClick={() => setIsModalOpen(true)}>
                            <Plus size={16} style={{ marginRight: '8px' }} />
                            {t('modal.add_topic.title')}
                        </Button>
                    </div>
                </div>
            </Card>

            <h3>{t('nav.topics')} ({topics.length})</h3>

            {/* Topic List (omitted for brevity in replacement, but I must keep it) */}
            <div style={{ display: 'grid', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                {topics.map(topic => (
                    <Card key={topic.id} style={{ padding: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <button
                            onClick={() => handleToggleStatus(topic)}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                color: topic.status === 'done' ? 'var(--color-success)' :
                                    topic.status === 'in_progress' ? 'var(--color-warning)' : 'var(--color-border)'
                            }}
                        >
                            {topic.status === 'done' ? <CheckCircle size={24} /> :
                                topic.status === 'in_progress' ? <Clock size={24} /> :
                                    <Circle size={24} aria-hidden="true" />}
                        </button>

                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500, textDecoration: topic.status === 'done' ? 'line-through' : 'none', color: topic.status === 'done' ? 'var(--color-text-secondary)' : 'var(--color-text-primary)' }}>
                                {topic.title}
                            </div>
                            {topic.description && <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{topic.description}</div>}
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                            <Button variant="ghost" size="sm" onClick={() => handleEditTopic(topic)} aria-label={t('action.edit')}>
                                <Edit2 size={16} aria-hidden="true" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                style={{ color: 'var(--color-danger)' }}
                                onClick={() => handleDeleteTopic(topic)}
                                aria-label={t('action.delete')}
                            >
                                <Trash2 size={16} aria-hidden="true" />
                            </Button>
                        </div>
                    </Card>
                ))}

                {topics.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--color-text-secondary)' }}>
                        {t('msg.no_topics_yet')}
                    </div>
                )}
            </div>

            <TopicModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                courseId={course.id}
                topicToEdit={editingTopic}
            />

            <BulkAddTopicModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                onSave={handleSave}
                courseId={course.id}
            />
        </div>
    );
};
