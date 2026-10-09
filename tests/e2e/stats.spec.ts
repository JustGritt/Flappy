import { test, expect, type Page } from "@playwright/test";
import { openGame, gameOverWithScore, startGame, startFlying, texts, scene, overflowingText, overlappingRows } from "./game";

test.beforeEach(async ({ page }) => openGame(page));

const saved = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("flappy.stats") ?? "null"));
const statsLine = async (page: Page) => (await texts(page)).find(t => t.startsWith("Games:"));

test("a fresh player sees no stats on the menu", async ({ page }) => {
    expect(await statsLine(page)).toBeUndefined();
});

test("each finished run adds a game and its pipes, shown on the menu", async ({ page, hasTouch }) => {
    await gameOverWithScore(page, hasTouch, 3);
    expect(await saved(page)).toEqual({ gamesPlayed: 1, pipesPassed: 3 });
    await openGame(page);
    await gameOverWithScore(page, hasTouch, 4);
    expect(await saved(page)).toEqual({ gamesPlayed: 2, pipesPassed: 7 });
    await openGame(page);
    expect(await statsLine(page)).toBe("Games: 2 · Pipes: 7");
});

test("quitting mid-flight counts once; quitting before flying doesn't count", async ({ page, hasTouch }) => {
    test.skip(hasTouch, "escape is keyboard only");
    await startGame(page, hasTouch);
    await page.keyboard.press("Escape");
    await expect.poll(() => scene(page)).toBe("menu");
    expect(await saved(page)).toBeNull();

    await openGame(page);
    await startFlying(page, hasTouch);
    await page.evaluate(`import("/src/utils/score.ts").then(s => s.increaseScore(2))`);
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await expect.poll(() => scene(page)).toBe("menu");
    expect(await saved(page)).toEqual({ gamesPlayed: 1, pipesPassed: 2 });
});

test("malformed saved stats start from zero", async ({ page, hasTouch }) => {
    await page.evaluate(() => localStorage.setItem("flappy.stats", "{not json"));
    await openGame(page);
    expect(await statsLine(page)).toBeUndefined();
    await gameOverWithScore(page, hasTouch, 1);
    expect(await saved(page)).toEqual({ gamesPlayed: 1, pipesPassed: 1 });
});

for (const size of [{ width: 320, height: 568 }, { width: 844, height: 390 }, { width: 1280, height: 720 }]) {
    test(`the menu with best score and stats fits ${size.width}x${size.height}`, async ({ page, isMobile }) => {
        test.skip(isMobile && size.width > 900, "desktop screen size");
        await page.evaluate(() => {
            localStorage.setItem("flappy.highScore", "123");
            localStorage.setItem("flappy.stats", JSON.stringify({ gamesPlayed: 4567, pipesPassed: 123456 }));
        });
        await page.setViewportSize(size);
        await openGame(page);
        expect(await statsLine(page)).toBe("Games: 4567 · Pipes: 123456");
        expect(await overflowingText(page)).toEqual([]);
        expect(await overlappingRows(page)).toEqual([]);
    });
}
