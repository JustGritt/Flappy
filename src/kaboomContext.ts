import kaboom from "kaboom";

export const k = kaboom({
    global: false,
    touchToMouse: true,
    canvas: document.getElementById("game") as HTMLCanvasElement,
});

// Let the end-to-end tests (tests/e2e) inspect the game. Dev server only.
if (import.meta.env.DEV) {
    (window as unknown as { k: typeof k }).k = k
}
