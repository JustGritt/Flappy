import { createBackground } from '../utils/background';
import { createPlayer } from '../entities/player';
import { createPipe } from '../entities/pipes';
import { isPaused, pause, resume } from "../utils/pause";
import { createScore } from '../utils/score';
import { k } from "../kaboomContext";


// ==============================
// Variables
// ==============================

export function createGame() {
    createBackground()
    createPlayer()
    createScore()

    k.loop(3, () => {
        createPipe()
    })

    k.onUpdate(() => {
        if (k.isKeyPressed("escape")) {
            k.go("menu")
        }

        if (k.isKeyPressed("p")) {
            isPaused ? resume() : pause()
        }
    })

    // Handle resize
    let resizeTimeout: any;
    k.onResize(() => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            createBackground()
        }, 1000);
    });
}