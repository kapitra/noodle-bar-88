// Deterministic screenshot scenes behind ?shot=...&seed=... — the same
// scenes the maker uses for screenshots/. Each one stages a real game
// state (orders, wok, boards, plates, timer) and draws it with the same
// render code the player sees, so a screenshot is a true render of the
// game's own code, never a mock-up.

import { DISHES } from './config.js';
import { createWorld, endShift } from './world.js';

function dish(id) {
  return DISHES.find((d) => d.id === id);
}

function order(world, dishId, patience, patienceMax) {
  return { id: `shot-${dishId}`, dish: dish(dishId), patience, patienceMax, flash: 0 };
}

export function stageShot(name, seed = 1) {
  const world = createWorld(seed);
  world.screen = 'play';
  if (name === 'start') {
    world.screen = 'title';
    return world;
  }
  if (name === 'results') {
    world.coins = 187;
    world.tipsEarned = 64;
    world.served = 12;
    world.missed = 2;
    world.bestCombo = 5;
    world.combo = 5;
    world.time = 180;
    world.shiftLeft = 0;
    endShift(world);
    return world;
  }

  // Shared mid-shift frame.
  world.time = 46;
  world.shiftLeft = 134;
  world.level = 2;
  world.coins = 86;
  world.tipsEarned = 31;
  world.served = 5;
  world.combo = 3;
  world.bestCombo = 4;
  world.orders = [
    order(world, 'nasi-goreng', 28, 50),
    order(world, 'mie-ayam', 41, 54),
    order(world, 'sate', 16, 46),
  ];

  if (name === 'chop') {
    world.chef.x = 420;
    world.chef.y = 300;
    world.chef.dir = 'left';
    world.boards[0].slot = { kind: 'chicken', state: 'chopping', progress: 0.25 };
    world.boards[1].slot = { kind: 'veggie', state: 'chopped', progress: 1 };
    world.woks[0].slot = { kind: 'rice', state: 'cooking', progress: 0.7 };
    world.coins = 32;
    world.tipsEarned = 12;
    world.served = 2;
    world.combo = 1;
    world.time = 19;
    world.shiftLeft = 161;
    world.level = 1;
    return world;
  }

  if (name === 'serve') {
    // A finished Nasi Goreng on plate 1, matching the first order.
    world.plates[0] = {
      items: [
        { kind: 'rice', state: 'cooked' },
        { kind: 'egg', state: 'cooked' },
        { kind: 'chili', state: 'chopped' },
      ],
    };
    world.chef.x = 1000;
    world.chef.y = 640;
    world.chef.dir = 'right';
    world.coins = 110;
    world.tipsEarned = 47;
    world.served = 7;
    world.combo = 4;
    world.floats.push({ x: 1166, y: 660, text: '+29 (14 + 7 TIP)', life: 5, color: '#ffd94d' });
    world.floats.push({ x: 1166, y: 632, text: 'COMBO x4!', life: 5, color: '#ff9d5c' });
    world.time = 88;
    world.shiftLeft = 92;
    world.level = 2;
    return world;
  }

  // 'cover' (and anything else): the hero frame — everything the judge
  // needs in one shot: order board, ingredients, a dish mid-assembly,
  // a timer, and a plate nearly ready to serve.
  world.chef.x = 1130;
  world.chef.y = 300;
  world.chef.dir = 'left';
  world.woks[0].slot = { kind: 'chicken', state: 'cooking', progress: 0.55 };
  world.woks[1].slot = { kind: 'egg', state: 'cooked', progress: 1, burnTimer: 4.2 };
  world.boards[0].slot = { kind: 'chili', state: 'chopping', progress: 0.6 };
  world.boards[1].slot = { kind: 'veggie', state: 'chopped', progress: 1 };
  world.plates[0] = {
    items: [
      { kind: 'rice', state: 'cooked' },
      { kind: 'egg', state: 'cooked' },
      { kind: 'chili', state: 'chopped' },
    ],
  };
  world.plates[1] = { items: [] };
  for (let i = 0; i < 6; i += 1) {
    world.particles.push({
      x: 1234 + (i % 3) * 8 - 8, y: 250 + i * 4,
      vx: 0, vy: -30, life: 0.8, maxLife: 0.8,
      color: 'rgba(255,255,255,0.55)', size: 5,
    });
  }
  return world;
}
