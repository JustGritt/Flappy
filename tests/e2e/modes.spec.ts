import { test, expect, type Page } from "@playwright/test";
import { openGame, startGame, gameOverWithScore, texts, buttons, press, playerState, scene, overflowingText, overlappingRows } from "./game";

test.beforeEach(async ({ page }) => openGame(page));

const MODE_NAMES = ["Easy", "Normal", "Hard"];
const modeName = async (page: Page) => (await texts(page)).find(t => MODE_NAMES.includes(t));
const best = async (page: Page) => (await texts(page)).find(t => t.startsWith("Best:"));

/**
 * Presses an arrow key and waits for the mode to become `expected`. Kaboom
 * reads input once per frame, so this also keeps presses in separate frames.
 */
async function arrow(page: Page, key: "ArrowLeft" | "ArrowRight", expected: string) {
    await page.keyboard.press(key);
    await expect.poll(() => modeName(page)).toBe(expected);
}

/** getDifficulty() at a score, per mode, from the game's own modules. */
function difficulty(page: Page, score: number) {
    return page.evaluate(`(async () => {
        const modes = await import("/src/utils/modes.ts");
        const pipes = await import("/src/entities/pipes.ts");
        const selected = modes.currentMode();
        const out = {};
        for (const mode of ["easy", "normal", "hard"]) {
            while (modes.currentMode() !== mode) modes.cycleMode(1);
            out[mode] = pipes.getDifficulty(${score});
        }
        while (modes.currentMode() !== selected) modes.cycleMode(1);
        return out;
    })()`) as Promise<Record<"easy" | "normal" | "hard", { gap: number; speed: number; interval: number }>>;
}

test("Normal is the default; arrow keys cycle modes and the choice is remembered", async ({ page, hasTouch }) => {
    test.skip(hasTouch, "keyboard only");
    expect(await modeName(page)).toBe("Normal");
    await arrow(page, "ArrowRight", "Hard");
    await arrow(page, "ArrowRight", "Easy");   // wraps around
    await arrow(page, "ArrowLeft", "Hard");
    await arrow(page, "ArrowLeft", "Normal");
    await arrow(page, "ArrowLeft", "Easy");
    await openGame(page);
    expect(await modeName(page)).toBe("Easy");
    expect(await scene(page)).toBe("menu");
});

test("tapping the mode buttons changes mode without starting the game", async ({ page, hasTouch }) => {
    const b = await buttons(page);
    await press(page, hasTouch, b[">"].x, b[">"].y);
    await expect.poll(() => modeName(page)).toBe("Hard");
    await press(page, hasTouch, b["<"].x, b["<"].y);
    await expect.poll(() => modeName(page)).toBe("Normal");
    await press(page, hasTouch, b["<"].x, b["<"].y);
    await expect.poll(() => modeName(page)).toBe("Easy");
    await page.waitForTimeout(400);
    expect(await scene(page)).toBe("menu");
    // Tapping elsewhere still starts the game
    await startGame(page, hasTouch);
});

test("each mode plays clearly differently", async ({ page }) => {
    const start = await difficulty(page, 0);
    expect(start.easy.gap).toBeGreaterThan(start.normal.gap);
    expect(start.normal.gap).toBeGreaterThan(start.hard.gap);
    expect(start.easy.speed).toBeLessThan(start.normal.speed);
    expect(start.normal.speed).toBeLessThan(start.hard.speed);
    expect(start.easy.interval).toBeGreaterThan(start.hard.interval);
    // Hard reaches full difficulty sooner, Easy later
    const at25 = await difficulty(page, 25), at40 = await difficulty(page, 40), at100 = await difficulty(page, 100);
    expect(at25.hard.gap).toBeCloseTo(at100.hard.gap, 5);
    expect(at25.normal.gap).toBeGreaterThan(at100.normal.gap);
    expect(at40.easy.gap).toBeGreaterThan(at100.easy.gap);
});

