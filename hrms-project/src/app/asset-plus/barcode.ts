/** Code 39 barcode as SVG rects (asset codes are A–Z, 0–9, '-', '.', ' '). v1.12.0 */
const C39: Record<string, string> = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn', '4': 'nnnwwnnnw', '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn', '9': 'nnwwnnwnn', A: 'wnnnnwnnw', B: 'nnwnnwnnw', C: 'wnwnnwnnn', D: 'nnnnwwnnw', E: 'wnnnwwnnn', F: 'nnwnwwnnn',
  G: 'nnnnnwwnw', H: 'wnnnnwwnn', I: 'nnwnnwwnn', J: 'nnnnwwwnn', K: 'wnnnnnnww', L: 'nnwnnnnww', M: 'wnwnnnnwn', N: 'nnnnwnnww',
  O: 'wnnnwnnwn', P: 'nnwnwnnwn', Q: 'nnnnnnwww', R: 'wnnnnnwwn', S: 'nnwnnnwwn', T: 'nnnnwnwwn', U: 'wwnnnnnnw', V: 'nwwnnnnnw',
  W: 'wwwnnnnnn', X: 'nwnnwnnnw', Y: 'wwnnwnnnn', Z: 'nwwnwnnnn', '-': 'nwnnnnwnw', '.': 'wwnnnnwnn', ' ': 'nwwnnnwnn', '*': 'nwnnwnwnn',
};

export interface Bar { x: number; w: number; }

/** Bars of the code (narrow = 1 unit, wide = 3 units, 1 unit gap between characters) and the total width. */
export function code39(text: string): { bars: Bar[]; width: number } {
  const s = `*${(text || '').toUpperCase().replace(/[^0-9A-Z\-. ]/g, '-')}*`;
  const bars: Bar[] = [];
  let x = 0;
  for (const ch of s) {
    const p = C39[ch] || C39['-'];
    for (let i = 0; i < 9; i++) {
      const w = p[i] === 'w' ? 3 : 1;
      if (i % 2 === 0) bars.push({ x, w });
      x += w;
    }
    x += 1;
  }
  return { bars, width: x };
}
