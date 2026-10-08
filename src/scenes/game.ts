import { createBackground } from '../utils/background';
import { createPlayer } from '../entities/player';
import { createPipe, getDifficulty } from '../entities/pipes';
import { isPaused, pause, resetPause, resume } from "../utils/pause";
import { createScore, increaseScore, resetScore, score } from '../utils/score';
import { DEATH_DELAY, FIRST_PIPE_DELAY, GRAVITY } from '../utils/constants';
import { BUTTON_SIZE, createButton, isPointerOnButton } from '../utils/ui';
import { bindMuteKey, isMuted, playSound, toggleMute } from '../utils/audio';
import { k } from "../kaboomContext";

// ==============================
// Functions
// ==============================

function createHint() {
    const hint = k.add([
        k.text("Space / tap to flap", { size: 32 }),
        k.pos(k.width() / 2, k.height() / 2 + 120),
        k.anchor("center"),
        k.opacity(1),
        k.z(8), // below the pause overlay
        k.fixed(),
    ])

    hint.onUpdate(() => {
        hint.pos.x = k.width() / 2
        hint.opacity = k.wave(0.4, 1, k.time() * 4)
    })

    return hint
}

// ==============================
// Export
// ==============================

export function createGame() {
    resetScore()
    resetPause()
    k.setGravity(GRAVITY)

    // Everything that moves lives in `world`, so pausing it freezes the game
    // while the UI (score, pause overlay) stays responsive.
    const world = k.add([k.timer()])

    createBackground(world)
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

    const gameOver = () => {
        if (player.state === "dead") return
        die()
        world.paused = true
        pauseButton.hidden = true
        playSound("hit")
        k.addKaboom(player.pos)
        k.shake(12)
        k.wait(DEATH_DELAY, () => k.go("gameOver"))
    }

    k.onCollide("player", "pipe", gameOver)

    player.onUpdate(() => {
        if (player.pos.y >= k.height()) gameOver()
    })

    k.onCollideEnd("player", "gap", () => {
        if (player.state !== "dead") increaseScore(1)
    })

    // ==============================
    // Controls
    // ==============================

    k.onKeyPress("escape", () => k.go("menu"))

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
