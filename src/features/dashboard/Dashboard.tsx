import React, { useEffect, useState, useMemo, useRef } from 'react';
import { usePlans, useCourses } from '@/core/hooks/useData';
import { calculateDegreeProgress, groupCoursesBySemester } from '@/core/services/dataService';
import { savePlan, getSemesterConfig } from '@/core/db/db';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from '@/app/i18n/useTranslation';
import { DegreeSnapshot } from './components/DegreeSnapshot';
import { SemesterRoadmap } from './components/SemesterRoadmap';
import { SemesterDrawer } from './components/SemesterDrawer';
import { CourseModal } from '@/features/courses/CourseModal';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Link } from 'react-router-dom';
import { Plus, GraduationCap, Info, MoreHorizontal, FileDown, Database, Upload, List } from 'lucide-react';
import { generateDegreePDF } from '@/core/services/pdfGenerator';
import { importDataFromJSON, exportDataToJSON } from '@/core/services/importExport';

export const Dashboard: React.FC = () => {
    const { t, language } = useTranslation();
    const { plans, loading: plansLoading, refresh: refreshPlans } = usePlans();

    const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
    const [semesterConfig, setSemesterConfig] = useState<{ count: number, labels: string[] } | undefined>(undefined);
    const [showActions, setShowActions] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const actionsRef = useRef<HTMLDivElement>(null);
    const importInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getSemesterConfig().then(setSemesterConfig);

        const handleClickOutside = (event: MouseEvent) => {
            if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
                setShowActions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentPlan = plans[0];
    const { courses, loading: coursesLoading } = useCourses(currentPlan?.id || null);

    const { progress, bySemester, stats } = useMemo(() => {
        if (!courses) return {
            progress: { totalCredits: 0, completedCredits: 0, percentage: 0 },
            bySemester: [],
            stats: { completedCount: 0, inProgressCount: 0, totalRemainingCredits: 0 }
        };

        const prog = calculateDegreeProgress(courses);
        const semesters = groupCoursesBySemester(courses, semesterConfig);

        const stats = {
            completedCount: courses.filter(c => c.effectiveStatus === 'completed').length,
            inProgressCount: courses.filter(c => c.effectiveStatus === 'in_progress').length,
            totalRemainingCredits: Math.max(0, prog.totalCredits - prog.completedCredits)
        };

        return { progress: prog, bySemester: semesters, stats };
    }, [courses, semesterConfig]);

    const handleCreatePlan = async () => {
        const defaultPlan = {
            id: uuidv4(),
            name: 'My Degree',
            passing_exam_threshold: 56,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        await savePlan(defaultPlan);
        refreshPlans();
    };

    const handleExportPDF = async () => {
        if (!currentPlan || !courses) return;
        setShowActions(false);
        try {
            const pdfBytes = await generateDegreePDF(currentPlan.name, courses, language);
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${currentPlan.name}-Progress.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
        }
    };

    const handleExportJSON = async () => {
        try {
            const blob = await exportDataToJSON();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `academ-pazam-backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            setShowActions(false);
        } catch (e) {
            console.error(e);
        }
    };

    const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        await importDataFromJSON(text, 'merge');
        window.location.reload();
    };

    const handleSaveCourse = () => {
        refreshPlans();
        window.location.reload();
    };

    if (plansLoading) {
        return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading...</div>;
    }

    // EMPTY STATE: No plan exists
    if (!currentPlan) {
        return (
            <div style={{ padding: 'var(--space-xl)', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <Card style={{ maxWidth: '400px', textAlign: 'center', padding: 'var(--space-xl)', border: '1px solid var(--color-border)' }}>
                    <div style={{ backgroundColor: 'var(--color-bg-secondary)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-lg)' }}>
                        <GraduationCap size={32} color="var(--color-accent)" />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-md)', fontWeight: 700 }}>{t('welcome.title')}</h1>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)', lineHeight: 1.5, fontSize: '0.95rem' }}>
                        {t('welcome.description')}
                    </p>
                    <Button onClick={handleCreatePlan} size="lg" style={{ width: '100%' }}>
                        {t('welcome.create_plan')}
                    </Button>
                </Card>
            </div>
        );
    }

    if (coursesLoading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>{t('msg.loading_courses')}</div>;
    }

    const selectedSemesterGroup = bySemester.find(g => g.semester === selectedSemester) || null;

    return (
        <div style={{ padding: 'var(--space-md)', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>

            {/* Minimal Header with Primary Action */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{t('nav.dashboard')}</h1>

                <div style={{ display: 'flex', gap: '8px', position: 'relative' }} ref={actionsRef}>
                    <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setIsModalOpen(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                    >
                        <Plus size={16} />
                        {t('dashboard.add_course')}
                    </Button>

                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setShowActions(!showActions)}
                        style={{ padding: '0 8px' }}
                    >
                        <MoreHorizontal size={18} />
                    </Button>

                    {showActions && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            [language === 'he' ? 'left' : 'right']: 0,
                            marginTop: '8px',
                            backgroundColor: 'var(--color-bg-secondary)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                            zIndex: 100,
                            minWidth: '180px',
                            overflow: 'hidden'
                        }}>
                            <MenuLink to="/courses" icon={<List size={16} />} label={t('label.manage_courses')} />
                            <MenuButton onClick={handleExportPDF} icon={<FileDown size={16} />} label={t('action.export_pdf')} />
                            <MenuButton onClick={handleExportJSON} icon={<Database size={16} />} label="Export JSON" />
                            <MenuButton onClick={() => importInputRef.current?.click()} icon={<Upload size={16} />} label="Import JSON" />
                            <input type="file" ref={importInputRef} style={{ display: 'none' }} onChange={handleImportJSON} accept=".json" />
                        </div>
                    )}
                </div>
            </header>

            {/* TOP: Primary Degree Progress Card */}
            <DegreeSnapshot
                degreeName={currentPlan.name}
                totalCredits={progress.totalCredits}
                completedCredits={progress.completedCredits}
                remainingCredits={stats.totalRemainingCredits}
                percentage={progress.percentage}
                completedCount={stats.completedCount}
                inProgressCount={stats.inProgressCount}
            />

            {/* SEMESTER OVERVIEW - Dominant Content */}
            <section style={{ flex: 1 }}>
                {courses?.length === 0 ? (
                    <Card style={{
                        textAlign: 'center',
                        padding: 'var(--space-xl)',
                        backgroundColor: 'var(--color-bg-secondary)',
                        border: '1px dashed var(--color-border)',
                        marginTop: 'var(--space-md)'
                    }}>
                        <Info size={32} color="var(--color-text-secondary)" style={{ marginBottom: 'var(--space-sm)' }} />
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)' }}>
                            {t('dashboard.empty_hint')}
                        </p>
                    </Card>
                ) : (
                    <SemesterRoadmap
                        semesters={bySemester}
                        selectedSemester={selectedSemester}
                        onSelectSemester={setSelectedSemester}
                    />
                )}
            </section>

            {/* Semester Details Drawer */}
            <SemesterDrawer
                isOpen={!!selectedSemester}
                onClose={() => setSelectedSemester(null)}
                semesterGroup={selectedSemesterGroup}
            />

            {/* Quick Add Modal */}
            {currentPlan && (
                <CourseModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveCourse}
                    planId={currentPlan.id}
                    initialData={{ semester: '1' }}
                />
            )}
        </div>
    );
};

const MenuLink = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => (
    <Link to={to} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 16px',
        textDecoration: 'none',
        color: 'var(--color-text-primary)',
        fontSize: '0.9rem',
        transition: 'background 0.2s'
    }} className="menu-item">
        {icon}
        {label}
        <style>{`.menu-item:hover { background: var(--color-bg-tertiary); }`}</style>
    </Link>
);

const MenuButton = ({ onClick, icon, label, variant = 'default' }: { onClick: () => void, icon: React.ReactNode, label: string, variant?: 'default' | 'danger' }) => (
    <button onClick={onClick} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 16px',
        width: '100%',
        border: 'none',
        background: 'none',
        textAlign: 'left',
        cursor: 'pointer',
        color: variant === 'danger' ? 'var(--color-danger)' : 'var(--color-text-primary)',
        fontSize: '0.9rem',
        transition: 'background 0.2s'
    }} className="menu-item">
        {icon}
        {label}
    </button>
);
