// Pixel-art sprites, defined as text maps and baked into small canvases.
// Each character in a map is one pixel; '.' is transparent.

export const PALETTE = {
  k: '#1a1020', // outline
  s: '#f2c29b', // skin
  h: '#6b3e1f', // hair
  t: '#3b6fd8', // tunic
  b: '#5a3a1a', // belt
  p: '#3a2a40', // pants
  o: '#2a1a10', // boots
  m: '#8a5a2b', // mustache
  a: '#e8e0d0', // apron
  r: '#a83232', // shirt
  g: '#3f7a3a', // hood
  n: '#7a5230', // brown cloth
};

const KNIGHT_PAL = {
  k: '#1a1020', // outline
  r: '#d63c2f', // plume
  R: '#8e2a1f', // plume shade
  L: '#eef2f8', // steel highlight
  S: '#b4bccb', // steel
  D: '#6c7484', // steel shade
  t: '#2f5fb3', // tabard
  T: '#21447f', // tabard shade
  y: '#e8b84a', // gold trim
  b: '#5a3a1a', // belt
  o: '#3a2a20', // boots
  g: '#7a4e2a', // glove
};

export function bake(rows, palette = PALETTE, flip = false) {
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

// ---------- Knight (16x18, side view, facing right) ----------

const KNIGHT_TOP = [
  '.......rr.......',
  '......rRRr......',
  '.....kkkkkk.....',
  '....kLLLSSSk....',
  '....kLSSSSSSk...',
  '....kSSSSkkkk...',
  '....kSSSSSSDk...',
  '....kDSSSSDDk...',
  '.....kkkkkkk....',
  '....kSttyttSk...',
  '...kSktttttkSk..',
  '...kSktyTttkgk..',
  '....kbbbbbbk....',
  '....ktttTttk....',
];
const KNIGHT_LEGS = {
  stand: ['....kDDkDDDk....', '....kSDk.kSDk...', '...koook.koook..', '...kkkkk.kkkkk..'],
  a: ['...kDDk..kDDk...', '..kSDk....kSDk..', '.koook....koook.', '.kkkkk....kkkkk.'],
  b: ['.....kDDDDk.....', '.....kSDSDk.....', '....koooook.....', '....kkkkkkk.....'],
  jump: ['....kDDkDDk.....', '...kSDk.kSDk....', '...kook..kook...', '...kkk...kkk....'],
};

function knightSet(flip) {
  const make = (legs) => bake([...KNIGHT_TOP, ...legs], KNIGHT_PAL, flip);
  const stand = make(KNIGHT_LEGS.stand);
  return { stand, walk: [make(KNIGHT_LEGS.a), stand, make(KNIGHT_LEGS.b), stand], jump: make(KNIGHT_LEGS.jump) };
}

export const KNIGHT = {
  w: 16,
  h: 18,
  hand: { x: 12, y: 11 }, // sword hand, facing right
  right: knightSet(false),
  left: knightSet(true),
};

// ---------- Barkeep (12x16, facing the viewer) ----------

export const BARKEEP = bake([
  '...kkkkkk...',
  '..kssssssk..',
  '.kssssssssk.',
  '.kskssssksk.',
  '.ksmmmmmmsk.',
  '.ksmmssmmsk.',
  '..kssssssk..',
  '.krrrrrrrrk.',
  'ksraaaaaarsk',
  'ksraaaaaarsk',
  '.kraaaaaark.',
  '.kaaaaaaaak.',
  '.kppppppppk.',
  '.kppk..kppk.',
  '.kook..kook.',
  '..kk....kk..',
]);

// ---------- Sleeping patron in a green hood ----------

export const PATRON = bake([
  '...kkkkkk...',
  '..kggggggk..',
  '.kggggggggk.',
  '.kgsssssgk..',
  '.kgskksskk..',
  '.kgssssssk..',
  '..kssssssk..',
  '.knnnnnnnnk.',
  'ksnnnbbnnnsk',
  'ksnnnnnnnnsk',
  '.kbbbbbbbbk.',
  '.kppppppppk.',
  '.kpppkkpppk.',
  '.kppk..kppk.',
  '.kook..kook.',
  '..kk....kk..',
]);

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
