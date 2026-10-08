import type { GameObj } from "kaboom";
import { k } from "../kaboomContext";

export let isPaused = false;

// ==============================
// Functions
// ==============================

function createPauseOverlay() {
    const overlay = k.add([
        k.rect(k.width(), k.height()),
        k.color(0, 0, 0),
        k.opacity(0.7),
        k.pos(0, 0),
        k.fixed(),
        k.z(9),
        "pause"
    ]);

    const title = overlay.add([
        k.text("GAME PAUSED"),
        k.pos(k.width() / 2, k.height() / 2 - 100),
        k.anchor("center"),
        k.scale(1.5),
        k.color(231, 76, 60),
        k.z(10),
    ]);

    const subtext = overlay.add([
        k.text("Press [p] to resume"),
        k.pos(k.width() / 2, k.height() / 2),
        k.anchor("center"),
        k.scale(1.5),
        k.color(231, 76, 60),
        k.timer(),
        k.z(10),
    ]);

    // Bound to the subtext so the loop stops when the overlay is destroyed
    subtext.loop(1, () => {
        subtext.hidden = !subtext.hidden;
    });

    overlay.onUpdate(() => {
        overlay.width = k.width();
        overlay.height = k.height();
        title.pos = k.vec2(k.width() / 2, k.height() / 2 - 100);
        subtext.pos = k.vec2(k.width() / 2, k.height() / 2);
    });
}

// ==============================
// Exports
// ==============================

/** Freezes everything inside `world` (movement, physics, its timers). */
export function pause(world: GameObj) {
    if (isPaused) return
    isPaused = true;
    world.paused = true;
    createPauseOverlay();
}

/** Clears pause state left over from a previous scene (scene changes destroy the overlay). */
export function resetPause() {
    isPaused = false;
}

export function resume(world: GameObj) {
    isPaused = false;
    world.paused = false;
    k.get("pause").forEach(p => p.destroy());
}
