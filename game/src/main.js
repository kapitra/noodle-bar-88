// Noodle Bar 88 — the game loop, the chef's hands, and the controls.
// Movement is WASD/arrows or click-to-move; every station also answers a
// click. E or Space uses the nearest station.

import { INGREDIENTS, LAYOUT, VIEW } from './config.js';
import { createInput, moveVector, takeClicks, takePressed } from './input.js';
import { drawGame, HUD_MUTE, HUD_PAUSE, RESULTS_RESTART, TITLE_START } from './render.js';
import { sfx } from './audio.js';
import { stageShot } from './shots.js';
import {
  createWorld, moveChef, moveChefToward, nearestStation,
  serveReadyPlate, startShift, stationAt, stationCenter, stationById,
  stepWorld, toast,
} from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || '1') || 1;
const shot = params.get('shot');

let world = shot ? stageShot(shot, seed) : createWorld(seed);
let input = createInput(canvas);
let scale = 1;
let offsetX = 0;
let offsetY = 0;

// Exposed for play-testing: window.__world is the live game state.
window.__world = world;
window.__start = () => { startShift(world); window.__world = world; };

function fit() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  scale = Math.min(canvas.width / VIEW.width, canvas.height / VIEW.height);
  offsetX = (canvas.width - VIEW.width * scale) / 2;
  offsetY = (canvas.height - VIEW.height * scale) / 2;
}

window.addEventListener('resize', fit);
fit();

function inRect(p, r) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

function finishedComponent(item) {
  return item && (item.state === 'chopped' || item.state === 'cooked');
}

function interact(world, station) {
  const chef = world.chef;
  if (!station) return;
  const carrying = chef.carrying;

  if (station.kind === 'crate') {
    if (carrying) { toast(world, 'Hands full — serve or trash something first'); sfx.error(); return; }
    chef.carrying = { kind: station.item, state: 'raw' };
    sfx.pickup();
    return;
  }

  if (station.kind === 'board') {
    const board = world.boards.find((b) => b.id === station.id);
    if (!board.slot && carrying && INGREDIENTS[carrying.kind].chop > 0 && carrying.state === 'raw') {
      board.slot = { kind: carrying.kind, state: 'chopping', progress: 0 };
      chef.carrying = null;
      sfx.chop();
      return;
    }
    if (board.slot && board.slot.state === 'chopped' && !carrying) {
      chef.carrying = { kind: board.slot.kind, state: 'chopped' };
      board.slot = null;
      sfx.pickup();
      return;
    }
    if (board.slot && board.slot.state === 'chopping') { toast(world, 'Still chopping…'); return; }
    toast(world, 'This board chops chicken, veggie and chili');
    sfx.error();
    return;
  }

  if (station.kind === 'wok') {
    const wok = world.woks.find((w) => w.id === station.id);
    const cookable = carrying && INGREDIENTS[carrying.kind].cook > 0
      && (carrying.state === 'raw' || (carrying.kind === 'chicken' && carrying.state === 'chopped'));
    if (!wok.slot && cookable) {
      wok.slot = { kind: carrying.kind, state: 'cooking', progress: 0 };
      chef.carrying = null;
      sfx.sizzle();
      return;
    }
    if (wok.slot && (wok.slot.state === 'cooked' || wok.slot.state === 'burnt') && !carrying) {
      chef.carrying = { kind: wok.slot.kind, state: wok.slot.state };
      wok.slot = null;
      sfx.pickup();
      return;
    }
    if (wok.slot && wok.slot.state === 'cooking') { toast(world, 'Still cooking…'); return; }
    toast(world, 'The wok cooks rice, noodle, egg and chopped chicken');
    sfx.error();
    return;
  }

  if (station.kind === 'plates') {
    if (carrying && finishedComponent(carrying)) {
      const plate = world.plates.find(
        (p) => p.items.length < 4 && !p.items.some((it) => it.kind === carrying.kind),
      );
      if (!plate) { toast(world, 'No plate has room for that'); sfx.error(); return; }
      plate.items.push(carrying);
      chef.carrying = null;
      sfx.plated();
      return;
    }
    if (carrying) { toast(world, 'That is not ready for a plate yet'); sfx.error(); return; }
    // Empty hands: take the last item back off the fullest plate.
    const plate = [...world.plates].sort((a, b) => b.items.length - a.items.length)[0];
    if (plate && plate.items.length > 0) {
      chef.carrying = plate.items.pop();
      sfx.pickup();
      return;
    }
    toast(world, 'Plates are empty — cook something first');
    return;
  }

  if (station.kind === 'serve') {
    if (serveReadyPlate(world)) return;
    toast(world, 'No finished plate matches an order yet');
    sfx.error();
    return;
  }

  if (station.kind === 'trash') {
    if (carrying) {
      chef.carrying = null;
      sfx.chop();
      toast(world, 'Thrown away');
      return;
    }
    toast(world, 'Nothing to throw away');
  }
}

