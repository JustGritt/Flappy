import { k } from "./kaboomContext";
import { createMainMenu } from './scenes/mainMenu';
import { createGameOver } from './scenes/gameOver';
import { createGame } from './scenes/game';

// Each scene registers its own input handlers; they're cleared on k.go()
k.scene("menu", createMainMenu)
k.scene("game", createGame)
k.scene("gameOver", createGameOver)

// Start the game
k.go("menu");
