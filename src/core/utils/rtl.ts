// Check if text contains Hebrew characters
export const hasHebrew = (text: string): boolean => {
    return /[\u0590-\u05FF]/.test(text);
};

// Convert logical text to visual text for PDF rendering
export const visualizeBiDiText = (text: string): string => {
    if (!text || !hasHebrew(text)) return text;
    // Mirror parentheses for Hebrew text to ensure correct orientation after BiDi reversal.
    // LTR blocks are protected below (reversed twice to stay correct).
    let processed = text.replace(/\(/g, 'TEMP_OPEN').replace(/\)/g, 'TEMP_CLOSE');
    processed = processed.replace(/TEMP_OPEN/g, ')').replace(/TEMP_CLOSE/g, '(');

    // BUG 1 FIX: fontkit will natively reverse this ENTIRE string because it detects Hebrew (RTL base).
    // This perfectly reverses Hebrew back to readable RTL, but ruins LTR substrings (English/Numbers).
    // To cancel out fontkit's dumb full-string reversal, we pre-reverse LTR blocks here.
    return processed.replace(/[a-zA-Z0-9][a-zA-Z0-9\s.,+\-*\/()'"~:]*[a-zA-Z0-9]|[a-zA-Z0-9]/g, match => {
        // Since we mirrored parentheses globally above, we must mirror them BACK for the pre-reversed English blocks
        // so they end up in their original orientation after the final PDF engine reversal.
        const reversedMatch = match.split('').map(c => {
            if (c === '(') return ')';
            if (c === ')') return '(';
            return c;
        }).reverse().join('');
        return reversedMatch;
    });
};
