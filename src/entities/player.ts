import type { GameObj } from "kaboom";
import { GRAVITY, JUMP_FORCE } from "../utils/constants";
import { unit } from "../utils/scale";
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

const SPRITE_SCALE = 1 / 4;

function playerTilt(player: GameObj) {
    const target = k.clamp(player.vel.y / unit() * 0.08, MAX_UP_ANGLE, MAX_DOWN_ANGLE);
    // Snap up on flap, rotate down progressively
    const speed = target < player.angle ? 20 : 4;
    player.angle = k.lerp(player.angle, target, Math.min(k.dt() * speed, 1));
}

// Squash-and-stretch on flap: thinner and taller, easing back to normal
const SQUASH_TIME = 0.15;
const SQUASH = 0.1;

const PUFF_COUNT = 6;
const PUFF_LIFETIME = 0.35;

/** A few feathers puffing out behind the player's tail, fading out. */
function puffFeathers(world: GameObj, player: GameObj) {
    const u = unit();
    const tail = player.pos.sub(player.width * player.scale.x * 0.35, -player.height * player.scale.y * 0.1);
    for (let i = 0; i < PUFF_COUNT; i++) {
        // Spread out backwards and down, away from the jump
        const vel = k.Vec2.fromAngle(k.rand(110, 200)).scale(k.rand(120, 240) * u);
        const feather = world.add([
            k.circle(k.rand(4, 8) * u),
            k.pos(tail),
            k.color(255, 255, 255),
            k.opacity(0.9),
            k.anchor("center"),
            "feather",
        ]);
        // Its own update (not a tween or lifespan), so it freezes with the world
        let age = 0;
        feather.onUpdate(() => {
            age += k.dt();
            feather.pos = feather.pos.add(vel.scale(k.dt()));
            feather.opacity = 0.9 * (1 - age / PUFF_LIFETIME);
            if (age >= PUFF_LIFETIME) feather.destroy();
        });
    }
}

// ==============================
// Export
// ==============================

/**
 * The player hovers in place ("ready") until `flap()` is first called,
 * then falls under gravity ("flying"). `die()` drops it onto the floor ("dead").
 */
export function createPlayer(world: GameObj) {
    const player = world.add([
        k.sprite("player"),
        k.anchor("center"),
        k.pos(k.width() / 3, k.height() / 2),
        k.scale(SPRITE_SCALE * unit()),
        k.rotate(0),
        k.body({ gravityScale: 0 }),
        k.area({ scale: 0.8 }),
        k.state("ready", ["ready", "flying", "dead"]),
        "player",
    ]);

    player.flipX = true;

    let hoverTime = 0;
    let squashLeft = 0;
    player.onUpdate(() => {
        if (squashLeft > 0) {
            squashLeft = Math.max(0, squashLeft - k.dt());
            const s = SQUASH * squashLeft / SQUASH_TIME;
            player.scale = k.vec2(1 - s, 1 + s).scale(SPRITE_SCALE * unit());
        }
        if (player.state === "ready") {
            hoverTime += k.dt();
            player.pos.y = k.height() / 2 + Math.sin(hoverTime * 4) * 8 * unit();
        } else if (player.state === "flying") {
            playerTilt(player);
        }
    })

    // Keep the player at a third of the screen, at the right size, when the window is resized
    k.onResize(() => {
        player.pos.x = k.width() / 3
        player.scale = k.vec2(SPRITE_SCALE * unit())
    })

    return {
        player,
        /** Returns whether the player actually jumped. */
        flap() {
            if (player.state === "dead") return false
            if (player.state === "ready") {
                player.gravityScale = 1
                player.enterState("flying")
            }
            // Can't fly above the screen
            if (player.pos.y < 0) return false
            player.jump(JUMP_FORCE * unit())
            squashLeft = SQUASH_TIME
            puffFeathers(world, player)
            return true
        },
        /**
         * Drops the player nose-down onto `floorY`, then calls `onLanded`.
         * The fall runs on the root, so it keeps going while the world is frozen.
         */
        die(floorY: number, onLanded: () => void) {
            player.enterState("dead")
            player.vel = k.vec2(0, 0)
            player.gravityScale = 0

            // Nose-down, the sprite's length is vertical: rest half of it on the floor
            const landY = Math.max(player.pos.y, floorY - player.width * player.scale.x / 2 * 0.8)
            let fallSpeed = 0
            const fall = k.onUpdate(() => {
                fallSpeed += GRAVITY * unit() * k.dt()
                player.pos.y = Math.min(player.pos.y + fallSpeed * k.dt(), landY)
                player.angle = k.lerp(player.angle, 90, Math.min(k.dt() * 8, 1))
                if (player.pos.y >= landY) {
                    player.angle = 90
                    fall.cancel()
                    onLanded()
                }
            })
        },
    }
}
