import type { GameObj } from "kaboom";
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

    const spawnCloud = () => {
        const comps = [
            k.sprite(randomSprite()),
            k.pos(k.width() + 100, k.rand(0, k.height())),
            k.move(k.LEFT, 110),
            k.anchor("center"),
            k.scale(1/2),
            k.rotate(1),
            k.offscreen({ destroy: true, distance: 300 }),
            k.z(-1),
            "cloud"
        ]
        parent ? parent.add(comps) : k.add(comps)
    }

    if (parent) {
        parent.loop(8, spawnCloud)
    } else {
        k.loop(8, spawnCloud)
    }

    return background
}
