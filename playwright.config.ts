import { defineConfig, devices } from "@playwright/test";

// A port of its own, and always a fresh server: a long-running dev server
// may have hot-reloaded modules, and then the tests' imports load separate
// copies of game modules (e.g. a second score) instead of the game's own.
const PORT = 5299;

export default defineConfig({
    testDir: "tests/e2e",
    timeout: Number(process.env.PW_TIMEOUT ?? 60_000),
    fullyParallel: true,
    // The game runs in real time; too many parallel browsers starve its frames
    workers: 3,
    retries: process.env.CI ? 1 : 0,
    reporter: [["list"], ["html", { open: "never" }]],
    use: {
        baseURL: `http://localhost:${PORT}`,
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
    },
    // Chromium projects use the installed Google Chrome: Playwright's bundled
    // headless Chromium has no WebGL on some machines, and Kaboom needs it.
    projects: [
        { name: "desktop", use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 1280, height: 720 } } },
        { name: "mobile-chrome", use: { ...devices["Pixel 7"], channel: "chrome" } },
        { name: "mobile-safari", use: { ...devices["iPhone 13"] } },
    ],
    webServer: {
        command: `npx vite --port ${PORT} --strictPort`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: false,
    },
});
