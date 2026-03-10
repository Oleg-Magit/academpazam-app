import React, { useState, useMemo, useEffect } from 'react';
import { usePlans, useCourses, useSemesters } from '@/core/hooks/useData';
import { deleteCourse } from '@/core/db/db';
import { CourseDetails } from './CourseDetails';
import { CourseModal } from './CourseModal';
import { BulkAddCourseModal } from './BulkAddCourseModal';
import { AddSemesterModal } from './AddSemesterModal';
import { DeleteSemesterModal } from './DeleteSemesterModal';
import { ConfirmationModal } from '@/ui/ConfirmationModal';
import { useTranslation } from '@/app/i18n/useTranslation';

import { useMediaQuery } from '@/core/hooks/useMediaQuery';
import { ChevronLeft, Trash2, Edit2, Save } from 'lucide-react';
import { Button } from '@/ui/Button';
import type { Course, CourseWithTopics } from '@/core/models/types';

// Sub-components
import { SemesterNavigation } from './components/SemesterNavigation';
import { CoursesToolbar } from './components/CoursesToolbar';
import { CourseList } from './components/CourseList';

// Hooks
import { useSemesterManagement } from './hooks/useSemesterManagement';
import { getSemesterTitle, getSemesterContext } from '@/core/utils/semesterUtils';

