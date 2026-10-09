import { expect, type Page } from "@playwright/test";

// The dev server exposes the Kaboom context as `window.k` (src/kaboomContext.ts).
// Page functions run in the browser, so they can only use what's passed in.
declare global {
    interface Window {
        k: any;
        __plays: string[];
        __autopilot: boolean;
    }
}

/**
 * Stand-ins for APIs that Kaboom needs on startup but Playwright's WebKit build
 * on Windows lacks (real Safari has them): Web Audio and the Gamepad API.
 * Sounds are silent, but `k.play` still runs.
 */
function stubMissingApis() {
    const w = window as any;
    if (!navigator.getGamepads) (navigator as any).getGamepads = () => [];
    if (w.AudioContext || w.webkitAudioContext) return;
    const node = () => ({ connect() {}, disconnect() {} });
    const param = () => ({ value: 1, setValueAtTime() {}, linearRampToValueAtTime() {} });
    const buffer = (duration: number) => ({ duration, numberOfChannels: 1, length: 1, sampleRate: 44100, getChannelData: () => new Float32Array(1) });
    w.AudioContext = class {
        state = "running";
        destination = node();
        sampleRate = 44100;
        get currentTime() { return performance.now() / 1000; }
        createGain() { return { ...node(), gain: param() }; }
        createBufferSource() {
            return { ...node(), buffer: null, loop: false, detune: param(), playbackRate: param(), onended: null, start() {}, stop() {} };
        }
        createBuffer(_channels: number, length: number, rate: number) { return buffer(length / rate); }
        decodeAudioData(_data: ArrayBuffer, ok?: (b: unknown) => void) {
            const b = buffer(0.2);
            ok?.(b);
            return Promise.resolve(b);
        }
        resume() { return Promise.resolve(); }
        suspend() { return Promise.resolve(); }
    };
}

/** Opens the menu with fresh storage and waits until the game is drawn. */
export async function openGame(page: Page) {
    await page.addInitScript(stubMissingApis);
    await page.goto("/");
    await page.waitForFunction(() => window.k && window.k.get("*").length > 2);
    // Let the menu finish fading in
    await page.waitForFunction(() => window.k.get("fade").length === 0);
    // Kaboom listens for keys on the canvas
    await page.locator("#game").focus();
    // Record every sound played
    await page.evaluate(() => {
        window.__plays = [];
        const play = window.k.play;
        window.k.play = (name: string, opt: unknown) => {
            window.__plays.push(name);
            return play(name, opt);
        };
    });
}

export function viewport(page: Page) {
    return page.viewportSize()!;
}

/** Taps (touch devices) or clicks (desktop) at a point in CSS pixels. */
export async function press(page: Page, hasTouch: boolean, x: number, y: number) {
    if (hasTouch) await page.touchscreen.tap(x, y);
    else await page.mouse.click(x, y);
}

/** Taps / presses space somewhere that isn't a HUD button. */
export async function flapInput(page: Page, hasTouch: boolean) {
    const { width, height } = viewport(page);
    if (hasTouch) await page.touchscreen.tap(width / 2, height * 0.6);
    else await page.keyboard.press("Space");
}

export async function playerState(page: Page): Promise<string | undefined> {
    return page.evaluate(() => window.k.get("player", { recursive: true })[0]?.state);
}

/** From the menu into the game scene. */
export async function startGame(page: Page, hasTouch: boolean) {
    await flapInput(page, hasTouch);
    await expect.poll(() => playerState(page)).toBe("ready");
}

/** Start the game and make the first flap. */
export async function startFlying(page: Page, hasTouch: boolean) {
    await startGame(page, hasTouch);
    await flapInput(page, hasTouch);
    await expect.poll(() => playerState(page)).toBe("flying");
}

/**
 * Pins the bird to the centre of the next gap every frame, so it never dies.
 * Set `window.__autopilot = false` to let go.
 */
export async function autopilot(page: Page) {
    await page.evaluate(() => {
        const k = window.k;
        window.__autopilot = true;
        k.onUpdate(() => {
            const p = k.get("player", { recursive: true })[0];
            if (!window.__autopilot || !p || p.state !== "flying") return;
            // Keep aiming at a gap until the bird is clear of its pipes.
            // Gaps are children of their pipe pair, so use world positions.
            const gaps = k.get("gap", { recursive: true })
                .map((g: any) => ({ pos: g.worldPos(), width: g.width, height: g.height }))
                .filter((g: any) => g.pos.x + g.width * 1.6 > p.pos.x)
                .sort((a: any, b: any) => a.pos.x - b.pos.x);
            p.pos.y = gaps.length ? gaps[0].pos.y + gaps[0].height / 2 : k.height() / 2;
            p.vel = k.vec2(0, 0);
        });
    });
}

