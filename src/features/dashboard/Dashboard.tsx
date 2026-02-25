import React, { useEffect, useState, useRef } from 'react';
import { usePlans, useCourses } from '@/core/hooks/useData';
import type { Course } from '@/core/models/types';
import { savePlan, getSemesterConfig } from '@/core/db/db';
import { v4 as uuidv4 } from 'uuid';
import { exportDataToJSON, importDataFromJSON } from '@/core/services/importExport';
import { useTranslation } from '@/app/i18n/useTranslation';
import { DegreeSnapshot } from './components/DegreeSnapshot';
import { SemesterRoadmap } from './components/SemesterRoadmap';
import { SemesterDrawer } from './components/SemesterDrawer';
import { CourseModal } from '@/features/courses/CourseModal';
import { DashboardHeader } from './components/DashboardHeader';
import { useDashboardData } from './hooks/useDashboardData';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { GraduationCap, Info } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const { t, language } = useTranslation();
    const { plans, loading: plansLoading, refresh: refreshPlans } = usePlans();

    const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
    const [semesterConfig, setSemesterConfig] = useState<{ count: number, labels: string[] } | undefined>(undefined);
    const [showActions, setShowActions] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [initialModalData, setInitialModalData] = useState<Partial<Course>>({ semester: '1' });
    const [showExportSuccess, setShowExportSuccess] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);
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

    const { progress, bySemester, stats } = useDashboardData(courses, semesterConfig);

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
        setExportError(null);
        if (!currentPlan) {
            setExportError(t('msg.no_plan_found'));
            return;
        }
        if (coursesLoading || !courses || courses.length === 0) {
            setExportError(t('dashboard.no_courses'));
            return;
        }

        setShowActions(false);
        try {
            const { generateDegreePDF } = await import('@/core/services/pdfGenerator');
            const pdfBytes = await generateDegreePDF(currentPlan.name, courses, language);

            // Minimal header check
            const header = String.fromCharCode(...pdfBytes.slice(0, 5));
            if (!header.startsWith('%PDF-')) {
                throw new Error('Invalid PDF generation - header missing');
            }

            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `${currentPlan.name}-Progress.pdf`;
            document.body.appendChild(a);
            a.click();

            // Delayed revocation for better browser compatibility (Chrome/Edge)
            setTimeout(() => {
                URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 2000);

            setShowExportSuccess(true);
            setTimeout(() => setShowExportSuccess(false), 3000);
        } catch (e) {
            console.error('[PDF Export] Failed:', e);
            setExportError(t('msg.pdf_export_failed'));
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

            setShowExportSuccess(true);
            setTimeout(() => setShowExportSuccess(false), 3000);
            setShowActions(false);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddCourseFromDrawer = (semesterId: string) => {
        setInitialModalData({ semester: semesterId });
        setIsModalOpen(true);
    };

    const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        await importDataFromJSON(text, 'merge');
        refreshPlans();
    };

    const handleSaveCourse = () => {
        refreshPlans();
    };

    if (plansLoading) {
        return <DashboardSkeleton />;
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

            <DashboardHeader
                title={t('nav.dashboard')}
                showExportSuccess={showExportSuccess}
                showActions={showActions}
                setShowActions={setShowActions}
                onAddCourse={() => setIsModalOpen(true)}
                onExportPDF={handleExportPDF}
                onExportJSON={handleExportJSON}
                onImportClick={() => importInputRef.current?.click()}
                language={language}
                actionsRef={actionsRef}
            />

            <input type="file" ref={importInputRef} style={{ display: 'none' }} onChange={handleImportJSON} accept=".json" />

            <DegreeSnapshot
                degreeName={currentPlan.name}
                totalCredits={progress.totalCredits}
                completedCredits={progress.completedCredits}
                remainingCredits={stats.totalRemainingCredits}
                percentage={progress.percentage}
                completedCount={stats.completedCount}
                inProgressCount={stats.inProgressCount}
            />

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

            <SemesterDrawer
                isOpen={!!selectedSemester}
                onClose={() => setSelectedSemester(null)}
                semesterGroup={selectedSemesterGroup}
                onAddCourse={handleAddCourseFromDrawer}
            />

            {currentPlan && (
                <CourseModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setInitialModalData({ semester: '1' }); // Reset
                    }}
                    onSave={handleSaveCourse}
                    planId={currentPlan.id}
                    initialData={initialModalData}
                    semesterConfig={semesterConfig || { count: 8, labels: [] }}
                />
            )}

            {exportError && (
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
                    zIndex: 1000,
                    cursor: 'pointer'
                }} onClick={() => setExportError(null)}>
                    {exportError}
                </div>
            )}
        </div>
    );
};
