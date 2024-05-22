import { k } from "../kaboomContext";
export let isPaused = false;

export function pause() {
    isPaused = true;

    // Background
    k.add([
        k.rect(k.width(), k.height()),
        k.color(0, 0, 0),
        k.opacity(0.7),
        k.pos(0, 0),
        k.fixed(),
        k.scale(k.width(), k.height()),
        k.z(9),
        "pause"
    ]);

    k.add([
        k.text("GAME PAUSED"),
        k.pos(k.width() / 2, k.height() / 2 - 100),
        k.anchor("center"),
        k.fixed(),
        k.scale(1.5),
        k.color(231, 76, 60),
        k.z(10),
        "pause",
    ]);

    const subtext = k.add([
        k.text("Press [p] to resume"),
        k.pos(k.width() / 2, k.height() / 2),
        k.anchor("center"),
        k.fixed(),
        k.scale(1.5),
        k.color(231, 76, 60),
        k.z(10),
        "pause",
    ]);

    k.loop(1, () => {
        subtext.hidden = !subtext.hidden;
    });

    const pauseEntity = (entity: any) => {
        entity.currentRotation = entity.angle;
        entity.currentVelocity = entity.vel;
        entity.use(k.body({ isStatic: true }));
        entity.use(k.rotate(entity.angle));
        entity.use(k.move(0, 0));
    };

    k.get("fruit").forEach(pauseEntity);
    k.get("turtle").forEach(pauseEntity);
}

export function resume() {
    isPaused = false;
    k.get("pause").forEach(p => p.destroy());

    const resetEntity = (entity: any) => {
        entity.use(k.body({ isStatic: false }));
        entity.use(k.rotate(entity.currentRotation));
        entity.vel.y = entity.currentVelocity ? (entity.currentVelocity.y || 0) : 0;
    };

    k.get("fruit").forEach(resetEntity);
    k.get("turtle").forEach(resetEntity);
}

