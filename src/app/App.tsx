import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from '../ui/Layout';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { Dashboard } from '../features/dashboard/Dashboard';
import { Courses } from '../features/courses/Courses';
import { CourseDetails } from '../features/courses/CourseDetails';
import { Settings } from '../features/settings/Settings';
import { LanguageSetup } from '../features/onboarding/LanguageSetup';
import { useTranslation } from './i18n/useTranslation';
import { UpgradeGuard } from '../ui/UpgradeGuard/UpgradeGuard';

const AppContent = () => {
    const { isInitialized, isLoaded } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (isLoaded && !isInitialized && location.pathname !== '/language-setup') {
            navigate('/language-setup', { replace: true });
        }
    }, [isInitialized, isLoaded, navigate, location.pathname]);

    if (!isLoaded) {
        return null;
    }

    return (
        <Routes>
            <Route path="/language-setup" element={<LanguageSetup />} />
            <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="courses" element={<Courses />} />
                <Route path="courses/:id" element={<CourseDetails />} />
                <Route path="settings" element={<Settings />} />
            </Route>
        </Routes>
    );
};

function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter basename={import.meta.env.BASE_URL}>
                <UpgradeGuard />
                <AppContent />
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;
