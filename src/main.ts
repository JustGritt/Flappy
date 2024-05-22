import { k } from "./kaboomContext";
import { createMainMenu, chosenDifficulty } from './scenes/mainMenu';
import { createGameOver } from './scenes/gameOver';
import { createGame } from './scenes/game';

// ==============================
// Main Menu scene
// ==============================

k.scene("menu", () => {
    createMainMenu()
    k.onKeyPress("space", () => {
        k.go("game")
    })
})

// ==============================
// Game scene
// ==============================

k.scene("game", () => {
    createGame(chosenDifficulty)
})

// ==============================
// Game Over scene
// ==============================

k.scene("gameOver", () => {
    createGameOver()

    k.onUpdate(() => {
        if (k.isKeyPressed("escape")) {
            k.go("menu")
        }

        if (k.isKeyPressed("space")) {
            k.go("game")
        }
    })
})

// Start the game
k.go("menu");
