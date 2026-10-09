import { k } from "../kaboomContext";
import { playSound } from "./audio";
import { SCORE_MILESTONE } from "./constants";

// ==============================
// Persistence
// ==============================

const HIGH_SCORE_KEY = "flappy.highScore";

function loadHighScore() {
    try {
        return Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
    } catch {
        return 0;
    }
}

function saveHighScore(value: number) {
    try {
        localStorage.setItem(HIGH_SCORE_KEY, value.toString());
    } catch {
        // Storage unavailable (private mode, blocked cookies...): keep it in memory only
    }
}

// ==============================
// Handle Score
// ==============================

const WHITE = k.rgb(255, 255, 255);
const GOLD = k.rgb(255, 205, 60);

export let highScore = loadHighScore();
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

export function resetScore() {
    score = 0
    isNewHighScore = false
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
