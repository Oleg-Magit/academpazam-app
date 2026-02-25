import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { resources, LANGUAGES, DEFAULT_LANGUAGE } from './index';
import type { Language, TranslationKey } from './index';
import { getMeta, saveMeta } from '../../core/db/db';

const STORAGE_KEY = 'i18nextLng';
const INITIALIZED_KEY = 'app_language_initialized';
const STORAGE_KEY_DIR = 'app_direction';

interface I18nContextType {
    language: Language;
    setLanguage: (lang: Language) => Promise<void>;
    t: (key: TranslationKey, options?: Record<string, any>) => string;
    isInitialized: boolean;
    setInitialized: (value: boolean) => Promise<void>;
    isLoaded: boolean;
    direction: 'auto' | 'rtl' | 'ltr';
    setDirection: (dir: 'auto' | 'rtl' | 'ltr') => Promise<void>;
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initial state from localStorage for fast render
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return (saved as Language) || DEFAULT_LANGUAGE;
    });

    const [direction, setDirectionState] = useState<'auto' | 'rtl' | 'ltr'>(() => {
        return (localStorage.getItem(STORAGE_KEY_DIR) as 'auto' | 'rtl' | 'ltr') || 'auto';
    });

    const [isInitialized, setIsInitializedState] = useState<boolean>(() => {
        return localStorage.getItem(INITIALIZED_KEY) === 'true';
    });

    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const [langMeta, initMeta, dirMeta] = await Promise.all([
                    getMeta(STORAGE_KEY),
                    getMeta(INITIALIZED_KEY),
                    getMeta(STORAGE_KEY_DIR)
                ]);

                // LocalStorage is source of truth for current session. 
                // Only load from Meta if LocalStorage is missing a value.
                const storedLang = localStorage.getItem(STORAGE_KEY);
                if (!storedLang && langMeta?.value && resources[langMeta.value as Language]) {
                    setLanguageState(langMeta.value as Language);
                    localStorage.setItem(STORAGE_KEY, langMeta.value);
                }

                if (initMeta !== undefined) {
                    const initValue = initMeta.value === 'true' || initMeta.value === true;
                    setIsInitializedState(initValue);
                    localStorage.setItem(INITIALIZED_KEY, String(initValue));
                }

                const storedDir = localStorage.getItem(STORAGE_KEY_DIR);
                if (!storedDir && dirMeta?.value) {
                    setDirectionState(dirMeta.value as 'auto' | 'rtl' | 'ltr');
                    localStorage.setItem(STORAGE_KEY_DIR, dirMeta.value);
                }
            } catch (e) {
                console.error('Failed to load i18n settings', e);
            } finally {
                setIsLoaded(true);
            }
        };
        loadSettings();
    }, []);

    // Initial session log removed for best practices

    useEffect(() => {
        const langConfig = LANGUAGES.find(l => l.code === language);
        let dir: string = langConfig?.dir || 'ltr';

        if (direction === 'rtl') dir = 'rtl';
        if (direction === 'ltr') dir = 'ltr';

        document.documentElement.dir = dir;
        document.documentElement.lang = language;
        localStorage.setItem(STORAGE_KEY, language);
        localStorage.setItem(STORAGE_KEY_DIR, direction);
    }, [language, direction]);

    const setLanguage = useCallback(async (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem(STORAGE_KEY, lang);
        document.documentElement.lang = lang;
        // Also update direction immediately if not forced
        if (direction === 'auto') {
            document.documentElement.dir = (lang === 'he' ? 'rtl' : 'ltr');
        }
        await saveMeta(STORAGE_KEY, lang);
    }, [direction]);

    const setDirection = useCallback(async (dir: 'auto' | 'rtl' | 'ltr') => {
        setDirectionState(dir);
        localStorage.setItem(STORAGE_KEY_DIR, dir);
        await saveMeta(STORAGE_KEY_DIR, dir);
    }, []);

    const setInitialized = useCallback(async (value: boolean) => {
        setIsInitializedState(value);
        localStorage.setItem(INITIALIZED_KEY, String(value));
        await saveMeta(INITIALIZED_KEY, String(value));
    }, []);

    const t = useCallback((key: TranslationKey, options?: Record<string, any>): string => {
        const dict = resources[language] as any;
        let text = dict[key] || (resources['en'] as any)[key] || key;

        if (options) {
            Object.keys(options).forEach(optKey => {
                // Handle version specially if it contains dots that might be misinterpreted if we used regex without escaping
                const value = String(options[optKey]);
                text = text.split(`{{${optKey}}}`).join(value);
            });
        }

        return text;
    }, [language]);

    const value = {
        language,
        setLanguage,
        t,
        isInitialized,
        setInitialized,
        isLoaded,
        direction,
        setDirection
    };

    return (
        <I18nContext.Provider value={value}>
            {children}
        </I18nContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useTranslation must be used within an I18nProvider');
    }
    return context;
};
