import React, { useState, useMemo, useEffect } from 'react';
import { usePlans, useCourses, useSemesters } from '@/core/hooks/useData';
import { deleteCourse } from '@/core/db/db';
import { CourseModal } from './CourseModal';
import { BulkAddCourseModal } from './BulkAddCourseModal';
import { DeleteSemesterModal } from './DeleteSemesterModal';
import { ConfirmationModal } from '@/ui/ConfirmationModal';
import { useTranslation } from '@/app/i18n/useTranslation';
import { useNavigate } from 'react-router-dom';
import { useMediaQuery } from '@/core/hooks/useMediaQuery';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/ui/Button';
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
    const { courses, loading: coursesLoading, refresh: refreshCourses } = useCourses(currentPlan?.id || null);
    const { semesters, loading: semestersLoading, refresh: refreshSemesters } = useSemesters();

    const refresh = () => {
        refreshCourses();
        refreshSemesters();
    };

    const isMobile = useMediaQuery('(max-width: 768px)');
    const [mobileView, setMobileView] = useState<'list' | 'details'>('list');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<CourseWithTopics | null>(null);
    const [selectedSemester, setSelectedSemester] = useState<string>('');
    useEffect(() => {
        if (semesters.length > 0 && !selectedSemester) {
            setSelectedSemester(semesters[0].id);
        }
    }, [semesters, selectedSemester]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

    const {
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
        confirmDeleteSemester,
        handleReorder
    } = useSemesterManagement(courses, semesters, refresh);

    // Sync mobileView with selectedSemester
    useEffect(() => {
        if (isMobile && selectedSemester && mobileView === 'list') {
            // Only auto-switch to details if we are actually selecting something (not just initial mount)
            // But requirement says: "If selectedSemesterId exists, mobile should start at Step B"
            setMobileView('details');
        }
    }, [selectedSemester, isMobile]);

    const isFiltering = searchTerm.trim() !== '' || statusFilter !== 'all';

    const displayedCourses = useMemo(() => {
        const filterFn = (c: CourseWithTopics) => {
            const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.code && c.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (c.topics && c.topics.some(t => t.title.toLowerCase().includes(searchTerm.toLowerCase())));

            const matchesStatus = statusFilter === 'all' || c.effectiveStatus === statusFilter;
            return matchesSearch && matchesStatus;
        };

        if (isFiltering) {
            // FIXED: Global search across all semesters
            return courses.filter(filterFn);
        } else {
            const group = bySemester.find(g => g.semesterId === selectedSemester);
            if (!group) return [];
            return group.courses.filter(filterFn);
        }
    }, [bySemester, courses, selectedSemester, searchTerm, statusFilter, isFiltering]);

    const semesterLabels = useMemo(() => {
        const labels: Record<string, string> = {};
        semesters.forEach(s => {
            labels[s.id] = s.name;
        });
        return labels;
    }, [semesters]);

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

    const handleSelectSemester = (semId: string) => {
        setSelectedSemester(semId);
        if (isMobile) {
            setMobileView('details');
        }
    };

    if (!currentPlan) return <div>{t('msg.no_plan_found')}</div>;
    if (coursesLoading || semestersLoading) return <div>{t('msg.loading_courses')}</div>;

    const renderSemesterNav = () => (
        <SemesterNavigation
            bySemester={bySemester}
            selectedSemester={selectedSemester}
            onSelectSemester={handleSelectSemester}
            editingSemesterId={editingSemesterId}
            setEditingSemesterId={setEditingSemesterId}
            tempLabel={tempLabel}
            setTempLabel={setTempLabel}
            onAddSemester={async () => {
                const nextId = await handleAddSemester();
                handleSelectSemester(nextId);
            }}
            onStartRenaming={startRenaming}
            onSaveRename={saveRename}
            onPromptDelete={promptDeleteSemester}
            onReorder={handleReorder}
            semesters={semesters}
            isMobile={isMobile}
        />
    );

    const renderCourseContent = () => (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', overflow: 'hidden' }}>
            {isMobile && mobileView === 'details' && !isFiltering && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Button variant="ghost" size="sm" onClick={() => setMobileView('list')} style={{ padding: '4px' }}>
                        <ChevronLeft size={20} />
                        {t('action.back')}
                    </Button>
                </div>
            )}

            <CoursesToolbar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                onAddCourse={() => setIsModalOpen(true)}
                onBulkAdd={() => setIsBulkModalOpen(true)}
                isMobile={isMobile}
            />

            <div style={{ overflowY: 'auto', paddingRight: '4px', paddingBottom: '32px' }}>
                <div style={{ marginBottom: '16px' }}>
                    <h1 style={{ fontSize: '1.5rem', margin: 0 }}>
                        {isFiltering ? t('label.search_results') :
                            (bySemester.find(s => s.semesterId === selectedSemester)?.semesterName || t('label.semester'))}
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
                    showSemesterLabel={isFiltering}
                    semesterLabels={semesterLabels}
                    isMobile={isMobile}
                />
            </div>
        </div>
    );

    return (
        <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 'var(--space-md)' : 'var(--space-lg)',
            height: 'calc(100vh - 100px)',
            overflow: 'hidden'
        }}>
            {(!isMobile || (isMobile && mobileView === 'list' && !isFiltering)) && renderSemesterNav()}
            {(!isMobile || (isMobile && (mobileView === 'details' || isFiltering))) && renderCourseContent()}

            <CourseModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingCourse(null);
                }}
                onSave={handleSave}
                planId={currentPlan.id}
                courseToEdit={editingCourse}
                initialData={!editingCourse ? { semesterId: selectedSemester, name: '', credits: 3 } : undefined}
                semesters={semesters}
            />

            <BulkAddCourseModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                onSave={handleSave}
                planId={currentPlan.id}
                semesters={semesters}
            />

            {semesterToDelete && (
                <DeleteSemesterModal
                    isOpen={deleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    semesterId={semesterToDelete.id}
                    semesterName={semesterToDelete.name}
                    courses={courses.filter(c => c.semesterId === semesterToDelete.id)}
                    semesters={semesters}
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
