import type { GameObj } from "kaboom";
import {
    GAP_SIZE, MIN_GAP_SIZE,
    PIPE_SPEED, MAX_PIPE_SPEED,
    PIPE_INTERVAL, MIN_PIPE_INTERVAL,
    MAX_DIFFICULTY_SCORE, PIPE_WIDTH, PIPE_CAP_HEIGHT, PIPE_CAP_OVERHANG,
    GAP_SHIFT_PER_SECOND,
} from "../utils/constants";
import { k } from "../kaboomContext";

// ==============================
// Functions
// ==============================

/** Pipe settings for a given score, ramping linearly up to MAX_DIFFICULTY_SCORE. */
export function getDifficulty(score: number) {
    const t = Math.min(score / MAX_DIFFICULTY_SCORE, 1);
    return {
        gap: k.lerp(GAP_SIZE, MIN_GAP_SIZE, t),
        speed: k.lerp(PIPE_SPEED, MAX_PIPE_SPEED, t),
        interval: k.lerp(PIPE_INTERVAL, MIN_PIPE_INTERVAL, t),
    };
}

// Centre of the previous gap, so the next one can't be out of reach
let lastGapCenter: number | null = null;

/** Forget the previous gap. Call at the start of each game. */
export function resetPipes() {
    lastGapCenter = null;
}

function handlePipePosition(gap: number, interval: number) {
    const totalHeight = k.height();
    // Keep a small margin so a pipe is always visible at the top and bottom
    const margin = Math.min(48, (totalHeight - gap) / 2);
    let minCenter = margin + gap / 2;
    let maxCenter = totalHeight - margin - gap / 2;

    // The bird can only climb or dive so far before the next pipe arrives
    if (lastGapCenter !== null) {
        const maxShift = GAP_SHIFT_PER_SECOND * interval;
        const lo = Math.max(minCenter, lastGapCenter - maxShift);
        const hi = Math.min(maxCenter, lastGapCenter + maxShift);
        // Empty range only if the window shrank a lot: fall back to anywhere on screen
        if (lo <= hi) {
            minCenter = lo;
            maxCenter = hi;
        }
    }

    const center = k.rand(minCenter, maxCenter);
    lastGapCenter = center;

    const topPipeHeight = center - gap / 2;
    const bottomPipeHeight = totalHeight - topPipeHeight - gap;
    return { topPipeHeight, bottomPipeHeight };
}

function createMiddlePart(world: GameObj, topHeight: number, bottomHeight: number, speed: number) {
    return world.add([
        k.rect(PIPE_WIDTH, k.height() - topHeight - bottomHeight),
        k.pos(k.width() + 64, topHeight),
        k.anchor("top"),
        k.area(),
        k.opacity(0),
        k.move(k.LEFT, speed),
        k.offscreen({ destroy: true }),
        "gap",
    ]);
}

function createPipePart(world: GameObj, height: number, anchor: "top" | "bot", yPosition: number, speed: number) {
    const pipe = world.add([
        k.rect(PIPE_WIDTH, height, { radius: 4 }),
        k.color(150, 111, 51),
        k.outline(4, k.rgb(110, 78, 32)),
        k.anchor(anchor),
        k.pos(k.width() + 64, yPosition),
        k.area(),
        k.move(k.LEFT, speed),
        k.offscreen({ destroy: true }),
        "pipe",
    ]);

    // Cap at the open end. Child positions are relative to the parent's anchor
    // point, so the open end is at +height for a "top" pipe and -height for a "bot" one.
    pipe.add([
        k.rect(PIPE_WIDTH + PIPE_CAP_OVERHANG * 2, PIPE_CAP_HEIGHT, { radius: 6 }),
        k.color(130, 94, 40),
        k.outline(4, k.rgb(110, 78, 32)),
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

export function createPipe(world: GameObj, score: number) {
    const { gap, speed, interval } = getDifficulty(score);
    const { topPipeHeight, bottomPipeHeight } = handlePipePosition(gap, interval);

    // Pipe parts extend 16px past the screen edge to hide their rounded ends
    createPipePart(world, topPipeHeight + 16, "top", -16, speed);
    createMiddlePart(world, topPipeHeight, bottomPipeHeight, speed);
    createPipePart(world, bottomPipeHeight + 16, "bot", k.height() + 16, speed);
}
