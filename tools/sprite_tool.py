# Pixel-art authoring tool for Dungeon Delve characters.
#
# Characters are built back-to-front from posed shapes (head, limbs, torso, armour,
# shield). Each part is shaded with light from the upper right and outlined: edges
# against empty space get a dark outline, edges against other parts get the part's
# own deep shade, which keeps forms crisp without looking like thick-lined blobs.
#
# Usage: python3 tools/sprite_tool.py <preview_dir>
#   -> <preview_dir>/sheet.png (10x preview), <preview_dir>/sprites.json, and
#      public/js/games/dungeon/art.js (the frames the game loads; generated, don't hand-edit)
import json
import math
import sys

from PIL import Image

PAL = {
    'k': '#140c18',
    # skin
    's': '#eab88a', 'S': '#c48a5c', 'q': '#8f5a38',
    # hair
    'h': '#3a2014', 'H': '#5e3620', 'j': '#24140c',
    'e': '#140c18',
    # scarf / shirt red
    'r': '#b8302a', 'R': '#7a1c1c', 'u': '#d8584a',
    # tunic blue
    'c': '#4c70c4', 'b': '#2f4f9a', 'B': '#213670', 'd': '#16244e',
    # steel
    'w': '#eef2f8', 'm': '#b9c2d2', 'M': '#7c8499', 'n': '#4a5064',
    # leather
    'l': '#7a4e2a', 'L': '#4a2e18', 'i': '#2e1c10',
    # gold
    'g': '#e8b84a', 'G': '#a87a22',
    # shield red
    'y': '#d85040', 'x': '#b83030', 'X': '#7a1e1e', 'z': '#4e1212',
    # trousers
    'p': '#3a3450', 'P': '#26223a', 'v': '#18142a',
    # boots
    'o': '#7a4a26', 'O': '#4a2e18', 'f': '#2e1c10',
    # apron / cloth
    'a': '#e8e0d0', 'A': '#b8ad98', 'E': '#857a68',
    # green hood
    't': '#4f8a44', 'T': '#2f5a2a', 'F': '#1c3a1a',
    # brown cloth
    'N': '#7a5230', 'Q': '#553820', 'K': '#3a2614',
    # beard
    'D': '#8a5a2b', 'C': '#5e3c1c',
    # shirt (cream)
    'J': '#f0e8d6', 'I': '#cfc3a8', 'U': '#9a8e76',
    # vest (brown)
    'Y': '#7a4826', 'Z': '#53301a', '1': '#2e180c',
    # grey hair
    '2': '#a0968e', '3': '#6e6660',
    # eye white
    '5': '#f4f0e8',
}

# Material ramps: (highlight, base, shade, deep)
RAMP = {
    'skin': ('s', 's', 'S', 'q'),
    'hair': ('H', 'h', 'h', 'j'),
    'scarf': ('u', 'r', 'R', 'R'),
    'tunic': ('c', 'b', 'B', 'd'),
    'steel': ('w', 'm', 'M', 'n'),
    'leather': ('l', 'l', 'L', 'i'),
    'shield': ('y', 'x', 'X', 'z'),
    'pants': ('p', 'p', 'P', 'v'),
    'boot': ('o', 'o', 'O', 'f'),
    'apron': ('a', 'a', 'A', 'E'),
    'hood': ('t', 't', 'T', 'F'),
    'cloth': ('N', 'N', 'Q', 'K'),
    'beard': ('D', 'D', 'C', 'C'),
    'gold': ('g', 'g', 'G', 'G'),
    'shirt': ('J', 'J', 'I', 'U'),
    'vest': ('Y', 'Y', 'Z', '1'),
    'grey': ('2', '2', '3', '3'),
}


