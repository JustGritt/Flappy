import type { GameObj } from "kaboom";
import { GROUND_HEIGHT } from "../utils/constants";
import { unit } from "../utils/scale";
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

/** Y of the ground's top edge: the floor, and the bottom of the sky the pipes live in. */
export function groundTop() {
    return k.height() - GROUND_HEIGHT * unit();
}

/**
 * Adds the ground strip at the bottom of the screen, scrolling left at
 * `getSpeed()` px/s. In the game, pass `world` as `parent` so it freezes on
 * pause and death. Tagged "ground"; it collides with the player.
 * Call once per scene: it handles window resizes itself.
 */
export function createGround(getSpeed: () => number, parent: GameObj = k.add([])) {
    const ground = parent.add([
        k.rect(k.width(), k.height() - groundTop()),
        k.color(DIRT),
        k.pos(0, groundTop()),
        k.area(),
        k.z(5), // in front of the pipes, so bottom pipes sink into it
        "ground",
    ])

    // Scroll offset in base units, so the stripes keep their place across resizes
    let offset = 0
    ground.onUpdate(() => {
        offset = (offset + getSpeed() / unit() * k.dt()) % STRIPE_SPACING
    })

    // Drawn in the ground's local space, on top of the dirt rect
    ground.onDraw(() => {
        const u = unit()
        const grass = GRASS_HEIGHT * u
        k.drawRect({ width: ground.width, height: grass, color: GRASS })
        for (let x = (-offset - STRIPE_SPACING) * u; x < ground.width; x += STRIPE_SPACING * u) {
            k.drawPolygon({
                pts: [
                    k.vec2(x + grass / 2, 0),
                    k.vec2(x + grass / 2 + STRIPE_WIDTH * u, 0),
                    k.vec2(x + STRIPE_WIDTH * u, grass),
                    k.vec2(x, grass),
                ],
                color: GRASS_STRIPE,
            })
        }
        k.drawLine({ p1: k.vec2(0, 0), p2: k.vec2(ground.width, 0), width: Math.max(2, 4 * u), color: EDGE })
        k.drawLine({ p1: k.vec2(0, grass), p2: k.vec2(ground.width, grass), width: Math.max(2, 3 * u), color: EDGE })
    })

    k.onResize(() => {
        ground.width = k.width()
        ground.height = k.height() - groundTop()
        ground.pos.y = groundTop()
    })

    return ground
}
