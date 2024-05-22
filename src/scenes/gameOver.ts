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

    k.add([
        k.text("High Score: " + highScore),
        k.pos(k.width() / 2, k.height() / 2 - 64),
        k.z(1),
        k.anchor("center"),
    ])

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

