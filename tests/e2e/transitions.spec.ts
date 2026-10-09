import { test, expect, type Page } from "@playwright/test";
import { openGame, flapInput, startFlying, playerState, scene } from "./game";

test.beforeEach(async ({ page }) => {
    await openGame(page);
    // Log scene switches and the fade overlay's opacity every frame
    await page.evaluate(() => {
        const k = window.k;
        const w = window as any;
        w.__gos = [];
        w.__fades = [];
        const go = k.go;
        k.go = (name: string, ...args: unknown[]) => { w.__gos.push(name); go(name, ...args); };
        const log = () => w.__fades.push(k.get("fade")[0]?.opacity ?? null);
        // Handlers are cleared on scene change, so register again in the next scene
        k.onUpdate(log);
        k.onSceneLeave(() => setTimeout(() => k.onUpdate(log)));
    });
});

const gos = (page: Page) => page.evaluate(() => (window as any).__gos as string[]);
const fades = (page: Page) => page.evaluate(() => (window as any).__fades as (number | null)[]);

test("the menu fades in from black", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => window.k && window.k.get("*").length > 2);
    // Right after loading the overlay is still there, then it's removed
    await expect.poll(() => page.evaluate(() => window.k.get("fade").length), { intervals: [50] }).toBe(0);
});

test("starting a game fades out to black, then fades the game in", async ({ page, hasTouch }) => {
    await flapInput(page, hasTouch);
    await expect.poll(() => playerState(page)).toBe("ready");
    await expect.poll(() => page.evaluate(() => window.k.get("fade").length)).toBe(0);
    const f = (await fades(page)).filter((v): v is number => v !== null);
    // Rises to fully black, then falls back
    const peak = f.indexOf(Math.max(...f));
    expect(f[peak]).toBeCloseTo(1, 1);
    expect(f.slice(0, peak).every((v, i, a) => i === 0 || v >= a[i - 1])).toBe(true);
    expect(f.slice(peak).every((v, i, a) => i === 0 || v <= a[i - 1])).toBe(true);
});

test("repeated input during a fade switches scene only once", async ({ page, hasTouch }) => {
    for (let i = 0; i < 4; i++) await flapInput(page, hasTouch);
    await expect.poll(() => playerState(page)).not.toBeUndefined();
    await page.waitForTimeout(500);
    expect(await gos(page)).toEqual(["game"]);
});

test("Game Over fades in and restarts once on repeated input", async ({ page, hasTouch }) => {
    await startFlying(page, hasTouch);
    await expect.poll(() => scene(page), { timeout: 10_000 }).toBe("gameOver");
    await page.waitForTimeout(700);
    for (let i = 0; i < 4; i++) await flapInput(page, hasTouch);
    await expect.poll(() => playerState(page)).toBe("ready");
    await page.waitForTimeout(300);
    expect(await gos(page)).toEqual(["game", "gameOver", "game"]);
});
