import { test, expect } from "@playwright/test";
import { openGame, startFlying, playerState, scene, plays, isPaused } from "./game";

test.beforeEach(async ({ page }) => openGame(page));

test("crashing into a pipe flashes, drops the bird to the ground, then shows Game Over", async ({ page, hasTouch }) => {
    await startFlying(page, hasTouch);
    // Hold the bird at the top until a pipe reaches it, and log every frame after the crash.
    // The log lives on `window`, so it survives the scene change.
    await page.evaluate(() => {
        const k = window.k;
        const log: any[] = ((window as any).__log = []);
        k.onUpdate(() => {
            const p = k.get("player", { recursive: true })[0];
            if (!p) return;
            if (p.state === "flying") {
                p.pos.y = 20;
                p.vel = k.vec2(0, 0);
            }
            if (p.state === "dead") log.push({
                y: p.pos.y,
                angle: p.angle,
                flash: k.get("*").some((o: any) => o.z === 20 && o.opacity > 0.05),
                pipeX: k.get("pipe", { recursive: true })[0]?.worldPos().x,
                ground: k.get("ground", { recursive: true })[0].pos.y,
                pauseHidden: k.get("ui-button").find((b: any) => b.children[0].text === "II").hidden,
            });
        });
    });
    await expect.poll(() => playerState(page), { timeout: 15_000 }).toBe("dead");
    if (!hasTouch) {
        await page.keyboard.press("p");
        expect(await isPaused(page)).toBe(false);
    }
    await expect.poll(() => scene(page), { timeout: 5000 }).toBe("gameOver");

    const log = await page.evaluate(() => (window as any).__log);
    const last = log.at(-1);
    expect(await plays(page)).toContain("hit");
    expect(log[0].y).toBeLessThan(100);
    expect(log.slice(0, 5).some((e: any) => e.flash)).toBe(true);
    expect(last.flash).toBe(false);
    expect(last.angle).toBeCloseTo(90, 0);
    expect(last.y).toBeLessThan(last.ground);
    expect(last.y).toBeGreaterThan(last.ground * 0.8);
    expect(log.every((e: any) => e.pipeX === log[0].pipeX)).toBe(true);
    expect(log.every((e: any) => e.pauseHidden)).toBe(true);
});

test("Game Over ignores input at first, then restarts", async ({ page, hasTouch }) => {
    await startFlying(page, hasTouch);
    // Poll often: input is only ignored for the first half second
    await expect.poll(() => scene(page), { timeout: 10_000, intervals: [20] }).toBe("gameOver");
    const { width, height } = page.viewportSize()!;
    const restart = () => hasTouch ? page.touchscreen.tap(width / 2, height / 2) : page.keyboard.press("Space");
    await restart();
    expect(await scene(page)).toBe("gameOver");
    await page.waitForTimeout(600);
    await restart();
    await expect.poll(() => playerState(page)).toBe("ready");
});
