import { en } from '@/app/i18n/locales/en';
import { he } from '@/app/i18n/locales/he';
import { ru } from '@/app/i18n/locales/ru';

export type TranslationKey = keyof typeof en;
export type SupportedLang = 'en' | 'he' | 'ru';

const resources = {
    en,
    he,
    ru
};

export const translate = (lang: SupportedLang, key: TranslationKey): string => {
    const dict = resources[lang] as any;
    return dict[key] || (resources['en'] as any)[key] || key;
};
