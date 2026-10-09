import { test, expect, type Page } from "@playwright/test";
import { openGame, startFlying, autopilot, plays } from "./game";

test.beforeEach(async ({ page }) => openGame(page));

/** Records the score label's largest scale and lowest blue channel for each score. */
async function trackScoreLabel(page: Page) {
    await page.evaluate(() => {
        const k = window.k;
        const track: Record<string, { maxScale: number; minBlue: number; endScale: number; endBlue: number }> = ((window as any).__track = {});
        k.onUpdate(() => {
            const label = k.get("score")[0];
            if (!label) return;
            const t = (track[label.text] ??= { maxScale: 0, minBlue: 255, endScale: 1, endBlue: 255 });
            t.maxScale = Math.max(t.maxScale, label.scale.x);
            t.minBlue = Math.min(t.minBlue, label.color.b);
            t.endScale = label.scale.x;
            t.endBlue = label.color.b;
        });
    });
}

const score = (page: Page) => page.evaluate(() => Number(window.k.get("score")[0]?.text ?? -1));

test("passing a pipe scores a point and pops the label", async ({ page, hasTouch }) => {
    await startFlying(page, hasTouch);
    await trackScoreLabel(page);
    await autopilot(page);
    await expect.poll(() => score(page), { timeout: 20_000 }).toBeGreaterThanOrEqual(2);
    const track = await page.evaluate(() => (window as any).__track);
    // The pop starts at 1.6; slow browsers sample it a frame or two later
    expect(track["1"].maxScale).toBeGreaterThan(1.25);
    expect(track["1"].endScale).toBeCloseTo(1, 2);
    expect(track["1"].minBlue).toBe(255);
    expect(await plays(page)).toContain("score");
    expect(await page.evaluate(() => localStorage.getItem("flappy.highScore.normal"))).not.toBeNull();
});

test("every 10th point flashes gold with the milestone sound", async ({ page, hasTouch }) => {
    test.skip(hasTouch, "same logic on every device; slow, so desktop only");
    test.setTimeout(90_000);
    await startFlying(page, hasTouch);
    await trackScoreLabel(page);
    await autopilot(page);
    await expect.poll(() => score(page), { timeout: 70_000, intervals: [1000] }).toBeGreaterThanOrEqual(11);
    const track = await page.evaluate(() => (window as any).__track);
    expect(track["10"].minBlue).toBeLessThan(120);
    expect(track["10"].endBlue).toBeGreaterThan(250);
    const sounds = await plays(page);
    expect(sounds.filter(s => s === "milestone")).toHaveLength(1);
});
