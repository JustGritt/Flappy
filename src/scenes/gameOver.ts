import { createBackground } from '../utils/background';
import { score, highScore, isNewHighScore } from '../utils/score';
import { RESTART_INPUT_DELAY } from '../utils/constants';
import { bindMuteKey, playSound } from '../utils/audio';
import { k } from "../kaboomContext";

// ==============================
// Functions
// ==============================

export function createGameOver() {
    createBackground()

    const overlay = k.add([
        k.rect(k.width(), k.height()),
        k.color(0, 0, 0),
        k.opacity(0.7),
        k.pos(0, 0),
    ])

    const title = k.add([
        k.text("Game Over"),
        k.pos(0, 0),
        k.scale(2),
        k.z(1),
        k.anchor("center"),
    ])

    const highScoreText = isNewHighScore
        ? k.add([
            k.text("New High Score: " + highScore, {
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
            k.pos(0, 0),
            k.z(1),
            k.anchor("center"),
        ])
        : k.add([
            k.text("High Score: " + highScore),
            k.pos(0, 0),
            k.z(1),
            k.anchor("center"),
        ])

    const scoreText = k.add([
        k.text("Score: " + score),
        k.pos(0, 0),
        k.z(1),
        k.anchor("center"),
    ])

    const startText = k.add([
        k.text("Press space or tap to restart\nEscape for the main menu", {
            align: "center",
            lineSpacing: 8,
        }),
        k.pos(0, 0),
        k.z(1),
        k.anchor("center"),
    ])

    const layout = () => {
        overlay.width = k.width()
        overlay.height = k.height()

        // Shrink the text on narrow (mobile) screens
        const textSize = Math.min(36, k.width() / 16)
        highScoreText.textSize = isNewHighScore ? textSize * 1.3 : textSize
        scoreText.textSize = textSize
        startText.textSize = Math.min(28, k.width() / 20)
        startText.width = k.width() - 32
        title.scale = k.vec2(Math.min(2, k.width() / 400))

        title.pos = k.vec2(k.width() / 2, k.height() / 2 - 64 * 3)
        highScoreText.pos = k.vec2(k.width() / 2, k.height() / 2 - 64)
        scoreText.pos = k.vec2(k.width() / 2, k.height() / 2)
        startText.pos = k.vec2(k.width() / 2, k.height() / 1.25)
    }
    layout()
    k.onResize(layout)

    k.loop(0.7, () => {
        startText.hidden = !startText.hidden
    })

    // Ignore inputs right after dying so frantic flapping doesn't skip this screen
    let canRestart = false
    k.wait(RESTART_INPUT_DELAY, () => canRestart = true)

    const restart = () => {
        if (canRestart) k.go("game")
    }

    k.onKeyPress("space", restart)
    k.onMousePress(restart)
    k.onKeyPress("escape", () => k.go("menu"))
    bindMuteKey()

    if (isNewHighScore) playSound("highscore")
}
