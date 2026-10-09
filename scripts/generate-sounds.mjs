// Generates the game's retro sound effects as WAV files in public/sounds/.
// No dependencies, and deterministic: re-running produces byte-identical files.
// Usage: npm run sounds
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "sounds");
const RATE = 22050;

// ==============================
// Synth helpers
// ==============================

// Seeded PRNG (mulberry32) so noise is identical on every run
function rng(seed) {
    return () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const waves = {
    sine: (p) => Math.sin(2 * Math.PI * p),
    square: (p) => (p % 1 < 0.5 ? 1 : -1),
    triangle: (p) => 1 - 4 * Math.abs((p % 1) - 0.5),
};

/** Fast attack, exponential decay. */
const envelope = (t, attack, decay) => (t < attack ? t / attack : Math.exp(-(t - attack) / decay));

/**
 * A tone whose frequency follows `freqAt(t)`. Phase is accumulated so
 * sweeps stay click-free.
 */
function tone({ duration, freqAt, wave = "square", volume = 0.3, attack = 0.004, decay = 0.08 }) {
    const out = new Float32Array(Math.round(duration * RATE));
    let phase = 0;
    for (let i = 0; i < out.length; i++) {
        const t = i / RATE;
        phase += freqAt(t) / RATE;
        out[i] = waves[wave](phase) * envelope(t, attack, decay) * volume;
    }
    return out;
}

/** Plays notes back to back; the last note rings for `tail` seconds. */
function arpeggio(freqs, { step, tail, wave = "square", volume = 0.25 }) {
    return concat(freqs.map((f, i) => {
        const last = i === freqs.length - 1;
        return tone({
            duration: last ? tail : step,
            // Light vibrato on the held note
            freqAt: last ? (t) => f * (1 + 0.01 * Math.sin(2 * Math.PI * 6 * t)) : () => f,
            wave, volume, decay: last ? tail / 3 : step,
        });
    }));
}

function noise({ duration, volume = 0.5, decay = 0.1, smoothing = 0.6, seed = 1 }) {
    const random = rng(seed);
    const out = new Float32Array(Math.round(duration * RATE));
    let prev = 0;
    for (let i = 0; i < out.length; i++) {
        // One-pole low-pass to take the hiss off the white noise
        prev = prev * smoothing + (random() * 2 - 1) * (1 - smoothing);
        out[i] = prev * envelope(i / RATE, 0.002, decay) * volume;
    }
    return out;
}

function concat(parts) {
    const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
    let offset = 0;
    for (const p of parts) { out.set(p, offset); offset += p.length; }
    return out;
}

function mix(...parts) {
    const out = new Float32Array(Math.max(...parts.map(p => p.length)));
    for (const p of parts) p.forEach((v, i) => { out[i] += v; });
    return out;
}

/** 16-bit PCM mono WAV, with a short fade-out to avoid a click at the end. */
function toWav(samples) {
    const fade = Math.min(samples.length, Math.round(0.005 * RATE));
    const data = Buffer.alloc(samples.length * 2);
    samples.forEach((v, i) => {
        const gain = i >= samples.length - fade ? (samples.length - i) / fade : 1;
        const s = Math.max(-1, Math.min(1, v * gain));
        data.writeInt16LE(Math.round(s * 32767), i * 2);
    });

    const header = Buffer.alloc(44);
    header.write("RIFF", 0);
    header.writeUInt32LE(36 + data.length, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16);        // fmt chunk size
    header.writeUInt16LE(1, 20);         // PCM
    header.writeUInt16LE(1, 22);         // mono
    header.writeUInt32LE(RATE, 24);
    header.writeUInt32LE(RATE * 2, 28);  // byte rate
    header.writeUInt16LE(2, 32);         // block align
    header.writeUInt16LE(16, 34);        // bits per sample
    header.write("data", 36);
    header.writeUInt32LE(data.length, 40);
    return Buffer.concat([header, data]);
}

// ==============================
// Sounds
// ==============================

const note = (semitonesFromA4) => 440 * 2 ** (semitonesFromA4 / 12);
const C5 = note(3), E5 = note(7), G5 = note(10), C6 = note(15), E6 = note(19), G6 = note(22), C7 = note(27);

const sounds = {
    // Quick upward "whoop"
    flap: tone({
        duration: 0.09, wave: "triangle", volume: 0.45, decay: 0.05,
        freqAt: (t) => 260 * (620 / 260) ** (t / 0.09),
    }),

    // Classic two-tone coin blip
    score: concat([
        tone({ duration: 0.05, freqAt: () => note(14), volume: 0.22, decay: 0.2 }),   // B5
        tone({ duration: 0.13, freqAt: () => note(19), volume: 0.22, decay: 0.06 }),  // E6
    ]),

    // Thud: filtered noise burst over a falling low sine
    hit: mix(
        noise({ duration: 0.3, volume: 0.6, decay: 0.06, smoothing: 0.7, seed: 7 }),
        tone({ duration: 0.3, wave: "sine", volume: 0.7, decay: 0.1, freqAt: (t) => 140 - 200 * t }),
    ),

    milestone: arpeggio([C6, E6, G6, C7], { step: 0.06, tail: 0.2, volume: 0.22 }),

    highscore: arpeggio([C5, E5, G5, C6, E6, G6, C7], { step: 0.075, tail: 0.45, volume: 0.22 }),
};

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, samples] of Object.entries(sounds)) {
    const file = join(OUT_DIR, `${name}.wav`);
    writeFileSync(file, toWav(samples));
    console.log(`${name}.wav  ${(samples.length / RATE).toFixed(2)}s`);
}
