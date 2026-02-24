import bidiFactory from 'bidi-js';

let bidi: any = null;

// Initialize bidi-js
const initBidi = () => {
    if (!bidi) {
        bidi = bidiFactory();
    }
    return bidi;
};

// Check if text contains Hebrew characters
export const hasHebrew = (text: string): boolean => {
    return /[\u0590-\u05FF]/.test(text);
};

// Convert logical text to visual text for PDF rendering
// Convert logical text to visual text for PDF rendering
export const visualizeBiDiText = (text: string): string => {
    if (!text) return '';
    // Optimization: if no Hebrew, just return text. 
    // However, if we want robust RTL for other langs, we should check broadly, but keeping to Hebrew for now is safer for perf.
    if (!hasHebrew(text)) return text;

    try {
        const bidiInstance = initBidi();

        // 1. Get Embedding Levels (Force RTL base direction for mixed content usually preferred in this context? 
        // Actually, if the string is "Course ABC", we want "Course ABC". If "קורס ABC", we want "ABC סרוק".
        // If we force RTL, 'Course ABC' might become 'ABC Course'?
        // 'auto' or explicit based on first strong char is better. bidi-js might infer if we don't pass direction?
        // README says: explicitDirection "ltr" or "rtl" if you don't want to auto-detect it.
        // Let's use auto-detection (pass nothing or undefined) or 'rtl' if we assume Hebrew context?
        // Given this is a hebrew app, 'rtl' base might be safer for "123" to be strictly handled?? 
        // No, '123' is neutral/weak. 
        // Let's try explicit 'rtl' as we did in the placeholder. 
        // Wait, if I pass 'rtl', "Hello" becomes "olleH"? 
        // Let's test assumption. 
        // If text is purely English "Hello", and base is RTL. 
        // "Hello" is LTR strong. So it embeds as LTR inside RTL.
        // Visual: "Hello" (right aligned). 
        // If I reverse the whole line for visual... 
        // Actually, let's use 'undefined' to let it auto-detect base direction from content.

        const embeddingLevels = bidiInstance.getEmbeddingLevels(text);

        // 2. Get Reorder Segments
        const flips = bidiInstance.getReorderSegments(text, embeddingLevels);

        // 3. Mirroring (e.g. parens)
        const mirroredMap = bidiInstance.getMirroredCharactersMap(text, embeddingLevels);

        // 4. Transform
        const chars = text.split('');

        // Apply mirroring
        if (mirroredMap.size > 0) {
            for (const [index, char] of mirroredMap) {
                chars[index] = char;
            }
        }

        // Apply flips
        for (const [start, end] of flips) {
            // Reverse the range [start, end] in place
            let left = start;
            let right = end;
            while (left < right) {
                const temp = chars[left];
                chars[left] = chars[right];
                chars[right] = temp;
                left++;
                right--;
            }
        }

        return chars.join('');

    } catch (e) {
        console.error('BiDi error', e);
        return text.split('').reverse().join(''); // Fallback
    }
};

// Note: bidi-js is low level. For robust PDF shaping, we often need to reverse the *visual* output.
// Since we can't easily implement full UAX#9 here without a heavy library, we will use a naive reverse for the "visual" output
// which is what PDF-Lib expects for RTL fonts usually (unless using a shaper).
// But standard RTL in generic fonts expects characters to be drawn right-to-left.
// PDF-Lib draws left-to-right. So visual string must be reversed.
