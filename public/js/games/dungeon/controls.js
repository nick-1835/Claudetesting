// On-screen controls: a joystick on the left; A (attack) and B (jump / use) on the right.
// Emits actions through `onAction(name)`: 'jump', 'interact', 'attack', 'left', 'right'.

function div(cls, html) {
  const el = document.createElement('div');
  el.className = cls;
  if (html) el.innerHTML = html;
  return el;
}

export function createControls(onAction) {
  const el = div('dq-controls');
  const zone = div('dq-stick-zone');
  const base = div('dq-stick');
  const knob = div('dq-knob');
  base.append(knob);
  zone.append(base);

  const pads = div('dq-pads');
  const interact = div('dq-pad b', '<span>B</span><small>Jump/Use</small>');
  const attack = div('dq-pad a', '<span>A</span><small>Attack</small>');
  pads.append(interact, attack);
  el.append(zone, pads);

  let x = 0, y = 0;
  let pid = null;
  let cx = 0, cy = 0;
  let wasUp = false, lastDir = 0;

  function setKnob(dx, dy) {
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  function update(e) {
    const r = base.offsetWidth * 0.42;
    let dx = e.clientX - cx, dy = e.clientY - cy;
    const len = Math.hypot(dx, dy);
    if (len > r) { dx = (dx / len) * r; dy = (dy / len) * r; }
    setKnob(dx, dy);
    x = Math.abs(dx / r) < 0.2 ? 0 : dx / r;
    y = dy / r;
    const up = y < -0.6;
    if (up && !wasUp) onAction('jump');
    wasUp = up;
    const dir = x > 0.7 ? 1 : x < -0.7 ? -1 : 0;
    if (dir && dir !== lastDir) onAction(dir > 0 ? 'right' : 'left');
    lastDir = dir;
  }

  function release() {
    pid = null;
    x = y = 0;
    wasUp = false;
    lastDir = 0;
    setKnob(0, 0);
    base.classList.remove('active');
  }

  zone.addEventListener('pointerdown', (e) => {
    if (pid !== null) return;
    e.preventDefault();
    pid = e.pointerId;
    zone.setPointerCapture(e.pointerId);
    const r = base.getBoundingClientRect();
    cx = r.left + r.width / 2;
    cy = r.top + r.height / 2;
    base.classList.add('active');
    update(e);
  });
  zone.addEventListener('pointermove', (e) => { if (e.pointerId === pid) update(e); });
  zone.addEventListener('pointerup', (e) => { if (e.pointerId === pid) release(); });
  zone.addEventListener('pointercancel', (e) => { if (e.pointerId === pid) release(); });

  for (const [pad, name] of [[attack, 'attack'], [interact, 'interact']]) {
    pad.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      pad.classList.add('down');
      onAction(name);
    });
    const up = () => pad.classList.remove('down');
    pad.addEventListener('pointerup', up);
    pad.addEventListener('pointercancel', up);
    pad.addEventListener('pointerleave', up);
  }

  return {
    el,
    get x() { return x; },
    get y() { return y; },
    /** Make the B button pulse when there's something to use nearby. */
    setReady(on) { interact.classList.toggle('ready', !!on); },
    reset: release,
  };
}