test("each mode keeps its own high score; the old one becomes Normal's", async ({ page, hasTouch }) => {
    test.skip(hasTouch, "keyboard only");
    await page.evaluate(() => localStorage.setItem("flappy.highScore", "17"));
    await openGame(page);
    expect(await best(page)).toBe("Best: 17");

    await arrow(page, "ArrowRight", "Hard");
    expect(await best(page)).toBeUndefined();
    await gameOverWithScore(page, hasTouch, 3);
    await expect.poll(() => texts(page)).toContain("New best: 3");
    expect(await page.evaluate(() => [localStorage.getItem("flappy.highScore.hard"), localStorage.getItem("flappy.highScore.normal")]))
        .toEqual(["3", null]);

    await openGame(page);
    expect(await modeName(page)).toBe("Hard");
    expect(await best(page)).toBe("Best: 3");
    await arrow(page, "ArrowLeft", "Normal");
    expect(await best(page)).toBe("Best: 17");
});

test("the run uses the selected mode", async ({ page, hasTouch }) => {
    test.skip(hasTouch, "keyboard only");
    await arrow(page, "ArrowRight", "Hard");
    await startGame(page, hasTouch);
    const d = await difficulty(page, 0);
    await page.keyboard.press("Space");
    await expect.poll(() => playerState(page)).toBe("flying");
    await expect.poll(() => page.evaluate(() => window.k.get("gap", { recursive: true }).length), { timeout: 5000 }).toBeGreaterThan(0);
    const gap = await page.evaluate(() => window.k.get("gap", { recursive: true })[0].height);
    expect(gap).toBeCloseTo(d.hard.gap, 0);
});

for (const size of [{ width: 320, height: 568 }, { width: 844, height: 390 }, { width: 1280, height: 720 }]) {
    test(`the menu with modes, best score and stats fits ${size.width}x${size.height}`, async ({ page, isMobile }) => {
        test.skip(isMobile && size.width > 900, "desktop screen size");
        await page.evaluate(() => {
            localStorage.setItem("flappy.highScore", "123");
            localStorage.setItem("flappy.stats", JSON.stringify({ gamesPlayed: 4567, pipesPassed: 123456 }));
        });
        await page.setViewportSize(size);
        await openGame(page);
        expect(await overflowingText(page)).toEqual([]);
        expect(await overlappingRows(page)).toEqual([]);
        // The mode buttons sit beside the name, on screen, clear of other rows
        const r = await page.evaluate(() => {
            const k = window.k;
            const name = k.get("*").find((o: any) => o.text === "Normal");
            const half = name.width / 2;
            return {
                buttons: k.get("ui-button").map((b: any) => ({ left: b.pos.x - b.width / 2, right: b.pos.x + b.width / 2, y: b.pos.y, h: b.height })),
                nameLeft: name.pos.x - half, nameRight: name.pos.x + half, width: k.width(),
                rows: k.get("*").filter((o: any) => o.text?.trim() && o !== name && !o.parent?.is?.("ui-button")).map((o: any) => ({ text: o.text, top: o.pos.y - o.height * (o.scale?.y ?? 1) ** 2 / 2, bottom: o.pos.y + o.height * (o.scale?.y ?? 1) ** 2 / 2 })),
            };
        });
        const [prev, next] = r.buttons.sort((a: any, b: any) => a.left - b.left);
        expect(prev.left).toBeGreaterThanOrEqual(0);
        expect(next.right).toBeLessThanOrEqual(r.width);
        expect(prev.right).toBeLessThanOrEqual(r.nameLeft);
        expect(next.left).toBeGreaterThanOrEqual(r.nameRight);
        for (const row of r.rows) {
            const clear = row.bottom <= prev.y - prev.h / 2 || row.top >= prev.y + prev.h / 2;
            expect(clear, row.text).toBe(true);
        }
    });
}
