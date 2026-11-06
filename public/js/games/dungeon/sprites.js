// Pixel-art character sprites, defined as text maps and baked into small canvases.
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

function bake(rows, palette = PALETTE, flip = false) {
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

// ---------- Hero (12x16) ----------

const FRONT_TOP = [
  '...kkkkkk...',
  '..khhhhhhk..',
  '.khhhhhhhhk.',
  '.khsssssshk.',
  '.kskssssksk.',
  '.kssssssssk.',
  '..kssssssk..',
  '.kttttttttk.',
  'kstttbbtttsk',
  'ksttttttttsk',
  '.kbbbbbbbbk.',
  '.kppppppppk.',
  '.kpppkkpppk.',
];
const BACK_TOP = [
  '...kkkkkk...',
  '..khhhhhhk..',
  '.khhhhhhhhk.',
  '.khhhhhhhhk.',
  '.khhhhhhhhk.',
  '.kshhhhhhsk.',
  '..kssssssk..',
  '.kttttttttk.',
  'ksttttttttsk',
  'ksttttttttsk',
  '.kbbbbbbbbk.',
  '.kppppppppk.',
  '.kpppkkpppk.',
];
const SIDE_TOP = [
  '...kkkkkk...',
  '..khhhhhhk..',
  '.khhhhhhhhk.',
  '.khhhssssk..',
  '.khhsssksk..',
  '.khssssssk..',
  '..kssssk....',
  '..kttttttk..',
  '..kttttstk..',
  '..kttttstk..',
  '..kbbbbbbk..',
  '..kppppppk..',
  '..kppkkppk..',
];
const FRONT_LEGS = {
  stand: ['.kppk..kppk.', '.kook..kook.', '..kk....kk..'],
  a: ['.kppk..kook.', '.kook...kk..', '..kk........'],
  b: ['.kook..kppk.', '..kk...kook.', '........kk..'],
};
const SIDE_LEGS = {
  stand: ['..kpk..kpk..', '..kok..kok..', '..kk...kk...'],
  a: ['.kpk....kpk.', '.kok....kok.', '.kk.....kk..'],
  b: ['...kpkkpk...', '...kokkok...', '...kk.kk....'],
};

function frames(top, legs, palette, flip) {
  // Walk cycle: stride A, stand, stride B, stand.
  const stand = bake([...top, ...legs.stand], palette, flip);
  return [bake([...top, ...legs.a], palette, flip), stand, bake([...top, ...legs.b], palette, flip), stand];
}

export const HERO = {
  down: frames(FRONT_TOP, FRONT_LEGS),
  up: frames(BACK_TOP, FRONT_LEGS),
  right: frames(SIDE_TOP, SIDE_LEGS),
  left: frames(SIDE_TOP, SIDE_LEGS, PALETTE, true),
};

// ---------- Barkeep (12x16) ----------

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

// ---------- Sleeping patron: the hero's shape in a green hood, eyes shut ----------

const SLEEPY_TOP = FRONT_TOP.map((row, i) => (i === 4 ? '.kskksskksk.' : row));
export const PATRON = bake([...SLEEPY_TOP, ...FRONT_LEGS.stand], { ...PALETTE, h: PALETTE.g, t: PALETTE.n });
