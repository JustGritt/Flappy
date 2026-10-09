import type { GameObj } from "kaboom";
import { unit } from "./scale";
import { k } from "../kaboomContext";

// ==============================
// Sprites
// ==============================

k.loadSprite("cool", "/sprites/cloud-cool.png")
k.loadSprite("heart", "/sprites/cloud-heart.png")
k.loadSprite("ok", "/sprites/cloud-ok.png")
k.loadSprite("star", "/sprites/cloud-star.png")
k.loadSprite("suika", "/sprites/cloud-suika.png")
k.loadSprite("thumb", "/sprites/cloud-thumb.png")
k.loadSprite("turtle", "/sprites/cloud-turtle.png")
k.loadSprite("pien", "/sprites/cloud-pien.png")
k.loadSprite("eyes", "/sprites/cloud-eyes.png")
k.loadSprite("mimir", "/sprites/cloud-mimir.png")

const sprites = ["cool", "heart", "ok", "star", "suika", "thumb", "turtle", "pien", "eyes", "mimir"];

// Speed (px/s) of a mid-depth cloud, and seconds between new clouds
const CLOUD_SPEED = 110;
const CLOUD_INTERVAL = 5;

// ==============================
// Functions
// ==============================

let lastSpriteIndex: number = -1;
function randomSprite() {
    let newIndex;
    do { newIndex = Math.floor(Math.random() * sprites.length); } while (newIndex === lastSpriteIndex);
    lastSpriteIndex = newIndex;
    return sprites[newIndex];
}

// ==============================
// Exports
// ==============================

/**
 * Adds the sky and the cloud spawner. Clouds are added to `parent` (and its
 * timer drives the spawner) so pausing the parent also freezes them.
 * Call once per scene: it handles window resizes itself.
 */
export function createBackground(parent?: GameObj) {
    const background = k.add([
        k.rect(k.width(), k.height()),
        k.color(52, 152, 219),
        k.pos(0, 0),
        k.fixed(),
        k.z(-2),
        "background"
    ])

    k.onResize(() => {
        background.width = k.width()
        background.height = k.height()
    })

    // Each cloud gets a random depth: far ones (0) are small, slow and faint,
    // near ones (1) big, fast and opaque. z keeps them behind the pipes (z 0).
    const addCloud = (x: number) => {
        const depth = k.rand(0, 1)
        const comps = [
            k.sprite(randomSprite()),
            k.pos(x, k.rand(0, k.height())),
            k.move(k.LEFT, CLOUD_SPEED * k.lerp(0.4, 1.2, depth) * unit()),
            k.anchor("center"),
            k.scale(k.lerp(0.25, 0.6, depth) * unit()),
            k.rotate(1),
            k.opacity(k.lerp(0.55, 1, depth)),
            k.offscreen({ destroy: true, distance: 300 }),
            k.z(-1 + depth * 0.9),
            "cloud"
        ]
        parent ? parent.add(comps) : k.add(comps)
    }
    const spawnCloud = () => addCloud(k.width() + 100 * unit())

    // Start with a few clouds already in the sky
    for (let i = 0; i < 3; i++) addCloud(k.rand(0, k.width()))

    if (parent) {
        parent.loop(CLOUD_INTERVAL, spawnCloud)
    } else {
        k.loop(CLOUD_INTERVAL, spawnCloud)
    }

    return background
}
