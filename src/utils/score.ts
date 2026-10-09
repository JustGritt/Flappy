import { k } from "../kaboomContext";
import { playSound } from "./audio";
import { SCORE_MILESTONE } from "./constants";
import { currentMode, type Mode } from "./modes";

// ==============================
// Persistence
// ==============================

// One high score per mode. Before modes existed there was a single one, which
// counts as Normal's.
const highScoreKey = (mode: Mode) => `flappy.highScore.${mode}`;
const LEGACY_HIGH_SCORE_KEY = "flappy.highScore";

function loadHighScore(mode: Mode) {
    try {
        const saved = localStorage.getItem(highScoreKey(mode))
            ?? (mode === "normal" ? localStorage.getItem(LEGACY_HIGH_SCORE_KEY) : null);
        return Number(saved) || 0;
    } catch {
        return 0;
    }
}

function saveHighScore(value: number) {
    try {
        localStorage.setItem(highScoreKey(currentMode()), value.toString());
    } catch {
        // Storage unavailable (private mode, blocked cookies...): keep it in memory only
    }
}

// ==============================
// Handle Score
// ==============================

const WHITE = k.rgb(255, 255, 255);
const GOLD = k.rgb(255, 205, 60);

/** The current mode's high score. */
export let highScore = loadHighScore(currentMode());
export let score = 0;
export let isNewHighScore = false;

export function createScore() {
    const scoreLabel = k.add([
        k.text(score.toString()),
        k.pos(k.width() / 2, 40),
        k.anchor("center"),
        k.scale(1),
        k.color(WHITE),
        k.z(10),
        k.fixed(),
        "score"
    ])

    k.onResize(() => {
        scoreLabel.pos.x = k.width() / 2
    })

    return scoreLabel
}

/** Reloads the high score for the current mode. Call after changing mode. */
export function refreshHighScore() {
    highScore = loadHighScore(currentMode())
}

export function resetScore() {
    score = 0
    isNewHighScore = false
    refreshHighScore()
}

export function increaseScore(value: number) {
    score += value
    const isMilestone = score % SCORE_MILESTONE === 0
    playSound(isMilestone ? "milestone" : "score")

    k.get("score").forEach(label => {
        label.text = score.toString()
        k.tween(1.6, 1, 0.25, v => label.scale = k.vec2(v), k.easings.easeOutBack)
        if (isMilestone) {
            k.tween(GOLD, WHITE, 0.8, c => label.color = c, k.easings.easeInQuad)
        }
    })

    // Update highscore
    if (score > highScore) {
        highScore = score
        isNewHighScore = true
        saveHighScore(highScore)
    }
}
