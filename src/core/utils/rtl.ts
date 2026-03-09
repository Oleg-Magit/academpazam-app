// Check if text contains Hebrew characters
export const hasHebrew = (text: string): boolean => {
    return /[\u0590-\u05FF]/.test(text);
};

// Convert logical text to visual text for PDF rendering
export const visualizeBiDiText = (text: string): string => {
    if (!text) return '';
    // fontkit handles shaping natively, so we do not manually reverse the string 
    // to avoid double-reversing visual output.
    return text;
};
