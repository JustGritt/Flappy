import { k } from "../kaboomContext";
import { isPaused } from "./pause";

// ==============================
// Handle Score
// ==============================

export let comboActive = false as boolean;
export let highScore = 0 as number;
export let score = 0 as number;
let comboStreak = 1 as number;
let timeElapsed = 0 as number;
let multiplier = 1 as number;

export function createScore() {
    const scoreLabel = k.add([
        k.text(score.toString()),
        k.pos(k.width() / 2, 40),
        k.anchor("center"),
        k.fixed(),
        "score"
    ])

    return scoreLabel
}

export function increaseScore(value: number) {
    timeElapsed = 0
    score += value * multiplier

    const scoreLabel = k.get("score")
    scoreLabel[0].text = score.toString()

    // Update highscore
    if(score > highScore) {
        highScore = score
    }
}

// ==============================
// Handle Combo
// ==============================

export function createCombo() {
    comboActive = true

    k.add([
        k.rect(k.width(), 48),
        k.pos(0, k.height() - 48),
        k.color(39, 174, 96),
        k.fixed(),
        "comboBar"
    ])

    k.add([
        k.text(comboStreak.toString()),
        k.pos(k.width() / 2, k.height() - 24),
        k.fixed(),
        k.scale(0.75),
        k.anchor("center"),
        "comboLabel"
    ])

    handleComboBar()
}

// ==============================
// Handle Combo
// ==============================

function handleComboBar() {
    const comboBar = k.get("comboBar")[0];
    const comboLabel = k.get("comboLabel")[0];

    // Start a new combo
    startCombo()

    comboBar.onDestroy(() => {
        comboActive = false
    })

    k.onUpdate(() => {
        if(comboActive && comboBar && comboBar.width <= 0) {
            comboLabel.destroy()
            comboBar.destroy()

            multiplier = 1;
            comboStreak = 1;
            timeElapsed = 0;
        }
    })
}

function startCombo() {
    score = 0;
    multiplier = 1;
    comboStreak = 1;
    timeElapsed = 0;

    const comboBar = k.get("comboBar")[0];
    const timer = k.loop(0.01, () => {
        if (!isPaused) { // Only update if the game is not paused
            timeElapsed += 10;
            comboBar.width = k.width() * (1 - timeElapsed / 5000);

            // Update color based on width
            comboBar.color = comboBar.width > k.width() * 0.5 ? k.rgb(39, 174, 96)
            : comboBar.width > k.width() * 0.25 ? k.rgb(241, 196, 15)
            : k.rgb(192, 57, 43);
        }

        // Reset the combo if the bar width reaches zero and the game is not paused
        if (comboActive && comboBar.width <= 0 && !isPaused) {
            timeElapsed = 0;
            timer.cancel();
        }
    });
}

export function increaseComboStreak() {
    comboStreak += 1;

    // Update the multiplier based on the combo streak
    if (comboStreak % 100 === 0 && comboStreak <= 500) {
        multiplier = 1 + (comboStreak / 100) * 0.1;
    }

    const comboLabel = k.get("comboLabel")[0];
    comboLabel.text = comboStreak.toString() + " x" + multiplier.toFixed(1);
}