class Sprite:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.g = [['.'] * w for _ in range(h)]
        self.owner = [[None] * w for _ in range(h)]
        self.n = 0

    def part(self, cells, ramp, shade_fn=None, outline=True):
        """cells: set of (x, y). shade_fn(x, y) -> 0 highlight, 1 base, 2 shade."""
        hi, base, sh, deep = RAMP[ramp]
        self.n += 1
        pid = self.n
        cells = {(x, y) for (x, y) in cells if 0 <= x < self.w and 0 <= y < self.h}
        for (x, y) in cells:
            tone = shade_fn(x, y) if shade_fn else 1
            ch = (hi, base, sh)[tone]
            if outline:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nb = (x + dx, y + dy)
                    if nb in cells:
                        continue
                    inside = 0 <= nb[0] < self.w and 0 <= nb[1] < self.h
                    if not inside or self.g[nb[1]][nb[0]] == '.':
                        ch = 'k'
                        break
                    ch = deep
            self.g[y][x] = ch
            self.owner[y][x] = pid
        # Pixels of earlier parts that now border this part get their edge darkened too.
        return cells

    def set(self, x, y, ch):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.g[y][x] = ch

    def outline_silhouette(self):
        """Make sure the outside edge of the whole figure is a clean dark line."""
        out = []
        for y in range(self.h):
            for x in range(self.w):
                if self.g[y][x] != '.':
                    continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < self.w and 0 <= ny < self.h and self.g[ny][nx] not in '.k':
                        out.append((x, y))
                        break
        # Only outline pixels that touch a coloured pixel diagonally-free (keeps it 1px thin).
        for (x, y) in out:
            pass

    def rows(self):
        return [''.join(r) for r in self.g]


# ---------- shape helpers ----------

def poly(points):
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    cells = set()
    for y in range(int(min(ys)) - 1, int(max(ys)) + 2):
        for x in range(int(min(xs)) - 1, int(max(xs)) + 2):
            px, py = x + 0.5, y + 0.5
            inside = False
            for i in range(len(points)):
                (ax, ay), (bx, by) = points[i], points[(i + 1) % len(points)]
                if (ay > py) != (by > py) and px < (bx - ax) * (py - ay) / (by - ay) + ax:
                    inside = not inside
            if inside:
                cells.add((x, y))
    return cells


def limb(a, b, ra, rb=None):
    """Tapered capsule from a (radius ra) to b (radius rb)."""
    rb = ra if rb is None else rb
    (x0, y0), (x1, y1) = a, b
    cells = set()
    for y in range(int(min(y0, y1) - max(ra, rb)) - 1, int(max(y0, y1) + max(ra, rb)) + 2):
        for x in range(int(min(x0, x1) - max(ra, rb)) - 1, int(max(x0, x1) + max(ra, rb)) + 2):
            px, py = x + 0.5, y + 0.5
            dx, dy = x1 - x0, y1 - y0
            L2 = dx * dx + dy * dy or 1e-9
            t = max(0, min(1, ((px - x0) * dx + (py - y0) * dy) / L2))
            cx, cy = x0 + t * dx, y0 + t * dy
            if math.hypot(px - cx, py - cy) <= ra + (rb - ra) * t:
                cells.add((x, y))
    return cells


