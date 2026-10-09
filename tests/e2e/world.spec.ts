import { test, expect, type Page } from "@playwright/test";
import { openGame, startGame, startFlying, autopilot, playerState } from "./game";

test.beforeEach(async ({ page }) => openGame(page));

/** Waits for pipes, then describes the most recent pipe pair, its caps and the ground. */
async function pipePair(page: Page) {
    await expect.poll(() => page.evaluate(() => window.k.get("gap", { recursive: true }).length), { timeout: 10_000 }).toBeGreaterThan(0);
    return page.evaluate(() => {
        const k = window.k;
        const gap = k.get("gap", { recursive: true }).at(-1);
        const pipes = k.get("pipe", { recursive: true }).filter((p: any) => p.parent === gap.parent && Math.abs(p.pos.x - gap.pos.x) < 1);
        const part = (anchor: string) => {
            const p = pipes.find((p: any) => p.anchor === anchor);
            const cap = p.children[0];
            return { y: p.pos.y, height: p.height, width: p.width, capY: cap.worldPos().y, capWidth: cap.width, capIsPipe: cap.is("pipe") && !!cap.c("area") };
        };
        const ground = k.get("ground", { recursive: true })[0];
        return {
            gapTop: gap.pos.y, gapBottom: gap.pos.y + gap.height,
            top: part("top"), bot: part("bot"),
            groundY: ground.pos.y, groundWidth: ground.width, width: k.width(), height: k.height(),
        };
    });
}

test("pipes have caps at their open ends, framing the gap", async ({ page, hasTouch }) => {
    await startFlying(page, hasTouch);
    await autopilot(page);
    const p = await pipePair(page);
    // The top pipe hangs down to the gap and the bottom pipe starts at it
    expect(p.top.y + p.top.height).toBeCloseTo(p.gapTop, 0);
    expect(p.bot.y - p.bot.height).toBeCloseTo(p.gapBottom, 0);
    expect(p.top.capY).toBeCloseTo(p.gapTop, 0);
    expect(p.bot.capY).toBeCloseTo(p.gapBottom, 0);
    expect(p.top.capIsPipe && p.bot.capIsPipe).toBe(true);
    expect(p.top.capWidth).toBeGreaterThan(p.top.width);
});

test("the ground spans the screen bottom and the gaps stay above it", async ({ page, hasTouch }) => {
    await startFlying(page, hasTouch);
    await autopilot(page);
    const p = await pipePair(page);
    expect(p.groundWidth).toBe(p.width);
    expect(p.groundY).toBeLessThan(p.height);
    expect(p.gapBottom).toBeLessThan(p.groundY);
    expect(p.gapTop).toBeGreaterThan(0);
    // The bottom pipe runs behind the ground to the screen edge
    expect(p.bot.y).toBeGreaterThanOrEqual(p.height);
});

test("the ground scrolls in flight and freezes when paused", async ({ page, hasTouch }) => {
    await startFlying(page, hasTouch);
    await autopilot(page);
    // The stripes are drawn from a private offset, so compare pixels of the grass
    const grass = async () => {
        const { groundY, width } = await page.evaluate(() => ({ groundY: window.k.get("ground", { recursive: true })[0].pos.y, width: window.k.width() }));
        return page.screenshot({ clip: { x: 0, y: groundY + 4, width: Math.min(width, 300), height: 10 } });
    };
    const a = await grass();
    await page.waitForTimeout(150);
    expect((await grass()).equals(a)).toBe(false);

    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await page.waitForTimeout(100);
    const b = await grass();
    await page.waitForTimeout(300);
    expect((await grass()).equals(b)).toBe(true);
});

test("falling onto the ground ends the run at the ground's top", async ({ page, hasTouch }) => {
    await startFlying(page, hasTouch);
    await expect.poll(() => playerState(page), { timeout: 5000 }).toBe("dead");
    const r = await page.evaluate(() => {
        const k = window.k;
        const p = k.get("player", { recursive: true })[0];
        return {
            y: p.pos.y,
            groundY: k.get("ground", { recursive: true })[0].pos.y,
            pipeNear: k.get("pipe", { recursive: true }).some((o: any) => Math.abs(o.worldPos().x - p.pos.x) < 150),
        };
    });
    expect(r.pipeNear).toBe(false);
    expect(r.y).toBeLessThan(r.groundY);
    expect(r.y).toBeGreaterThan(r.groundY * 0.8);
});

test("consecutive gaps never jump further than the bird can follow", async ({ page, hasTouch }) => {
    await startGame(page, hasTouch);
    for (const score of [0, 40]) {
        // Spawn many pipes straight from the module into a frozen container.
        // A string, so the browser (not the test runner) resolves the imports.
        const r: any = await page.evaluate(`(async () => {
            const k = window.k;
            const pipes = await import("/src/entities/pipes.ts");
            const { GAP_SHIFT_PER_SECOND } = await import("/src/utils/constants.ts");
            pipes.resetPipes();
            const world = k.add([k.timer()]);
            world.paused = true;
            const centres = [];
            for (let i = 0; i < 200; i++) {
                pipes.createPipe(world, ${score});
                const g = world.get("gap").at(-1);
                centres.push(g.pos.y + g.height / 2);
            }
            const { interval, gap } = pipes.getDifficulty(${score});
            world.destroy();
            const shifts = centres.slice(1).map((c, i) => Math.abs(c - centres[i]));
            return {
                limit: GAP_SHIFT_PER_SECOND * interval,
                maxShift: Math.max(...shifts),
                top: Math.min(...centres) - gap / 2,
                bottom: Math.max(...centres) + gap / 2,
                ground: k.get("ground", { recursive: true })[0].pos.y,
            };
        })()`);
        expect(r.maxShift, `score ${score}`).toBeLessThanOrEqual(r.limit + 0.01);
        expect(r.top, `score ${score}`).toBeGreaterThan(0);
        expect(r.bottom, `score ${score}`).toBeLessThan(r.ground);
    }
});
