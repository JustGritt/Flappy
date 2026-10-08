// ==============================
// Player
// ==============================

export const GRAVITY = 1000;
export const JUMP_FORCE = 500;

// ==============================
// Pipes (values at score 0 → values at full difficulty)
// ==============================

export const PIPE_WIDTH = 100;

export const GAP_SIZE = 350;
export const MIN_GAP_SIZE = 220;

export const PIPE_SPEED = 150;
export const MAX_PIPE_SPEED = 300;

export const PIPE_INTERVAL = 3;
export const MIN_PIPE_INTERVAL = 1.6;

// Score at which the pipes reach full difficulty
export const MAX_DIFFICULTY_SCORE = 40;

// Delay between the first flap and the first pipe
export const FIRST_PIPE_DELAY = 1;

// ==============================
// Game over
// ==============================

// Delay before the game over scene, so the crash is visible
export const DEATH_DELAY = 0.8;

// Ignore restart input right after dying to avoid accidental restarts
export const RESTART_INPUT_DELAY = 0.5;
