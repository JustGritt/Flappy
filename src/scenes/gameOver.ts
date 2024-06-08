import { createBackground } from '../utils/background';
import { score, highScore } from '../utils/score';
import { k } from "../kaboomContext";

// ==============================
// Functions
// ==============================

export function createGameOver() {
    createBackground()

    k.add([
        k.rect(k.width(), k.height()),
        k.color(0, 0, 0),
        k.opacity(0.7),
        k.pos(k.width() / 2, k.height() / 2),
        k.anchor("center"),
    ])

    k.add([
        k.text("Game Over"),
        k.pos(k.width() / 2, k.height() / 2 - 64 * 3),
        k.scale(2),
        k.z(1),
        k.anchor("center"),
    ])

    if(highScore === score) {
        k.add([
            k.text("High Score: " + highScore, {
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
            k.pos(k.width() / 2, k.height() / 2 - 64),
            k.z(1),
            k.anchor("center"),
        ])
    } else {
        k.add([
            k.text("High Score: " + highScore),
            k.pos(k.width() / 2, k.height() / 2 - 64),
            k.z(1),
            k.anchor("center"),
        ])
    }

    k.add([
        k.text("Score: " + score),
        k.pos(k.width() / 2, k.height() / 2),
        k.z(1),
        k.anchor("center"),
    ])

    const startText = k.add([
        k.text("Press space to restart or escape to go back to main menu"),
        k.pos(k.width() / 2, k.height() / 1.25),
        k.z(1),
        k.anchor("center"),
    ])

    k.loop(0.7, () => {
        startText.hidden = !startText.hidden
    })
}