export const Courses: React.FC = () => {
    const { t } = useTranslation();
    const { plans } = usePlans();
    const currentPlan = plans[0];
    const { courses, loading: coursesLoading, refresh: refreshCourses } = useCourses(currentPlan?.id || null);
    const { semesters, loading: semestersLoading, refresh: refreshSemesters } = useSemesters();

    const refresh = () => {
        refreshCourses();
        refreshSemesters();
    };

    const isMobile = useMediaQuery('(max-width: 768px)');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<CourseWithTopics | null>(null);
    const [selectedSemester, setSelectedSemester] = useState<string>('');
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [isAddSemesterModalOpen, setIsAddSemesterModalOpen] = useState(false);
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

    // Mobile modes detection
    const isSearching = searchTerm.trim() !== '' || statusFilter !== 'all';
    const isOverviewMode = selectedSemester === 'all' || selectedSemester === '';
    const isFocusedMode = isMobile && !isOverviewMode;

    const defaultSemesterForNewCourse = !isOverviewMode
        ? selectedSemester
        : (semesters.length > 0 ? semesters[0].id : '');

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

    const hierarchy = useMemo(() => {
        const yearMap = new Map<number, Map<string, Map<string, { name: string, courses: CourseWithTopics[] }>>>();

        displayedCourses.forEach(course => {
            const sem = semesters.find(s => s.id === course.semesterId);
            if (!sem) return;

            const y = sem.year ?? 1;
            const t = sem.term ?? 'A';

            if (!yearMap.has(y)) yearMap.set(y, new Map());
            const termMap = yearMap.get(y)!;

            if (!termMap.has(t)) termMap.set(t, new Map());
            const semMap = termMap.get(t)!;

            if (!semMap.has(sem.id)) semMap.set(sem.id, { name: sem.name, courses: [] });
            semMap.get(sem.id)!.courses.push(course);
        });

        const sortedYears = Array.from(yearMap.keys()).sort((a, b) => a - b);
        return sortedYears.map(year => {
            const termMap = yearMap.get(year)!;
            const termOrder = { 'A': 1, 'B': 2, 'SUMMER': 3 };
            const sortedTerms = Array.from(termMap.keys()).sort((a, b) => (termOrder[a as keyof typeof termOrder] || 99) - (termOrder[b as keyof typeof termOrder] || 99));

            return {
                year,
                terms: sortedTerms.map(term => {
                    const semMap = termMap.get(term)!;
                    const semArray = Array.from(semMap.keys()).map(semId => {
                        const s = semesters.find(x => x.id === semId);
                        return {
                            id: semId,
                            name: semMap.get(semId)!.name,
                            orderIndex: s?.orderIndex || 0,
                            courses: semMap.get(semId)!.courses as CourseWithTopics[]
                        };
                    }).sort((a, b) => a.orderIndex - b.orderIndex);

                    return {
                        term,
                        semesters: semArray
                    };
                })
            };
        });
    }, [displayedCourses, semesters]);

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
            onAddSemester={() => setIsAddSemesterModalOpen(true)}
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
            {isFocusedMode && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedSemester('all')} style={{ padding: '4px' }}>
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
                onAddSemester={() => setIsAddSemesterModalOpen(true)}
                onBulkAdd={() => setIsBulkModalOpen(true)}
                isMobile={isMobile}
            />

            <div style={{ overflowY: 'auto', paddingRight: '4px', paddingBottom: '32px' }}>
                {isMobile && isOverviewMode && !isSearching ? (
                    renderSemesterNav()
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isMobile ? '12px' : '16px' }}>
                            <div style={{ flex: 1 }}>
                                {editingSemesterId === selectedSemester ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                                        <input
                                            id="rename-semester-header"
                                            name="renameSemesterHeader"
                                            value={tempLabel}
                                            onChange={e => setTempLabel(e.target.value)}
                                            autoFocus
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                border: '1px solid var(--color-accent)',
                                                fontSize: '1rem',
                                                backgroundColor: 'var(--color-bg-primary)',
                                                color: 'var(--color-text-primary)'
                                            }}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') saveRename();
                                                if (e.key === 'Escape') setEditingSemesterId(null);
                                            }}
                                        />
                                        <Button size="sm" variant="ghost" onClick={saveRename} style={{ padding: '8px' }}>
                                            <Save size={20} />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', margin: 0, fontWeight: 700 }}>
                                            {searchTerm.trim() !== '' || statusFilter !== 'all' ? t('label.search_results') :
                                                selectedSemester === 'all' ? t('label.all_semesters') :
                                                    (() => {
                                                        const sem = semesters.find(s => s.id === selectedSemester);
                                                        if (!sem) return t('label.semester');
                                                        return (
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <span>{getSemesterTitle(sem, t)}</span>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        style={{ padding: '4px', height: 'auto' }}
                                                                        onClick={() => startRenaming(sem.id, sem.name)}
                                                                        aria-label={t('action.edit')}
                                                                    >
                                                                        <Edit2 size={18} style={{ opacity: 0.7 }} />
                                                                    </Button>
                                                                </div>
                                                                <span style={{
                                                                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                                                                    color: 'var(--color-text-secondary)',
                                                                    fontWeight: 400,
                                                                    marginTop: '2px'
                                                                }}>
                                                                    {getSemesterContext(sem, t)}
                                                                </span>
                                                            </div>
                                                        );
                                                    })()
                                            }
                                        </h1>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                            {displayedCourses.length} {t('label.courses_found')}
                                        </span>
                                    </>
                                )}
                            </div>
                            {isFocusedMode && semesters.length > 1 && !editingSemesterId && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    style={{ color: 'var(--color-danger)', padding: '8px' }}
                                    onClick={() => {
                                        const fullSem = semesters.find(s => s.id === selectedSemester);
                                        if (fullSem) promptDeleteSemester(fullSem);
                                    }}
                                    aria-label={t('action.delete')}
                                >
                                    <Trash2 size={22} />
                                </Button>
                            )}
                        </div>

                        {selectedSemester === 'all' || isFiltering ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {hierarchy.map(hYear => (
                                    <div key={hYear.year}>
                                        <h2 style={{ fontSize: isMobile ? '1.15rem' : '1.3rem', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
                                            {t('label.year' as any) || 'Year'} {hYear.year}
                                        </h2>
                                        <div style={{ paddingLeft: isMobile ? '8px' : '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            {hYear.terms.map(hTerm => (
                                                <div key={hTerm.term}>
                                                    <h3 style={{ fontSize: isMobile ? '1rem' : '1.1rem', marginBottom: '12px', color: 'var(--color-text-secondary)' }}>
                                                        {t(`term.${hTerm.term.toLowerCase()}` as any) || `Term ${hTerm.term}`}
                                                    </h3>
                                                    <div style={{ paddingLeft: isMobile ? '4px' : '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                        {hTerm.semesters.map(hSem => {
                                                            const isDefault = !hSem.name ||
                                                                /^(Semester|סמסטר|Семестр)\s+\d+$/i.test(hSem.name);

                                                            return (
                                                                <div key={hSem.id}>
                                                                    {!isDefault && (
                                                                        <h4 style={{ fontSize: '1rem', marginBottom: '8px', color: 'var(--color-accent)' }}>
                                                                            {hSem.name}
                                                                        </h4>
                                                                    )}
                                                                    <CourseList
                                                                        courses={hSem.courses}
                                                                        onEdit={handleEdit}
                                                                        onDelete={handleDelete}
                                                                        onNavigate={(id) => setSelectedCourseId(id)}
                                                                        showSemesterLabel={false}
                                                                        semesterLabels={semesterLabels}
                                                                        isMobile={isMobile}
                                                                    />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {hierarchy.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                                        {t('label.no_courses_found')}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <CourseList
                                courses={displayedCourses}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onNavigate={(id) => setSelectedCourseId(id)}
                                showSemesterLabel={false}
                                semesterLabels={semesterLabels}
                                isMobile={isMobile}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );

    if (selectedCourseId) {
        return <CourseDetails id={selectedCourseId} onBack={() => setSelectedCourseId(null)} />;
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 'var(--space-md)' : 'var(--space-lg)',
            height: 'calc(100vh - 100px)',
            overflow: 'hidden'
        }}>
            {!isMobile && renderSemesterNav()}
            {renderCourseContent()}

            <CourseModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingCourse(null);
                }}
                onSave={handleSave}
                planId={currentPlan.id}
                courseToEdit={editingCourse}
                initialData={!editingCourse ? { semesterId: defaultSemesterForNewCourse, name: '', credits: 3 } : undefined}
                semesters={semesters}
            />

            <BulkAddCourseModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                onSave={handleSave}
                planId={currentPlan.id}
                semesters={semesters}
            />

            <AddSemesterModal
                isOpen={isAddSemesterModalOpen}
                onClose={() => setIsAddSemesterModalOpen(false)}
                semesters={semesters}
                onAdd={async (year, term) => {
                    const nextId = await handleAddSemester(year, term);
                    if (nextId && !isMobile) handleSelectSemester(nextId);
                    return nextId;
                }}
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
