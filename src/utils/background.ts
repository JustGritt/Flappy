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

export function createBackground() {

    const background = k.add([
        k.rect(k.width(), k.height()),
        k.color(52, 152, 219),
        k.pos(0, 0),
        k.z(-1),
        "backgroundColor"
    ])

    k.loop(5, () => {
        k.add([
            k.sprite(randomSprite()),
            k.pos(k.width(), k.rand(0, k.height())),
            k.move(0, -100),
            k.anchor("center"),
            k.scale(1/2),
            k.rotate(1),
            k.z(-1),
            "cloud"
        ])
    })


    return background
}

export function deleteBackground() {
    k.get("backgroundColor").forEach(bg => {
        bg.destroy();
    })
}