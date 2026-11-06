# Usage: python3 tools/hero_sprite.py <out_dir>  -> hero-sheet.png preview + hero.json frames
# (paste the frames into public/js/games/dungeon/sprites.js as HERO_FRAMES).
# Pixel-art authoring tool for the hero: builds poses from shapes, auto-outlines each part,
# writes a preview PNG and the JS sprite maps.
import math, sys, json
from PIL import Image

W, H = 34, 40
PAL = {
  'k': '#1a1020', 'h': '#4a2616', 'H': '#7a4224', 's': '#f0c090', 'S': '#c88f60', 'e': '#1a1020',
  'r': '#c8322a', 'R': '#8a1e1e', 'b': '#2f4f9a', 'B': '#213670', 'w': '#eef2f8', 'm': '#b9c2d2',
  'M': '#737b92', 'l': '#6b4423', 'L': '#4a2e18', 'g': '#e8b84a', 'x': '#b83030', 'X': '#7a1e1e',
  'p': '#2a2440', 'P': '#1c1830', 'o': '#7a4a26', 'O': '#4a2e18',
}

class Canvas:
    def __init__(self):
        self.g = [['.'] * W for _ in range(H)]
    def part(self, pixels, outline=True):
        """pixels: dict (x,y)->color. Paint, then outline the part's boundary (inner edge)."""
        pts = {p for p in pixels if 0 <= p[0] < W and 0 <= p[1] < H}
        for (x, y) in pts:
            c = pixels[(x, y)]
            if outline and any((x + dx, y + dy) not in pts for dx, dy in ((1,0),(-1,0),(0,1),(0,-1))):
                c = 'k'
            self.g[y][x] = c
    def rows(self):
        return [''.join(r) for r in self.g]

def capsule(a, b, r, col, shade=None, shade_side=-1):
    (x0, y0), (x1, y1) = a, b
    out = {}
    for y in range(H):
        for x in range(W):
            px, py = x + 0.5, y + 0.5
            dx, dy = x1 - x0, y1 - y0
            L2 = dx * dx + dy * dy or 1e-9
            t = max(0, min(1, ((px - x0) * dx + (py - y0) * dy) / L2))
            cx, cy = x0 + t * dx, y0 + t * dy
            d = math.hypot(px - cx, py - cy)
            if d <= r:
                c = col
                if shade and (px - cx) * shade_side > r * 0.25: c = shade
                out[(x, y)] = c
    return out

