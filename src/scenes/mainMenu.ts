import { createBackground } from '../utils/background';
import { createGround, groundTop } from '../entities/ground';
import { highScore, refreshHighScore } from '../utils/score';
import { MODES, currentMode, cycleMode } from '../utils/modes';
import { stats } from '../utils/stats';
import { bindMuteKey, isMuted } from '../utils/audio';
import { PIPE_SPEED } from '../utils/constants';
import { unit } from '../utils/scale';
import { fadeIn, goWithFade } from "../utils/transition";
import { BUTTON_SIZE, createButton, fitText, isPointerOnButton, rainbowWave } from "../utils/ui";
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
        k.text("", { size: 32 }),
        k.pos(0, 0),
        k.anchor("center"),
    ])

    // Mode selector: "< Normal >". Arrow keys or the buttons change it; the
    // buttons are HUD buttons, so tapping them doesn't start the game.
    const modeText = k.add([
        k.text("", { size: 32 }),
        k.pos(0, 0),
        k.anchor("center"),
        k.color(),
    ])
    const { button: prevButton } = createButton("<", () => changeMode(-1))
    const { button: nextButton } = createButton(">", () => changeMode(1))

    const updateMode = () => {
        const mode = MODES[currentMode()]
        modeText.text = mode.name
        modeText.color = mode.color
        highScoreText.text = "Best: " + highScore
        highScoreText.hidden = highScore === 0
    }
    const changeMode = (step: 1 | -1) => {
        cycleMode(step)
        refreshHighScore()
        updateMode()
    }
    updateMode()

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

        title.pos = center(sky * 0.18)
        fitText(title, Math.min(2, sky / 200))
        startText.textSize = Math.min(48, k.width() / 14, sky / 10)
        startText.width = k.width() - 32
        startText.pos = center(sky * 0.38)
        modeText.pos = center(sky * 0.54)
        // Far enough apart for the longest name ("Normal")
        const buttonOffset = Math.min(100, k.width() / 2 - BUTTON_SIZE / 2 - 16)
        prevButton.pos = modeText.pos.sub(buttonOffset, 0)
        nextButton.pos = modeText.pos.add(buttonOffset, 0)
        highScoreText.pos = center(sky * 0.7)
        statsText.pos = center(sky * 0.7 + 30)
        fitText(statsText, 1)
        soundText.pos = center(sky - 32)
    }
    layout()
    k.onResize(layout)

    k.loop(0.7, () => {
        startText.hidden = !startText.hidden
    })

    k.onKeyPress("left", () => changeMode(-1))
    k.onKeyPress("right", () => changeMode(1))
    k.onKeyPress("space", () => goWithFade("game"))
    // A click on a mode button also fires this, so ignore it there
    k.onMousePress(() => {
        if (!isPointerOnButton()) goWithFade("game")
    })
}
