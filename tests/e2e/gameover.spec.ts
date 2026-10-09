import { test, expect, type Page } from "@playwright/test";
import { openGame, gameOverWithScore, texts, flapInput, playerState, plays, overflowingText, overlappingRows } from "./game";

test.beforeEach(async ({ page }) => openGame(page));

/** Waits for the count-up to end (the best score appears with it). */
async function waitForReveal(page: Page) {
    await expect.poll(async () => (await texts(page)).some(t => /best/i.test(t)), { timeout: 5000 }).toBe(true);
}

const medalName = (page: Page) => page.evaluate(() => {
    const k = window.k;
    if (!k.get("medal").length) return null;
    const names = ["Bronze", "Silver", "Gold", "Platinum"];
    return k.get("*").find((o: any) => names.includes(o.text) && !o.hidden)?.text ?? "hidden";
});

for (const [points, medal] of [[0, null], [9, null], [10, "Bronze"], [20, "Silver"], [30, "Gold"], [45, "Platinum"]] as const) {
    test(`score ${points} earns ${medal ?? "no medal"}`, async ({ page, hasTouch, isMobile }) => {
        test.skip(isMobile && ![0, 10].includes(points), "same logic on every device");
        await gameOverWithScore(page, hasTouch, points);
        await waitForReveal(page);
        expect(await medalName(page)).toBe(medal);
        expect(await texts(page)).toContain(`Score: ${points}`);
    });
}

test("the score counts up, then the medal pops in with a sound", async ({ page, hasTouch }) => {
    await page.evaluate(() => localStorage.setItem("flappy.highScore", "99"));
    await openGame(page);   // the best score is read on load
    await gameOverWithScore(page, hasTouch, 25);
    // Sample the score text while it counts
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) {
        (await texts(page)).filter(t => t.startsWith("Score:")).forEach(t => seen.add(t));
        if (seen.has("Score: 25")) break;
        await page.waitForTimeout(40);
    }
    expect(seen.size).toBeGreaterThan(3);
    expect(seen.has("Score: 25")).toBe(true);
    await waitForReveal(page);
    expect(await texts(page)).toContain("Best: 99");
    await expect.poll(() => page.evaluate(() => window.k.get("medal")[0].scale.x)).toBeCloseTo(1, 2);
    expect(await plays(page)).toContain("milestone");
});

test("the first press finishes the count-up, the second restarts", async ({ page, hasTouch }) => {
    await gameOverWithScore(page, hasTouch, 40);
    await page.waitForTimeout(550);   // past the input lock, still counting
    expect(await texts(page)).not.toContain("Score: 40");
    await flapInput(page, hasTouch);
    await expect.poll(() => texts(page)).toContain("Score: 40");
    expect(await medalName(page)).toBe("Platinum");
    expect(await playerState(page)).toBeUndefined();
    await flapInput(page, hasTouch);
    await expect.poll(() => playerState(page)).toBe("ready");
});

test("a new high score shows as a rainbow 'New best' after the count-up", async ({ page, hasTouch }) => {
    await page.evaluate(() => localStorage.setItem("flappy.highScore", "5"));
    await openGame(page);
    await gameOverWithScore(page, hasTouch, 12);
    expect(await texts(page)).not.toContain("New best: 12");
    await waitForReveal(page);
    expect(await texts(page)).toContain("New best: 12");
    expect(await plays(page)).toContain("highscore");
    expect(await plays(page)).not.toContain("milestone");
});

for (const size of [{ width: 320, height: 568 }, { width: 844, height: 390 }, { width: 1280, height: 720 }]) {
    test(`Game Over with a medal and new best fits ${size.width}x${size.height} without overlaps`, async ({ page, hasTouch, isMobile }) => {
        test.skip(isMobile && size.width > 900, "desktop screen size");
        await page.setViewportSize(size);
        await gameOverWithScore(page, hasTouch, 33);
        await waitForReveal(page);
        await page.waitForTimeout(500);   // medal pop finished
        expect(await overflowingText(page)).toEqual([]);
        // Rows (title, medal, medal name, score, best, hint) must not overlap
        expect(await overlappingRows(page)).toEqual([]);
    });
}