def ellipse(cx, cy, rx, ry, col, fn=None):
    out = {}
    for y in range(H):
        for x in range(W):
            nx, ny = (x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry
            if nx * nx + ny * ny <= 1:
                out[(x, y)] = fn(x, y, nx, ny) if fn else col
    return out

def poly(points, col, fn=None):
    out = {}
    for y in range(H):
        for x in range(W):
            px, py = x + 0.5, y + 0.5
            inside = False
            for i in range(len(points)):
                (ax, ay), (bx, by) = points[i], points[(i + 1) % len(points)]
                if (ay > py) != (by > py) and px < (bx - ax) * (py - ay) / (by - ay) + ax:
                    inside = not inside
            if inside: out[(x, y)] = fn(x, y) if fn else col
    return out

def merge(*ds):
    out = {}
    for d in ds: out.update(d)
    return out

def boot(ax, ay, toe, col='o', shade='O'):
    # Boot: a block from the ankle down to the ground with the toe pointing `toe` (+1 right / -1 left).
    out = {}
    gy = H - 1
    for y in range(int(ay) - 1, gy + 1):
        for x in range(int(ax) - 3, int(ax) + 3):
            out[(x, y)] = shade if x < ax - 1 else col
    for x in range(int(ax) + (3 if toe > 0 else -5), int(ax) + (6 if toe > 0 else -2)):
        for y in range(gy - 2, gy + 1):
            out[(x, y)] = col
    return out

def lifted_boot(ax, ay, col='o', shade='O'):
    out = {}
    for y in range(int(ay) - 1, int(ay) + 4):
        for x in range(int(ax) - 3, int(ax) + 3):
            out[(x, y)] = shade if x < ax - 1 else col
    for y in range(int(ay) + 1, int(ay) + 4):
        for x in range(int(ax) + 3, int(ax) + 5):
            out[(x, y)] = col
    return out

def leg(c, hip, knee, ankle, near, lifted=False):
    tc, ts = ('p', 'P') if near else ('P', 'P')
    c.part(capsule(hip, knee, 3.0, tc, ts))
    c.part(merge(capsule(knee, ankle, 2.3, tc, ts), ellipse(knee[0] + 0.3, knee[1], 2.2, 1.8, 'm' if near else 'M')))
    c.part(lifted_boot(*ankle) if lifted else boot(ankle[0], ankle[1], 1, 'o' if near else 'O', 'O'))

def frame(pose):
    c = Canvas()
    bob = pose.get('bob', 0)
    oy = bob
    # Legs (back leg first)
    bl, fl = pose['back'], pose['front']
    leg(c, (14, 24 + oy), bl[0], bl[1], False, bl[2] if len(bl) > 2 else False)
    # Cape flowing behind
    c.part(poly([(13, 10 + oy), (17, 11 + oy), (11, 25 + oy), (5, 27 + oy), (7, 20 + oy)], 'R',
                lambda x, y: 'r' if x > 9 and y < 20 + oy else 'R'))
    # Shield (far arm) raised behind the body
    def shield_px(x, y, nx, ny):
        d = nx * nx + ny * ny
        if d > 0.62: return 'm' if ny < 0.2 else 'M'
        if abs(nx) < 0.18 or abs(ny) < 0.14: return 'w' if ny < 0 else 'm'
        return 'x' if nx > -0.1 else 'X'
    c.part(ellipse(9.5, 17 + oy, 4.6, 6.6, None, shield_px))
    leg(c, (18, 24 + oy), fl[0], fl[1], True, fl[2] if len(fl) > 2 else False)
    # Tunic skirt
    c.part(poly([(12, 20 + oy), (21, 20 + oy), (23, 27 + oy), (18, 26 + oy), (16, 28 + oy), (13, 26 + oy), (10, 27 + oy)], 'b',
                lambda x, y: 'B' if x < 15 else 'b'))
    # Torso: broad shoulders, narrow waist, leaning forward
    def torso_px(x, y):
        if y >= 20 + oy: return 'l'
        return 'B' if x < 15 else 'b'
    c.part(poly([(11, 11 + oy), (22, 11 + oy), (21, 17 + oy), (20, 21 + oy), (13, 21 + oy), (12, 17 + oy)], 'b', torso_px))
    # Leather strap across the chest + belt buckle
    for i in range(9):
        x, y = 13 + i, 12 + i + oy
        if 0 <= y < H and c.g[y][x] != 'k': c.g[y][x] = 'l'
    for x in (17, 18):
        if c.g[20 + oy][x] != 'k': c.g[20 + oy][x] = 'g'
    # Neck + scarf
    c.part(capsule((14.5, 10.5 + oy), (10, 14 + oy), 1.4, 'r', 'R'))
    c.part(ellipse(17.8, 10.6 + oy, 4.4, 2.0, 'r', lambda x, y, nx, ny: 'R' if ny > 0.35 or nx < -0.5 else 'r'))
    # Head: 3/4 view facing right, hair swept back
    def head_px(x, y, nx, ny):
        if x == 21 and y == 5 + oy: return 'e'
        if y == 4 + oy and x in (20, 21): return 'h'  # brow
        if ny < -0.42 or nx < -0.3 or (ny < -0.1 and nx < 0.05): return 'H' if (ny < -0.55 and nx > -0.2) else 'h'
        if nx < 0.05: return 'S'
        return 'S' if ny > 0.6 else 's'
    c.part(ellipse(19, 5.5 + oy, 4.3, 5.0, None, head_px))
    # Hair tuft at the back
    c.part(capsule((16, 2.5 + oy), (13.5, 5.5 + oy), 1.7, 'h'))
    # Near arm: pauldron, sleeve, bracer, glove
    ax, ay = pose.get('hand', (25, 20))
    ay += oy
    c.part(capsule((20, 13 + oy), (22.5, 16.5 + oy), 2.1, 'b', 'B'))
    c.part(capsule((22.5, 16.5 + oy), (ax, ay), 1.9, 'l', 'L'))
    c.part(ellipse(ax + 0.5, ay + 0.3, 1.9, 1.8, 's'))
    c.part(ellipse(21, 13 + oy, 3.0, 2.4, 'm', lambda x, y, nx, ny: 'w' if ny < -0.2 and nx < 0.3 else ('M' if ny > 0.4 else 'm')))
    return c.rows(), (ax, ay)

POSES = {
    'stand': {'back': ((10, 30), (7, 35)), 'front': ((23, 30), (24, 35))},
    'walk1': {'back': ((12, 30), (9, 35)), 'front': ((21, 29), (23, 35))},
    'walk2': {'back': ((15, 30), (13, 33), True), 'front': ((18, 30), (18, 35)), 'bob': 1},
    'walk3': {'back': ((19, 30), (21, 35)), 'front': ((14, 30), (11, 35))},
    'walk4': {'back': ((15, 30), (15, 35)), 'front': ((19, 29), (17, 33), True), 'bob': 1},
    'jump': {'back': ((11, 28), (11, 32), True), 'front': ((22, 27), (20, 32), True), 'hand': (25, 18)},
}

if __name__ == '__main__':
    out_dir = sys.argv[1]
    frames = {k: frame(v) for k, v in POSES.items()}
    scale = 10
    sheet = Image.new('RGB', ((W + 2) * scale * len(frames), H * scale), '#2a3a5a')
    for i, (name, (rows, hand)) in enumerate(frames.items()):
        for y, row in enumerate(rows):
            for x, ch in enumerate(row):
                if ch == '.': continue
                col = PAL[ch]
                rgb = tuple(int(col[j:j + 2], 16) for j in (1, 3, 5))
                for yy in range(scale):
                    for xx in range(scale):
                        sheet.putpixel(((x + i * (W + 2)) * scale + xx, y * scale + yy), rgb)
    sheet.save(f'{out_dir}/hero-sheet.png')
    js = {name: rows for name, (rows, hand) in frames.items()}
    json.dump({'frames': js, 'hand': {n: h for n, (r, h) in frames.items()}}, open(f'{out_dir}/hero.json', 'w'))
    print('ok')
