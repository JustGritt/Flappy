import type { GameObj } from "kaboom";
import { JUMP_FORCE } from "../utils/constants";
import { k } from "../kaboomContext";

// ==============================
// Sprites
// ==============================

k.loadSprite("player", "/sprites/turtlebee.png")

// ==============================
// Functions
// ==============================

// Nose up when rising, dive when falling
const MAX_UP_ANGLE = -25;
const MAX_DOWN_ANGLE = 70;

function playerTilt(player: GameObj) {
    const target = k.clamp(player.vel.y * 0.08, MAX_UP_ANGLE, MAX_DOWN_ANGLE);
    // Snap up on flap, rotate down progressively
    const speed = target < player.angle ? 20 : 4;
    player.angle = k.lerp(player.angle, target, Math.min(k.dt() * speed, 1));
}

// ==============================
// Export
// ==============================

/**
 * The player hovers in place ("ready") until `flap()` is first called,
 * then falls under gravity ("flying"). `die()` freezes it in place.
 */
export function createPlayer(world: GameObj) {
    const player = world.add([
        k.sprite("player"),
        k.anchor("center"),
        k.pos(k.width() / 3, k.height() / 2),
        k.scale(1/4),
        k.rotate(0),
        k.body({ gravityScale: 0 }),
        k.area({ scale: 0.8 }),
        k.state("ready", ["ready", "flying", "dead"]),
        "player",
    ]);

    player.flipX = true;

    let hoverTime = 0;
    player.onUpdate(() => {
        if (player.state === "ready") {
            hoverTime += k.dt();
            player.pos.y = k.height() / 2 + Math.sin(hoverTime * 4) * 8;
        } else if (player.state === "flying") {
            playerTilt(player);
        }
    })

    // Keep the player at a third of the screen when the window is resized
    k.onResize(() => {
        player.pos.x = k.width() / 3
    })

    return {
        player,
        flap() {
            if (player.state === "dead") return
            if (player.state === "ready") {
                player.gravityScale = 1
                player.enterState("flying")
            }
            // Can't fly above the screen
            if (player.pos.y < 0) return
            player.jump(JUMP_FORCE)
        },
        die() {
            player.enterState("dead")
            player.vel = k.vec2(0, 0)
            player.gravityScale = 0
        },
    }
}
