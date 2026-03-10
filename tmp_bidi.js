const bidiFactory = require('./node_modules/bidi-js/dist/bidi.js');
const bidi = bidiFactory();
function visualize(text, dir) {
    const lvls = bidi.getEmbeddingLevels(text, dir);
    const flips = bidi.getReorderSegments(text, lvls);
    const chars = text.split('');
    for (const [start, end] of flips) {
        let left = start, right = end;
        while (left < right) {
            let t = chars[left]; chars[left] = chars[right]; chars[right] = t;
            left++; right--;
        }
    }
    return chars.join('');
}

console.log('Original LTR input:', 'My Degree: התקדמות');
console.log('Visual Auto:', visualize('My Degree: התקדמות'));
console.log('Visual RTL:', visualize('My Degree: התקדמות', 'rtl'));
console.log('Visual LTR:', visualize('My Degree: התקדמות', 'ltr'));

console.log('---');
console.log('Original LTR input 2:', 'אלגברה 101');
console.log('Visual Auto:', visualize('אלגברה 101'));
console.log('Visual RTL:', visualize('אלגברה 101', 'rtl'));
console.log('Visual LTR:', visualize('אלגברה 101', 'ltr'));

console.log('---');
console.log('Original mixed:', 'התקדמות בתואר :My Degree');
console.log('Visual Auto:', visualize('התקדמות בתואר :My Degree'));
console.log('Visual RTL:', visualize('התקדמות בתואר :My Degree', 'rtl'));
console.log('Visual LTR:', visualize('התקדמות בתואר :My Degree', 'ltr'));
