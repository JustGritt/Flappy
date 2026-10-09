import { MAX_DIFFICULTY_SCORE } from "./constants";
import { k } from "../kaboomContext";

export type Mode = "easy" | "normal" | "hard";

/**
 * Per-mode tuning, applied on top of the pipe values in constants.ts: gap,
 * speed and interval are multipliers, and `rampScore` is the score at which
 * the pipes reach full difficulty.
 */
export const MODES: Record<Mode, { name: string; color: ReturnType<typeof k.rgb>; gap: number; speed: number; interval: number; rampScore: number }> = {
    easy: { name: "Easy", color: k.rgb(140, 230, 120), gap: 1.2, speed: 0.85, interval: 1.1, rampScore: MAX_DIFFICULTY_SCORE * 1.5 },
    normal: { name: "Normal", color: k.rgb(255, 255, 255), gap: 1, speed: 1, interval: 1, rampScore: MAX_DIFFICULTY_SCORE },
    hard: { name: "Hard", color: k.rgb(255, 130, 110), gap: 0.9, speed: 1.15, interval: 0.9, rampScore: MAX_DIFFICULTY_SCORE * 0.625 },
};

const ORDER: Mode[] = ["easy", "normal", "hard"];
const MODE_KEY = "flappy.mode";

function loadMode(): Mode {
    try {
        const saved = localStorage.getItem(MODE_KEY);
        return ORDER.includes(saved as Mode) ? saved as Mode : "normal";
    } catch {
        return "normal";
    }
}

let mode = loadMode();

// ==============================
// Exports
// ==============================

export function currentMode() {
    return mode;
}

/** Selects the previous (-1) or next (1) mode, wrapping around, and remembers it. */
export function cycleMode(step: 1 | -1) {
    mode = ORDER[(ORDER.indexOf(mode) + step + ORDER.length) % ORDER.length];
    try {
        localStorage.setItem(MODE_KEY, mode);
    } catch {
        // Storage unavailable: remember it for this visit only
    }
}
