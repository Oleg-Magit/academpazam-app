// Check if text contains Hebrew characters
export const hasHebrew = (text: string): boolean => {
    return /[\u0590-\u05FF]/.test(text);
};

// Convert logical text to visual text for PDF rendering
export const visualizeBiDiText = (text: string): string => {
    if (!text || !hasHebrew(text)) return text;
    
    // Mirror parentheses globally for Hebrew text base.
    // This handles the RTL base reversal performed by the PDF engine.
    let processed = text.replace(/\(/g, 'TEMP_OPEN').replace(/\)/g, 'TEMP_CLOSE');
    processed = processed.replace(/TEMP_OPEN/g, ')').replace(/TEMP_CLOSE/g, '(');

    // Fontkit reverses the entire string if it detects Hebrew.
    // We pre-reverse LTR blocks (English, Numbers, special chars) to cancel this out.
    // Hardening: Robustly capture LTR runs including surrounding parentheses.
    return processed.replace(/[a-zA-Z0-9@#%$^&*!\[\]{}|<>\/_=+](?:[a-zA-Z0-9\s.,+\-*\/()'"~:?!@#%$^&*!\[\]{}|<>\/_=+]*[a-zA-Z0-9@#%$^&*!\[\]{}|<>\/_=+])?/g, match => {
        // For LTR blocks, we reverse them back. 
        // We also must flip parentheses BACK within these blocks because they will be flipped 
        // again by the global engine reversal.
        return match.split('').map(c => {
            if (c === '(') return ')';
            if (c === ')') return '(';
            return c;
        }).reverse().join('');
    });
};
