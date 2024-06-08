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

function createMiddlePart(topHeight: number, bottomHeight: number) {
    return k.add([
        k.rect(100, k.height() - topHeight - bottomHeight),
        k.pos(k.width() + 64, topHeight),
        k.anchor("top"),
        k.area(),
        k.opacity(0),
        k.move(0, -150),
        k.offscreen({ destroy: true }),
        "gap",
        {
            currentPosition: 0,
        }
    ]);
}

function createPipePart(height: number, anchor: any, yPosition: number) {
    return k.add([
        k.rect(100, height, { radius: 16 }),
        k.color(150, 111, 51),
        k.anchor(anchor),
        k.pos(k.width() + 64, yPosition),
        k.area(),
        k.move(0, -150),
        k.offscreen({ destroy: true }),
        "pipe",
        {
            currentPosition: 0,
        }
    ]);
}

export function createPipe() {
    const pipePositions = handlePipePosition();

    createPipePart(pipePositions.topPipeHeight, "top", -16);
    createMiddlePart(pipePositions.topPipeHeight, pipePositions.bottomPipeHeight);
    createPipePart(pipePositions.bottomPipeHeight, "bot", k.height() + 16);
}

