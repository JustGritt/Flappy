import { test, expect, type Page } from "@playwright/test";
import { openGame, startGame, startFlying, flapInput, autopilot, playerState, scene, overflowingText } from "./game";

// From a small phone to a large desktop, including a phone held sideways
const SIZES = [
    { name: "small phone", width: 320, height: 568 },
    { name: "phone", width: 390, height: 844 },
    { name: "phone landscape", width: 844, height: 390 },
    { name: "laptop", width: 1280, height: 720 },
    { name: "large desktop", width: 1920, height: 1080 },
];

// On the base screen the gap starts at 350px, the bird is drawn at 1/4 of its
// sprite size, and a flap rises 500^2 / (2 * 1000) = 125px.
const BASE_GAP = 350;
const BASE_JUMP_TO_GAP = 125 / BASE_GAP;

/** Gameplay proportions at score 0, which should be the same on every screen. */
async function proportions(page: Page, hasTouch: boolean) {
    await startGame(page, hasTouch);
    const gap: number = await page.evaluate(`import("/src/entities/pipes.ts").then(p => p.getDifficulty(0).gap)`);
    const bird = await page.evaluate(() => {
        const p = window.k.get("player", { recursive: true })[0];
        // Record the jump force, so the arc's height can be computed exactly:
        // measuring it would depend on the frame rate
        const jump = p.jump.bind(p);
        p.jump = (force: number) => { (window as any).__jumpForce = force; jump(force); };
        return { height: p.height * p.scale.y, spriteHeight: p.height };
    });
    await flapInput(page, hasTouch);
    await expect.poll(() => page.evaluate(() => (window as any).__jumpForce)).toBeTruthy();
    const rise: number = await page.evaluate(() => (window as any).__jumpForce ** 2 / (2 * window.k.getGravity()));
    return { birdToGap: bird.height / gap, jumpToGap: rise / gap, spriteHeight: bird.spriteHeight };
}

for (const size of SIZES) {
    test.describe(`${size.name} ${size.width}x${size.height}`, () => {
        test.use({ viewport: { width: size.width, height: size.height } });
        test.beforeEach(async ({ page, isMobile }) => {
            test.skip(isMobile && size.width > 900, "desktop screen size");
            await openGame(page);
        });

        test("the bird and its jump are the same size relative to the gap", async ({ page, hasTouch }) => {
            const r = await proportions(page, hasTouch);
            expect(r.jumpToGap).toBeCloseTo(BASE_JUMP_TO_GAP, 3);
            expect(r.birdToGap).toBeCloseTo(r.spriteHeight / 4 / BASE_GAP, 3);
        });

        test("pipes, gaps and ground fit, and the run is playable", async ({ page, hasTouch }) => {
            await startFlying(page, hasTouch);
            await autopilot(page);
            await expect.poll(() => page.evaluate(() => Number(window.k.get("score")[0].text)), { timeout: 20_000 }).toBeGreaterThanOrEqual(1);
            const r = await page.evaluate(() => {
                const k = window.k;
                const ground = k.get("ground", { recursive: true })[0];
                const gaps = k.get("gap", { recursive: true });
                return {
                    groundHeight: ground.height, groundY: ground.pos.y, height: k.height(),
                    gapTop: Math.min(...gaps.map((g: any) => g.worldPos().y)),
                    gapBottom: Math.max(...gaps.map((g: any) => g.worldPos().y + g.height)),
                };
            });
            expect(r.groundHeight).toBeGreaterThanOrEqual(30);
            expect(r.groundY + r.groundHeight).toBeCloseTo(r.height, 0);
            expect(r.gapTop).toBeGreaterThan(0);
            expect(r.gapBottom).toBeLessThan(r.groundY);
            expect(await playerState(page)).toBe("flying");
        });

        test("hint, pause and Game Over text fit on screen", async ({ page, hasTouch }) => {
            await startGame(page, hasTouch);
            expect(await overflowingText(page), "ready").toEqual([]);

            // Auto-pause only happens mid-flight
            await flapInput(page, hasTouch);
            await expect.poll(() => playerState(page)).toBe("flying");
            await page.evaluate(() => window.dispatchEvent(new Event("blur")));
            await expect.poll(() => page.evaluate(() => window.k.get("pause").length)).toBe(1);
            await page.waitForTimeout(100);
            expect(await overflowingText(page), "paused").toEqual([]);

            // Resume and let the bird fall to Game Over
            if (hasTouch) {
                const II = await page.evaluate(() => window.k.get("ui-button").find((b: any) => b.children[0].text === "II").pos);
                await page.touchscreen.tap(II.x, II.y);
            } else {
                await page.keyboard.press("p");
            }
            await expect.poll(() => scene(page), { timeout: 10_000 }).toBe("gameOver");
            expect(await overflowingText(page), "game over").toEqual([]);
        });
    });
}
