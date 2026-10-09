import { test, expect } from "@playwright/test";
import { openGame, startGame, startFlying, flapInput, playerState, press, buttons, isPaused, plays, scene } from "./game";

test.beforeEach(async ({ page }) => openGame(page));

const velocity = (page: any) => page.evaluate(() => window.k.get("player", { recursive: true })[0].vel.y);
const posY = (page: any) => page.evaluate(() => window.k.get("player", { recursive: true })[0].pos.y);

test("the bird hovers until the first flap, then flies up", async ({ page, hasTouch }) => {
    await startGame(page, hasTouch);
    await page.waitForTimeout(500);
    expect(await playerState(page)).toBe("ready");
    expect(await page.evaluate(() => window.k.get("*").some((o: any) => o.text?.includes("to flap")))).toBe(true);
    await flapInput(page, hasTouch);
    await expect.poll(() => playerState(page)).toBe("flying");
    expect(await velocity(page)).toBeLessThan(0);
    expect(await plays(page)).toContain("flap");
});

test("the pause button pauses and resumes without flapping", async ({ page, hasTouch }) => {
    await startFlying(page, hasTouch);
    const { II } = await buttons(page);
    await press(page, hasTouch, II.x, II.y);
    await expect.poll(() => isPaused(page)).toBe(true);
    const frozen = await posY(page);
    await page.waitForTimeout(300);
    expect(await posY(page)).toBe(frozen);

    const before = await velocity(page);
    await press(page, hasTouch, II.x, II.y);
    await expect.poll(() => isPaused(page)).toBe(false);
    // A flap would set the velocity to the (negative) jump force
    expect(await velocity(page)).toBeGreaterThanOrEqual(before - 1);
});

test("HUD buttons are big enough to tap and fit on screen", async ({ page, hasTouch }) => {
    await startGame(page, hasTouch);
    const { width } = page.viewportSize()!;
    for (const b of Object.values(await buttons(page))) {
        expect(b.size).toBeGreaterThanOrEqual(44);
        expect(b.x - b.size / 2).toBeGreaterThanOrEqual(0);
        expect(b.x + b.size / 2).toBeLessThanOrEqual(width);
    }
});

test("P pauses and resumes", async ({ page, hasTouch }) => {
    test.skip(hasTouch, "keyboard only");
    await startFlying(page, hasTouch);
    await page.keyboard.press("p");
    await expect.poll(() => isPaused(page)).toBe(true);
    await page.keyboard.press("p");
    await expect.poll(() => isPaused(page)).toBe(false);
});

test("space still flaps while the mouse rests on a button", async ({ page, hasTouch }) => {
    test.skip(hasTouch, "keyboard and mouse only");
    await startFlying(page, hasTouch);
    const { II } = await buttons(page);
    await page.mouse.move(II.x, II.y);
    await page.waitForTimeout(500);
    await page.keyboard.press("Space");
    await expect.poll(() => velocity(page)).toBeLessThan(0);
});

test("leaving the window mid-flight pauses the game", async ({ page, hasTouch }) => {
    await startFlying(page, hasTouch);
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await expect.poll(() => isPaused(page)).toBe(true);
});

test("leaving the window before the first flap doesn't pause", async ({ page, hasTouch }) => {
    await startGame(page, hasTouch);
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await page.waitForTimeout(200);
    expect(await isPaused(page)).toBe(false);
});

test("the sound button mutes without starting the game", async ({ page, hasTouch }) => {
    await startGame(page, hasTouch);
    const { SFX } = await buttons(page);
    await press(page, hasTouch, SFX.x, SFX.y);
    await expect.poll(async () => Object.keys(await buttons(page))).toContain("OFF");
    expect(await playerState(page)).toBe("ready");
    expect(await page.evaluate(() => localStorage.getItem("flappy.muted"))).toBe("true");
});

test("escape returns to the menu", async ({ page, hasTouch }) => {
    test.skip(hasTouch, "keyboard only");
    await startFlying(page, hasTouch);
    await page.keyboard.press("Escape");
    await expect.poll(() => scene(page)).toBe("menu");
});
