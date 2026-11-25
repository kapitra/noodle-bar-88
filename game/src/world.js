// The kitchen itself: the world state, the stations, and one fixed step
// of simulation (movement, chopping, cooking, orders, timers). No drawing
// and no input handling live here — see render.js, input.js and main.js.

import { CHEF_SPEED, DISHES, INGREDIENTS, LAYOUT, MAX_ORDERS, SHIFT_LENGTH, SPEED_BONUS, SPEED_THRESHOLD, STAR_CUT, TIP_MAX } from './config.js';
import { makeRng, pick, range } from './random.js';
import { sfx } from './audio.js';

let orderId = 0;

export function createWorld(seed = 1) {
  const rng = makeRng(seed);
  return {
    rng,
    seed,
    screen: 'title', // title | play | results
    time: 0,
    shiftLeft: SHIFT_LENGTH,
    level: 1,
    coins: 0,
    tipsEarned: 0,
    served: 0,
    missed: 0,
    combo: 0,
    bestCombo: 0,
    orderTimer: 6,
    spawnInterval: 13,
    chef: {
      x: LAYOUT.chefStart.x, y: LAYOUT.chefStart.y,
      dir: 'down', moving: false,
      carrying: null, // { kind, state } — state: raw | chopped | cooked | burnt
      target: null, // { x, y } mouse destination
      pendingStation: null, // station id to use on arrival
    },
    boards: LAYOUT.boards.map((s) => ({ ...s, slot: null })),
    woks: LAYOUT.woks.map((s) => ({ ...s, slot: null })),
    plates: [{ items: [] }, { items: [] }],
    orders: [],
    floats: [], // { x, y, text, life, color }
    particles: [], // { x, y, vx, vy, life, maxLife, color, size }
    toast: null, // { text, life }
    result: null,
    paused: false,
    over: false,
    lastTickSecond: -1,
  };
}

export function stationById(world, id) {
  for (const s of LAYOUT.crates) if (s.id === id) return s;
  for (const s of world.boards) if (s.id === id) return s;
  for (const s of world.woks) if (s.id === id) return s;
  if (LAYOUT.plates.id === id) return LAYOUT.plates;
  if (LAYOUT.serve.id === id) return LAYOUT.serve;
  if (LAYOUT.trash.id === id) return LAYOUT.trash;
  return null;
}

export function allStations(world) {
  return [...LAYOUT.crates, ...world.boards, ...world.woks, LAYOUT.plates, LAYOUT.serve, LAYOUT.trash];
}

export function stationCenter(st) {
  return { x: st.x + st.w / 2, y: st.y + st.h / 2 };
}

export function nearestStation(world, x, y, maxDist = 130) {
  let best = null;
  let bestD = maxDist;
  for (const st of allStations(world)) {
    const c = stationCenter(st);
    const d = Math.hypot(c.x - x, c.y - y);
    if (d < bestD) { bestD = d; best = st; }
  }
  return best;
}

export function stationAt(world, x, y) {
  for (const st of allStations(world)) {
    if (x >= st.x - 6 && x <= st.x + st.w + 6 && y >= st.y - 6 && y <= st.y + st.h + 6) return st;
  }
  return null;
}

function clampChef(world) {
  const c = world.chef;
  const f = LAYOUT.floor;
  c.x = Math.min(f.x + f.w - 24, Math.max(f.x + 24, c.x));
  c.y = Math.min(f.y + f.h - 24, Math.max(f.y + 24, c.y));
  // Push the chef out of station rectangles.
  for (const st of allStations(world)) {
    const cx = Math.min(st.x + st.w, Math.max(st.x, c.x));
    const cy = Math.min(st.y + st.h, Math.max(st.y, c.y));
    const dx = c.x - cx;
    const dy = c.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < 24 * 24) {
      if (d2 === 0) { c.y = st.y + st.h + 24; continue; }
      const d = Math.sqrt(d2);
      c.x = cx + (dx / d) * 24;
      c.y = cy + (dy / d) * 24;
    }
  }
}

export function moveChef(world, dx, dy, dt) {
  const c = world.chef;
  if (dx === 0 && dy === 0) { c.moving = false; return; }
  const len = Math.hypot(dx, dy);
  c.x += (dx / len) * CHEF_SPEED * dt;
  c.y += (dy / len) * CHEF_SPEED * dt;
  c.moving = true;
  c.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  clampChef(world);
}

