// Pixel-art sprites, defined as text maps and baked into small canvases.
// Each character in a map is one pixel; '.' is transparent.
import { ART_PALETTE, HERO_FRAMES, HERO_HAND, BRAM_ROWS, PATRON_ROWS } from './art.js';

export function bake(rows, palette, flip = false) {
  const h = rows.length;
  const w = rows[0].length;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  rows.forEach((row, y) => {
    if (row.length !== w) throw new Error(`Sprite row ${y} is ${row.length} wide, expected ${w}: "${row}"`);
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      const color = palette[ch];
      if (!color) throw new Error(`Unknown palette key "${ch}"`);
      g.fillStyle = color;
      g.fillRect(flip ? w - 1 - x : x, y, 1, 1);
    });
  });
  return c;
}

/** White silhouette of a sprite, used for the "just got hit" flash. */
export function silhouette(img) {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

// ---------- Hero, Bram and the patron ----------
// Drawn by tools/sprite_tool.py (posed shapes, shading, outlines) into art.js.

function heroSet(flip) {
  const make = (name) => bake(HERO_FRAMES[name], ART_PALETTE, flip);
  const stand = make('stand');
  return {
    stand,
    walk: [make('walk1'), make('walk2'), make('walk3'), make('walk4')],
    walkBob: [0, 1, 0, 1], // body dips on the passing steps
    jump: make('jump'),
    attack: make('attack'), // no sword arm: the game draws the arm swinging
    flash: silhouette(stand),
  };
}

export const HERO = {
  w: HERO_FRAMES.stand[0].length,
  h: HERO_FRAMES.stand.length,
  hand: HERO_HAND, // sword hand (held low behind him), facing right
  shoulder: { x: 18, y: 16 }, // sword-arm shoulder, facing right
  right: heroSet(false),
  left: heroSet(true),
};

// Bram faces left, toward customers coming in the front door.
export const BRAM = bake(BRAM_ROWS, ART_PALETTE, true);
export const PATRON = bake(PATRON_ROWS, ART_PALETTE);

// ---------- Enemies ----------

const SLIME_PAL = { k: '#12210f', g: '#5cc24a', G: '#3a8a30', w: '#c8f5b8', e: '#12210f' };
const SLIME_FRAMES = [
  [
    '.....kkkkkk.....',
    '...kkggggggkk...',
    '..kgwwggggggGk..',
    '.kgwggggggggGGk.',
    '.kggggekggekgGk.',
    'kggggggggggggGGk',
    'kggggggggggggGGk',
    'kGgggggggggggGGk',
    'kGGGggggggggGGGk',
    '.kkkkkkkkkkkkkk.',
  ],
  [
    '................',
    '................',
    '....kkkkkkkk....',
    '..kkgwwgggggkk..',
    '.kgwggggggggGGk.',
    'kggggekggekggGGk',
    'kggggggggggggGGk',
    'kGgggggggggggGGk',
    'kGGGGggggggGGGGk',
    '.kkkkkkkkkkkkkk.',
  ],
];

const RAT_PAL = { k: '#1a1020', r: '#7c7488', R: '#55506a', p: '#e89aa8', e: '#ff4040', w: '#e8e0f0' };
const RAT_FRAMES = [
  [
    '.........kk.......',
    '..kkkkkkkrpk......',
    '.krrrrrrrrrkkk....',
    'krrrrrrrrrrrrekk..',
    'kRrrrrrrrrrrrrrrpk',
    'kRRrrrrrrrrrrrwkk.',
    '.kRRkkRRkkkRRk....',
    'kk.kk..k.k..kk....',
  ],
  [
    '.........kk.......',
    '..kkkkkkkrpk......',
    '.krrrrrrrrrkkk....',
    'krrrrrrrrrrrrekk..',
    'kRrrrrrrrrrrrrrrpk',
    'kRRrrrrrrrrrrrwkk.',
    '.kRRkRRkkRRkkk....',
    '..kk.kk..kk.kk....',
  ],
];

function enemySet(frames, pal) {
  const right = frames.map((f) => bake(f, pal, false));
  const left = frames.map((f) => bake(f, pal, true));
  return { right, left, flash: right.map(silhouette), flashLeft: left.map(silhouette), w: frames[0][0].length, h: frames[0].length };
}

export const SLIME = enemySet(SLIME_FRAMES, SLIME_PAL);
// Rat art faces right; tails trail to the left.
export const RAT = enemySet(RAT_FRAMES, RAT_PAL);

// ---------- Pixel icons for the HUD (as inline SVG) ----------

function svgIcon(rows, colors) {
  const w = rows[0].length;
  const h = rows.length;
  let rects = '';
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== '.') rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${colors[ch]}"/>`;
  }));
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}

export const ICONS = {
  heart: svgIcon([
    '.kk.kk.',
    'krrkrrk',
    'krwrrrk',
    'krrrrrk',
    '.krrrk.',
    '..krk..',
    '...k...',
  ], { k: '#1a1020', r: '#e8453c', w: '#ffb3a8' }),
  coin: svgIcon([
    '.kkkk.',
    'kyyyyk',
    'kywyyk',
    'kyyydk',
    'kyyddk',
    '.kkkk.',
  ], { k: '#1a1020', y: '#f2c94c', w: '#fff3b0', d: '#c08a1e' }),
  key: svgIcon([
    '.kkk.......',
    'kyyyk......',
    'ky.ykkkkkk.',
    'kyyyyyyyyyk',
    '.kkk.kyky.k',
    '......k.k..',
  ], { k: '#1a1020', y: '#f2c94c' }),
};
