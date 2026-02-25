import { useState, useEffect, useMemo } from 'react';
import { getSemesterConfig, saveSemesterConfig, saveCourse } from '@/core/db/db';
import type { CourseWithTopics } from '@/core/models/types';
import { groupCoursesBySemester } from '@/core/services/dataService';
import { useTranslation } from '@/app/i18n/useTranslation';

export const useSemesterManagement = (courses: CourseWithTopics[], refresh: () => void) => {
    const { t } = useTranslation();
    const [semesterConfig, setSemesterConfig] = useState<{ count: number, labels: string[] }>({ count: 8, labels: [] });
    const [editingSemesterId, setEditingSemesterId] = useState<string | null>(null);
    const [tempLabel, setTempLabel] = useState('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [semesterToDelete, setSemesterToDelete] = useState<{ id: string, label: string } | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        getSemesterConfig().then(setSemesterConfig);
    }, []);

    const bySemester = useMemo(() => {
        return groupCoursesBySemester(courses, semesterConfig);
    }, [courses, semesterConfig]);

    const handleAddSemester = async () => {
        const newCount = semesterConfig.count + 1;
        const newLabels = [...semesterConfig.labels];
        await saveSemesterConfig(newCount, newLabels);
        setSemesterConfig({ count: newCount, labels: newLabels });
        return newCount.toString();
    };

    const startRenaming = (semId: string, currentLabel: string) => {
        setEditingSemesterId(semId);
        setTempLabel(currentLabel);
    };

    const saveRename = async () => {
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

    const promptDeleteSemester = (semId: string, label: string) => {
        if (semesterConfig.count <= 1) {
            setErrorMsg(t('msg.cannot_delete_only_semester'));
            setTimeout(() => setErrorMsg(''), 3000);
            return;
        }
        setSemesterToDelete({ id: semId, label });
        setDeleteModalOpen(true);
    };

    const confirmDeleteSemester = async (targetId: string | null) => {
        if (!semesterToDelete) return;

        const deleteId = semesterToDelete.id;
        const deleteIndex = parseInt(deleteId);

        if (targetId) {
            let actualTarget = targetId;
            if (targetId === 'prev') {
                actualTarget = (deleteIndex - 1).toString();
            }

            const group = bySemester.find(g => g.semester === deleteId);
            if (group && group.courses.length > 0) {
                await Promise.all(group.courses.map(c =>
                    saveCourse({ ...c, semester: actualTarget, updatedAt: Date.now() })
                ));
            }
        }

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

    return {
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
    };
};
