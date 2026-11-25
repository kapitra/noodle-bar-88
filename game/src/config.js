// Noodle Bar 88 — configuration.
// A bright street noodle bar: Chef Bimo cooks fast, customers watch their
// patience drain, and a fast serve pays a fat tip. Speed of serving and
// customer satisfaction drive the tips — that is the whole game.
// Every tunable number, ingredient, recipe and station layout lives here,
// so balancing the game never means hunting through the other files.

export const GAME_NAME = 'Noodle Bar 88';
export const GAME_SUBTITLE = 'Fast noodles, happy customers, big tips';
export const CHEF_NAME = 'Chef Bimo';

export const VIEW = { width: 1280, height: 800 };
export const SHIFT_LENGTH = 180; // seconds of one shift
export const MAX_ORDERS = 4;
export const CHEF_SPEED = 265; // px per second
export const INTERACT_RANGE = 100; // px from the chef to a station

// Tips: the faster the serve, the fatter the tip. A serve while patience
// is above SPEED_THRESHOLD also pays a flat speed bonus.
export const TIP_MAX = 12;
export const SPEED_BONUS = 5;
export const SPEED_THRESHOLD = 0.7;

// One ingredient kind. `chop` / `cook` are seconds of work, 0 means the
// step does not apply. A finished component is either `chopped` or `cooked`.
export const INGREDIENTS = {
  rice:    { label: 'Rice',    color: '#f5ead2', dark: '#cbb98d', chop: 0,   cook: 4, shape: 'rice' },
  noodle:  { label: 'Noodle',  color: '#f2c14e', dark: '#b98a1e', chop: 0,   cook: 4, shape: 'noodle' },
  chicken: { label: 'Chicken', color: '#d98a4b', dark: '#8f4f1d', chop: 2.2, cook: 5, shape: 'drum' },
  egg:     { label: 'Egg',     color: '#fdf3d0', dark: '#e0a92e', chop: 0,   cook: 3, shape: 'egg' },
  veggie:  { label: 'Veggie',  color: '#69b455', dark: '#2f6b2a', chop: 2,   cook: 0, shape: 'leaf' },
  chili:   { label: 'Chili',   color: '#e23b2e', dark: '#7d150c', chop: 1.5, cook: 0, shape: 'chili' },
};

// A dish is a set of finished components. Order on a plate does not matter.
export const DISHES = [
  {
    id: 'sate', name: 'Sate Ayam', price: 10, color: '#e2703a',
    needs: [
      { kind: 'chicken', state: 'cooked' },
      { kind: 'chili', state: 'chopped' },
    ],
  },
  {
    id: 'nasi-goreng', name: 'Nasi Goreng', price: 14, color: '#d99a2b',
    needs: [
      { kind: 'rice', state: 'cooked' },
      { kind: 'egg', state: 'cooked' },
      { kind: 'chili', state: 'chopped' },
    ],
  },
  {
    id: 'mie-goreng', name: 'Mie Goreng', price: 13, color: '#e0a92e',
    needs: [
      { kind: 'noodle', state: 'cooked' },
      { kind: 'egg', state: 'cooked' },
      { kind: 'veggie', state: 'chopped' },
    ],
  },
  {
    id: 'ayam-geprek', name: 'Ayam Geprek', price: 15, color: '#c65a2e',
    needs: [
      { kind: 'rice', state: 'cooked' },
      { kind: 'chicken', state: 'cooked' },
      { kind: 'chili', state: 'chopped' },
    ],
  },
  {
    id: 'mie-ayam', name: 'Mie Ayam', price: 16, color: '#b4762a',
    needs: [
      { kind: 'noodle', state: 'cooked' },
      { kind: 'chicken', state: 'cooked' },
      { kind: 'veggie', state: 'chopped' },
    ],
  },
];

// Kitchen layout. The order board is a panel on the left; everything else
// is a station the chef walks up to. x/y/w/h are in logical pixels.
export const LAYOUT = {
  hudHeight: 64,
  board: { x: 8, y: 72, w: 284, h: 720 },
  floor: { x: 300, y: 72, w: 972, h: 720 },
  chefStart: { x: 790, y: 430 },
  crates: [
    { id: 'crate-rice', kind: 'crate', item: 'rice', x: 320, y: 78, w: 140, h: 72 },
    { id: 'crate-noodle', kind: 'crate', item: 'noodle', x: 472, y: 78, w: 140, h: 72 },
    { id: 'crate-chicken', kind: 'crate', item: 'chicken', x: 624, y: 78, w: 140, h: 72 },
    { id: 'crate-egg', kind: 'crate', item: 'egg', x: 776, y: 78, w: 140, h: 72 },
    { id: 'crate-veggie', kind: 'crate', item: 'veggie', x: 928, y: 78, w: 140, h: 72 },
    { id: 'crate-chili', kind: 'crate', item: 'chili', x: 1080, y: 78, w: 140, h: 72 },
  ],
  boards: [
    { id: 'board-1', kind: 'board', x: 308, y: 220, w: 76, h: 104 },
    { id: 'board-2', kind: 'board', x: 308, y: 348, w: 76, h: 104 },
  ],
  woks: [
    { id: 'wok-1', kind: 'wok', x: 1196, y: 220, w: 76, h: 104 },
    { id: 'wok-2', kind: 'wok', x: 1196, y: 348, w: 76, h: 104 },
  ],
  plates: { id: 'plates', kind: 'plates', x: 560, y: 694, w: 240, h: 92 },
  serve: { id: 'serve', kind: 'serve', x: 1060, y: 694, w: 212, h: 92 },
  trash: { id: 'trash', kind: 'trash', x: 308, y: 694, w: 120, h: 92 },
};

// Stars at the end of a shift, by coins earned.
export const STAR_CUT = [90, 160, 240];
