import { test, expect, type Page } from "@playwright/test";
import { openGame, startGame, startFlying, autopilot, gameOverWithScore } from "./game";

test.beforeEach(async ({ page }) => openGame(page));

type RGB = { r: number; g: number; b: number };
const DAY = { r: 52, g: 152, b: 219 }, SUNSET = { r: 205, g: 100, b: 80 }, NIGHT = { r: 24, g: 32, b: 72 };

/** skyColor() for each score, from the game's own module. */
function skyColors(page: Page, scores: number[]): Promise<RGB[]> {
    return page.evaluate(`import("/src/utils/background.ts").then(m =>
        ${JSON.stringify(scores)}.map(s => { const c = m.skyColor(s); return { r: c.r, g: c.g, b: c.b }; }))`) as Promise<RGB[]>;
}

const background = (page: Page): Promise<RGB> => page.evaluate(() => {
    const c = window.k.get("background")[0].color;
    return { r: c.r, g: c.g, b: c.b };
});

const close = (a: RGB, b: RGB, tolerance = 2) =>
    Math.abs(a.r - b.r) <= tolerance && Math.abs(a.g - b.g) <= tolerance && Math.abs(a.b - b.b) <= tolerance;

/** WCAG contrast ratio of white text on this colour. */
function contrastWithWhite({ r, g, b }: RGB) {
    const lin = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    return 1.05 / (luminance + 0.05);
}

test("the sky goes day, sunset, night and back to day every 25 points", async ({ page, hasTouch }) => {
    test.skip(hasTouch, "same logic on every device");
    await startGame(page, hasTouch);
    const [s0, s19, s22, s25, s50, s75] = await skyColors(page, [0, 19, 22, 25, 50, 75]);
    expect(s0).toEqual(DAY);
    expect(s19).toEqual(DAY);
    expect(close(s22, DAY, 0) || close(s22, SUNSET, 0)).toBe(false);   // blending
    expect(s25).toEqual(SUNSET);
    expect(s50).toEqual(NIGHT);
    expect(s75).toEqual(DAY);
});

test("white text stays readable on every sky", async ({ page, hasTouch }) => {
    test.skip(hasTouch, "same logic on every device");
    await startGame(page, hasTouch);
    const scores = Array.from({ length: 76 }, (_, i) => i);
    const colors = await skyColors(page, scores);
    colors.forEach((c, i) => expect(contrastWithWhite(c), `score ${scores[i]}`).toBeGreaterThanOrEqual(3));
});

test("the sky eases into the next phase as the score rises", async ({ page, hasTouch }) => {
    await startFlying(page, hasTouch);
    await autopilot(page);
    expect(close(await background(page), DAY)).toBe(true);
    await page.evaluate(`import("/src/utils/score.ts").then(s => s.increaseScore(25))`);
    // Not a jump: partway there shortly after
    await page.waitForTimeout(150);
    const mid = await background(page);
    expect(close(mid, DAY) || close(mid, SUNSET)).toBe(false);
    await expect.poll(() => background(page).then(c => close(c, SUNSET)), { timeout: 6000 }).toBe(true);
});

test("Game Over keeps the sky the player crashed under", async ({ page, hasTouch }) => {
    await gameOverWithScore(page, hasTouch, 50);
    expect(close(await background(page), NIGHT)).toBe(true);
});
