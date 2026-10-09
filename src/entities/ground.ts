import type { GameObj } from "kaboom";
import { GROUND_HEIGHT } from "../utils/constants";
import { k } from "../kaboomContext";

// ==============================
// Style
// ==============================

const DIRT = k.rgb(222, 184, 135);
const GRASS = k.rgb(115, 191, 46);
const GRASS_STRIPE = k.rgb(95, 165, 34);
const EDGE = k.rgb(84, 56, 22);

const GRASS_HEIGHT = 20;
const STRIPE_WIDTH = 14;
const STRIPE_SPACING = 28;

// ==============================
// Export
// ==============================

/**
 * Adds the ground strip at the bottom of the screen, scrolling left at
 * `getSpeed()` px/s. In the game, pass `world` as `parent` so it freezes on
 * pause and death. Tagged "ground"; it collides with the player.
 * Call once per scene: it handles window resizes itself.
 */
export function createGround(getSpeed: () => number, parent: GameObj = k.add([])) {
    const ground = parent.add([
        k.rect(k.width(), GROUND_HEIGHT),
        k.color(DIRT),
        k.pos(0, k.height() - GROUND_HEIGHT),
        k.area(),
        k.z(5), // in front of the pipes, so bottom pipes sink into it
        "ground",
    ])

    let offset = 0
    ground.onUpdate(() => {
        offset = (offset + getSpeed() * k.dt()) % STRIPE_SPACING
    })

    // Drawn in the ground's local space, on top of the dirt rect
    ground.onDraw(() => {
        k.drawRect({ width: ground.width, height: GRASS_HEIGHT, color: GRASS })
        for (let x = -offset - STRIPE_SPACING; x < ground.width; x += STRIPE_SPACING) {
            k.drawPolygon({
                pts: [
                    k.vec2(x + GRASS_HEIGHT / 2, 0),
                    k.vec2(x + GRASS_HEIGHT / 2 + STRIPE_WIDTH, 0),
                    k.vec2(x + STRIPE_WIDTH, GRASS_HEIGHT),
                    k.vec2(x, GRASS_HEIGHT),
                ],
                color: GRASS_STRIPE,
            })
        }
        k.drawLine({ p1: k.vec2(0, 0), p2: k.vec2(ground.width, 0), width: 4, color: EDGE })
        k.drawLine({ p1: k.vec2(0, GRASS_HEIGHT), p2: k.vec2(ground.width, GRASS_HEIGHT), width: 3, color: EDGE })
    })

    k.onResize(() => {
        ground.width = k.width()
        ground.pos.y = k.height() - GROUND_HEIGHT
    })

    return ground
}
