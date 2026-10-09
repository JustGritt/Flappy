import type { GameObj } from "kaboom";
import { k } from "../kaboomContext";

// ==============================
// Exports
// ==============================

export const BUTTON_SIZE = 56;

/**
 * A square on-screen HUD button, drawn above the pause overlay.
 * Tagged "ui-button": tap/click handlers elsewhere (e.g. flapping) must ignore
 * presses while one is hovered, since a click fires both handlers.
 */
export function createButton(text: string, onClick: () => void) {
    const button = k.add([
        k.rect(BUTTON_SIZE, BUTTON_SIZE, { radius: 12 }),
        k.pos(0, 0),
        k.anchor("center"),
        k.color(0, 0, 0),
        k.opacity(0.35),
        k.area(),
        k.fixed(),
        k.z(11),
        "ui-button",
    ])

    const label = button.add([
        k.text(text, { size: 24 }),
        k.anchor("center"),
        k.opacity(1),
    ])

    button.onClick(() => {
        if (!button.hidden) onClick()
    })

    return { button, label }
}

/**
 * Scales a text object (which needs a `k.scale()` component) to fit
 * `maxWidth`, never above `maxScale`.
 * Call it every frame (or on resize) from the text's layout code.
 */
export function fitText(text: GameObj, maxScale: number, maxWidth = k.width() - 32) {
    // Kaboom reports a scaled text's width divided by its scale: undo that
    const naturalWidth = text.width * text.scale.x
    text.scale = k.vec2(Math.min(maxScale, maxWidth / naturalWidth))
}

/** Text transform for celebratory titles: rainbow letters that wave and wobble. */
export const rainbowWave = (idx: number) => ({
    color: k.hsl2rgb((k.time() * 0.2 + idx * 0.1) % 1, 0.7, 0.8),
    pos: k.vec2(0, k.wave(-4, 4, k.time() * 4 + idx * 0.5)),
    scale: k.wave(1, 1.2, k.time() * 3 + idx),
    angle: k.wave(-9, 9, k.time() * 3 + idx),
})

/** True when the pointer is over a visible HUD button. */
export function isPointerOnButton() {
    return k.get("ui-button").some(b => !b.hidden && b.isHovering())
}
