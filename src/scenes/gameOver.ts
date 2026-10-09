import { createBackground, skyColor } from '../utils/background';
import { createGround, groundTop } from '../entities/ground';
import { score, highScore, isNewHighScore } from '../utils/score';
import { RESTART_INPUT_DELAY } from '../utils/constants';
import { bindMuteKey, playSound } from '../utils/audio';
import { createMedal, medalFor } from '../utils/medals';
import { fadeIn, goWithFade } from "../utils/transition";
import { rainbowWave } from "../utils/ui";
import { k } from "../kaboomContext";

// ==============================
// Functions
// ==============================

// Seconds to count the score up from 0: longer for bigger scores, capped
const countUpTime = (value: number) => Math.min(1.5, 0.3 + value * 0.04)

export function createGameOver() {
    fadeIn()
    // Under the sky the player crashed in
    createBackground(undefined, skyColor(score))
    // Still, like the frozen world the player just died in
    createGround(() => 0)

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

    const medal = medalFor(score)
    const medalView = medal ? createMedal(medal) : undefined

    const scoreText = k.add([
        k.text("Score: 0"),
        k.pos(0, 0),
        k.z(1),
        k.anchor("center"),
    ])

    // "Best: N", or a rainbow "New best: N" once the count-up reaches it
    const bestText = k.add([
        k.text(isNewHighScore ? `New best: ${highScore}` : `Best: ${highScore}`, {
            transform: isNewHighScore ? rainbowWave : undefined,
        }),
        k.pos(0, 0),
        k.z(1),
        k.anchor("center"),
    ])
    bestText.hidden = isNewHighScore

    const startText = k.add([
        k.text("Press space or tap to restart\nEscape for the main menu", {
            align: "center",
            // Kaboom only wraps text given a width when created; layout() updates it
            width: k.width() - 32,
            lineSpacing: 8,
        }),
        k.pos(0, 0),
        k.z(1),
        k.anchor("center"),
    ])

    const layout = () => {
        overlay.width = k.width()
        overlay.height = k.height()

        // Spread over the sky, so short (landscape phone) screens fit too
        const sky = groundTop()
        const center = (fraction: number) => k.vec2(k.width() / 2, sky * fraction)

        // Shrink the text on narrow (mobile) and short (landscape) screens
        const textSize = Math.min(36, k.width() / 16, sky / 12)
        scoreText.textSize = textSize
        bestText.textSize = textSize
        startText.textSize = Math.min(28, k.width() / 20, sky / 14)
        startText.width = k.width() - 32
        title.scale = k.vec2(Math.min(2, k.width() / 400, k.height() / 250))

        title.pos = center(0.14)
        medalView?.layout(center(0.34), Math.min(48, sky * 0.09, k.width() * 0.12), textSize * 0.6)
        scoreText.pos = center(0.6)
        bestText.pos = center(0.7)
        startText.pos = center(0.86)
    }
    layout()
    k.onResize(layout)

    k.loop(0.7, () => {
        startText.hidden = !startText.hidden
    })

    // ==============================
    // Count-up, then medal and best score
    // ==============================

    let counting = true
    const reveal = () => {
        counting = false
        scoreText.text = `Score: ${score}`
        bestText.hidden = false
        medalView?.reveal()
        if (isNewHighScore) playSound("highscore")
        else if (medal) playSound("milestone")
    }

    const countUp = score > 0
        ? k.tween(0, score, countUpTime(score), v => scoreText.text = `Score: ${Math.floor(v)}`, k.easings.easeOutQuad)
        : undefined
    if (countUp) countUp.onEnd(reveal)
    else reveal()

    // ==============================
    // Input
    // ==============================

    // Ignore inputs right after dying so frantic flapping doesn't skip this screen.
    // After that, the first press finishes the count-up and the next restarts.
    let acceptInput = false
    k.wait(RESTART_INPUT_DELAY, () => acceptInput = true)

    const onPress = () => {
        if (!acceptInput) return
        if (counting) countUp?.finish()
        else goWithFade("game")
    }

    k.onKeyPress("space", onPress)
    k.onMousePress(onPress)
    k.onKeyPress("escape", () => goWithFade("menu"))
    bindMuteKey()
}
