import { test, expect } from "@playwright/test";
import { openGame, startGame, scene } from "./game";

test.beforeEach(async ({ page }) => openGame(page));

test("menu shows the title and sound hint, and no best score at first", async ({ page }) => {
    const texts = await page.evaluate(() => window.k.get("*").filter((o: any) => o.text && !o.hidden).map((o: any) => o.text));
    expect(texts).toContain("Flappy");
    expect(texts).toContain("[M] Sound: ON");
    expect(texts.some((t: string) => t.startsWith("Best:"))).toBe(false);
});

test("space or tap starts the game", async ({ page, hasTouch }) => {
    await startGame(page, hasTouch);
    expect(await scene(page)).toBe("game");
});

test("M toggles sound and the choice survives a reload", async ({ page, hasTouch }) => {
    test.skip(hasTouch, "keyboard only");
    await page.keyboard.press("m");
    const soundText = () => page.evaluate(() => window.k.get("*").find((o: any) => o.text?.startsWith("[M]"))?.text);
    await expect.poll(soundText).toBe("[M] Sound: OFF");
    await openGame(page);
    await expect.poll(soundText).toBe("[M] Sound: OFF");
    await page.keyboard.press("m");
    await expect.poll(soundText).toBe("[M] Sound: ON");
});

test("best score shows on the menu once set", async ({ page }) => {
    await page.evaluate(() => localStorage.setItem("flappy.highScore", "7"));
    await openGame(page);
    const best = await page.evaluate(() => window.k.get("*").find((o: any) => o.text?.startsWith("Best:")));
    expect(best).toBeTruthy();
});
