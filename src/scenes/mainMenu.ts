import { createBackground } from '../utils/background';
import { createGround, groundTop } from '../entities/ground';
import { highScore } from '../utils/score';
import { stats } from '../utils/stats';
import { bindMuteKey, isMuted } from '../utils/audio';
import { PIPE_SPEED } from '../utils/constants';
import { unit } from '../utils/scale';
import { fadeIn, goWithFade } from "../utils/transition";
import { fitText, rainbowWave } from "../utils/ui";
import { k } from "../kaboomContext";

// ==============================
// Functions
// ==============================

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
            // Kaboom only wraps text given a width when created; layout() updates it
            width: k.width() - 32,
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

    const statsText = k.add([
        k.text(`Games: ${stats.gamesPlayed} · Pipes: ${stats.pipesPassed}`, { size: 20 }),
        k.pos(0, 0),
        k.anchor("center"),
        k.scale(1),
        k.opacity(0.8),
    ])
    statsText.hidden = stats.gamesPlayed === 0

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
        // Spread over the sky, sized by height too, so short (landscape phone) screens fit
        const sky = groundTop()
        const center = (y: number) => k.vec2(k.width() / 2, y)

        title.pos = center(sky * 0.2)
        fitText(title, Math.min(2, sky / 200))
        startText.textSize = Math.min(48, k.width() / 14, sky / 10)
        startText.width = k.width() - 32
        startText.pos = center(sky * 0.45)
        highScoreText.pos = center(sky * 0.68)
        statsText.pos = center(sky * 0.68 + 30)
        fitText(statsText, 1)
        soundText.pos = center(sky - 32)
    }
    layout()
    k.onResize(layout)

    k.loop(0.7, () => {
        startText.hidden = !startText.hidden
    })

    k.onKeyPress("space", () => goWithFade("game"))
    k.onMousePress(() => goWithFade("game"))
}