export function moveChefToward(world, tx, ty, dt) {
  const c = world.chef;
  const dx = tx - c.x;
  const dy = ty - c.y;
  const d = Math.hypot(dx, dy);
  if (d < 6) { c.moving = false; c.target = null; return true; }
  moveChef(world, dx, dy, dt);
  return false;
}

export function addFloat(world, x, y, text, color = '#ffd94d') {
  world.floats.push({ x, y, text, life: 1.4, color });
}

export function toast(world, text) {
  world.toast = { text, life: 2.2 };
}

function burst(world, x, y, color, n = 10, speed = 60) {
  for (let i = 0; i < n; i += 1) {
    const a = world.rng() * Math.PI * 2;
    const v = range(world.rng, speed * 0.3, speed);
    world.particles.push({
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20,
      life: range(world.rng, 0.4, 0.9), maxLife: 0.9, color, size: range(world.rng, 2, 5),
    });
  }
}

function steam(world, x, y) {
  world.particles.push({
    x: x + range(world.rng, -12, 12), y, vx: range(world.rng, -6, 6), vy: -34,
    life: 0.8, maxLife: 0.8, color: 'rgba(255,255,255,0.55)', size: range(world.rng, 4, 8),
  });
}

// --- Orders ---------------------------------------------------------------

export function dishById(id) {
  return DISHES.find((d) => d.id === id);
}

function spawnOrder(world) {
  const level = world.level;
  // Early orders are the 2-item sate; harder dishes join as the rush grows.
  const pool = level === 1
    ? ['sate', 'sate', 'nasi-goreng', 'mie-goreng']
    : level === 2
      ? ['sate', 'nasi-goreng', 'mie-goreng', 'ayam-geprek']
      : DISHES.map((d) => d.id);
  const dish = dishById(pick(world.rng, pool));
  const patienceMax = Math.max(30, 58 - level * 4);
  world.orders.push({
    id: `o${orderId += 1}`,
    dish,
    patience: patienceMax,
    patienceMax,
    flash: 0,
  });
}

export function plateMatchesDish(plate, dish) {
  if (plate.items.length !== dish.needs.length) return false;
  return dish.needs.every((need) => plate.items.some(
    (it) => it.kind === need.kind && it.state === need.state,
  ));
}

export function readyPlateIndex(world) {
  for (let i = 0; i < world.plates.length; i += 1) {
    const plate = world.plates[i];
    if (plate.items.length === 0) continue;
    if (world.orders.some((o) => plateMatchesDish(plate, o.dish))) return i;
  }
  return -1;
}

// How happy this customer is right now, 0 to 1: patience left as a share.
export function orderSatisfaction(order) {
  return Math.max(0, order.patience / order.patienceMax);
}

// The tip this order pays if served right now: it shrinks as patience
// drains, and a fast serve (satisfaction above the threshold) adds a
// flat speed bonus on top.
export function orderTip(order) {
  const frac = orderSatisfaction(order);
  return Math.round(frac * TIP_MAX) + (frac >= SPEED_THRESHOLD ? SPEED_BONUS : 0);
}

export function serveReadyPlate(world) {
  const pi = readyPlateIndex(world);
  if (pi === -1) return false;
  const plate = world.plates[pi];
  const orderIndex = world.orders.findIndex((o) => plateMatchesDish(plate, o.dish));
  const order = world.orders[orderIndex];
  const tip = orderTip(order);
  const fast = orderSatisfaction(order) >= SPEED_THRESHOLD;
  const mult = Math.min(2, 1 + world.combo * 0.1);
  const earned = Math.round((order.dish.price + tip) * mult);
  world.coins += earned;
  world.tipsEarned += tip;
  world.served += 1;
  world.combo += 1;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  world.orders.splice(orderIndex, 1);
  world.plates[pi] = { items: [] };
  const serve = LAYOUT.serve;
  addFloat(world, serve.x + serve.w / 2, serve.y - 8, `+${earned}  (${order.dish.price} + ${tip} TIP)`, '#ffd94d');
  if (fast) addFloat(world, serve.x + serve.w / 2, serve.y - 36, 'SPEED BONUS!', '#ff9d5c');
  if (world.combo >= 3) addFloat(world, serve.x + serve.w / 2, serve.y - 62, `COMBO x${world.combo}!`, '#ff9d5c');
  burst(world, serve.x + serve.w / 2, serve.y + 30, '#ffd94d', 14, 90);
  sfx.serve();
  sfx.coin();
  return true;
}

