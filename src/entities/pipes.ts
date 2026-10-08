import type { GameObj } from "kaboom";
import {
    GAP_SIZE, MIN_GAP_SIZE,
    PIPE_SPEED, MAX_PIPE_SPEED,
    PIPE_INTERVAL, MIN_PIPE_INTERVAL,
    MAX_DIFFICULTY_SCORE, PIPE_WIDTH,
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

function handlePipePosition(gap: number) {
    const totalHeight = k.height();
    // Keep a small margin so a pipe is always visible at the top and bottom
    const margin = Math.min(48, (totalHeight - gap) / 2);
    const topPipeHeight = k.rand(margin, totalHeight - gap - margin);
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
    return world.add([
        k.rect(PIPE_WIDTH, height, { radius: 16 }),
        k.color(150, 111, 51),
        k.outline(4, k.rgb(110, 78, 32)),
        k.anchor(anchor),
        k.pos(k.width() + 64, yPosition),
        k.area(),
        k.move(k.LEFT, speed),
        k.offscreen({ destroy: true }),
        "pipe",
    ]);
}

// ==============================
// Export
// ==============================

export function createPipe(world: GameObj, score: number) {
    const { gap, speed } = getDifficulty(score);
    const { topPipeHeight, bottomPipeHeight } = handlePipePosition(gap);

    // Pipe parts extend 16px past the screen edge to hide their rounded ends
    createPipePart(world, topPipeHeight + 16, "top", -16, speed);
    createMiddlePart(world, topPipeHeight, bottomPipeHeight, speed);
    createPipePart(world, bottomPipeHeight + 16, "bot", k.height() + 16, speed);
}
