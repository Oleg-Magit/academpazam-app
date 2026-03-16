import { useState, useMemo, useCallback } from 'react';
import { saveSemester, deleteSemester, saveCourse } from '@/core/db/db';
import type { CourseWithTopics, Semester } from '@/core/models/types';
import { groupCoursesBySemester } from '@/core/services/dataService';
import { useTranslation } from '@/app/i18n/useTranslation';
import { v4 as uuidv4 } from 'uuid';

export const useSemesterManagement = (
    courses: CourseWithTopics[],
    semesters: Semester[],
    refresh: () => void,
    passingThreshold: number
) => {
    const { t } = useTranslation();
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [semesterToDelete, setSemesterToDelete] = useState<Semester | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    const bySemester = useMemo(() => {
        return groupCoursesBySemester(courses, semesters, passingThreshold);
    }, [courses, semesters, passingThreshold]);

    const getNextSemesterProposal = useCallback((pacing: '2-term' | '3-term' = '3-term'): { year: number, term: 'A' | 'B' | 'SUMMER' | 'OTHER' } => {
        if (semesters.length === 0) {
            return { year: 1, term: 'A' };
        }

        const sorted = [...semesters].sort((a, b) => b.orderIndex - a.orderIndex);
        const lastSem = sorted[0];

        const lastYear = typeof lastSem.year === 'number' ? lastSem.year : 1;
        const lastTerm = lastSem.term || 'A';

        if (pacing === '2-term') {
            // 2-term Model: A -> B, B -> next year A
            if (lastTerm === 'A') {
                return { year: lastYear, term: 'B' };
            } else {
                return { year: lastYear + 1, term: 'A' };
            }
        } else {
            // 3-term Model: A -> B, B -> Summer, Summer -> next year A
            if (lastTerm === 'A') {
                return { year: lastYear, term: 'B' };
            } else if (lastTerm === 'B') {
                return { year: lastYear, term: 'SUMMER' };
            } else {
                // Includes 'SUMMER', 'OTHER', or any fallback
                return { year: lastYear + 1, term: 'A' };
            }
        }
    }, [semesters]);

    const handleAddSemester = useCallback(async (semesterData: Omit<Semester, 'id' | 'createdAt' | 'orderIndex'>) => {
        const maxOrder = semesters.length > 0 ? Math.max(...semesters.map(s => s.orderIndex)) : -1;
        
        const newSemester: Semester = {
            id: uuidv4(),
            name: semesterData.name || '',
            createdAt: Date.now(),
            orderIndex: maxOrder + 1,
            year: semesterData.year,
            term: semesterData.term
        };
        await saveSemester(newSemester);
        refresh();
        return newSemester.id;
    }, [semesters, refresh]);


    const promptDeleteSemester = (semester: Semester) => {
        if (semesters.length <= 1) {
            setErrorMsg(t('msg.cannot_delete_only_semester'));
            setTimeout(() => setErrorMsg(''), 3000);
            return;
        }
        setSemesterToDelete(semester);
        setDeleteModalOpen(true);
    };

    const confirmDeleteSemester = async (targetId: string | null) => {
        if (!semesterToDelete) return;

        const deleteId = semesterToDelete.id;

        if (targetId) {
            // Reassign courses to another semester
            const group = bySemester.find(g => g.semesterId === deleteId);
            if (group && group.courses.length > 0) {
                await Promise.all(group.courses.map(c =>
                    saveCourse({ ...c, semesterId: targetId, updatedAt: Date.now() })
                ));
            }
            await deleteSemester(deleteId, false);
        } else {
            // Delete semester and all its courses
            await deleteSemester(deleteId, true);
        }

        refresh();
        setDeleteModalOpen(false);
        setSemesterToDelete(null);
    };

    const handleUpdateSemester = async (semesterId: string, updates: Partial<Semester>) => {
        const semester = semesters.find(s => s.id === semesterId);
        if (semester) {
            await saveSemester({
                ...semester,
                ...updates
            });
            refresh();
        }
    };

    const handleReorder = async (semesterId: string, direction: 'up' | 'down') => {
        // Use bySemester (which is sorted by orderIndex) for safe reordering
        const index = bySemester.findIndex(s => s.semesterId === semesterId);
        if (index === -1) return;
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === bySemester.length - 1) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        const current = semesters.find(s => s.id === semesterId);
        const target = semesters.find(s => s.id === bySemester[targetIndex].semesterId);

        if (!current || !target) return;

        // Swap orderIndex
        const currentOrder = current.orderIndex;
        const targetOrder = target.orderIndex;

        await Promise.all([
            saveSemester({ ...current, orderIndex: targetOrder }),
            saveSemester({ ...target, orderIndex: currentOrder })
        ]);

        refresh();
    };

    return {
        bySemester,
        deleteModalOpen,
        setDeleteModalOpen,
        semesterToDelete,
        errorMsg,
        getNextSemesterProposal,
        handleAddSemester,
        handleUpdateSemester,
        promptDeleteSemester,
        confirmDeleteSemester,
        handleReorder
    };
};