export async function isPaused(page: Page) {
    return page.evaluate(() => window.k.get("pause").length > 0);
}

/** Centres of the HUD buttons, keyed by label ("II", "SFX"/"OFF"). */
export async function buttons(page: Page): Promise<Record<string, { x: number; y: number; size: number }>> {
    return page.evaluate(() => Object.fromEntries(window.k.get("ui-button").map((b: any) =>
        [b.children[0].text, { x: b.pos.x, y: b.pos.y, size: b.width }])));
}

export async function scene(page: Page) {
    return page.evaluate(() => {
        const k = window.k;
        if (k.get("player", { recursive: true }).length) return "game";
        if (k.get("*").some((o: any) => o.text === "Game Over")) return "gameOver";
        return "menu";
    });
}

export async function plays(page: Page) {
    return page.evaluate(() => window.__plays);
}

/**
 * Text objects that stick out past an edge of the screen. Hidden ones count
 * too, since blinking prompts are hidden half the time.
 * Kaboom divides a text's reported height (and its width, unless a wrap width
 * is set) by its scale, so this measures the unscaled text itself.
 */
export async function overflowingText(page: Page): Promise<string[]> {
    return page.evaluate(() => {
        const k = window.k;
        return k.get("*", { recursive: true })
            .filter((o: any) => o.text?.trim())
            .filter((o: any) => {
                const sx = o.scale?.x ?? 1, sy = o.scale?.y ?? 1;
                const natural = k.formatText({
                    text: o.text, size: o.textSize, font: o.font,
                    letterSpacing: o.letterSpacing, lineSpacing: o.lineSpacing,
                }).width;
                // Unwrapped: width * scale is the natural width. Wrapped: width is the wrap box.
                const wrapped = Math.abs(o.width * sx - natural) > 1;
                const halfW = (wrapped ? o.width : natural) * sx / 2;
                const halfH = o.height * sy * sy / 2;
                const { x, y } = o.worldPos ? o.worldPos() : o.parent.worldPos();
                return x - halfW < -1 || x + halfW > k.width() + 1 || y - halfH < -1 || y + halfH > k.height() + 1;
            })
            .map((o: any) => o.text);
    });
}

/** Plays a run that ends with `points`, and waits for the Game Over screen. */
export async function gameOverWithScore(page: Page, hasTouch: boolean, points: number) {
    await startFlying(page, hasTouch);
    // The browser resolves this import, so it's the game's own score module
    if (points > 0) await page.evaluate(`import("/src/utils/score.ts").then(s => s.increaseScore(${points}))`);
    await expect.poll(() => scene(page), { timeout: 10_000 }).toBe("gameOver");
}

/** Texts on screen, by content. */
export async function texts(page: Page): Promise<string[]> {
    return page.evaluate(() => window.k.get("*", { recursive: true })
        .filter((o: any) => o.text?.trim() && !o.hidden).map((o: any) => o.text));
}

/**
 * Pairs of root-level texts (and medals) whose vertical extents overlap, for
 * screens laid out as a single centred column. Includes hidden (blinking) text.
 */
export async function overlappingRows(page: Page): Promise<string[]> {
    return page.evaluate(() => {
        const k = window.k;
        const rows: { name: string; top: number; bottom: number }[] = [];
        for (const o of k.get("*")) {
            if (o.is("medal")) rows.push({ name: "medal", top: o.pos.y - o.radius, bottom: o.pos.y + o.radius });
            else if (o.text?.trim() && !o.is("ui-button")) {
                // Kaboom reports a scaled text's height divided by its scale
                const h = o.height * (o.scale?.y ?? 1) ** 2;
                rows.push({ name: o.text, top: o.pos.y - h / 2, bottom: o.pos.y + h / 2 });
            }
        }
        rows.sort((a, b) => a.top - b.top);
        const overlaps: string[] = [];
        for (let i = 1; i < rows.length; i++) {
            if (rows[i].top < rows[i - 1].bottom - 1) overlaps.push(`${rows[i - 1].name} / ${rows[i].name}`);
        }
        return overlaps;
    });
}
