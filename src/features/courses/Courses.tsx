import React, { useState, useMemo } from 'react';
import { usePlans, useCourses } from '@/core/hooks/useData';
import { deleteCourse } from '@/core/db/db';
import { CourseModal } from './CourseModal';
import { BulkAddCourseModal } from './BulkAddCourseModal';
import { DeleteSemesterModal } from './DeleteSemesterModal';
import { ConfirmationModal } from '@/ui/ConfirmationModal';
import { useTranslation } from '@/app/i18n/useTranslation';
import { useNavigate } from 'react-router-dom';
import type { Course, CourseWithTopics } from '@/core/models/types';

// Sub-components
import { SemesterNavigation } from './components/SemesterNavigation';
import { CoursesToolbar } from './components/CoursesToolbar';
import { CourseList } from './components/CourseList';

// Hooks
import { useSemesterManagement } from './hooks/useSemesterManagement';

export const Courses: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { plans } = usePlans();
    const currentPlan = plans[0];
    const { courses, loading, refresh } = useCourses(currentPlan?.id || null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<CourseWithTopics | null>(null);
    const [selectedSemester, setSelectedSemester] = useState<string>('1');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

    const {
        semesterConfig,
        bySemester,
        editingSemesterId,
        setEditingSemesterId,
        tempLabel,
        setTempLabel,
        deleteModalOpen,
        setDeleteModalOpen,
        semesterToDelete,
        errorMsg,
        handleAddSemester,
        startRenaming,
        saveRename,
        promptDeleteSemester,
        confirmDeleteSemester
    } = useSemesterManagement(courses, refresh);

    const isSearching = searchTerm.trim() !== '' || statusFilter !== 'all';

    const displayedCourses = useMemo(() => {
        const filterFn = (c: CourseWithTopics) => {
            const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.code && c.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (c.topics && c.topics.some(t => t.title.toLowerCase().includes(searchTerm.toLowerCase())));

            const matchesStatus = statusFilter === 'all' || c.effectiveStatus === statusFilter;
            return matchesSearch && matchesStatus;
        };

        if (isSearching) {
            return courses.filter(filterFn);
        } else {
            const group = bySemester.find(g => g.semester === selectedSemester);
            if (!group) return [];
            return group.courses.filter(filterFn);
        }
    }, [bySemester, courses, selectedSemester, searchTerm, statusFilter, isSearching]);

    const semesterLabels = useMemo(() => {
        const labels: Record<string, string> = {};
        bySemester.forEach(g => {
            if (g.semester) {
                (labels as any)[g.semester] = g.label;
            }
        });
        return labels;
    }, [bySemester]);

    const handleEdit = (course: CourseWithTopics) => {
        setEditingCourse(course);
        setIsModalOpen(true);
    };

    const handleDelete = (course: Course) => {
        setCourseToDelete(course);
    };

    const confirmCourseDelete = async () => {
        if (!courseToDelete) return;
        await deleteCourse(courseToDelete.id);
        setCourseToDelete(null);
        refresh();
    };

    const handleSave = () => {
        refresh();
        setEditingCourse(null);
    };

    if (!currentPlan) return <div>{t('msg.no_plan_found')}</div>;
    if (loading) return <div>{t('msg.loading_courses')}</div>;

    return (
        <div style={{ display: 'flex', gap: 'var(--space-lg)', height: 'calc(100vh - 100px)', overflow: 'hidden' }}>
            <SemesterNavigation
                bySemester={bySemester}
                selectedSemester={selectedSemester}
                onSelectSemester={setSelectedSemester}
                editingSemesterId={editingSemesterId}
                setEditingSemesterId={setEditingSemesterId}
                tempLabel={tempLabel}
                setTempLabel={setTempLabel}
                onAddSemester={async () => {
                    const nextId = await handleAddSemester();
                    setSelectedSemester(nextId);
                }}
                onStartRenaming={startRenaming}
                onSaveRename={saveRename}
                onPromptDelete={promptDeleteSemester}
                semesterCount={semesterConfig.count}
            />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', overflow: 'hidden' }}>
                <CoursesToolbar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    onAddCourse={() => setIsModalOpen(true)}
                    onBulkAdd={() => setIsBulkModalOpen(true)}
                />

                <div style={{ overflowY: 'auto', paddingRight: '4px', paddingBottom: '32px' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>
                            {isSearching ? t('label.search_results') :
                                (bySemester.find(s => s.semester === selectedSemester)?.label || `${t('label.semester')} ${selectedSemester}`)}
                        </h1>
                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                            {displayedCourses.length} {t('label.courses_found')}
                        </span>
                    </div>

                    <CourseList
                        courses={displayedCourses}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onNavigate={(id) => navigate(`/courses/${id}`)}
                        showSemesterLabel={isSearching}
                        semesterLabels={semesterLabels}
                    />
                </div>
            </div>

            <CourseModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingCourse(null);
                }}
                onSave={handleSave}
                planId={currentPlan.id}
                courseToEdit={editingCourse}
                initialData={!editingCourse ? { semester: selectedSemester, name: '', credits: 3 } : undefined}
                semesterConfig={semesterConfig}
            />

            <BulkAddCourseModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                onSave={handleSave}
                planId={currentPlan.id}
                semesterConfig={semesterConfig}
            />

            {semesterToDelete && (
                <DeleteSemesterModal
                    isOpen={deleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    semesterId={semesterToDelete.id}
                    semesterLabel={semesterToDelete.label}
                    courses={courses.filter(c => c.semester === semesterToDelete.id)}
                    totalSemesters={semesterConfig.count}
                    onDelete={confirmDeleteSemester}
                />
            )}

            {courseToDelete && (
                <ConfirmationModal
                    isOpen={!!courseToDelete}
                    onClose={() => setCourseToDelete(null)}
                    onConfirm={confirmCourseDelete}
                    title={t('action.delete')}
                    message={t('msg.delete_course_prompt', { name: courseToDelete.name })}
                    variant="danger"
                    confirmLabel={t('action.delete')}
                />
            )}

            {errorMsg && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'var(--color-danger)',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    zIndex: 1000
                }}>
                    {errorMsg}
                </div>
            )}
        </div>
    );
};
