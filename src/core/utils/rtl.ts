// Check if text contains Hebrew characters
export const hasHebrew = (text: string): boolean => {
    return /[\u0590-\u05FF]/.test(text);
};

// Convert logical text to visual text for PDF rendering
export const visualizeBiDiText = (text: string): string => {
    if (!text || !hasHebrew(text)) return text;
    // BUG 1 FIX: fontkit will natively reverse this ENTIRE string because it detects Hebrew (RTL base).
    // This perfectly reverses Hebrew back to readable RTL, but ruins LTR substrings (English/Numbers).
    // To cancel out fontkit's dumb full-string reversal, we pre-reverse LTR blocks here.
    return text.replace(/[a-zA-Z0-9][a-zA-Z0-9\s.,+\-*\/()'"~:]*[a-zA-Z0-9]|[a-zA-Z0-9]/g, match => {
        return match.split('').reverse().join('');
    });
};
