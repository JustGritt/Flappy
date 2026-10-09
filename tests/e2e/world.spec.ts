import { test, expect, type Page } from "@playwright/test";
import { openGame, startGame, startFlying, autopilot, playerState, isPaused } from "./game";

test.beforeEach(async ({ page }) => openGame(page));

/** Waits for pipes, then describes the most recent pipe pair, its caps and the ground. */
async function pipePair(page: Page) {
    await expect.poll(() => page.evaluate(() => window.k.get("gap", { recursive: true }).length), { timeout: 10_000 }).toBeGreaterThan(0);
    return page.evaluate(() => {
        const k = window.k;
        // A pair's top pipe, gap and bottom pipe are children of one "pipe-pair"
        const gap = k.get("gap", { recursive: true }).at(-1);
        const pipes = gap.parent.children.filter((p: any) => p.is("pipe"));
        const part = (anchor: string) => {
            const p = pipes.find((p: any) => p.anchor === anchor);
            const cap = p.children[0];
            return { y: p.worldPos().y, height: p.height, width: p.width, capY: cap.worldPos().y, capWidth: cap.width, capIsPipe: cap.is("pipe") && !!cap.c("area") };
        };
        const ground = k.get("ground", { recursive: true })[0];
        return {
            gapTop: gap.worldPos().y, gapBottom: gap.worldPos().y + gap.height,
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

/** Spawns many pipe pairs straight from the module into a frozen container. */
async function spawnPairs(page: Page, score: number, count = 300) {
    // A string, so the browser (not the test runner) resolves the imports
    return page.evaluate(`(async () => {
        const k = window.k;
        const pipes = await import("/src/entities/pipes.ts");
        const { GAP_SHIFT_PER_SECOND } = await import("/src/utils/constants.ts");
        const { unit } = await import("/src/utils/scale.ts");
        const { groundTop } = await import("/src/entities/ground.ts");
        pipes.resetPipes();
        const world = k.add([k.timer()]);
        world.paused = true;
        const pairs = [];
        for (let i = 0; i < ${count}; i++) {
            pipes.createPipe(world, ${score});
            const g = world.get("gap", { recursive: true }).at(-1);
            pairs.push({ centre: g.pos.y + g.height / 2, amplitude: g.parent.amplitude });
        }
        const { interval, gap } = pipes.getDifficulty(${score});
        world.destroy();
        return { pairs, gap, limit: GAP_SHIFT_PER_SECOND * interval * unit(), ground: groundTop() };
    })()`) as Promise<{ pairs: { centre: number; amplitude: number }[]; gap: number; limit: number; ground: number }>;
}

test("every point of a gap is within reach of every point of the previous one", async ({ page, hasTouch }) => {
    await startGame(page, hasTouch);
    for (const score of [0, 40]) {
        const { pairs, gap, limit, ground } = await spawnPairs(page, score);
        for (let i = 0; i < pairs.length; i++) {
            const p = pairs[i];
            // Even at the ends of its bob, the gap stays in the sky
            expect(p.centre - p.amplitude - gap / 2, `score ${score}`).toBeGreaterThan(0);
            expect(p.centre + p.amplitude + gap / 2, `score ${score}`).toBeLessThan(ground);
            if (i > 0) {
                const prev = pairs[i - 1];
                const worst = Math.abs(p.centre - prev.centre) + p.amplitude + prev.amplitude;
                expect(worst, `score ${score}, pair ${i}`).toBeLessThanOrEqual(limit + 0.01);
            }
        }
    }
});

test("pipes only bob from score 25, and never two in a row", async ({ page, hasTouch }) => {
    await startGame(page, hasTouch);
    const early = await spawnPairs(page, 24);
    expect(early.pairs.every(p => p.amplitude === 0)).toBe(true);

    const late = await spawnPairs(page, 30);
    const moving = late.pairs.filter(p => p.amplitude > 0).length;
    expect(moving).toBeGreaterThan(late.pairs.length * 0.15);
    for (let i = 1; i < late.pairs.length; i++) {
        expect(late.pairs[i].amplitude > 0 && late.pairs[i - 1].amplitude > 0, `pair ${i}`).toBe(false);
    }
});

test("a bobbing pair keeps its gap aligned, scores, and freezes on pause", async ({ page, hasTouch }) => {
    await startFlying(page, hasTouch);
    await page.evaluate(`import("/src/utils/score.ts").then(s => s.increaseScore(30))`);
    await autopilot(page);
    // Wait for a bobbing pair to be on screen
    const bobbing = () => page.evaluate(() => {
        const pair = window.k.get("pipe-pair", { recursive: true }).find((p: any) => p.amplitude > 0 && p.pos.x < window.k.width());
        if (!pair) return null;
        const [top, bot] = ["top", "bot"].map(a => pair.children.find((c: any) => c.is("pipe") && c.anchor === a));
        const gap = pair.children.find((c: any) => c.is("gap"));
        return {
            id: pair.id, y: pair.pos.y, x: pair.pos.x,
            topEnd: top.worldPos().y + top.height, gapTop: gap.worldPos().y,
            gapBottom: gap.worldPos().y + gap.height, botEnd: bot.worldPos().y - bot.height,
        };
    });
    await expect.poll(bobbing, { timeout: 25_000 }).not.toBeNull();
    const samples = [];
    for (let i = 0; i < 6; i++) {
        samples.push((await bobbing())!);
        await page.waitForTimeout(120);
    }
    const same = samples.filter(s => s.id === samples[0].id);
    for (const s of same) {
        expect(s.topEnd).toBeCloseTo(s.gapTop, 0);
        expect(s.botEnd).toBeCloseTo(s.gapBottom, 0);
    }
    expect(new Set(same.map(s => Math.round(s.y))).size).toBeGreaterThan(1);

    // Passing it still scores
    const score = () => page.evaluate(() => Number(window.k.get("score")[0].text));
    const before = await score();
    await expect.poll(score, { timeout: 10_000 }).toBeGreaterThan(before);

    // Frozen while paused
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await expect.poll(() => isPaused(page)).toBe(true);
    const ys = () => page.evaluate(() => window.k.get("pipe-pair", { recursive: true }).map((p: any) => p.pos.y));
    const a = await ys();
    await page.waitForTimeout(300);
    expect(await ys()).toEqual(a);
});
