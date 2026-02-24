import React, { useState, useEffect } from 'react';
import { usePlans, useCourses } from '@/core/hooks/useData';
import { groupCoursesBySemester } from '@/core/services/dataService';
import { getSemesterConfig, saveSemesterConfig, saveCourse } from '@/core/db/db';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { CourseModal } from './CourseModal';
import type { Course } from '@/core/models/types';
import { deleteCourse } from '@/core/db/db';
import { BulkAddCourseModal } from './BulkAddCourseModal';
import { Plus, Edit2, Trash2, ChevronRight, FileText, Search, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { DeleteSemesterModal } from './DeleteSemesterModal';
import { useTranslation } from '@/app/i18n/useTranslation';

export const Courses: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { plans } = usePlans();
    const currentPlan = plans[0];
    const { courses, loading, refresh } = useCourses(currentPlan?.id || null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [selectedSemester, setSelectedSemester] = useState<string>('1');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [semesterConfig, setSemesterConfig] = useState<{ count: number, labels: string[] }>({ count: 8, labels: [] });
    const [editingSemesterId, setEditingSemesterId] = useState<string | null>(null);
    const [tempLabel, setTempLabel] = useState('');

    // Delete Semester
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [semesterToDelete, setSemesterToDelete] = useState<{ id: string, label: string } | null>(null);

    useEffect(() => {
        const loadConfig = async () => {
            const config = await getSemesterConfig();
            setSemesterConfig(config);
        };
        loadConfig();
    }, []);

    const handleAddSemester = async () => {
        const newCount = semesterConfig.count + 1;
        const newLabels = [...semesterConfig.labels];
        await saveSemesterConfig(newCount, newLabels);
        setSemesterConfig({ count: newCount, labels: newLabels });
        setSelectedSemester(newCount.toString());
    };

    const startRenaming = (e: React.MouseEvent, sem: string, currentLabel: string) => {
        e.stopPropagation();
        setEditingSemesterId(sem);
        setTempLabel(currentLabel);
    };

    const saveRename = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!editingSemesterId) return;

        const semIndex = parseInt(editingSemesterId) - 1;
        if (semIndex >= 0) {
            const newLabels = [...semesterConfig.labels];
            while (newLabels.length <= semIndex) newLabels.push('');

            newLabels[semIndex] = tempLabel;

            await saveSemesterConfig(semesterConfig.count, newLabels);
            setSemesterConfig({ ...semesterConfig, labels: newLabels });
        }
        setEditingSemesterId(null);
    };

    const promptDeleteSemester = (e: React.MouseEvent, semId: string, label: string) => {
        e.stopPropagation();
        if (semesterConfig.count <= 1) {
            alert(t('msg.cannot_delete_only_semester') || "Cannot delete the only semester.");
            return;
        }
        setSemesterToDelete({ id: semId, label });
        setDeleteModalOpen(true);
    };

    const confirmDeleteSemester = async (targetId: string | null) => {
        if (!semesterToDelete) return;

        const deleteId = semesterToDelete.id;
        const deleteIndex = parseInt(deleteId);

        // 1. Migrate courses if needed
        if (targetId) {
            let actualTarget = targetId;
            if (targetId === 'prev') {
                actualTarget = (deleteIndex - 1).toString();
            }

            const group = bySemester.find(g => g.semester === deleteId);
            if (group && group.courses.length > 0) {
                // Update all courses
                await Promise.all(group.courses.map(c =>
                    saveCourse({ ...c, semester: actualTarget, updatedAt: Date.now() })
                ));
            }
        }

        // 2. Shift down all courses in semesters > deleteIndex
        const higherSemCourses = courses.filter(c => {
            const s = parseInt(c.semester);
            return !isNaN(s) && s > deleteIndex;
        });

        if (higherSemCourses.length > 0) {
            await Promise.all(higherSemCourses.map(c => {
                const currentS = parseInt(c.semester);
                return saveCourse({ ...c, semester: (currentS - 1).toString(), updatedAt: Date.now() });
            }));
        }

        // 3. Update Meta
        const newLabels = [...semesterConfig.labels];
        if (deleteIndex - 1 < newLabels.length) {
            newLabels.splice(deleteIndex - 1, 1);
        }
        const newCount = semesterConfig.count - 1;

        await saveSemesterConfig(newCount, newLabels);
        setSemesterConfig({ count: newCount, labels: newLabels });

        refresh();
        setDeleteModalOpen(false);
        setSemesterToDelete(null);
    };

    const handleEdit = (course: Course) => {
        setEditingCourse(course);
        setIsModalOpen(true);
    };

    const handleDelete = async (course: Course) => {
        if (confirm(t('msg.delete_course_prompt', { name: course.name }))) {
            await deleteCourse(course.id);
            refresh();
        }
    };

    const handleSave = () => {
        refresh();
        setEditingCourse(null);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingCourse(null);
    };

    const bySemester = React.useMemo(() => {
        if (!currentPlan) return [];
        return groupCoursesBySemester(courses, semesterConfig);
    }, [courses, semesterConfig, currentPlan]);

    const displayedCourses = React.useMemo(() => {
        const group = bySemester.find(g => g.semester === selectedSemester);
        if (!group) return [];
        return group.courses.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.code && c.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (c.topics && c.topics.some(t => t.title.toLowerCase().includes(searchTerm.toLowerCase())));

            const matchesStatus = statusFilter === 'all' || c.effectiveStatus === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [bySemester, selectedSemester, searchTerm, statusFilter]);

    if (!currentPlan) return <div>{t('msg.no_plan_found') || 'No plan found.'}</div>;
    if (loading) return <div>{t('msg.loading_courses') || 'Loading courses...'}</div>;

    return (
        <div style={{ display: 'flex', gap: 'var(--space-lg)', height: 'calc(100vh - 100px)', overflow: 'hidden' }}>
            <div style={{
                width: '240px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                overflowY: 'auto',
                paddingRight: '8px',
                borderRight: '1px solid var(--color-border)'
            }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', paddingLeft: '8px' }}>{t('label.semesters') || 'Semesters'}</h2>
                {bySemester.map(sem => (
                    <div
                        key={sem.semester}
                        onClick={() => setSelectedSemester(sem.semester)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            backgroundColor: selectedSemester === sem.semester ? 'var(--color-bg-secondary)' : 'transparent',
                            border: selectedSemester === sem.semester ? '1px solid var(--color-border)' : '1px solid transparent',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s ease',
                            minHeight: '42px',
                            position: 'relative'
                        }}
                        className="semester-row"
                    >
                        {editingSemesterId === sem.semester ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }} onClick={e => e.stopPropagation()}>
                                <input
                                    id={`rename-semester-${sem.semester}`}
                                    name={`renameSemester-${sem.semester}`}
                                    value={tempLabel}
                                    onChange={e => setTempLabel(e.target.value)}
                                    // eslint-disable-next-line jsx-a11y/no-autofocus
                                    autoFocus
                                    aria-label={`Rename semester ${sem.semester}`}
                                    style={{
                                        width: '100%',
                                        padding: '4px',
                                        borderRadius: '4px',
                                        border: '1px solid var(--color-accent)',
                                        fontSize: '0.9rem',
                                        backgroundColor: 'var(--color-bg-primary)',
                                        color: 'var(--color-text-primary)'
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') saveRename();
                                        if (e.key === 'Escape') setEditingSemesterId(null);
                                    }}
                                />
                                <Button size="sm" variant="ghost" onClick={() => saveRename()} style={{ padding: '4px' }}>
                                    <Save size={14} />
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
                                    <span style={{ fontWeight: selectedSemester === sem.semester ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {sem.label || `${t('label.semester')} ${sem.semester}`}
                                    </span>
                                    {selectedSemester === sem.semester && (
                                        <div style={{ display: 'flex', gap: '2px' }}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                style={{ padding: '2px', height: 'auto' }}
                                                onClick={(e) => startRenaming(e, sem.semester, sem.label || `${t('label.semester')} ${sem.semester}`)}
                                            >
                                                <Edit2 size={12} style={{ opacity: 0.7 }} />
                                            </Button>

                                            {semesterConfig.count > 1 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    style={{ padding: '2px', height: 'auto', color: 'var(--color-danger)' }}
                                                    onClick={(e) => promptDeleteSemester(e, sem.semester, sem.label || `${t('label.semester')} ${sem.semester}`)}
                                                >
                                                    <Trash2 size={12} style={{ opacity: 0.7 }} />
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    {(sem.courses.length > 0) && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-primary)', padding: '2px 6px', borderRadius: '10px' }}>
                                            {sem.courses.length}
                                        </span>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                ))}

                <Button variant="ghost" onClick={handleAddSemester} style={{ marginTop: '8px', justifyContent: 'flex-start' }}>
                    <Plus size={16} style={{ marginRight: '8px' }} />
                    {t('action.add_semester') || 'Add Semester'}
                </Button>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>
                            {bySemester.find(s => s.semester === selectedSemester)?.label || `${t('label.semester')} ${selectedSemester}`}
                        </h1>
                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                            {displayedCourses.length} {t('label.courses_found') || 'courses found'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ position: 'relative', width: '250px' }}>
                            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                            <input
                                id="courses-search-input"
                                name="searchCourses"
                                placeholder={t('label.search_placeholder')}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 8px 8px 36px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--color-border)',
                                    backgroundColor: 'var(--color-bg-secondary)',
                                    color: 'var(--color-text-primary)'
                                }}
                                aria-label={t('label.search_placeholder')}
                                autoComplete="off"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            style={{
                                padding: '8px',
                                borderRadius: '6px',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-bg-secondary)',
                                color: 'var(--color-text-primary)',
                                fontSize: '0.9rem',
                                cursor: 'pointer'
                            }}
                            aria-label={t('label.filter_status')}
                        >
                            <option value="all">{t('status.all')}</option>
                            <option value="not_started">{t('status.not_started')}</option>
                            <option value="in_progress">{t('status.in_progress')}</option>
                            <option value="completed">{t('status.completed')}</option>
                            <option value="failed">{t('status.failed')}</option>
                        </select>
                        <Button variant="secondary" onClick={() => setIsBulkModalOpen(true)}>
                            <FileText size={16} />
                        </Button>
                        <Button onClick={() => setIsModalOpen(true)}>
                            <Plus size={16} style={{ marginRight: '8px' }} />
                            {t('dashboard.add_course')}
                        </Button>
                    </div>
                </div>

                <div style={{ overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '32px' }}>
                    {displayedCourses.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '12px' }}>
                            <p>{t('label.no_courses_in_semester')} {selectedSemester}.</p>
                            <Button variant="ghost" onClick={() => setIsModalOpen(true)} style={{ marginTop: '16px' }}>
                                + {t('action.add_course_manually') || 'Add Course manually'}
                            </Button>
                        </div>
                    ) : (
                        displayedCourses.map(course => (
                            <Card
                                key={course.id}
                                style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s', cursor: 'pointer' }}
                                className="course-row"
                                onClick={() => navigate(`/courses/${course.id}`)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                                    <div style={{
                                        width: '40px', height: '40px',
                                        borderRadius: '8px',
                                        backgroundColor: 'var(--color-bg-secondary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700,
                                        color: 'var(--color-accent)'
                                    }}>
                                        {course.credits}
                                    </div>
                                    <div>
                                        <Link to={`/courses/${course.id}`} style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-text-primary)', textDecoration: 'none' }}>
                                            {course.name}
                                        </Link>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                            {course.code && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-secondary)', padding: '1px 6px', borderRadius: '4px' }}>{course.code}</span>}
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{course.topics?.length || 0} {t('nav.topics')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <Badge variant={
                                        course.effectiveStatus === 'completed' ? 'success' :
                                            course.effectiveStatus === 'in_progress' ? 'warning' : 'neutral'
                                    }>
                                        {t(`status.${course.effectiveStatus}`) || course.effectiveStatus}
                                    </Badge>

                                    <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(course)} aria-label={t('action.edit')}>
                                            <Edit2 size={16} aria-hidden="true" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            style={{ color: 'var(--color-danger)' }}
                                            onClick={() => handleDelete(course)}
                                            aria-label={t('action.delete')}
                                        >
                                            <Trash2 size={16} aria-hidden="true" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => navigate(`/courses/${course.id}`)}>
                                            <ChevronRight size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            <CourseModal
                isOpen={isModalOpen}
                onClose={handleClose}
                onSave={handleSave}
                planId={currentPlan.id}
                courseToEdit={editingCourse}
                initialData={!editingCourse ? { semester: selectedSemester, name: '', credits: 3 } : undefined}
            />

            <BulkAddCourseModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                onSave={handleSave}
                planId={currentPlan.id}
            />

            {
                semesterToDelete && (
                    <DeleteSemesterModal
                        isOpen={deleteModalOpen}
                        onClose={() => setDeleteModalOpen(false)}
                        semesterId={semesterToDelete.id}
                        semesterLabel={semesterToDelete.label}
                        courses={courses.filter(c => c.semester === semesterToDelete.id)}
                        totalSemesters={semesterConfig.count}
                        onDelete={confirmDeleteSemester}
                    />
                )
            }
        </div >
    );
};
