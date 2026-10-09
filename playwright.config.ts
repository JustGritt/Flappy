import { defineConfig, devices } from "@playwright/test";

const PORT = 5199;

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
        reuseExistingServer: !process.env.CI,
    },
});