function handleClick(world, p) {
  sfx.unlock();
  if (world.screen === 'title') {
    if (inRect(p, TITLE_START)) { startShift(world); window.__world = world; }
    return;
  }
  if (world.screen === 'results') {
    if (inRect(p, RESULTS_RESTART)) { startShift(world); window.__world = world; }
    return;
  }
  if (world.screen !== 'play') return;
  if (inRect(p, HUD_MUTE)) { sfx.setMuted(!sfx.isMuted()); world.muted = sfx.isMuted(); return; }
  if (inRect(p, HUD_PAUSE)) { world.paused = !world.paused; return; }

  const station = stationAt(world, p.x, p.y);
  const chef = world.chef;
  if (station) {
    const c = stationCenter(station);
    const d = Math.hypot(c.x - chef.x, c.y - chef.y);
    if (d <= 150) { interact(world, station); return; }
    chef.target = { x: c.x, y: c.y };
    chef.pendingStation = station.id;
    return;
  }
  chef.target = { x: p.x, y: p.y };
  chef.pendingStation = null;
}

let last = performance.now();
let fpsAccum = 0;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  fpsAccum += dt;

  // One-shot keys (edge-triggered, so holding a key never double-fires).
  if (takePressed(input, 'm')) { sfx.setMuted(!sfx.isMuted()); world.muted = sfx.isMuted(); }
  if (takePressed(input, 'p')) {
    if (world.screen === 'play') world.paused = !world.paused;
  }
  if (takePressed(input, 'r')) {
    if (world.screen === 'results' || world.screen === 'title') { startShift(world); window.__world = world; }
  }
  if (takePressed(input, 'Enter', ' ')) {
    if (world.screen === 'title' || world.screen === 'results') {
      startShift(world); window.__world = world;
    }
  }
  if (takePressed(input, 'e', ' ')) {
    if (world.screen === 'play' && !world.paused) {
      const st = nearestStation(world, world.chef.x, world.chef.y, 150);
      if (st) interact(world, st);
    }
  }

  for (const click of takeClicks(input)) handleClick(world, click);

  // Movement: keys win over a click target.
  if (world.screen === 'play' && !world.paused) {
    const mv = moveVector(input);
    if (mv.dx !== 0 || mv.dy !== 0) {
      // Keys steer directly and cancel any click destination.
      world.chef.target = null;
      world.chef.pendingStation = null;
      moveChef(world, mv.dx, mv.dy, dt);
    } else if (world.chef.target) {
      const arrived = moveChefToward(world, world.chef.target.x, world.chef.target.y, dt);
      // A station's centre is inside the station, so the chef can never
      // stand on it: arriving means close enough to use the station.
      if (world.chef.pendingStation) {
        const st = stationById(world, world.chef.pendingStation);
        if (!st) {
          world.chef.pendingStation = null;
        } else {
          const c = stationCenter(st);
          const d = Math.hypot(c.x - world.chef.x, c.y - world.chef.y);
          if (arrived || d <= 150) {
            world.chef.pendingStation = null;
            interact(world, st);
          }
        }
      }
    }
    world.hintStation = nearestStation(world, world.chef.x, world.chef.y, 150);
    stepWorld(world, dt);
  }

  // Status line for screen readers, updated twice a second.
  if (fpsAccum > 0.5) {
    fpsAccum = 0;
    statusEl.textContent = world.screen === 'play'
      ? `Noodle Bar 88: ${world.coins} coins, ${world.tipsEarned} in tips, ${world.served} dishes served, ${fmtClock(world.shiftLeft)} left, ${world.orders.length} orders waiting.`
      : world.screen === 'results'
        ? `Shift over: ${world.coins} coins, ${world.tipsEarned} in tips, ${world.served} dishes served.`
        : 'Noodle Bar 88, a fast noodle-bar cooking game. Press Enter to start.';
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#0e1b2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
  drawGame(ctx, world, now / 1000);
  requestAnimationFrame(frame);
}

function fmtClock(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

world.muted = sfx.isMuted();
requestAnimationFrame(frame);
