import { createBackground } from '../utils/background';
import { k } from "../kaboomContext";

export let chosenDifficulty = "Easy"

// ==============================
// Functions
// ==============================

export function createMainMenu() {
    createBackground()

    const title = k.add([
        k.text("Flappy", {
            size: 48,
            lineSpacing: 8,
            letterSpacing: 4,
            transform: (idx) => ({
                color: k.hsl2rgb((k.time() * 0.2 + idx * 0.1) % 1, 0.7, 0.8),
                pos: k.vec2(0, k.wave(-4, 4, k.time() * 4 + idx * 0.5)),
                scale: k.wave(1, 1.2, k.time() * 3 + idx),
                angle: k.wave(-9, 9, k.time() * 3 + idx),
            }),
        }),
        k.pos(k.width() / 2, k.height() / 4),
        k.scale(2),
        k.anchor("center"),
    ])

    const startText = k.add([
        k.text("Press space to start", {
            size: 48,
            lineSpacing: 8,
            letterSpacing: 4,
            transform: (idx) => ({
                color: k.hsl2rgb((k.time() * 0.2 + idx * 0.1) % 1, 0.7, 0.8),
                pos: k.vec2(0, k.wave(-4, 4, k.time() * 4 + idx * 0.5)),
                scale: k.wave(1, 1.2, k.time() * 3 + idx),
                angle: k.wave(-9, 9, k.time() * 3 + idx),
            }),
        }),
        k.pos(k.width() / 2, k.height() / 2),
        k.anchor("center"),
    ])



    k.loop(0.7, () => {
        startText.hidden = !startText.hidden
    })

    // Handle resize
    let resizeTimeout: any;
    k.onResize(() => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            createBackground()

            title.pos.x = k.width() / 2
            title.pos.y = k.height() / 4

            startText.pos.x = k.width() / 2
            startText.pos.y = k.height() / 1.25
        }, 1000);
    });
}