function missOrder(world, order) {
  world.orders = world.orders.filter((o) => o.id !== order.id);
  world.missed += 1;
  world.combo = 0;
  toast(world, `Too slow — ${order.dish.name} walked out!`);
  sfx.error();
}

// --- One simulation step --------------------------------------------------

export function stepWorld(world, dt) {
  if (world.screen !== 'play' || world.paused) return;
  world.time += dt;
  world.shiftLeft = Math.max(0, SHIFT_LENGTH - world.time);
  world.level = 1 + Math.floor(world.time / 45);

  // Shift clock ticks.
  const whole = Math.ceil(world.shiftLeft);
  if (whole <= 10 && whole !== world.lastTickSecond && whole > 0) {
    world.lastTickSecond = whole;
    sfx.tick();
  }

  // New orders arrive faster as the rush grows.
  world.orderTimer -= dt;
  if (world.orderTimer <= 0 && world.orders.length < MAX_ORDERS) {
    spawnOrder(world);
    world.spawnInterval = Math.max(7, 13 - world.level);
    world.orderTimer = world.spawnInterval * range(world.rng, 0.85, 1.15);
  }

  // Patience drains; an order with none left walks out.
  for (const order of [...world.orders]) {
    order.patience -= dt;
    if (order.patience <= 12) order.flash += dt;
    if (order.patience <= 0) missOrder(world, order);
  }

  // Chopping boards finish their work.
  for (const board of world.boards) {
    const slot = board.slot;
    if (!slot || slot.state !== 'chopping') continue;
    slot.progress += dt / INGREDIENTS[slot.kind].chop;
    if (world.rng() < dt * 6) {
      burst(world, board.x + board.w / 2, board.y + 30, INGREDIENTS[slot.kind].color, 2, 40);
    }
    if (slot.progress >= 1) {
      slot.state = 'chopped';
      slot.progress = 1;
      sfx.chopped();
      addFloat(world, board.x + board.w / 2, board.y - 6, 'Chopped!', '#9be36d');
    }
  }

  // Woks cook, then burn.
  for (const wok of world.woks) {
    const slot = wok.slot;
    if (!slot || slot.state !== 'cooking') continue;
    slot.progress += dt / INGREDIENTS[slot.kind].cook;
    if (world.rng() < dt * 8) steam(world, wok.x + wok.w / 2, wok.y + 20);
    if (slot.progress >= 1) {
      slot.state = 'cooked';
      slot.progress = 1;
      slot.burnTimer = 6;
      sfx.cooked();
      addFloat(world, wok.x + wok.w / 2, wok.y - 6, 'Ready!', '#9be36d');
    }
  }
  for (const wok of world.woks) {
    const slot = wok.slot;
    if (!slot || slot.state !== 'cooked') continue;
    slot.burnTimer -= dt;
    if (slot.burnTimer <= 0) {
      slot.state = 'burnt';
      sfx.burnt();
      addFloat(world, wok.x + wok.w / 2, wok.y - 6, 'Burnt!', '#ff6b5e');
    }
  }

  // Floating texts, particles and toasts age out.
  for (const f of world.floats) { f.y -= 34 * dt; f.life -= dt; }
  world.floats = world.floats.filter((f) => f.life > 0);
  for (const p of world.particles) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 26 * dt; p.life -= dt;
  }
  world.particles = world.particles.filter((p) => p.life > 0);
  if (world.toast) {
    world.toast.life -= dt;
    if (world.toast.life <= 0) world.toast = null;
  }

  // The shift ends: score the night.
  if (world.shiftLeft <= 0) endShift(world);
}

export function endShift(world) {
  world.screen = 'results';
  world.over = true;
  const stars = world.coins >= STAR_CUT[2] ? 3 : world.coins >= STAR_CUT[1] ? 2 : world.coins >= STAR_CUT[0] ? 1 : 0;
  world.result = {
    coins: world.coins, tips: world.tipsEarned, served: world.served, missed: world.missed,
    bestCombo: world.bestCombo, stars,
  };
  sfx.rush();
}

export function startShift(world) {
  const fresh = createWorld(world.seed);
  Object.assign(world, fresh, { screen: 'play' });
  spawnOrder(world);
  spawnOrder(world);
}
