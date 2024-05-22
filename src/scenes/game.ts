import { createBackground } from '../utils/background';
import { createPlayer } from '../entities/player';
import { isPaused, pause, resume } from "../utils/pause";
import { createScore } from '../utils/score';
import { k } from "../kaboomContext";


// ==============================
// Variables
// ==============================

export function createGame(difficulty: string) {
    handleDifficulty(difficulty)
    createBackground()
    createPlayer()
    createScore()

    k.onUpdate(() => {
        if (k.isKeyPressed("escape")) {
            k.go("menu")
        }

        if (k.isKeyPressed("p")) {
            isPaused ? resume() : pause()
        }
    })
}

function handleDifficulty(difficulty: string) {
    console.log(difficulty)
}
