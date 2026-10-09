import { test, expect } from "@playwright/test";
import { openGame, startGame, startFlying, scene, overflowingText } from "./game";

test.beforeEach(async ({ page }) => openGame(page));

test("the canvas fills the viewport with no page scrolling", async ({ page }) => {
    const r = await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth, scrollH: document.documentElement.scrollHeight,
        w: innerWidth, h: innerHeight, kw: window.k.width(), kh: window.k.height(),
    }));
    expect(r.scrollW).toBeLessThanOrEqual(r.w);
    expect(r.scrollH).toBeLessThanOrEqual(r.h);
    // Devices with fractional pixel ratios (Pixel 7: 2.625) round the canvas
    expect(r.kw).toBeCloseTo(r.w, 0);
    expect(r.kh).toBeCloseTo(r.h, 0);
});

test("touch gestures can't zoom, scroll or select", async ({ page }) => {
    const css = await page.evaluate(() => {
        const s = getComputedStyle(document.body);
        // Playwright's Windows WebKit lacks overscroll-behavior (iOS Safari 16+ has it)
        return { touchAction: s.touchAction, overscroll: s.overscrollBehaviorY ?? "none", select: s.userSelect || s.webkitUserSelect };
    });
    expect(css).toEqual({ touchAction: "none", overscroll: "none", select: "none" });
});

test("menu text fits on screen", async ({ page }) => {
    expect(await overflowingText(page)).toEqual([]);
});

test("pause overlay text fits on screen", async ({ page, hasTouch }) => {
    await startFlying(page, hasTouch);
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await expect.poll(() => page.evaluate(() => window.k.get("pause").length)).toBe(1);
    expect(await overflowingText(page)).toEqual([]);
});

test("Game Over text fits on screen", async ({ page, hasTouch }) => {
    await startFlying(page, hasTouch);
    await expect.poll(() => scene(page), { timeout: 10_000 }).toBe("gameOver");
    expect(await overflowingText(page)).toEqual([]);
});

test("the HUD stays in the top corner after a resize", async ({ page, hasTouch }) => {
    await startGame(page, hasTouch);
    const size = page.viewportSize()!;
    await page.setViewportSize({ width: size.height, height: size.width });   // rotate
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => ({
        w: window.k.width(),
        buttons: window.k.get("ui-button").map((b: any) => ({ x: b.pos.x, y: b.pos.y })),
        ground: window.k.get("ground", { recursive: true })[0].pos.y,
        h: window.k.height(),
    }));
    expect(r.w).toBeCloseTo(size.height, 0);
    for (const b of r.buttons) {
        expect(b.x).toBeLessThan(r.w);
        expect(b.y).toBeLessThan(100);
    }
    expect(r.ground).toBeLessThan(r.h);
});
