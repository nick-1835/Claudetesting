// Pixel-art sprites, defined as text maps and baked into small canvases.
// Each character in a map is one pixel; '.' is transparent.

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

// ---------- Hero (34x40, side view, facing right) ----------
// Heroic proportions and a wide, low fighting stance: shield raised behind him,
// scarf trailing back, sword held low and ready. Frames were built with a small
// shape-based drawing script (limbs, torso, cape, shield) and auto-outlined.

const HERO_PAL = {
  k: '#1a1020', // outline
  h: '#5a2e18', // hair
  H: '#83492a', // hair highlight
  s: '#f0c090', // skin
  S: '#c88f60', // skin shade
  e: '#1a1020', // eye
  r: '#c8322a', // scarf
  R: '#8a1e1e', // scarf shade
  b: '#2f4f9a', // tunic
  B: '#213670', // tunic shade
  w: '#eef2f8', // steel highlight
  m: '#c2cad8', // steel
  M: '#7f879c', // steel shade
  l: '#6b4423', // leather strap / belt
  L: '#4a2e18', // leather shade
  g: '#e8b84a', // buckle
  x: '#b83030', // shield
  X: '#7a1e1e', // shield shade
  p: '#2a2440', // trousers
  P: '#1c1830', // trousers shade
  o: '#7a4a26', // boots
  O: '#4a2e18', // boot shade
};

