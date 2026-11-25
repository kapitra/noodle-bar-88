// Every pixel of Noodle Bar 88: a bright street noodle bar — warm tiles,
// a red awning, hanging lamps, and Chef Bimo at the woks. All art is
// drawn with canvas shapes — no image files, no fonts to load.

import { CHEF_NAME, DISHES, GAME_NAME, GAME_SUBTITLE, INGREDIENTS, LAYOUT, VIEW } from './config.js';
import { orderSatisfaction, orderTip, plateMatchesDish } from './world.js';

export const TITLE_START = { x: 490, y: 600, w: 300, h: 72 };
export const RESULTS_RESTART = { x: 490, y: 636, w: 300, h: 64 };
export const HUD_MUTE = { x: 1170, y: 12, w: 44, h: 40 };
export const HUD_PAUSE = { x: 1120, y: 12, w: 44, h: 40 };

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = 700, align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px Trebuchet MS, Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// --- Food, drawn as vector shapes -----------------------------------------

export function drawFood(ctx, kind, state, x, y, r) {
  const ing = INGREDIENTS[kind];
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'rice') {
    ctx.fillStyle = state === 'cooked' ? '#f7ecd4' : '#efe3c2';
    ctx.beginPath();
    ctx.ellipse(0, 2, r, r * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ing.dark;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = state === 'cooked' ? '#fff8e2' : '#e2d3ac';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.arc(i * r * 0.45, -r * 0.25, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }
    if (state === 'cooked') {
      ctx.fillStyle = '#e8a13a';
      ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.1, r * 0.14, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.35, r * 0.15, r * 0.12, 0, Math.PI * 2); ctx.fill();
    }
  } else if (kind === 'noodle') {
    ctx.strokeStyle = state === 'cooked' ? '#f2c14e' : '#e8d199';
    ctx.lineWidth = r * 0.32;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < 3; i += 1) {
      const yy = -r * 0.5 + i * r * 0.5;
      ctx.moveTo(-r * 0.8, yy);
      ctx.bezierCurveTo(-r * 0.3, yy - r * 0.35, r * 0.3, yy + r * 0.35, r * 0.8, yy);
    }
    ctx.stroke();
    if (state === 'cooked') {
      ctx.fillStyle = '#7fae4c';
      ctx.beginPath(); ctx.arc(r * 0.5, -r * 0.55, r * 0.16, 0, Math.PI * 2); ctx.fill();
    }
  } else if (kind === 'chicken') {
    if (state === 'raw') {
      // A drumstick: meaty end, bone sticking out.
      ctx.fillStyle = '#e8a06a';
      ctx.beginPath(); ctx.ellipse(0, -r * 0.1, r * 0.75, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8f4f1d';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = '#f3e2c2';
      ctx.lineWidth = r * 0.22;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(r * 0.55, r * 0.25); ctx.lineTo(r * 1.05, r * 0.6); ctx.stroke();
      ctx.fillStyle = '#f3e2c2';
      ctx.beginPath(); ctx.arc(r * 1.08, r * 0.62, r * 0.16, 0, Math.PI * 2); ctx.fill();
    } else if (state === 'chopped') {
      ctx.fillStyle = '#f7c9a0';
      for (let i = -1; i <= 1; i += 1) {
        ctx.save();
        ctx.translate(i * r * 0.62, (i % 2) * r * 0.3 - r * 0.15);
        ctx.rotate(i * 0.5);
        rr(ctx, -r * 0.42, -r * 0.3, r * 0.84, r * 0.6, r * 0.2);
        ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = '#8f4f1d'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-r, -r * 0.55); ctx.lineTo(r, -r * 0.55); ctx.stroke();
    } else if (state === 'cooked') {
      // Golden, grilled drumstick with char lines.
      ctx.fillStyle = '#c97a2e';
      ctx.beginPath(); ctx.ellipse(0, -r * 0.1, r * 0.75, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#5e2f10'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-r * 0.4, -r * 0.5); ctx.lineTo(-r * 0.1, r * 0.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r * 0.1, -r * 0.5); ctx.lineTo(r * 0.4, r * 0.3); ctx.stroke();
      ctx.strokeStyle = '#f3e2c2';
      ctx.lineWidth = r * 0.22;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(r * 0.55, r * 0.25); ctx.lineTo(r * 1.05, r * 0.6); ctx.stroke();
    } else {
      ctx.fillStyle = '#241d18';
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.75, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else if (kind === 'egg') {
    ctx.fillStyle = state === 'cooked' ? '#fdf3d0' : '#f4ead0';
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.95, r * 0.75, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d9b96a'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = state === 'cooked' ? '#f2a81d' : '#f6c453';
    ctx.beginPath(); ctx.arc(r * 0.1, 0, r * 0.42, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.arc(r * 0.02, -r * 0.14, r * 0.12, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'veggie') {
    ctx.fillStyle = state === 'chopped' ? '#7cc46a' : '#4d9a44';
    for (let i = 0; i < 3; i += 1) {
      ctx.save();
      ctx.rotate((i - 1) * 0.7);
      ctx.beginPath(); ctx.ellipse(0, -r * 0.45, r * 0.32, r * 0.62, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = '#2f6b2a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, r * 0.5); ctx.lineTo(0, r * 0.95); ctx.stroke();
  } else if (kind === 'chili') {
    ctx.strokeStyle = state === 'chopped' ? '#e2574a' : '#d92b1f';
    ctx.lineWidth = r * 0.34;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, -r * 0.4);
    ctx.quadraticCurveTo(0, r * 0.9, r * 0.75, -r * 0.35);
    ctx.stroke();
    ctx.fillStyle = '#3f7d33';
    ctx.beginPath(); ctx.ellipse(-r * 0.72, -r * 0.48, r * 0.28, r * 0.14, -0.5, 0, Math.PI * 2); ctx.fill();
    if (state === 'chopped') {
      ctx.fillStyle = '#e2574a';
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath(); ctx.arc(-r * 0.5 + i * r * 0.5, r * 0.3, r * 0.22, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  ctx.restore();
}

function progressRing(ctx, x, y, r, frac, color) {
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function progressBar(ctx, x, y, w, h, frac, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  if (frac > 0) {
    ctx.fillStyle = color;
    rr(ctx, x + 1, y + 1, Math.max(h - 2, (w - 2) * frac), h - 2, (h - 2) / 2);
    ctx.fill();
  }
}

// --- Scenery: bright noodle-bar interior -------------------------------------

function drawScenery(ctx, world, now) {
  // A bright noodle-bar interior: warm cream walls, a red awning stripe,
  // and a checkerboard tile floor. No river, no boats.
  const wall = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  wall.addColorStop(0, '#f7e8c8');
  wall.addColorStop(0.5, '#f3ddb0');
  wall.addColorStop(1, '#e8c98f');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  // Red-and-cream awning valance across the top of the kitchen wall.
  for (let i = 0; i < 16; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? '#c0392b' : '#fdf3d0';
    ctx.fillRect(300 + i * 61, 64, 61, 16);
    ctx.beginPath();
    ctx.arc(300 + i * 61 + 30, 80, 30, 0, Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = '#8e2a20';
  ctx.fillRect(300, 64, 972, 3);

  // Checkerboard tile floor.
  const f = LAYOUT.floor;
  const cols = 12;
  const rows = 9;
  const tw = f.w / cols;
  const th = f.h / rows;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      ctx.fillStyle = (r + c) % 2 === 0 ? '#f3e2c2' : '#e0a868';
      ctx.fillRect(f.x + c * tw, f.y + r * th, tw, th);
    }
  }
  ctx.strokeStyle = 'rgba(120,72,32,0.25)';
  ctx.lineWidth = 1;
  for (let c = 0; c <= cols; c += 1) {
    ctx.beginPath(); ctx.moveTo(f.x + c * tw, f.y); ctx.lineTo(f.x + c * tw, f.y + f.h); ctx.stroke();
  }
  for (let r = 0; r <= rows; r += 1) {
    ctx.beginPath(); ctx.moveTo(f.x, f.y + r * th); ctx.lineTo(f.x + f.w, f.y + r * th); ctx.stroke();
  }
  // Warm red trim around the floor.
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 4;
  ctx.strokeRect(f.x - 4, f.y - 4, f.w + 8, f.h + 8);

  // Festive string lights across the kitchen, high enough to read.
  ctx.strokeStyle = 'rgba(90,50,20,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(310, 168);
  ctx.quadraticCurveTo(790, 206, 1262, 168);
  ctx.stroke();
  for (let i = 0; i <= 12; i += 1) {
    const t = i / 12;
    const x = 310 + t * 952;
    const y = 168 + Math.sin(t * Math.PI) * 30;
    const colors = ['#ffd94d', '#ff9d5c', '#ff6b5e', '#9be36d'];
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath(); ctx.arc(x, y + 6, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,217,77,0.3)';
    ctx.beginPath(); ctx.arc(x, y + 6, 11, 0, Math.PI * 2); ctx.fill();
  }

  // Floor dressing, flat on the tiles: a round red mat, a basket of
  // produce and a potted herb plant, so the middle is not bare tile.
  ctx.fillStyle = '#a93226';
  ctx.beginPath(); ctx.ellipse(790, 520, 110, 46, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c0392b';
  ctx.beginPath(); ctx.ellipse(790, 520, 84, 34, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f2c14e';
  ctx.beginPath(); ctx.ellipse(790, 520, 58, 22, 0, 0, Math.PI * 2); ctx.fill();
  // Basket of produce.
  ctx.fillStyle = '#6b4423';
  ctx.beginPath();
  ctx.moveTo(520, 600); ctx.lineTo(600, 600); ctx.lineTo(590, 636); ctx.lineTo(530, 636);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#69b455';
  ctx.beginPath(); ctx.arc(540, 596, 10, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(560, 590, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e23b2e';
  ctx.beginPath(); ctx.arc(580, 596, 9, 0, Math.PI * 2); ctx.fill();
  // Potted herbs.
  ctx.fillStyle = '#a34d2d';
  ctx.beginPath();
  ctx.moveTo(1062, 596); ctx.lineTo(1098, 596); ctx.lineTo(1092, 628); ctx.lineTo(1068, 628);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#4d9a44';
  ctx.beginPath(); ctx.arc(1080, 584, 12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(1068, 592, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(1092, 592, 9, 0, Math.PI * 2); ctx.fill();

  // Shelf with stacked bowls on the left wall, between the boards
  // and the trash, and ladles hanging on the right wall.
  ctx.fillStyle = '#5d3d22';
  ctx.fillRect(312, 480, 68, 10);
  ctx.fillRect(312, 540, 68, 10);
  for (const [bx, by] of [[330, 472], [352, 472], [330, 532], [352, 532]]) {
    ctx.fillStyle = '#fdf3d0';
    ctx.beginPath(); ctx.ellipse(bx, by, 12, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.strokeStyle = '#5d3d22';
  ctx.lineWidth = 3;
  for (const lx of [1216, 1240]) {
    ctx.beginPath(); ctx.moveTo(lx, 480); ctx.lineTo(lx, 512); ctx.stroke();
    ctx.fillStyle = '#c9a86a';
    ctx.beginPath(); ctx.ellipse(lx, 518, 7, 10, 0, 0, Math.PI * 2); ctx.fill();
  }

  // Warm pendant lamps hanging at the kitchen corners.
  for (const [lx, ly] of [[330, 92], [1240, 92]]) {
    const sway = Math.sin(now * 0.8 + lx) * 3;
    ctx.strokeStyle = 'rgba(90,50,20,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(lx, ly - 22); ctx.lineTo(lx + sway, ly); ctx.stroke();
    const glow = ctx.createRadialGradient(lx + sway, ly + 16, 2, lx + sway, ly + 16, 34);
    glow.addColorStop(0, 'rgba(255,190,90,0.6)');
    glow.addColorStop(1, 'rgba(255,190,90,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(lx + sway - 34, ly - 18, 68, 68);
    ctx.fillStyle = '#e2574a';
    ctx.beginPath(); ctx.ellipse(lx + sway, ly + 16, 15, 19, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd94d';
    ctx.fillRect(lx + sway - 15, ly + 8, 30, 4);
    ctx.fillRect(lx + sway - 15, ly + 20, 30, 4);
  }
}

// --- Stations ---------------------------------------------------------------

function drawStations(ctx, world, now) {
  // Ingredient crates along the top wall.
  for (const st of LAYOUT.crates) {
    ctx.fillStyle = '#5d3d22';
    rr(ctx, st.x, st.y, st.w, st.h, 10);
    ctx.fill();
    ctx.fillStyle = '#6f4a2a';
    rr(ctx, st.x + 4, st.y + 4, st.w - 8, st.h - 8, 8);
    ctx.fill();
    drawFood(ctx, st.item, 'raw', st.x + 30, st.y + st.h / 2, 17);
    text(ctx, INGREDIENTS[st.item].label, st.x + 56, st.y + 30, 17, '#ffe9c4');
    text(ctx, 'crate', st.x + 56, st.y + 52, 12, '#d9b98a', 600);
  }

  // Chopping boards.
  for (const board of world.boards) {
    ctx.fillStyle = '#4a3220';
    rr(ctx, board.x, board.y, board.w, board.h, 10);
    ctx.fill();
    ctx.fillStyle = '#e8cf9f';
    rr(ctx, board.x + 8, board.y + 10, board.w - 16, board.h - 20, 6);
    ctx.fill();
    ctx.strokeStyle = '#b89a68';
    ctx.lineWidth = 2;
    ctx.stroke();
    const slot = board.slot;
    if (slot) {
      drawFood(ctx, slot.kind, slot.state === 'chopping' ? 'raw' : slot.state, board.x + board.w / 2, board.y + 44, 20);
      if (slot.state === 'chopping') progressRing(ctx, board.x + board.w / 2, board.y + 44, 30, slot.progress, '#ffcf4d');
    }
    text(ctx, 'CHOP', board.x + board.w / 2, board.y + board.h - 6, 12, '#3a2a18', 800, 'center');
  }

  // Woks (stoves).
  for (const wok of world.woks) {
    ctx.fillStyle = '#3a3f4a';
    rr(ctx, wok.x, wok.y, wok.w, wok.h, 10);
    ctx.fill();
    const cx = wok.x + wok.w / 2;
    const cy = wok.y + 46;
    ctx.fillStyle = '#22242c';
    ctx.beginPath(); ctx.ellipse(cx, cy + 8, 30, 10, 0, 0, Math.PI * 2); ctx.fill();
    if (wok.slot) {
      const slot = wok.slot;
      ctx.fillStyle = slot.state === 'burnt' ? '#1c1713' : '#2e2a26';
      ctx.beginPath(); ctx.ellipse(cx, cy, 30, 14, 0, 0, Math.PI * 2); ctx.fill();
      if (slot.state !== 'burnt') drawFood(ctx, slot.kind, slot.state === 'cooking' ? 'raw' : 'cooked', cx, cy - 4, 15);
      if (slot.state === 'cooking') {
        progressRing(ctx, cx, cy, 36, slot.progress, '#ff9d3c');
      } else if (slot.state === 'cooked') {
        text(ctx, 'READY', cx, cy - 34, 13, '#9be36d', 800, 'center');
        progressBar(ctx, cx - 26, cy + 16, 52, 7, Math.max(0, slot.burnTimer / 6), '#ff6b5e');
      } else if (slot.state === 'burnt') {
        text(ctx, 'BURNT!', cx, cy - 34, 13, '#ff6b5e', 800, 'center');
      }
    } else {
      ctx.strokeStyle = '#565b68';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cx, cy, 30, 14, 0, 0, Math.PI * 2); ctx.stroke();
    }
    text(ctx, 'WOK', cx, wok.y + wok.h - 6, 12, '#cfd3de', 800, 'center');
  }

  // Plating counter.
  const pl = LAYOUT.plates;
  ctx.fillStyle = '#5d3d22';
  rr(ctx, pl.x, pl.y, pl.w, pl.h, 10);
  ctx.fill();
  ctx.fillStyle = '#f3e2c2';
  rr(ctx, pl.x + 6, pl.y + 6, pl.w - 12, pl.h - 12, 8);
  ctx.fill();
  world.plates.forEach((plate, i) => {
    const cx = pl.x + 62 + i * 116;
    const cy = pl.y + 48;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(cx, cy, 46, 30, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c9b18a';
    ctx.lineWidth = 2;
    ctx.stroke();
    plate.items.forEach((it, j) => {
      const a = (j / Math.max(1, plate.items.length)) * Math.PI * 2 - Math.PI / 2;
      drawFood(ctx, it.kind, it.state, cx + Math.cos(a) * 20, cy + Math.sin(a) * 12, 12);
    });
    if (plate.items.length > 0) {
      const ready = world.orders.some((o) => plateMatchesDish(plate, o.dish));
      if (ready) {
        ctx.fillStyle = '#2f9e44';
        rr(ctx, cx - 34, cy - 46, 68, 20, 10);
        ctx.fill();
        text(ctx, 'READY ✓', cx, cy - 32, 12, '#ffffff', 800, 'center');
      }
    }
  });
  text(ctx, 'PLATE', pl.x + pl.w / 2, pl.y + pl.h - 6, 12, '#3a2a18', 800, 'center');

  // Pickup counter: ring the bell, hand the dish over, collect the tip.
  const sv = LAYOUT.serve;
  ctx.fillStyle = '#8e2a20';
  rr(ctx, sv.x, sv.y, sv.w, sv.h, 10);
  ctx.fill();
  ctx.fillStyle = '#f3e2c2';
  rr(ctx, sv.x + 6, sv.y + 22, sv.w - 12, sv.h - 28, 8);
  ctx.fill();
  // The service bell.
  ctx.fillStyle = '#f2c14e';
  ctx.beginPath(); ctx.arc(sv.x + 52, sv.y + 56, 16, Math.PI, 0); ctx.fill();
  ctx.fillRect(sv.x + 34, sv.y + 56, 36, 5);
  ctx.fillStyle = '#8a6d1d';
  ctx.beginPath(); ctx.arc(sv.x + 52, sv.y + 38, 3, 0, Math.PI * 2); ctx.fill();
  // A waiting customer's face, hoping their food comes fast.
  const happy = world.orders.length > 0 && world.orders[0].patience / world.orders[0].patienceMax > 0.5;
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath(); ctx.arc(sv.x + sv.w - 52, sv.y + 52, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3a2a18';
  ctx.beginPath(); ctx.arc(sv.x + sv.w - 58, sv.y + 48, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(sv.x + sv.w - 46, sv.y + 48, 2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3a2a18';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (happy) ctx.arc(sv.x + sv.w - 52, sv.y + 54, 7, 0.15 * Math.PI, 0.85 * Math.PI);
  else ctx.arc(sv.x + sv.w - 52, sv.y + 62, 7, 1.15 * Math.PI, 1.85 * Math.PI);
  ctx.stroke();
  text(ctx, 'PICKUP', sv.x + sv.w / 2, sv.y + 16, 15, '#ffe9c4', 800, 'center');

  // Trash.
  const tr = LAYOUT.trash;
  ctx.fillStyle = '#3a3f4a';
  rr(ctx, tr.x, tr.y, tr.w, tr.h, 10);
  ctx.fill();
  ctx.fillStyle = '#565b68';
  rr(ctx, tr.x + 18, tr.y + 14, tr.w - 36, tr.h - 34, 6);
  ctx.fill();
  text(ctx, 'TRASH', tr.x + tr.w / 2, tr.y + tr.h - 6, 12, '#cfd3de', 800, 'center');
}

// --- Chef -------------------------------------------------------------------

function drawChef(ctx, world, now) {
  const c = world.chef;
  const bob = c.moving ? Math.sin(now * 14) * 2 : Math.sin(now * 2) * 1;
  ctx.save();
  ctx.translate(c.x, c.y + bob);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 22, 22, 8, 0, 0, Math.PI * 2); ctx.fill();
  // Body: teal apron over a cream shirt.
  ctx.fillStyle = '#f3e2c2';
  rr(ctx, -16, -8, 32, 30, 12);
  ctx.fill();
  ctx.fillStyle = '#c0392b';
  rr(ctx, -13, 2, 26, 20, 8);
  ctx.fill();
  // Head, tall chef hat and moustache: Chef Bimo.
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath(); ctx.arc(0, -18, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-13, -26);
  ctx.quadraticCurveTo(-16, -44, -7, -44);
  ctx.quadraticCurveTo(0, -50, 7, -44);
  ctx.quadraticCurveTo(16, -44, 13, -26);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#c9c9c9';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = '#3a2a18';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-6, -12); ctx.quadraticCurveTo(0, -9, 6, -12); ctx.stroke();
  // Face direction.
  ctx.fillStyle = '#2b2b3a';
  const look = c.dir === 'left' ? -4 : c.dir === 'right' ? 4 : 0;
  ctx.beginPath(); ctx.arc(-4 + look, -18, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(5 + look, -18, 1.8, 0, Math.PI * 2); ctx.fill();
  // Carried item above the head.
  if (c.carrying) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.arc(0, -52, 17, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c9b18a';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawFood(ctx, c.carrying.kind, c.carrying.state, 0, -52, 12);
  }
  ctx.restore();
}

// --- Order board -------------------------------------------------------------

function drawBoard(ctx, world) {
  const b = LAYOUT.board;
  ctx.fillStyle = 'rgba(14,24,40,0.88)';
  rr(ctx, b.x, b.y, b.w, b.h, 14);
  ctx.fill();
  ctx.strokeStyle = '#c9a86a';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'ORDER BOARD', b.x + b.w / 2, b.y + 30, 19, '#ffd94d', 800, 'center');
  text(ctx, 'fast serve = happy customer = big tip', b.x + b.w / 2, b.y + 50, 12, '#9fb3c8', 600, 'center');

  if (world.orders.length === 0) {
    text(ctx, 'No orders yet —', b.x + b.w / 2, b.y + 120, 15, '#dfe8f2', 600, 'center');
    text(ctx, 'the lunch rush is coming!', b.x + b.w / 2, b.y + 142, 15, '#dfe8f2', 600, 'center');
  }
  world.orders.forEach((order, i) => {
    const y = b.y + 66 + i * 158;
    const urgent = order.patience <= 12;
    const flash = urgent && Math.floor(order.flash * 4) % 2 === 0;
    ctx.fillStyle = flash ? '#5a2320' : '#f3e2c2';
    rr(ctx, b.x + 12, y, b.w - 24, 146, 10);
    ctx.fill();
    ctx.fillStyle = order.dish.color;
    rr(ctx, b.x + 12, y, b.w - 24, 34, 10);
    ctx.fill();
    ctx.fillStyle = '#2a1c10';
    rr(ctx, b.x + 12, y + 26, b.w - 24, 8, 0);
    ctx.fill();
    text(ctx, order.dish.name, b.x + 24, y + 23, 17, '#ffffff', 800);
    text(ctx, `${order.dish.price}c`, b.x + b.w - 24, y + 23, 16, '#ffe9a8', 800, 'right');
    // Recipe components.
    order.dish.needs.forEach((need, j) => {
      const ix = b.x + 40 + j * 62;
      const iy = y + 66;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(ix, iy, 24, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c9b18a';
      ctx.lineWidth = 2;
      ctx.stroke();
      drawFood(ctx, need.kind, need.state, ix, iy, 16);
      text(ctx, need.state, ix, iy + 40, 10, '#5d4a33', 700, 'center');
    });
    // The customer behind the ticket: their face shows how happy they
    // still are — smile, straight face, or frown as patience drains.
    const sat = orderSatisfaction(order);
    const fx = b.x + b.w - 44;
    const fy = y + 66;
    ctx.fillStyle = sat > 0.66 ? '#4caf50' : sat > 0.33 ? '#ff9d3c' : '#e23b2e';
    ctx.beginPath(); ctx.arc(fx, fy, 19, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2c79b';
    ctx.beginPath(); ctx.arc(fx, fy, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b2b3a';
    ctx.beginPath(); ctx.arc(fx - 6, fy - 4, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(fx + 6, fy - 4, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b2b3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (sat > 0.66) ctx.arc(fx, fy + 4, 7, 0.15 * Math.PI, 0.85 * Math.PI);
    else if (sat > 0.33) { ctx.moveTo(fx - 6, fy + 7); ctx.lineTo(fx + 6, fy + 7); }
    else ctx.arc(fx, fy + 12, 7, 1.15 * Math.PI, 1.85 * Math.PI);
    ctx.stroke();
    // Patience bar.
    const frac = sat;
    const barColor = frac > 0.5 ? '#4caf50' : frac > 0.25 ? '#ff9d3c' : '#e23b2e';
    progressBar(ctx, b.x + 24, y + 116, b.w - 48, 12, frac, barColor);
    text(ctx, `patience ${Math.ceil(order.patience)}s`, b.x + 24, y + 140, 12, '#8a7455', 600);
    text(ctx, `TIP +${orderTip(order)}c`, b.x + b.w - 24, y + 140, 13, urgent ? '#e23b2e' : '#b8860b', 800, 'right');
  });
}

// --- HUD ----------------------------------------------------------------------

function drawHud(ctx, world, now) {
  ctx.fillStyle = 'rgba(14,24,40,0.92)';
  ctx.fillRect(0, 0, VIEW.width, LAYOUT.hudHeight);
  ctx.fillStyle = '#c9a86a';
  ctx.fillRect(0, LAYOUT.hudHeight - 2, VIEW.width, 2);

  text(ctx, GAME_NAME, 16, 30, 26, '#ffd94d', 800);
  text(ctx, 'fast noodles · happy customers · big tips', 16, 52, 12, '#9fb3c8', 600);

  // Shift timer, centre.
  const low = world.shiftLeft <= 30 && world.screen === 'play';
  const pulse = low ? 1 + Math.sin(now * 8) * 0.08 : 1;
  ctx.save();
  ctx.translate(640, 34);
  ctx.scale(pulse, pulse);
  text(ctx, `⏱ ${fmtTime(world.shiftLeft)}`, 0, 8, 30, low ? '#ff6b5e' : '#ffffff', 800, 'center');
  ctx.restore();
  text(ctx, `Day ${world.level} · shift ends at 0:00`, 640, 56, 11, '#9fb3c8', 600, 'center');

  // Coins and combo.
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath(); ctx.arc(880, 30, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8a6d1d';
  text(ctx, 'c', 880, 35, 16, '#8a6d1d', 800, 'center');
  text(ctx, `${world.coins}`, 900, 38, 26, '#ffffff', 800);
  text(ctx, `tips +${world.tipsEarned}c · served ${world.served}`, 900, 56, 12, '#9fb3c8', 600);
  if (world.combo >= 2) {
    ctx.fillStyle = '#ff9d5c';
    rr(ctx, 1010, 14, 92, 36, 18);
    ctx.fill();
    text(ctx, `🔥 x${world.combo}`, 1056, 38, 18, '#ffffff', 800, 'center');
  }

  // Mute / pause buttons.
  for (const [rect, label] of [[HUD_PAUSE, 'II'], [HUD_MUTE, world.muted ? '✕' : '♪']]) {
    ctx.fillStyle = '#2a3b52';
    rr(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.strokeStyle = '#5d7390';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    text(ctx, label, rect.x + rect.w / 2, rect.y + 27, 18, '#dfe8f2', 800, 'center');
  }
}

// --- Overlays -----------------------------------------------------------------

function drawTitle(ctx, world, now) {
  ctx.fillStyle = 'rgba(10,18,32,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const bob = Math.sin(now * 1.4) * 4;
  text(ctx, GAME_NAME, 640, 150 + bob, 84, '#ffd94d', 800, 'center');
  text(ctx, GAME_SUBTITLE, 640, 196 + bob, 26, '#ffe9c4', 600, 'center');
  text(ctx, `${CHEF_NAME} runs the busiest noodle bar on the street.`, 640, 232, 18, '#dfe8f2', 600, 'center');
  text(ctx, 'Orders fly in, patience drains fast — serve fast and the tips roll in.', 640, 258, 18, '#dfe8f2', 600, 'center');

  ctx.fillStyle = 'rgba(243,226,194,0.96)';
  rr(ctx, 340, 292, 600, 240, 16);
  ctx.fill();
  text(ctx, 'HOW TO PLAY', 640, 326, 20, '#8a5a1d', 800, 'center');
  const lines = [
    ['1', 'Grab ingredients from the crates on the top wall.'],
    ['2', 'Chop chicken, veggie and chili on the boards.'],
    ['3', 'Cook rice, noodle, egg and chicken in the woks — don\'t burn them!'],
    ['4', 'Build the dish on a plate, then serve it at the pickup counter.'],
    ['5', 'Serve while patience is high: fat tip + speed bonus, and a combo.'],
  ];
  lines.forEach(([n, s], i) => {
    text(ctx, n, 380, 360 + i * 34, 18, '#c65a2e', 800);
    text(ctx, s, 410, 360 + i * 34, 16, '#3a2a18', 600);
  });
  text(ctx, 'Move: WASD / arrows or click  ·  Interact: E / Space or click a station', 640, 556, 15, '#dfe8f2', 600, 'center');
  text(ctx, 'P pause · M mute · R restart', 640, 580, 13, '#9fb3c8', 600, 'center');

  ctx.fillStyle = '#e2703a';
  rr(ctx, TITLE_START.x, TITLE_START.y, TITLE_START.w, TITLE_START.h, 16);
  ctx.fill();
  ctx.strokeStyle = '#ffd94d';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, 'START COOKING  ▶', 640, TITLE_START.y + 46, 24, '#ffffff', 800, 'center');
}

function drawResults(ctx, world) {
  const r = world.result;
  ctx.fillStyle = 'rgba(10,18,32,0.78)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#f3e2c2';
  rr(ctx, 390, 90, 500, 520, 20);
  ctx.fill();
  text(ctx, 'SHIFT OVER!', 640, 150, 40, '#8a5a1d', 800, 'center');
  const stars = '★'.repeat(r.stars) + '☆'.repeat(3 - r.stars);
  text(ctx, stars, 640, 205, 44, '#e8a13a', 800, 'center');
  const rows = [
    ['Coins earned', `${r.coins}`],
    ['Tips earned', `+${r.tips}c`],
    ['Dishes served', `${r.served}`],
    ['Orders missed', `${r.missed}`],
    ['Best combo', `x${r.bestCombo}`],
  ];
  rows.forEach(([label, value], i) => {
    const y = 248 + i * 40;
    text(ctx, label, 450, y, 20, '#5d4a33', 600);
    text(ctx, value, 830, y, 20, '#3a2a18', 800, 'right');
  });
  text(ctx, r.stars === 3 ? 'The whole street is talking about your noodles!' : r.stars === 2 ? 'A solid shift — the regulars are happy.' : 'The lunch rush will be back — practice makes perfect.', 640, 470, 16, '#8a5a1d', 600, 'center');
  ctx.fillStyle = '#e2703a';
  rr(ctx, RESULTS_RESTART.x, RESULTS_RESTART.y, RESULTS_RESTART.w, RESULTS_RESTART.h, 14);
  ctx.fill();
  text(ctx, 'COOK AGAIN  (R)', 640, RESULTS_RESTART.y + 41, 20, '#ffffff', 800, 'center');
  text(ctx, 'Tip: serve fast for tips — a big combo doubles your pay.', 640, 588, 13, '#8a7455', 600, 'center');
}

function drawPause(ctx) {
  ctx.fillStyle = 'rgba(10,18,32,0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  text(ctx, 'PAUSED', 640, 380, 56, '#ffffff', 800, 'center');
  text(ctx, 'Press P to keep cooking', 640, 420, 18, '#dfe8f2', 600, 'center');
}

// --- Main frame ---------------------------------------------------------------

export function drawGame(ctx, world, now) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawScenery(ctx, world, now);
  drawBoard(ctx, world);
  drawStations(ctx, world, now);

  // Steam and chop particles.
  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife) * 0.8;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  drawChef(ctx, world, now);

  // Rising +coins texts, on a dark pill so they read over any station.
  ctx.font = '800 20px Trebuchet MS, Verdana, sans-serif';
  for (const f of world.floats) {
    ctx.globalAlpha = Math.min(1, f.life);
    const w = ctx.measureText(f.text).width + 24;
    ctx.fillStyle = 'rgba(20,16,12,0.85)';
    rr(ctx, f.x - w / 2, f.y - 22, w, 30, 15);
    ctx.fill();
    text(ctx, f.text, f.x, f.y, 20, f.color, 800, 'center');
  }
  ctx.globalAlpha = 1;

  // Nearest-station hint.
  if (world.screen === 'play' && !world.paused) {
    const hint = world.hintStation;
    if (hint) {
      const c = { x: hint.x + hint.w / 2, y: hint.y + hint.h / 2 };
      ctx.strokeStyle = '#ffd94d';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      rr(ctx, hint.x - 4, hint.y - 4, hint.w + 8, hint.h + 8, 12);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'E', c.x, hint.y - 10, 15, '#ffd94d', 800, 'center');
    }
  }

  drawHud(ctx, world, now);

  // Toasts.
  if (world.toast) {
    ctx.globalAlpha = Math.min(1, world.toast.life);
    ctx.fillStyle = 'rgba(20,16,12,0.85)';
    ctx.font = '700 17px Trebuchet MS, Verdana, sans-serif';
    const w = ctx.measureText(world.toast.text).width + 40;
    rr(ctx, 640 - w / 2, 96, w, 40, 20);
    ctx.fill();
    text(ctx, world.toast.text, 640, 122, 17, '#ffe9c4', 700, 'center');
    ctx.globalAlpha = 1;
  }

  if (world.screen === 'title') drawTitle(ctx, world, now);
  if (world.screen === 'results') drawResults(ctx, world);
  if (world.paused && world.screen === 'play') drawPause(ctx);
}

// A one-line text outline of the dishes, used by the title screen's source
// outline and by nothing else at run time.
export function dishListText() {
  return DISHES.map((d) => `${d.name} (${d.price}c)`).join(' · ');
}
