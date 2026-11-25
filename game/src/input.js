// Keyboard and mouse (and touch) input, converted into the game's
// logical 1280x800 coordinates. main.js polls this every frame.

import { VIEW } from './config.js';

export function createInput(canvas) {
  const input = {
    keys: new Set(),
    justPressed: new Set(), // action keys, edge-triggered (auto-repeat ignored)
    clicks: [], // { x, y } in logical coordinates, consumed by main.js
    mouse: { x: 0, y: 0, down: false },
  };

  function toLogical(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * VIEW.width,
      y: ((clientY - rect.top) / rect.height) * VIEW.height,
    };
  }

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    input.keys.add(key);
    if (!e.repeat) input.justPressed.add(key);
  });
  window.addEventListener('keyup', (e) => {
    input.keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
  });
  window.addEventListener('blur', () => input.keys.clear());

  canvas.addEventListener('mousemove', (e) => {
    const p = toLogical(e.clientX, e.clientY);
    input.mouse.x = p.x;
    input.mouse.y = p.y;
  });
  canvas.addEventListener('mousedown', (e) => {
    const p = toLogical(e.clientX, e.clientY);
    input.mouse.x = p.x;
    input.mouse.y = p.y;
    input.mouse.down = true;
    input.clicks.push(p);
  });
  window.addEventListener('mouseup', () => { input.mouse.down = false; });
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    const p = toLogical(t.clientX, t.clientY);
    input.mouse.x = p.x;
    input.mouse.y = p.y;
    input.clicks.push(p);
  }, { passive: false });

  return input;
}

export function takeClicks(input) {
  const out = input.clicks.splice(0, input.clicks.length);
  return out;
}

// Movement keys held right now, as a unit-ish vector.
export function moveVector(input) {
  let dx = 0;
  let dy = 0;
  if (input.keys.has('a') || input.keys.has('ArrowLeft')) dx -= 1;
  if (input.keys.has('d') || input.keys.has('ArrowRight')) dx += 1;
  if (input.keys.has('w') || input.keys.has('ArrowUp')) dy -= 1;
  if (input.keys.has('s') || input.keys.has('ArrowDown')) dy += 1;
  return { dx, dy };
}

export function pressed(input, ...names) {
  return names.some((n) => input.keys.has(n));
}

// True once per physical key press; consumes the press.
export function takePressed(input, ...names) {
  for (const n of names) {
    if (input.justPressed.has(n)) {
      input.justPressed.delete(n);
      return n;
    }
  }
  return null;
}
