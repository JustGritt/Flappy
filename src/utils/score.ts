import { k } from "../kaboomContext";

// ==============================
// Handle Score
// ==============================

export let highScore = 0 as number;
export let score = 0 as number;

export function createScore() {
    const scoreLabel = k.add([
        k.text(score.toString()),
        k.pos(k.width() / 2, 40),
        k.anchor("center"),
        k.z(10),
        k.fixed(),
        "score"
    ])

    return scoreLabel
}

export function resetScore() {
    score = 0
}

export function increaseScore(value: number) {
    const scoreLabel = k.get("score")
    score += value
    scoreLabel[0].text = score.toString()

    // Update highscore
    if(score > highScore) {
        highScore = score
    }
}