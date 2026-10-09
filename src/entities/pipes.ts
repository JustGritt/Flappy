import type { GameObj } from "kaboom";
import {
    GAP_SIZE, MIN_GAP_SIZE,
    PIPE_SPEED, MAX_PIPE_SPEED,
    PIPE_INTERVAL, MIN_PIPE_INTERVAL,
    PIPE_WIDTH, PIPE_CAP_HEIGHT, PIPE_CAP_OVERHANG,
    GAP_SHIFT_PER_SECOND,
    MOVING_PIPES_SCORE, MOVING_PIPE_CHANCE, MOVING_PIPE_AMPLITUDE, MOVING_PIPE_PERIOD,
} from "../utils/constants";
import { unit } from "../utils/scale";
import { MODES, currentMode } from "../utils/modes";
import { groundTop } from "./ground";
import { k } from "../kaboomContext";

// ==============================
// Functions
// ==============================

/**
 * Pipe settings for a given score (in screen pixels) in the current mode,
 * ramping linearly up to the mode's `rampScore`.
 */
export function getDifficulty(score: number) {
    const mode = MODES[currentMode()];
    const t = Math.min(score / mode.rampScore, 1);
    return {
        gap: k.lerp(GAP_SIZE, MIN_GAP_SIZE, t) * mode.gap * unit(),
        speed: k.lerp(PIPE_SPEED, MAX_PIPE_SPEED, t) * mode.speed * unit(),
        interval: k.lerp(PIPE_INTERVAL, MIN_PIPE_INTERVAL, t) * mode.interval,
    };
}

// The previous gap's centre and how far it bobs, so the next one can't be out of reach
let lastGapCenter: number | null = null;
let lastAmplitude = 0;

/** Forget the previous gap. Call at the start of each game. */
export function resetPipes() {
    lastGapCenter = null;
    lastAmplitude = 0;
}

/**
 * Picks the gap's resting centre. A gap that bobs by `amplitude` must stay in
 * the sky at both extremes, and every point it can reach must be within a
 * climb or dive of every point the previous gap could have been at.
 * Returns null when no centre satisfies that (the caller then tries without bobbing).
 */
function pickGapCenter(gap: number, interval: number, amplitude: number) {
    // Pipes and gaps fit in the sky above the ground
    const sky = groundTop();
    // Keep a small margin so a pipe is always visible at the top and bottom
    const margin = Math.min(48 * unit(), (sky - gap) / 2);
    let lo = margin + gap / 2 + amplitude;
    let hi = sky - margin - gap / 2 - amplitude;
    if (lo > hi) return null;

    // The bird can only climb or dive so far before the next pipe arrives
    if (lastGapCenter !== null) {
        const maxShift = GAP_SHIFT_PER_SECOND * interval * unit() - lastAmplitude - amplitude;
        const shiftLo = Math.max(lo, lastGapCenter - maxShift);
        const shiftHi = Math.min(hi, lastGapCenter + maxShift);
        if (shiftLo <= shiftHi) {
            lo = shiftLo;
            hi = shiftHi;
        } else if (amplitude > 0) {
            return null;
        }
        // A static gap with an empty range only happens if the window shrank a
        // lot: fall back to anywhere in the sky
    }
    return k.rand(lo, hi);
}

// Pipes spawn just past the right edge of the screen
const spawnX = () => k.width() + 64 * unit();

function createPipePart(pair: GameObj, height: number, anchor: "top" | "bot", yPosition: number) {
    const u = unit();
    const outline = Math.max(2, 4 * u);
    const pipe = pair.add([
        k.rect(PIPE_WIDTH * u, height, { radius: 4 * u }),
        k.color(150, 111, 51),
        k.outline(outline, k.rgb(110, 78, 32)),
        k.anchor(anchor),
        k.pos(0, yPosition),
        k.area(),
        "pipe",
    ]);

    // Cap at the open end. Child positions are relative to the parent's anchor
    // point, so the open end is at +height for a "top" pipe and -height for a "bot" one.
    pipe.add([
        k.rect((PIPE_WIDTH + PIPE_CAP_OVERHANG * 2) * u, PIPE_CAP_HEIGHT * u, { radius: 6 * u }),
        k.color(130, 94, 40),
        k.outline(outline, k.rgb(110, 78, 32)),
        k.anchor(anchor === "top" ? "bot" : "top"),
        k.pos(0, anchor === "top" ? height : -height),
        k.area(),
        "pipe",
    ]);

    return pipe;
}

// ==============================
// Export
// ==============================

/**
 * Spawns a pipe pair: a parent tagged "pipe-pair" that moves left, holding the
 * top "pipe", the invisible scoring "gap" and the bottom "pipe", so they stay
 * aligned when the pair bobs. From MOVING_PIPES_SCORE some pairs bob up and
 * down, never two in a row.
 */
export function createPipe(world: GameObj, score: number) {
    const { gap, speed, interval } = getDifficulty(score);

    const wantsToMove = score >= MOVING_PIPES_SCORE && lastAmplitude === 0 && k.rand(0, 1) < MOVING_PIPE_CHANCE;
    let amplitude = wantsToMove ? MOVING_PIPE_AMPLITUDE * unit() : 0;
    let center = pickGapCenter(gap, interval, amplitude);
    if (center === null) {
        amplitude = 0;
        center = pickGapCenter(gap, interval, 0)!;
    }
    lastGapCenter = center;
    lastAmplitude = amplitude;

    const topHeight = center - gap / 2;
    const bottomHeight = groundTop() - topHeight - gap;

    const pair = world.add([
        k.pos(spawnX(), 0),
        k.move(k.LEFT, speed),
        k.offscreen({ destroy: true, distance: PIPE_WIDTH * unit() }),
        "pipe-pair",
        { amplitude },
    ]);

    // The top pipe extends past the screen edge (16px plus however far the
    // pair bobs down) to hide its rounded end, and the bottom one runs down
    // behind the ground to the bottom of the screen
    const overshoot = 16 + amplitude;
    createPipePart(pair, topHeight + overshoot, "top", -overshoot);
    pair.add([
        k.rect(PIPE_WIDTH * unit(), gap),
        k.pos(0, topHeight),
        k.anchor("top"),
        k.area(),
        k.opacity(0),
        "gap",
    ]);
    createPipePart(pair, bottomHeight + (k.height() - groundTop()) + 16, "bot", k.height() + 16);

    if (amplitude > 0) {
        // Its own update, so the bobbing freezes with the world
        let time = k.rand(0, MOVING_PIPE_PERIOD);
        pair.onUpdate(() => {
            time += k.dt();
            pair.pos.y = Math.sin(time / MOVING_PIPE_PERIOD * Math.PI * 2) * amplitude;
        });
    }
}
