// ==============================
// Persistence
// ==============================

const STATS_KEY = "flappy.stats";

type Stats = { gamesPlayed: number; pipesPassed: number };

function loadStats(): Stats {
    try {
        const saved = JSON.parse(localStorage.getItem(STATS_KEY) ?? "{}");
        // Anything missing or malformed counts as 0
        const count = (value: unknown) => Number.isFinite(value) && (value as number) > 0 ? Math.floor(value as number) : 0;
        return { gamesPlayed: count(saved.gamesPlayed), pipesPassed: count(saved.pipesPassed) };
    } catch {
        return { gamesPlayed: 0, pipesPassed: 0 };
    }
}

function saveStats(value: Stats) {
    try {
        localStorage.setItem(STATS_KEY, JSON.stringify(value));
    } catch {
        // Storage unavailable (private mode, blocked cookies...): keep it in memory only
    }
}

// ==============================
// Exports
// ==============================

/** Lifetime totals across all runs. */
export const stats: Readonly<Stats> = loadStats();

/** Adds a finished run (a crash, or quitting mid-flight) to the totals. */
export function recordRun(pipesPassed: number) {
    const s = stats as Stats;
    s.gamesPlayed += 1;
    s.pipesPassed += pipesPassed;
    saveStats(s);
}
