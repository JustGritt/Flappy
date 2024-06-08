import { GAP_SIZE } from "../utils/constants";
import { k } from "../kaboomContext";

// ==============================
// Sprites
// ==============================

// ==============================
// Functions
// ==============================

function handlePipePosition() {
    const totalHeight = k.height();
    const topPipeHeight = k.rand(totalHeight - GAP_SIZE);
    const bottomPipeHeight = totalHeight - topPipeHeight - GAP_SIZE;
    return { topPipeHeight, bottomPipeHeight };
}

// ==============================
// Export
// ==============================

export function createPipe() {
    const pipePositions = handlePipePosition();

    k.add([
        k.rect(100, pipePositions.topPipeHeight),
        k.color(150, 111, 51),
        k.anchor("top"),
        k.pos(k.width() + 64, 0),
        k.area(),
        k.move(0, -100),
        k.offscreen({ destroy: true }),
        "pipe",
        {
            currentPosition: 0,
        }
    ]);

    k.add([
        k.rect(100, pipePositions.bottomPipeHeight),
        k.color(150, 111, 51),
        k.anchor("bot"),
        k.pos(k.width() + 64, k.height()),
        k.area(),
        k.move(0, -100),
        k.offscreen({ destroy: true }),
        "pipe",
        {
            currentPosition: 0,
        }
    ]);


}

