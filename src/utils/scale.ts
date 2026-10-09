import { BASE_HEIGHT, BASE_WIDTH } from "./constants";
import { k } from "../kaboomContext";

/**
 * Size of one gameplay unit on the current screen, relative to the base screen
 * the sizes in constants.ts are tuned for. Multiply every gameplay length,
 * speed and acceleration by it, so the game plays the same on every screen
 * (only how much sky you see changes). HUD sizes are not scaled, so buttons
 * stay easy to tap.
 */
export function unit() {
    return k.clamp(Math.min(k.height() / BASE_HEIGHT, k.width() / BASE_WIDTH), 0.4, 1.6);
}
