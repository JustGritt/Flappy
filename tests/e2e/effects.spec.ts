import { test, expect, type Page } from "@playwright/test";
import { openGame, startGame, flapInput, playerState, isPaused } from "./game";

test.beforeEach(async ({ page }) => openGame(page));

const feathers = (page: Page) => page.evaluate(() => window.k.get("feather", { recursive: true }).map((f: any) => ({ id: f.id, x: f.pos.x, opacity: f.opacity })));

/** Records the bird's scale every frame, relative to its resting scale. */
async function trackScale(page: Page) {
    await page.evaluate(() => {
        const k = window.k;
        const p = k.get("player", { recursive: true })[0];
        const base = p.scale.y;
        const log: { x: number; y: number }[] = ((window as any).__scale = []);
        k.onUpdate(() => log.push({ x: p.scale.x / base, y: p.scale.y / base }));
    });
}

test("each flap puffs feathers behind the bird that fade away", async ({ page, hasTouch }) => {
    await startGame(page, hasTouch);
    const birdX = await page.evaluate(() => window.k.get("player", { recursive: true })[0].pos.x);
    await flapInput(page, hasTouch);
    await expect.poll(() => feathers(page).then(f => f.length)).toBeGreaterThanOrEqual(4);
    const first = await feathers(page);
    expect(first.every(f => f.x < birdX)).toBe(true);
    await page.waitForTimeout(80);
    const later = await feathers(page);
    const same = later.filter(f => first.some(g => g.id === f.id));
    expect(same.every(f => f.opacity < first.find(g => g.id === f.id)!.opacity)).toBe(true);
    await expect.poll(() => feathers(page).then(f => f.length), { timeout: 2000 }).toBe(0);
});

test("each flap squashes and stretches the bird, then it returns to normal", async ({ page, hasTouch }) => {
    await startGame(page, hasTouch);
    await trackScale(page);
    await flapInput(page, hasTouch);
    await expect.poll(() => playerState(page)).toBe("flying");
    await page.waitForTimeout(400);
    const log = await page.evaluate(() => (window as any).__scale as { x: number; y: number }[]);
    const peak = Math.max(...log.map(s => s.y));
    expect(peak).toBeGreaterThan(1.03);
    expect(peak).toBeLessThanOrEqual(1.1 + 1e-6);
    expect(log.find(s => s.y === peak)!.x).toBeLessThan(1);
    expect(log.at(-1)!.y).toBeCloseTo(1, 5);
    expect(log.at(-1)!.x).toBeCloseTo(1, 5);
});

test("feathers freeze while paused", async ({ page, hasTouch }) => {
    await startGame(page, hasTouch);
    await flapInput(page, hasTouch);
    await expect.poll(() => playerState(page)).toBe("flying");
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await expect.poll(() => isPaused(page)).toBe(true);
    const a = await feathers(page);
    expect(a.length).toBeGreaterThan(0);
    await page.waitForTimeout(400);
    expect(await feathers(page)).toEqual(a);
});
