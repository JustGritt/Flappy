import { k } from "../kaboomContext";

// ==============================
// Sprites
// ==============================

k.loadSprite("player", "/sprites/turtlebee.png")

// ==============================
// Functions
// ==============================

function jumpHandler(player: any) {

    k.onKeyPress("space", () => {
        if (player.pos.y < 0) return
        player.jump(500)
    })

    k.onMousePress(() => {
        if (player.pos.y < 0) return
        player.jump(500)
    })
}

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
        k.move(0, 100),
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
    jumpHandler(player)


    k.onUpdate(() => {
        if (player.pos.y >= k.height()) {
            k.go("gameOver")
        }

        if (player.pos.x > k.width() / 3) {
            player.pos.x = k.width() / 3
        }
    })

    k.onCollide("player", "pipe", (player) => {
        k.addKaboom(player.pos)
        k.go("gameOver")
    });

    return player
}

