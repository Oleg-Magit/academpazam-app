export type AcademicImportTextKey =
    | 'open' | 'title' | 'mode' | 'degreePlan' | 'academicResults' | 'source' | 'upload' | 'paste'
    | 'consentTitle' | 'consentBody' | 'analyze' | 'reviewTitle' | 'save' | 'cancel' | 'back'
    | 'course' | 'code' | 'credits' | 'semester' | 'grade' | 'action' | 'add' | 'update' | 'skip'
    | 'warnings' | 'missingConfig' | 'noRows' | 'processing' | 'success' | 'error' | 'fileTooLarge';

const copy: Record<'en' | 'he' | 'ru', Record<AcademicImportTextKey, string>> = {
    en: {
        open: 'Import with AI', title: 'AI Academic Import', mode: 'What are you importing?',
        degreePlan: 'Degree plan', academicResults: 'Academic results', source: 'Choose one source',
        upload: 'Upload PDF or image', paste: 'Or paste academic text', consentTitle: 'AI processing notice',
        consentBody: 'Only the file or text you selected will be sent to the AI processing service. Your existing AcademPazam database stays on this device. Nothing is saved until you review and confirm the result.',
        analyze: 'Analyze with AI', reviewTitle: 'Review before saving', save: 'Save reviewed import', cancel: 'Cancel', back: 'Back',
        course: 'Course', code: 'Code', credits: 'Credits', semester: 'Semester', grade: 'Grade', action: 'Action',
        add: 'Add', update: 'Update', skip: 'Skip', warnings: 'Needs review', missingConfig: 'AI import is not configured yet.',
        noRows: 'No reliable course rows were extracted.', processing: 'Analyzing academic document…', success: 'Import saved successfully.',
        error: 'AI import failed. Manual course entry is still available.', fileTooLarge: 'File must be 10 MB or smaller.',
    },
    he: {
        open: 'ייבוא בעזרת AI', title: 'ייבוא אקדמי בעזרת AI', mode: 'מה מייבאים?', degreePlan: 'תוכנית התואר',
        academicResults: 'גיליון ציונים / תוצאות', source: 'בחרו מקור אחד', upload: 'העלאת PDF או תמונה',
        paste: 'או הדבקת טקסט אקדמי', consentTitle: 'הודעה לפני עיבוד AI',
        consentBody: 'רק הקובץ או הטקסט שבחרתם יישלח לשירות עיבוד ה-AI. מסד הנתונים הקיים של AcademPazam נשאר במכשיר. שום דבר לא נשמר לפני שתבדקו ותאשרו את התוצאה.',
        analyze: 'ניתוח בעזרת AI', reviewTitle: 'בדיקה לפני שמירה', save: 'שמירת הייבוא שנבדק', cancel: 'ביטול', back: 'חזרה',
        course: 'קורס', code: 'קוד', credits: 'נק״ז', semester: 'סמסטר', grade: 'ציון', action: 'פעולה',
        add: 'הוספה', update: 'עדכון', skip: 'דילוג', warnings: 'דורש בדיקה', missingConfig: 'שירות הייבוא בעזרת AI עדיין לא מוגדר.',
        noRows: 'לא זוהו שורות קורסים אמינות.', processing: 'מנתח את המסמך האקדמי…', success: 'הייבוא נשמר בהצלחה.',
        error: 'ייבוא ה-AI נכשל. עדיין אפשר להשתמש בהזנה הידנית.', fileTooLarge: 'הקובץ חייב להיות עד 10MB.',
    },
    ru: {
        open: 'Импорт с AI', title: 'Академический импорт с AI', mode: 'Что импортируем?', degreePlan: 'Учебный план',
        academicResults: 'Оценки / результаты', source: 'Выберите один источник', upload: 'Загрузить PDF или изображение',
        paste: 'Или вставить академический текст', consentTitle: 'Перед обработкой AI',
        consentBody: 'Только выбранный файл или текст будет отправлен сервису AI. Текущая база AcademPazam останется на устройстве. Ничего не сохраняется до вашей проверки и подтверждения.',
        analyze: 'Проанализировать', reviewTitle: 'Проверка перед сохранением', save: 'Сохранить проверенный импорт', cancel: 'Отмена', back: 'Назад',
        course: 'Курс', code: 'Код', credits: 'Кредиты', semester: 'Семестр', grade: 'Оценка', action: 'Действие',
        add: 'Добавить', update: 'Обновить', skip: 'Пропустить', warnings: 'Нужно проверить', missingConfig: 'AI-импорт пока не настроен.',
        noRows: 'Надёжные строки курсов не найдены.', processing: 'Анализ академического документа…', success: 'Импорт успешно сохранён.',
        error: 'AI-импорт не удался. Ручной ввод по-прежнему доступен.', fileTooLarge: 'Размер файла должен быть не больше 10 МБ.',
    },
};

export const academicImportText = (language: string, key: AcademicImportTextKey): string =>
    copy[language as 'en' | 'he' | 'ru']?.[key] ?? copy.en[key];
