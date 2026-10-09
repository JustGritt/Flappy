// ==============================
// Screen
// ==============================

// Gameplay sizes below are for a screen at least this big. Other screens scale
// them by `unit()` (utils/scale.ts): by height, or by width on narrow screens.
export const BASE_HEIGHT = 800;
export const BASE_WIDTH = 500;

// ==============================
// Player
// ==============================

export const GRAVITY = 1000;
export const JUMP_FORCE = 500;

// ==============================
// Ground
// ==============================

// Height of the ground strip; its top is the floor the player dies on
export const GROUND_HEIGHT = 80;

// ==============================
// Pipes (values at score 0 → values at full difficulty)
// ==============================

export const PIPE_WIDTH = 100;
export const PIPE_CAP_HEIGHT = 32;
// How far the cap sticks out on each side of the pipe
export const PIPE_CAP_OVERHANG = 8;

export const GAP_SIZE = 350;
export const MIN_GAP_SIZE = 220;

export const PIPE_SPEED = 150;
export const MAX_PIPE_SPEED = 300;

export const PIPE_INTERVAL = 3;
export const MIN_PIPE_INTERVAL = 1.6;

// How far (px) a gap's centre may move from the previous one, per second
// between pipes. Keeps fast pipes from asking for an impossible climb or dive.
export const GAP_SHIFT_PER_SECOND = 150;

// From this score, some pipe pairs bob up and down (never two in a row)
export const MOVING_PIPES_SCORE = 25;
// Chance that a pair moves, when allowed
export const MOVING_PIPE_CHANCE = 0.5;
// How far (px) a moving pair bobs either side of its resting place, and the
// seconds per full cycle
export const MOVING_PIPE_AMPLITUDE = 60;
export const MOVING_PIPE_PERIOD = 2.4;

// Score at which the pipes reach full difficulty
export const MAX_DIFFICULTY_SCORE = 40;

// Delay between the first flap and the first pipe
export const FIRST_PIPE_DELAY = 1;

// ==============================
// Score
// ==============================

// Every N points the score flashes gold and plays the milestone sound
export const SCORE_MILESTONE = 10;

// ==============================
// Sky
// ==============================

// Points per sky phase (day, sunset, night), and how many of its last points
// blend into the next one
export const SKY_PHASE_POINTS = 25;
export const SKY_TRANSITION_POINTS = 5;

// ==============================
// Game over
// ==============================

// Time the player lies on the ground before the game over scene
export const DEATH_DELAY = 0.8;

// Ignore restart input right after dying to avoid accidental restarts
export const RESTART_INPUT_DELAY = 0.5;
