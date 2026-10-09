import { createBackground } from '../utils/background';
import { createPlayer } from '../entities/player';
import { createPipe, getDifficulty, resetPipes } from '../entities/pipes';
import { createGround, groundTop } from '../entities/ground';
import { isPaused, pause, resetPause, resume } from "../utils/pause";
import { createScore, increaseScore, resetScore, score } from '../utils/score';
import { recordRun } from '../utils/stats';
import { DEATH_DELAY, FIRST_PIPE_DELAY, GRAVITY } from '../utils/constants';
import { unit } from '../utils/scale';
import { BUTTON_SIZE, createButton, fitText, isPointerOnButton } from '../utils/ui';
import { bindMuteKey, isMuted, playSound, toggleMute } from '../utils/audio';
import { fadeIn, goWithFade } from "../utils/transition";
import { k } from "../kaboomContext";

// ==============================
// Functions
// ==============================

function createHint() {
    const hint = k.add([
        k.text("Space / tap to flap", { size: 32 }),
        k.pos(0, 0),
        k.anchor("center"),
        k.scale(1),
        k.opacity(1),
        k.z(8), // below the pause overlay
        k.fixed(),
    ])

    hint.onUpdate(() => {
        // Below the hovering bird, shrunk to fit narrow screens
        hint.pos = k.vec2(k.width() / 2, k.height() / 2 + 120 * unit())
        fitText(hint, 1)
        hint.opacity = k.wave(0.4, 1, k.time() * 4)
    })

    return hint
}

/** Brief white flash over everything, for impacts. */
function flashScreen() {
    const flash = k.add([
        k.rect(k.width(), k.height()),
        k.color(255, 255, 255),
        k.opacity(0.8),
        k.fixed(),
        k.z(20),
    ])
    k.tween(0.8, 0, 0.3, v => flash.opacity = v, k.easings.easeOutQuad)
        .onEnd(() => flash.destroy())
}

// ==============================
// Export
// ==============================

export function createGame() {
    fadeIn()
    resetScore()
    resetPause()
    resetPipes()
    k.setGravity(GRAVITY * unit())
    k.onResize(() => k.setGravity(GRAVITY * unit()))

    // Everything that moves lives in `world`, so pausing it freezes the game
    // while the UI (score, pause overlay) stays responsive.
    const world = k.add([k.timer()])

    createBackground(world)
    createGround(() => getDifficulty(score).speed, world)
    createScore()
    const hint = createHint()
    const { player, flap, die } = createPlayer(world)

    // Pipes spawn faster as the score increases
    const spawnPipes = () => {
        createPipe(world, score)
        world.wait(getDifficulty(score).interval, spawnPipes)
    }

    const onFlap = () => {
        if (isPaused) return
        if (player.state === "ready") {
            hint.destroy()
            world.wait(FIRST_PIPE_DELAY, spawnPipes)
        }
        if (flap()) playSound("flap")
    }

    k.onKeyPress("space", onFlap)
    k.onKeyPress("up", onFlap)
    // A click on a HUD button also fires this, so ignore it there
    k.onMousePress(() => {
        if (!isPointerOnButton()) onFlap()
    })

    // ==============================
    // Death
    // ==============================

    // Count the run in the lifetime stats once, when it ends
    let runRecorded = false
    const endRun = () => {
        if (runRecorded) return
        runRecorded = true
        recordRun(score)
    }

    // Freeze the world, then let the bird fall to the ground before Game Over
    const gameOver = () => {
        if (player.state === "dead") return
        endRun()
        world.paused = true
        pauseButton.hidden = true
        playSound("hit")
        flashScreen()
        k.shake(12)
        die(groundTop(), () => {
            k.wait(DEATH_DELAY, () => goWithFade("gameOver"))
        })
    }

    k.onCollide("player", "pipe", gameOver)
    k.onCollide("player", "ground", gameOver)

    k.onCollideEnd("player", "gap", () => {
        if (player.state !== "dead") increaseScore(1)
    })

    // ==============================
    // Controls
    // ==============================

    // Quitting mid-flight still counts as a run
    k.onKeyPress("escape", () => {
        if (player.state === "flying") endRun()
        goWithFade("menu")
    })

    const togglePause = () => {
        if (player.state === "dead") return
        isPaused ? resume(world) : pause(world)
    }

    k.onKeyPress("p", togglePause)

    const { button: pauseButton } = createButton("II", togglePause)

    const { button: muteButton, label: muteLabel } = createButton("", () => {
        toggleMute()
        updateMuteButton()
    })
    const updateMuteButton = () => {
        muteLabel.text = isMuted() ? "OFF" : "SFX"
        muteLabel.opacity = isMuted() ? 0.5 : 1
    }
    updateMuteButton()
    bindMuteKey(updateMuteButton)

    const layoutButtons = () => {
        pauseButton.pos = k.vec2(k.width() - BUTTON_SIZE / 2 - 16, BUTTON_SIZE / 2 + 16)
        muteButton.pos = pauseButton.pos.sub(BUTTON_SIZE + 12, 0)
    }
    layoutButtons()
    k.onResize(layoutButtons)

    // Auto-pause when the player switches window/tab mid-flight. These are DOM
    // listeners, so unlike Kaboom handlers they must be removed on scene change.
    const autoPause = () => {
        if (player.state === "flying" && !isPaused) pause(world)
    }
    const onVisibilityChange = () => {
        if (document.hidden) autoPause()
    }
    window.addEventListener("blur", autoPause)
    document.addEventListener("visibilitychange", onVisibilityChange)
    k.onSceneLeave(() => {
        window.removeEventListener("blur", autoPause)
        document.removeEventListener("visibilitychange", onVisibilityChange)
    })
}
