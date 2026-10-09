import { k } from "../kaboomContext";

const FADE_TIME = 0.2;

// True from the start of a fade-out until the next scene starts
let leaving = false;

function addFade(opacity: number) {
    return k.add([
        k.rect(k.width(), k.height()),
        k.color(0, 0, 0),
        k.opacity(opacity),
        k.fixed(),
        k.z(100), // above everything, HUD included
        "fade",
    ]);
}

// ==============================
// Exports
// ==============================

/**
 * Fades to black, then switches to `scene`. Calls made while a fade-out is
 * already running are ignored, so double input can't switch twice.
 * Use instead of `k.go` for every scene change.
 */
export function goWithFade(scene: string) {
    if (leaving) return;
    leaving = true;
    const fade = addFade(0);
    k.tween(0, 1, FADE_TIME, v => fade.opacity = v).onEnd(() => k.go(scene));
}

/** Fades the current scene in from black. Call at the start of every scene. */
export function fadeIn() {
    leaving = false;
    const fade = addFade(1);
    k.tween(1, 0, FADE_TIME, v => fade.opacity = v).onEnd(() => fade.destroy());
}
