import { useState, useEffect, useCallback } from 'react';
import type { Plan, CourseWithTopics, Topic } from '../models/types';
import { getPlans, getPlan, getCoursesByPlan, getTopicsByCourse } from '../db/db';
import { enrichCourses } from '../services/dataService';

export function usePlans() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [version, setVersion] = useState(0);

    const refresh = useCallback(() => setVersion(v => v + 1), []);

    useEffect(() => {
        let active = true;
        setLoading(true);
        getPlans()
            .then(res => {
                if (active) setPlans(res);
            })
            .catch(err => {
                if (active) setError(err);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [version]);

    return { plans, loading, error, refresh };
}

export function usePlan(id: string | null) {
    const [plan, setPlan] = useState<Plan | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let active = true;
        if (!id) {
            setPlan(null);
            return;
        }
        setLoading(true);
        getPlan(id)
            .then(res => {
                if (active) setPlan(res || null);
            })
            .catch(err => {
                if (active) setError(err);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [id]);

    return { plan, loading, error };
}

export function useCourses(planId: string | null) {
    const [courses, setCourses] = useState<CourseWithTopics[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [version, setVersion] = useState(0);

    const refresh = useCallback(() => setVersion(v => v + 1), []);

    useEffect(() => {
        let active = true;
        if (!planId) {
            setCourses([]);
            return;
        }
        setLoading(true);
        getCoursesByPlan(planId)
            .then(rawCourses => enrichCourses(rawCourses))
            .then(res => {
                if (active) setCourses(res);
            })
            .catch(err => {
                if (active) setError(err);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [planId, version]);

    return { courses, loading, error, refresh };
}

export function useTopics(courseId: string | null) {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [version, setVersion] = useState(0);

    const refresh = useCallback(() => setVersion(v => v + 1), []);

    useEffect(() => {
        let active = true;
        if (!courseId) {
            setTopics([]);
            return;
        }
        setLoading(true);
        getTopicsByCourse(courseId)
            .then(res => {
                if (active) setTopics(res);
            })
            .catch(err => {
                if (active) setError(err);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [courseId, version]);

    return { topics, loading, error, refresh };
}
