import { test, expect, type Page } from "@playwright/test";
import { openGame, startFlying, isPaused } from "./game";

test.beforeEach(async ({ page }) => openGame(page));

function clouds(page: Page) {
    return page.evaluate(() => window.k.get("cloud", { recursive: true }).map((c: any) => ({
        id: c.id, x: c.worldPos().x, scale: c.scale.x, opacity: c.opacity, z: c.z,
    })));
}

test("the sky starts with clouds at different depths", async ({ page }) => {
    const cs = await clouds(page);
    expect(cs.length).toBeGreaterThanOrEqual(3);
    const scales = cs.map(c => c.scale);
    expect(Math.max(...scales) - Math.min(...scales)).toBeGreaterThan(0.01);
    // Nearer (bigger) clouds are more opaque and drawn in front
    const sorted = [...cs].sort((a, b) => a.scale - b.scale);
    for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].opacity).toBeGreaterThanOrEqual(sorted[i - 1].opacity);
        expect(sorted[i].z).toBeGreaterThanOrEqual(sorted[i - 1].z);
    }
    // Every cloud stays behind the pipes (z 0)
    expect(cs.every(c => c.z < 0)).toBe(true);
});

test("nearer clouds move faster", async ({ page }) => {
    const a = await clouds(page);
    await page.waitForTimeout(1000);
    const b = await clouds(page);
    const moved = a.map(c => ({ scale: c.scale, dx: c.x - b.find(d => d.id === c.id)!.x })).sort((p, q) => p.scale - q.scale);
    expect(moved.every(m => m.dx > 0)).toBe(true);
    expect(moved.at(-1)!.dx).toBeGreaterThan(moved[0].dx);
});

test("clouds freeze while the game is paused", async ({ page, hasTouch }) => {
    await startFlying(page, hasTouch);
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await expect.poll(() => isPaused(page)).toBe(true);
    const a = await clouds(page);
    await page.waitForTimeout(400);
    expect(await clouds(page)).toEqual(a);
});
