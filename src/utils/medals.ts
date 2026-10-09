import { k } from "../kaboomContext";

// Thresholds follow the difficulty ramp, which peaks at 40 (MAX_DIFFICULTY_SCORE)
const MEDALS = [
    { name: "Platinum", score: 40, color: k.rgb(170, 225, 235), edge: k.rgb(90, 150, 165) },
    { name: "Gold", score: 30, color: k.rgb(255, 205, 60), edge: k.rgb(190, 140, 20) },
    { name: "Silver", score: 20, color: k.rgb(205, 210, 215), edge: k.rgb(130, 135, 145) },
    { name: "Bronze", score: 10, color: k.rgb(210, 135, 70), edge: k.rgb(140, 80, 35) },
];

export type Medal = typeof MEDALS[number];

/** The best medal earned with `score`, if any. */
export function medalFor(score: number): Medal | undefined {
    return MEDALS.find(m => score >= m.score);
}

/**
 * A medal disc showing its threshold, with its name underneath. Hidden until
 * `reveal()`, which pops it in. Tagged "medal".
 */
export function createMedal(medal: Medal) {
    const disc = k.add([
        k.circle(1),
        k.color(medal.color),
        k.outline(4, medal.edge),
        k.pos(0, 0),
        k.scale(0),
        k.z(1),
        "medal",
    ]);
    const inner = disc.add([
        k.circle(1),
        k.color(medal.color.lighten(40)),
    ]);
    const number = disc.add([
        k.text(medal.score.toString()),
        k.anchor("center"),
        k.color(medal.edge.darken(40)),
    ]);
    const label = k.add([
        k.text(medal.name),
        k.pos(0, 0),
        k.anchor("center"),
        k.color(medal.color),
        k.z(1),
    ]);
    label.hidden = true;

    return {
        /** Centres the medal at `pos` with the given radius. */
        layout(pos: ReturnType<typeof k.vec2>, radius: number, textSize: number) {
            disc.pos = pos;
            disc.radius = radius;
            inner.radius = radius * 0.72;
            number.textSize = radius * 0.8;
            label.textSize = textSize;
            label.pos = pos.add(0, radius + textSize * 0.9);
        },
        reveal() {
            label.hidden = false;
            k.tween(0, 1, 0.4, v => disc.scale = k.vec2(v), k.easings.easeOutBack);
        },
    };
}
