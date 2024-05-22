import { k } from "../kaboomContext";

// ==============================
// Sprites
// ==============================

k.loadSprite("player", "/sprites/turtlebee.png")

// ==============================
// Functions
// ==============================

// ==============================
// Export
// ==============================

export function createPlayer() {
    const player = k.add([
        k.sprite("player"),
        k.anchor("center"),
        k.pos(32, 32),
        k.scale(1/4),
        k.body(),
        k.area(),
        k.move(0, 500),
        k.offscreen({ destroy: true }),
        k.state("jumping", ["jumping", "falling", "paused"]),
        "player",
        {
            // States
            fallingState: false,
            // Helpers for pause
            currentRotation: 0,
            currentVelocity: 0,
        }
    ]);

    player.flipX = true;
    k.setGravity(1000)

    return player
}

