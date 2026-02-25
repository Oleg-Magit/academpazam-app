import { useState, useMemo } from 'react';
import { saveSemester, deleteSemester, saveCourse } from '@/core/db/db';
import type { CourseWithTopics, Semester } from '@/core/models/types';
import { groupCoursesBySemester } from '@/core/services/dataService';
import { useTranslation } from '@/app/i18n/useTranslation';
import { v4 as uuidv4 } from 'uuid';

export const useSemesterManagement = (
    courses: CourseWithTopics[],
    semesters: Semester[],
    refresh: () => void
) => {
    const { t } = useTranslation();
    const [editingSemesterId, setEditingSemesterId] = useState<string | null>(null);
    const [tempLabel, setTempLabel] = useState('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [semesterToDelete, setSemesterToDelete] = useState<Semester | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    const bySemester = useMemo(() => {
        return groupCoursesBySemester(courses, semesters);
    }, [courses, semesters]);

    const handleAddSemester = async () => {
        const newSemester: Semester = {
            id: uuidv4(),
            name: `${t('semester.semester')} ${semesters.length + 1}`,
            createdAt: Date.now(),
            orderIndex: semesters.length > 0 ? Math.max(...semesters.map(s => s.orderIndex)) + 1 : 0
        };
        await saveSemester(newSemester);
        refresh();
        return newSemester.id;
    };

    const startRenaming = (semId: string, currentLabel: string) => {
        setEditingSemesterId(semId);
        setTempLabel(currentLabel);
    };

    const saveRename = async () => {
        if (!editingSemesterId) return;

        const semester = semesters.find(s => s.id === editingSemesterId);
        if (semester) {
            await saveSemester({
                ...semester,
                name: tempLabel
            });
            refresh();
        }
        setEditingSemesterId(null);
    };

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

    const handleReorder = async (semesterId: string, direction: 'up' | 'down') => {
        const index = semesters.findIndex(s => s.id === semesterId);
        if (index === -1) return;
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === semesters.length - 1) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        const current = semesters[index];
        const target = semesters[targetIndex];

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
    };
};