const HERO_FRAMES = {
  stand: [
    '..................................',
    '...............kkkkkkk............',
    '..............khhkHHHk............',
    '.............khhkhhsssk...........',
    '............khhhkhhshhk...........',
    '............khhkhhSssek...........',
    '............kkkkhhSsssk...........',
    '...............khhSsssk...........',
    '................khSssk............',
    '..............kkkkkkkk............',
    '.........k..kkRRrrrrrk............',
    '.......kkmkkrrkkRRRkkkk...........',
    '......kmXwkrrkBbkkkwwwmk..........',
    '......kXXkrrkBlbbbkmmmmk..........',
    '.....kXXXkkkkBBlbbkkkkkk..........',
    '.....kXXXwxxkBBblbbkBkkk..........',
    '.....kwwwwwwkBBbblbbkkllk.........',
    '.....kmmmmmmkBBbbblbkklllk........',
    '.....kXXXmxxkBBbbbblk.kllk........',
    '.....kXXXmxxxkBbbbbkl.kLkkk.......',
    '......kXXmxxkkkkkkkkkl.kksk.......',
    '......kMXmxMkBBbbbbbk...kkk.......',
    '......kkkMkkBBBbbbbbbk............',
    '......kRRkRkBBBbbbbbbk............',
    '......kRRkkkBBBbbbbbbk............',
    '.....kkkkkkkkkBbbkkkbbk...........',
    '.....k...kkPPPkbkPPpkkkk..........',
    '........kPPPPPkk.kPPppppk.........',
    '.......kkkkkPPk...kPpkkkkk........',
    '.......kkMMkPk.....kPkmmkk........',
    '.......kMMMkk.......kkmmkk........',
    '......kPPMMkk.......kkmmmk........',
    '......kPPPkk.........kPppk........',
    '.....kPPPPk..........kPppk........',
    '....kkkkkk...........kkkkkk.......',
    '....kOOOOk...........kOoook.......',
    '....kOOOOk...........kOoook.......',
    '....kOOOOOkkk........kOooookkk....',
    '....kOOOOOOOk........kOooooook....',
    '....kkkkkkkkk........kkkkkkkkk....',
  ],
  walk1: [
    '..................................',
    '...............kkkkkkk............',
    '..............khhkHHHk............',
    '.............khhkhhsssk...........',
    '............khhhkhhshhk...........',
    '............khhkhhSssek...........',
    '............kkkkhhSsssk...........',
    '...............khhSsssk...........',
    '................khSssk............',
    '..............kkkkkkkk............',
    '.........k..kkRRrrrrrk............',
    '.......kkmkkrrkkRRRkkkk...........',
    '......kmXwkrrkBbkkkwwwmk..........',
    '......kXXkrrkBlbbbkmmmmk..........',
    '.....kXXXkkkkBBlbbkkkkkk..........',
    '.....kXXXwxxkBBblbbkBkkk..........',
    '.....kwwwwwwkBBbblbbkkllk.........',
    '.....kmmmmmmkBBbbblbkklllk........',
    '.....kXXXmxxkBBbbbblk.kllk........',
    '.....kXXXmxxxkBbbbbkl.kLkkk.......',
    '......kXXmxxkkkkkkkkkl.kksk.......',
    '......kMXmxMkBBbbbbbk...kkk.......',
    '......kkkMkkBBBbbbbbbk............',
    '......kRRkRkBBBbbbbbbk............',
    '......kRRkkkBBBbbbbbbk............',
    '.....kkkk.kkkkBbbkkkbbk...........',
    '.....k....kPPPkbkPppkkk...........',
    '..........kPPPPk.kPkkkkk..........',
    '.........kkkkkPk.kPkmmkk..........',
    '.........kkMMkk...kkmmmk..........',
    '.........kMMMkk...kkmmmk..........',
    '........kPPMMkk....kPppk..........',
    '........kPPPkk......kPppk.........',
    '.......kPPPPk.......kPppk.........',
    '......kkkkkk........kkkkkk........',
    '......kOOOOk........kOoook........',
    '......kOOOOk........kOoook........',
    '......kOOOOOkkk.....kOooookkk.....',
    '......kOOOOOOOk.....kOooooook.....',
    '......kkkkkkkkk.....kkkkkkkkk.....',
  ],
  walk2: [
    '..................................',
    '..................................',
    '...............kkkkkkk............',
    '..............khhkHHHk............',
    '.............khhkhhsssk...........',
    '............khhhkhhshhk...........',
    '............khhkhhSssek...........',
    '............kkkkhhSsssk...........',
    '...............khhSsssk...........',
    '................khSssk............',
    '..............kkkkkkkk............',
    '.........k..kkRRrrrrrk............',
    '.......kkmkkrrkkRRRkkkk...........',
    '......kmXwkrrkBbkkkwwwmk..........',
    '......kXXkrrkBlbbbkmmmmk..........',
    '.....kXXXkkkkBBlbbkkkkkk..........',
    '.....kXXXwxxkBBblbbkBkkk..........',
    '.....kwwwwwwkBBbblbbkkllk.........',
    '.....kmmmmmmkBBbbblbkklllk........',
    '.....kXXXmxxkBBbbbblk.kllk........',
    '.....kXXXmxxxkBbbbbkl.kLkkk.......',
    '......kXXmxxkkkkkkkkkl.kksk.......',
    '......kMXmxMkBBbbbbbk...kkk.......',
    '......kkkMkkBBBbbbbbbk............',
    '......kRRkRkBBBbbbbbbk............',
    '......kRRkkkBBBbbbbbbk............',
    '.....kkkk.kkkkBbbkkkbbk...........',
    '.....k....kkPPkbkpppkkk...........',
    '............kkkkkkkkk.............',
    '............kkMkkmmkk.............',
    '............kMMkkmmkk.............',
    '...........kPPMkkmmkk.............',
    '..........kkkkkkkppk..............',
    '..........kOoookkppk..............',
    '..........kOoookkkkkk.............',
    '..........kOoookOoook.............',
    '..........kkkkkkOoook.............',
    '...............kOooookkk..........',
    '...............kOooooook..........',
    '...............kkkkkkkkk..........',
  ],
  walk3: [
    '..................................',
    '...............kkkkkkk............',
    '..............khhkHHHk............',
    '.............khhkhhsssk...........',
    '............khhhkhhshhk...........',
    '............khhkhhSssek...........',
    '............kkkkhhSsssk...........',
    '...............khhSsssk...........',
    '................khSssk............',
    '..............kkkkkkkk............',
    '.........k..kkRRrrrrrk............',
    '.......kkmkkrrkkRRRkkkk...........',
    '......kmXwkrrkBbkkkwwwmk..........',
    '......kXXkrrkBlbbbkmmmmk..........',
    '.....kXXXkkkkBBlbbkkkkkk..........',
    '.....kXXXwxxkBBblbbkBkkk..........',
    '.....kwwwwwwkBBbblbbkkllk.........',
    '.....kmmmmmmkBBbbblbkklllk........',
    '.....kXXXmxxkBBbbbblk.kllk........',
    '.....kXXXmxxxkBbbbbkl.kLkkk.......',
    '......kXXmxxkkkkkkkkkl.kksk.......',
    '......kMXmxMkBBbbbbbk...kkk.......',
    '......kkkMkkBBBbbbbbbk............',
    '......kRRkRkBBBbbbbbbk............',
    '......kRRkkkBBBbbbbbbk............',
    '.....kkkk.kkkkBbbkkkbbk...........',
    '.....k....k.kkkbkppkkkk...........',
    '............kPPkppkPk.............',
    '...........kkkkkppkkkk............',
    '...........kkmmkpkMMkk............',
    '...........kmmmkkkMMMk............',
    '..........kPpmmkkkMMMk............',
    '..........kPppkk.kkPPk............',
    '.........kPpppk...kPPPk...........',
    '........kkkkkk....kkkkkk..........',
    '........kOoook....kOOOOk..........',
    '........kOoook....kOOOOk..........',
    '........kOooookkk.kOOOOOkkk.......',
    '........kOooooook.kOOOOOOOk.......',
    '........kkkkkkkkk.kkkkkkkkk.......',
  ],
  walk4: [
    '..................................',
    '..................................',
    '...............kkkkkkk............',
    '..............khhkHHHk............',
    '.............khhkhhsssk...........',
    '............khhhkhhshhk...........',
    '............khhkhhSssek...........',
    '............kkkkhhSsssk...........',
    '...............khhSsssk...........',
    '................khSssk............',
    '..............kkkkkkkk............',
    '.........k..kkRRrrrrrk............',
    '.......kkmkkrrkkRRRkkkk...........',
    '......kmXwkrrkBbkkkwwwmk..........',
    '......kXXkrrkBlbbbkmmmmk..........',
    '.....kXXXkkkkBBlbbkkkkkk..........',
    '.....kXXXwxxkBBblbbkBkkk..........',
    '.....kwwwwwwkBBbblbbkkllk.........',
    '.....kmmmmmmkBBbbblbkklllk........',
    '.....kXXXmxxkBBbbbblk.kllk........',
    '.....kXXXmxxxkBbbbbkl.kLkkk.......',
    '......kXXmxxkkkkkkkkkl.kksk.......',
    '......kMXmxMkBBbbbbbk...kkk.......',
    '......kkkMkkBBBbbbbbbk............',
    '......kRRkRkBBBbbbbbbk............',
    '......kRRkkkBBBbbbbbbk............',
    '.....kkkk.kkkkBbbkkkbbk...........',
    '.....k....kkPPkbkkkkkkk...........',
    '............kkkkkkmmkk............',
    '............kkMMkmmmkk............',
    '............kkMMkPmmkk............',
    '............kkMkPppkk.............',
    '.............kkkkkkk..............',
    '.............kkOoook..............',
    '............kkkOooookk............',
    '............kOkOoooook............',
    '............kOkkkkkkkk............',
    '............kOOOOOkkk.............',
    '............kOOOOOOOk.............',
    '............kkkkkkkkk.............',
  ],
  jump: [
    '..................................',
    '...............kkkkkkk............',
    '..............khhkHHHk............',
    '.............khhkhhsssk...........',
    '............khhhkhhshhk...........',
    '............khhkhhSssek...........',
    '............kkkkhhSsssk...........',
    '...............khhSsssk...........',
    '................khSssk............',
    '..............kkkkkkkk............',
    '.........k..kkRRrrrrrk............',
    '.......kkmkkrrkkRRRkkkk...........',
    '......kmXwkrrkBbkkkwwwmk..........',
    '......kXXkrrkBlbbbkmmmmk..........',
    '.....kXXXkkkkBBlbbkkkkkk..........',
    '.....kXXXwxxkBBblbbkBkkkk.........',
    '.....kwwwwwwkBBbblbbkklllk........',
    '.....kmmmmmmkBBbbblbkkllkkk.......',
    '.....kXXXmxxkBBbbbblk.kkksk.......',
    '.....kXXXmxxxkBbbbbkl...kkk.......',
    '......kXXmxxkkkkkkkkkl............',
    '......kMXmxMkBBbbbbbk.............',
    '......kkkMkkBBBbbbbbbk............',
    '......kRRkRkBBBbbbbbbk............',
    '......kRRkkkBBBbbbbbbkkk..........',
    '.....kkkkkkkkkBbbkkkbbkkk.........',
    '.....k..kkkkkPkbkkPpkkkkk.........',
    '........kkMMkPkk..kkmmmkk.........',
    '........kkMMkk.....kPmmkk.........',
    '........kkMMkk.....kppkk..........',
    '.........kPPk.....kPppk...........',
    '........kkkkkk...kkkkkk...........',
    '........kOoook...kOoook...........',
    '........kOooookk.kOooookk.........',
    '........kOoooook.kOoooook.........',
    '........kkkkkkkk.kkkkkkkk.........',
    '..................................',
    '..................................',
    '..................................',
    '..................................',
  ],
};

