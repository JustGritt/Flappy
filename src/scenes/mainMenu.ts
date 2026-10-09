import { createBackground } from '../utils/background';
import { createGround, groundTop } from '../entities/ground';
import { highScore } from '../utils/score';
import { bindMuteKey, isMuted } from '../utils/audio';
import { PIPE_SPEED } from '../utils/constants';
import { unit } from '../utils/scale';
import { fadeIn, goWithFade } from "../utils/transition";
import { k } from "../kaboomContext";

// ==============================
// Functions
// ==============================

const rainbowWave = (idx: number) => ({
    color: k.hsl2rgb((k.time() * 0.2 + idx * 0.1) % 1, 0.7, 0.8),
    pos: k.vec2(0, k.wave(-4, 4, k.time() * 4 + idx * 0.5)),
    scale: k.wave(1, 1.2, k.time() * 3 + idx),
    angle: k.wave(-9, 9, k.time() * 3 + idx),
})

export function createMainMenu() {
    fadeIn()
    createBackground()
    createGround(() => PIPE_SPEED * unit())

    const title = k.add([
        k.text("Flappy", {
            size: 48,
            lineSpacing: 8,
            letterSpacing: 4,
            transform: rainbowWave,
        }),
        k.pos(0, 0),
        k.scale(2),
        k.anchor("center"),
    ])

    const startText = k.add([
        k.text("Press space or tap to start", {
            size: 48,
            lineSpacing: 8,
            letterSpacing: 4,
            align: "center",
            transform: rainbowWave,
        }),
        k.pos(0, 0),
        k.anchor("center"),
    ])

    const highScoreText = k.add([
        k.text("Best: " + highScore, { size: 32 }),
        k.pos(0, 0),
        k.anchor("center"),
    ])
    highScoreText.hidden = highScore === 0

    // Text only: any click on the menu starts the game
    const soundText = k.add([
        k.text("", { size: 24 }),
        k.pos(0, 0),
        k.anchor("center"),
        k.opacity(0.8),
    ])
    const updateSoundText = () => {
        soundText.text = `[M] Sound: ${isMuted() ? "OFF" : "ON"}`
    }
    updateSoundText()
    bindMuteKey(updateSoundText)

    const layout = () => {
        soundText.pos = k.vec2(k.width() / 2, groundTop() - 32)
        startText.textSize = Math.min(48, k.width() / 14)
        startText.width = k.width() - 32
        title.pos = k.vec2(k.width() / 2, k.height() / 4)
        startText.pos = k.vec2(k.width() / 2, k.height() / 2)
        highScoreText.pos = k.vec2(k.width() / 2, k.height() * 0.7)
    }
    layout()
    k.onResize(layout)

    k.loop(0.7, () => {
        startText.hidden = !startText.hidden
    })

    k.onKeyPress("space", () => goWithFade("game"))
    k.onMousePress(() => goWithFade("game"))
}
