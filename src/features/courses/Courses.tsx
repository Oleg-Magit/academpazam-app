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
    const [yearFilter, setYearFilter] = useState<string>('all');
    const [termFilter, setTermFilter] = useState<string>('all');

    useEffect(() => {
        if (semesters.length > 0 && !selectedSemester) {
            setSelectedSemester('all');
        }
    }, [semesters, selectedSemester]);

    useEffect(() => {
        if (selectedSemester !== 'all') {
            const sem = semesters.find(s => s.id === selectedSemester);
            if (sem) {
                if (yearFilter !== 'all' && sem.year !== parseInt(yearFilter)) {
                    setSelectedSemester('all');
                } else if (termFilter !== 'all' && sem.term !== termFilter) {
                    setSelectedSemester('all');
                }
            }
        }
    }, [yearFilter, termFilter, semesters, selectedSemester]);

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
        if (isMobile && selectedSemester && selectedSemester !== 'all' && mobileView === 'list') {
            // Only auto-switch to details if we are actually selecting a specific semester
            setMobileView('details');
        }
    }, [selectedSemester, isMobile, mobileView]);

    const availableYears = useMemo(() => {
        const years = new Set<number>();
        semesters.forEach(s => {
            if (s.year !== undefined) years.add(s.year);
        });
        return Array.from(years).sort((a, b) => a - b);
    }, [semesters]);

    const availableTerms = useMemo(() => {
        if (yearFilter === 'all') return ['A', 'B', 'SUMMER'];
        const terms = new Set<string>();
        semesters.forEach(s => {
            if (s.year === parseInt(yearFilter) && s.term) terms.add(s.term);
        });
        return ['A', 'B', 'SUMMER'].filter(t => terms.has(t));
    }, [semesters, yearFilter]);

    const filteredSemestersForNav = useMemo(() => {
        return bySemester.filter(g => {
            const sem = semesters.find(s => s.id === g.semesterId);
            if (!sem) return true;
            if (yearFilter !== 'all' && sem.year !== parseInt(yearFilter)) return false;
            if (termFilter !== 'all' && sem.term !== termFilter) return false;
            return true;
        });
    }, [bySemester, semesters, yearFilter, termFilter]);

    const showSemesterLabels = searchTerm.trim() !== '' || statusFilter !== 'all' || selectedSemester === 'all';
    const isFiltering = showSemesterLabels;

    const displayedCourses = useMemo(() => {
        const filterFn = (c: CourseWithTopics) => {
            const sem = semesters.find(s => s.id === c.semesterId);

            // 1. Year Filter (Ignored if a specific semester is picked)
            if (selectedSemester === 'all' && yearFilter !== 'all' && sem?.year !== parseInt(yearFilter)) return false;

            // 2. Term Filter (Ignored if a specific semester is picked)
            if (selectedSemester === 'all' && termFilter !== 'all' && sem?.term !== termFilter) return false;

            // 3. Semester Filter
            if (selectedSemester !== 'all' && c.semesterId !== selectedSemester) return false;

            // 4. Status Filter
            if (statusFilter !== 'all' && c.effectiveStatus !== statusFilter) return false;

            // 5. Search
            if (searchTerm.trim() !== '') {
                const searchLower = searchTerm.toLowerCase();
                const matchesSearch = c.name.toLowerCase().includes(searchLower) ||
                    (c.code && c.code.toLowerCase().includes(searchLower)) ||
                    (c.topics && c.topics.some(t => t.title.toLowerCase().includes(searchLower)));
                if (!matchesSearch) return false;
            }

            return true;
        };

        return courses.filter(filterFn);
    }, [courses, semesters, selectedSemester, searchTerm, statusFilter, yearFilter, termFilter]);

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
            bySemester={filteredSemestersForNav}
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
                yearFilter={yearFilter}
                onYearFilterChange={setYearFilter}
                termFilter={termFilter}
                onTermFilterChange={setTermFilter}
                availableYears={availableYears}
                availableTerms={availableTerms}
                onAddCourse={() => setIsModalOpen(true)}
                onBulkAdd={() => setIsBulkModalOpen(true)}
                isMobile={isMobile}
            />

            <div style={{ overflowY: 'auto', paddingRight: '4px', paddingBottom: '32px' }}>
                <div style={{ marginBottom: '16px' }}>
                    <h1 style={{ fontSize: '1.5rem', margin: 0 }}>
                        {searchTerm.trim() !== '' || statusFilter !== 'all' ? t('label.search_results') :
                            (selectedSemester === 'all' ? (t('label.all_semesters' as any) || 'All Semesters') :
                                (bySemester.find(s => s.semesterId === selectedSemester)?.semesterName || t('label.semester')))}
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
                    showSemesterLabel={showSemesterLabels}
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
                    zIndex: 2000
                }}>
                    {errorMsg}
                </div>
            )}
        </div>
    );
};