function heroSet(flip) {
  const make = (name) => bake(HERO_FRAMES[name], HERO_PAL, flip);
  const stand = make('stand');
  return {
    stand,
    walk: [make('walk1'), make('walk2'), make('walk3'), make('walk4')],
    walkBob: [0, 1, 0, 1], // body dips on the passing steps
    jump: make('jump'),
    flash: silhouette(stand),
  };
}

export const HERO = {
  w: 34,
  h: 40,
  hand: { x: 25, y: 20 }, // sword hand, facing right
  right: heroSet(false),
  left: heroSet(true),
};

// ---------- Bram the barkeep (20x26, facing the viewer) ----------

const PEOPLE_PAL = {
  k: '#1a1020',
  s: '#f0c090',
  S: '#c88f60',
  e: '#1a1020',
  m: '#8a5a2b', // mustache
  r: '#a83232', // shirt
  a: '#e8e0d0', // apron
  p: '#3a2a40',
  o: '#4a2e18',
  g: '#3f7a3a', // hood
  n: '#7a5230', // brown cloth
};

const BRAM_ROWS = [
  '......kkkkkkkk......',
  '.....kssssssssk.....',
  '....kssssssssssk....',
  '....kssssssssssk....',
  '...kSssesssssessSk..',
  '...kSsssssssssssSk..',
  '...kSsmmmmmmmmmsSk..',
  '...kSmmmmsssmmmmSk..',
  '....kSmmsssssmmSk...',
  '.....kkSsssssSkk....',
  '....krrrrrrrrrrrrk..',
  '...krrraaaaaaaarrrk.',
  '..kssraaaaaaaaarssk.',
  '..kssraaaaaaaaarssk.',
  '..kssraaaaaaaaarssk.',
  '...krraaaaaaaaarrk..',
  '....kaaaaaaaaaaak...',
  '....kaaaaaaaaaaak...',
  '....kaaaaaaaaaaak...',
  '....kpppppppppppk...',
  '....kppppk.kppppk...',
  '....kppppk.kppppk...',
  '....kppppk.kppppk...',
  '....kppppk.kppppk...',
  '....kooook.kooook...',
  '....kkkkkk.kkkkkk...',
];
export const BRAM = bake(BRAM_ROWS, PEOPLE_PAL);

// Sleeping patron: same build, green hood, brown clothes, eyes shut.
export const PATRON = bake(
  BRAM_ROWS.map((row, y) => (y < 4 ? row.replace(/s/g, 'g') : row.replace(/e/g, 'S'))),
  { ...PEOPLE_PAL, r: PEOPLE_PAL.g, a: PEOPLE_PAL.n },
);

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