def ellipse(cx, cy, rx, ry):
    cells = set()
    for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
        for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
            nx, ny = (x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry
            if nx * nx + ny * ny <= 1:
                cells.add((x, y))
    return cells


def side_shade(cells, light=0.25, dark=0.3):
    """Shade by horizontal position: right edge lit, left side in shadow."""
    xs = [c[0] for c in cells] or [0]
    x0, x1 = min(xs), max(xs)
    span = max(1, x1 - x0)

    def fn(x, y):
        t = (x - x0) / span
        if t > 1 - light:
            return 0
        if t < dark:
            return 2
        return 1
    return fn


def limb_shade(a, b):
    """Shade a limb by which side of its axis a pixel is on (light from upper right)."""
    (x0, y0), (x1, y1) = a, b
    nx, ny = -(y1 - y0), (x1 - x0)
    L = math.hypot(nx, ny) or 1
    nx, ny = nx / L, ny / L
    if nx * 1 + ny * -1 < 0:  # make the normal point toward the light (right / up)
        nx, ny = -nx, -ny

    def fn(x, y):
        dx, dy = x + 0.5 - x0, y + 0.5 - y0
        tx, ty = x1 - x0, y1 - y0
        T2 = tx * tx + ty * ty or 1e-9
        t = max(0, min(1, (dx * tx + dy * ty) / T2))
        px, py = x + 0.5 - (x0 + t * tx), y + 0.5 - (y0 + t * ty)
        d = px * nx + py * ny
        if d > 1.0:
            return 0
        if d < -0.6:
            return 2
        return 1
    return fn


# ---------- the hero ----------

HERO_W, HERO_H = 40, 48


def boot_cells(ax, ay, ground, toe=1, lifted=False):
    cells = set()
    top = int(ay)
    bottom = top + 5 if lifted else ground
    for y in range(top, bottom + 1):
        for x in range(int(ax) - 2, int(ax) + 3):
            cells.add((x, y))
    # foot
    for y in range(bottom - 2, bottom + 1):
        for x in range(int(ax) - 2, int(ax) + 3 + 3 * toe if toe > 0 else int(ax) + 3):
            cells.add((x, y))
    return cells


def hero_leg(sp, hip, knee, ankle, near, lifted=False):
    ground = HERO_H - 1
    ramp = 'pants'
    thigh = limb(hip, knee, 3.2, 2.5)
    sp.part(thigh, ramp, limb_shade(hip, knee) if near else (lambda x, y: 2))
    shin = limb(knee, ankle, 2.4, 1.9)
    sp.part(shin, ramp, limb_shade(knee, ankle) if near else (lambda x, y: 2))
    kg = ellipse(knee[0] + 0.6, knee[1], 2.3, 2.0)
    sp.part(kg, 'steel', side_shade(kg) if near else (lambda x, y: 2))
    b = boot_cells(ankle[0], ankle[1] - 1, ground, 1, lifted)
    sp.part(b, 'boot', side_shade(b, 0.2, 0.35) if near else (lambda x, y: 2))


def hero_frame(pose):
    sp = Sprite(HERO_W, HERO_H)
    oy = pose.get('bob', 0)
    Y = lambda v: v + oy

    back, front = pose['back'], pose['front']
    # 1. back leg
    hero_leg(sp, (18, Y(31)), back[0], back[1], False, len(back) > 2)
    # 2. far arm: holds the sword low behind him (left out of the attack body; the game draws it)
    hx, hy = pose.get('hand', (12, 26))
    hy = Y(hy)
    if not pose.get('no_sword_arm'):
        sp.part(limb((18, Y(16)), (15, Y(22)), 2.1, 1.9), 'tunic', lambda x, y: 2)
        sp.part(limb((15, Y(22)), (hx, hy), 1.9, 1.7), 'leather', lambda x, y: 2)
        sp.part(ellipse(hx - 0.2, hy + 0.2, 1.8, 1.7), 'leather', lambda x, y: 2)
    # 3. front leg
    hero_leg(sp, (22, Y(31)), front[0], front[1], True, len(front) > 2)
    # 4. tunic skirt with a split
    skirt = poly([(16, Y(26)), (25, Y(26)), (27, Y(33)), (23, Y(32)), (21, Y(34)), (19, Y(32)), (15, Y(33))])
    sp.part(skirt, 'tunic', side_shade(skirt))
    # 5. torso: broad chest tapering to the waist
    torso = poly([(15, Y(14)), (25, Y(14)), (27, Y(17)), (25, Y(26)), (17, Y(26)), (15, Y(20)), (14, Y(16))])
    sp.part(torso, 'tunic', side_shade(torso))
    # breastplate
    plate = poly([(17, Y(15)), (25.5, Y(15)), (26, Y(19)), (24, Y(23)), (19, Y(23)), (17, Y(20))])
    sp.part(plate, 'steel', side_shade(plate, 0.3, 0.3))
    for x in range(19, 25):
        sp.set(x, Y(19), 'M')  # plate ridge
    # belt + buckle
    belt = poly([(16.5, Y(24)), (25.5, Y(24)), (25.3, Y(26.2)), (16.7, Y(26.2))])
    sp.part(belt, 'leather', side_shade(belt))
    sp.set(22, Y(25), 'g'); sp.set(23, Y(25), 'g')
    # 6. neck + scarf
    sp.part(limb((21.5, Y(11)), (21.5, Y(14)), 1.6), 'skin', lambda x, y: 2)
    scarf = ellipse(21.5, Y(14), 4.6, 1.8) | limb((18, Y(14)), (15, Y(17)), 1.2, 0.8)
    sp.part(scarf, 'scarf', side_shade(scarf))
    # 7. head: profile facing right, square jaw
    head = poly([(17.5, Y(5)), (19, Y(2.5)), (23, Y(2)), (25.5, Y(4)), (26, Y(6)), (27, Y(8)), (26, Y(9)),
                 (25.8, Y(10.5)), (24.5, Y(12)), (21, Y(12)), (18.5, Y(10.5)), (17.5, Y(8))])
    sp.part(head, 'skin', lambda x, y: 2 if x < 21 or y > Y(11) else 1)
    # short hair: top and back of the head
    hair = {(x, y) for (x, y) in head if y < Y(4.5) or (x < 21 and y < Y(9)) or (x < 22.5 and y < Y(5.5))}
    hair |= {(x, Y(4)) for x in range(23, 26)}
    sp.part(hair, 'hair', lambda x, y: 0 if y < Y(3.5) and x > 19 else 1)
    sp.set(20, Y(8), 'S')    # ear
    sp.set(19, Y(8), 'q')
    sp.set(23, Y(6), 'e')    # eye
    sp.set(24, Y(6), '5')
    sp.set(23, Y(5), 'j'); sp.set(24, Y(5), 'j')  # brow
    sp.set(26, Y(9), 'S')    # under the nose
    sp.set(25, Y(10), 'q')   # mouth
    # 8. near arm reaches forward and holds the shield out in front
    upper = ((25, Y(16)), (26.5, Y(21)))
    sp.part(limb(upper[0], upper[1], 2.3, 2.0), 'tunic', limb_shade(*upper))
    fore = ((26.5, Y(21)), (30, Y(22)))
    sp.part(limb(fore[0], fore[1], 2.0, 1.8), 'leather', limb_shade(*fore))
    paul = poly([(22.5, Y(14.5)), (26, Y(14)), (28.3, Y(16)), (28.3, Y(18.5)), (24, Y(18.8)), (22.5, Y(17))])
    sp.part(paul, 'steel', side_shade(paul, 0.35, 0.25))
    for x in range(23, 28):
        sp.set(x, Y(17), 'M')  # layered plate line
    # 9. tall rounded shield (left hand, in front): thick silver rim, red face, light bevel band
    sx, sy = pose.get('shield', (30.5, 23))
    sy = Y(sy)
    rx, ry = 5.2, 8.6
    shield = set()
    for y in range(int(sy - ry) - 1, int(sy + ry) + 2):
        for x in range(int(sx - rx) - 1, int(sx + rx) + 2):
            nx, ny = (x + 0.5 - sx) / rx, (y + 0.5 - sy) / ry
            if abs(nx) ** 2.6 + abs(ny) ** 2.2 <= 1:
                shield.add((x, y))
    sp.part(shield, 'steel', lambda x, y: 0 if (x > sx + 1 or y < sy - ry + 3) else (2 if x < sx - 2 else 1))
    for (x, y) in shield:
        nx, ny = (x + 0.5 - sx) / (rx - 1.8), (y + 0.5 - sy) / (ry - 1.8)
        if abs(nx) ** 2.6 + abs(ny) ** 2.2 <= 1:
            d = (x + 0.5 - sx) - (y + 0.5 - sy) * 0.35  # diagonal band across the face
            if 0.4 < d < 2.0:
                ch = 'y'
            elif x < sx - 1.5 or y > sy + ry - 4:
                ch = 'X'
            else:
                ch = 'x'
            sp.set(x, y, ch)
    # inner edge of the rim catches a dark line so the face reads as recessed
    face = {(x, y) for (x, y) in shield if sp.g[y][x] in 'yxX'}
    for (x, y) in face:
        if any((x + dx, y + dy) not in face for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            if y < sy - 1 or x < sx:
                sp.set(x, y, 'z')
    return sp.rows(), (hx, hy)


HERO_POSES = {
    'stand': {'back': ((14, 37), (11, 43)), 'front': ((27, 37), (28, 43))},
    'walk1': {'back': ((15, 37), (12, 43)), 'front': ((26, 37), (28, 43))},
    'walk2': {'back': ((19, 37), (17, 41), True), 'front': ((22, 38), (22, 43)), 'bob': 1},
    'walk3': {'back': ((24, 37), (26, 43)), 'front': ((17, 37), (14, 43))},
    'walk4': {'back': ((19, 38), (19, 43)), 'front': ((24, 37), (22, 41), True), 'bob': 1},
    'jump': {'back': ((15, 35), (14, 39), True), 'front': ((27, 34), (25, 39), True), 'hand': (12, 24), 'shield': (30.5, 21)},
    'attack': {'back': ((14, 37), (11, 43)), 'front': ((27, 37), (28, 43)), 'no_sword_arm': True},
}


# ---------- Bram (upper body behind the bar, facing right; flipped in game) ----------

def bram():
    """Upper body (he stands behind the bar), facing the viewer."""
    sp = Sprite(34, 34)
    # torso: sloped shoulders and a bit of a belly
    torso = poly([(12, 15), (22, 15), (27, 17), (29, 21), (28, 34), (6, 34), (5, 21), (7, 17)])
    sp.part(torso, 'shirt', side_shade(torso, 0.2, 0.25))
    # vest: two panels with a V opening, gold buttons
    left = poly([(7, 17), (13, 15.5), (16, 25), (16, 34), (6, 34), (5.5, 21)])
    right = poly([(21, 15.5), (27, 17), (28.5, 21), (28, 34), (18, 34), (18, 25)])
    sp.part(left, 'vest', lambda x, y: 2 if x < 9 else 1)
    sp.part(right, 'vest', lambda x, y: 0 if x > 25 else 1)
    for y in (24, 27, 30):
        sp.set(15, y, 'g')
    # apron string tied at the waist
    for x in range(6, 29):
        sp.set(x, 31, 'A' if x % 5 else 'E')
    # arms: upper arms down his sides, forearms (sleeves rolled up) bent in to the hands at the counter
    for side in (-1, 1):
        sh = (17 + side * 10.5, 18)
        el = (17 + side * 12.5, 24)
        hand = (17 + side * 4.5, 26)
        sp.part(limb(sh, el, 2.6, 2.4), 'shirt', lambda x, y, s=side: 0 if s > 0 else 2)
        sp.part(limb(el, hand, 2.2, 1.9), 'skin', lambda x, y, s=side: 1 if s > 0 else 2)
        sp.part(ellipse(el[0], el[1] - 0.5, 2.7, 1.7), 'shirt', lambda x, y: 1)  # rolled cuff
        sp.part(ellipse(hand[0], hand[1], 2.0, 1.8), 'skin', lambda x, y: 1)
    # towel over his left shoulder (our right), with red check stripes
    towel = poly([(22, 14.5), (26.5, 15.5), (27.5, 24), (24.5, 25), (23.5, 18)])
    sp.part(towel, 'apron', lambda x, y: 0)
    for (x, y) in towel:
        if y in (19, 22) and sp.g[y][x] not in 'kE':
            sp.set(x, y, 'r')
    # neck and head
    sp.part(limb((17, 12), (17, 15), 3.0), 'skin', lambda x, y: 2)
    head = poly([(12.5, 4), (14.5, 1.5), (19.5, 1.5), (21.5, 4), (22.2, 8), (21.5, 12), (19, 15), (15, 15),
                 (12.5, 12), (11.8, 8)])
    sp.part(head, 'skin', lambda x, y: 0 if (x > 17 and y < 5) else (2 if x < 14 else 1))
    # ears
    sp.part(ellipse(11.4, 8.5, 1.3, 1.8), 'skin', lambda x, y: 2)
    sp.part(ellipse(22.6, 8.5, 1.3, 1.8), 'skin', lambda x, y: 1)
    # grey fringe on the sides (bald on top)
    for (x, y) in head:
        if y >= 4 and y <= 8 and (x <= 12 or x >= 22):
            sp.set(x, y, '2' if x >= 22 else '3')
    # brows, eyes, nose
    for x in (13, 14, 15):
        sp.set(x, 6, '3')
    for x in (19, 20, 21):
        sp.set(x, 6, '3')
    sp.set(14, 7, '5'); sp.set(15, 7, 'e')
    sp.set(19, 7, 'e'); sp.set(20, 7, '5')
    sp.set(17, 7, 'S'); sp.set(17, 8, 'S'); sp.set(16, 9, 'S'); sp.set(17, 9, 's'); sp.set(18, 9, 'q')
    sp.set(13, 9, 'S'); sp.set(21, 9, 'S')  # cheeks
    # big mustache and a short beard
    beard = poly([(12.5, 11), (21.5, 11), (21.8, 13), (20, 16.5), (17, 17.5), (14, 16.5), (12.2, 13)])
    sp.part(beard, 'beard', lambda x, y: 0 if (x > 17 and y < 13) else (2 if x < 15 or y > 15 else 1))
    stache = poly([(11.5, 10.6), (16.5, 9.8), (17, 10.4), (17.5, 9.8), (22.5, 10.6), (21, 12.2), (17, 11.6), (13, 12.2)])
    sp.part(stache, 'beard', lambda x, y: 0 if x > 17 else 1)
    sp.set(16, 13, 'q'); sp.set(17, 13, 'q'); sp.set(18, 13, 'q')  # mouth
    return sp.rows()


# ---------- Sleeping patron, slumped over the table ----------

def patron():
    sp = Sprite(30, 24)
    back = poly([(4, 24), (5, 14), (9, 8), (15, 6), (20, 8), (22, 14), (24, 24)])
    sp.part(back, 'cloth', side_shade(back))
    arms = ellipse(18, 19, 9, 3.5)
    sp.part(arms, 'cloth', lambda x, y: 0 if y < 18 else 1)
    hood = poly([(10, 6), (13, 2), (19, 1.5), (24, 4), (26, 9), (25, 14), (20, 17), (14, 15), (10, 11)])
    sp.part(hood, 'hood', side_shade(hood))
    face = poly([(18, 9), (24, 8.5), (24.5, 13), (21, 15.5), (18, 14)])
    sp.part(face, 'skin', lambda x, y: 2 if y > 13 else 1)
    sp.set(21, 11, 'q'); sp.set(22, 11, 'q')  # closed eye
    sp.set(23, 14, 'q')
    return sp.rows()


def render(frames, path, scale=10):
    widths = [len(f[0]) for f in frames]
    height = max(len(f) for f in frames)
    sheet = Image.new('RGB', ((sum(widths) + 2 * len(frames)) * scale, height * scale), '#2a3a5a')
    ox = 0
    for f in frames:
        for y, row in enumerate(f):
            for x, ch in enumerate(row):
                if ch == '.':
                    continue
                col = PAL[ch]
                rgb = tuple(int(col[j:j + 2], 16) for j in (1, 3, 5))
                for yy in range(scale):
                    for xx in range(scale):
                        sheet.putpixel(((ox + x) * scale + xx, (height - len(f) + y) * scale + yy), rgb)
        ox += len(f[0]) + 2
    sheet.save(path)


if __name__ == '__main__':
    out = sys.argv[1]
    hero = {k: hero_frame(v) for k, v in HERO_POSES.items()}
    b, p = bram(), patron()
    render([r for r, _ in hero.values()] + [b, p], f'{out}/sheet.png')
    json.dump({
        'hero': {k: r for k, (r, _) in hero.items()},
        'hand': {k: h for k, (_, h) in hero.items()},
        'bram': b,
        'patron': p,
        'palette': PAL,
    }, open(f'{out}/sprites.json', 'w'))
    import os
    js_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'js', 'games', 'dungeon', 'art.js')
    def arr(rows, ind='  '):
        return '[\n' + ''.join(f"{ind}  '{r}',\n" for r in rows) + f'{ind}]'
    with open(js_path, 'w') as f:
        f.write('// Generated by tools/sprite_tool.py. Edit the tool and re-run it instead of editing this file.\n\n')
        f.write('export const ART_PALETTE = ' + json.dumps(PAL, indent=2) + ';\n\n')
        f.write('export const HERO_FRAMES = {\n' + ''.join(f'  {k}: {arr(r, "  ")},\n' for k, (r, _) in hero.items()) + '};\n\n')
        hand = hero['stand'][1]
        f.write(f'export const HERO_HAND = {{ x: {hand[0]}, y: {hand[1]} }};\n\n')
        f.write('export const BRAM_ROWS = ' + arr(b, '') + ';\n\n')
        f.write('export const PATRON_ROWS = ' + arr(p, '') + ';\n')
    print('ok')
