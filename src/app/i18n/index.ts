import { en } from './locales/en';
import { he } from './locales/he';
import { ru } from './locales/ru';

export const resources = {
    en,
    he,
    ru,
};

export type Language = keyof typeof resources;
export type TranslationKey = keyof typeof en;

export const LANGUAGES: { code: Language; label: string; dir: 'ltr' | 'rtl' }[] = [
    { code: 'en', label: 'English', dir: 'ltr' },
    { code: 'he', label: 'עברית', dir: 'rtl' },
    { code: 'ru', label: 'Русский', dir: 'ltr' },
];

export const DEFAULT_LANGUAGE: Language = 'en';
