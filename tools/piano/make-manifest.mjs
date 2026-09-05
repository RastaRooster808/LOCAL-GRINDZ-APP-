#!/usr/bin/env node
/*
 * Build a piano manifest by looking at a folder of samples.
 * © 2026 Local Grindz / RastaRooster (rastarooster.com). All rights reserved.
 * Proprietary and confidential — see NOTICE at the repository root.
 *
 *   node tools/piano/make-manifest.mjs <folder> [options]
 *
 * Reads every audio file in <folder>, works out each one's pitch and dynamic
 * layer from its NAME, and writes a manifest src/lib/sampleLoader.ts can use.
 * Nothing is downloaded and nothing is guessed silently — anything it cannot
 * parse is listed at the end so you can see exactly what was skipped.
 *
 * Recognised names (case-insensitive):
 *   C4.mp3  A#3.ogg  Db2.wav        → pitch only, one layer
 *   C4v1.ogg  A0v16.flac           → pitch + velocity layer (Salamander style)
 *   piano-C4-v3.wav  60.wav        → separators are ignored; a bare number is MIDI
 *
 * Options:
 *   --name "Salamander Grand Piano"
 *   --license CC-BY-3.0
 *   --attribution "Alexander Holm — Salamander Grand Piano V3"
 *   --attribution-url https://…
 *   --base-url samples/salamander/     (how the BROWSER will reach the files)
 *   --max-stretch 3
 *   --out public/piano/salamander.manifest.json
 */

import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, extname, basename } from 'node:path';

const AUDIO = new Set(['.mp3', '.ogg', '.wav', '.flac', '.m4a', '.opus', '.aac', '.webm']);
const PITCH_CLASS = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };

/** "A#3" / "Db-1" / "c4" → MIDI number. Returns null if it isn't a note name. */
export function noteToMidi(text) {
  const m = /^([a-gA-G])([#♯sb♭]?)(-?\d{1,2})$/.exec(text);
  if (!m) return null;
  const [, letter, accidental, octave] = m;
  let midi = PITCH_CLASS[letter.toLowerCase()] + (Number(octave) + 1) * 12;
  if (accidental === '#' || accidental === '♯' || accidental === 's') midi += 1;
  if (accidental === 'b' || accidental === '♭') midi -= 1;
  return midi >= 0 && midi <= 127 ? midi : null;
}

/** Pull { midi, layer } out of a file name, or null if it can't be read. */
export function parseName(file) {
  const stem = basename(file, extname(file));
  // Velocity suffix: …v12, …_v12, …-V12
  let layer = null;
  let rest = stem;
  const v = /[\s._-]?v(\d{1,2})$/i.exec(rest);
  if (v) { layer = Number(v[1]); rest = rest.slice(0, v.index); }

  // The note is the last token that parses as one.
  const tokens = rest.split(/[\s._-]+/).filter(Boolean);
  for (let i = tokens.length - 1; i >= 0; i--) {
    const midi = noteToMidi(tokens[i]);
    if (midi !== null) return { midi, layer };
    if (/^\d{1,3}$/.test(tokens[i])) {
      const n = Number(tokens[i]);
      if (n >= 0 && n <= 127) return { midi: n, layer };
    }
  }
  // Or the whole stem, for names with no separators like "C4v1" → rest "C4".
  const midi = noteToMidi(rest);
  return midi === null ? null : { midi, layer };
}

/** Split 1–127 into `count` contiguous velocity bands, softest first. */
export function velocityBands(count) {
  const bands = [];
  for (let i = 0; i < count; i++) {
    bands.push([
      Math.floor((i * 127) / count) + 1,
      Math.floor(((i + 1) * 127) / count),
    ]);
  }
  return bands;
}

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i === -1 ? fallback : process.argv[i + 1];
}

function main() {
  const folder = process.argv[2];
  if (!folder || folder.startsWith('--')) {
    console.error('usage: node tools/piano/make-manifest.mjs <folder> [--name …] [--out …]');
    process.exit(2);
  }

  const files = readdirSync(folder).filter(f => AUDIO.has(extname(f).toLowerCase())).sort();
  if (!files.length) {
    console.error(`No audio files in ${folder} (looked for ${[...AUDIO].join(' ')}).`);
    process.exit(1);
  }

  const byLayer = new Map();
  const skipped = [];
  for (const file of files) {
    const parsed = parseName(file);
    if (!parsed) { skipped.push(file); continue; }
    const key = parsed.layer ?? 1;
    if (!byLayer.has(key)) byLayer.set(key, []);
    byLayer.get(key).push({ root: parsed.midi, file });
  }
  if (!byLayer.size) {
    console.error('Could not read a pitch from any file name. Rename them like C4.mp3 or C4v3.ogg.');
    console.error('Examples seen: ' + files.slice(0, 5).join(', '));
    process.exit(1);
  }

  const keys = [...byLayer.keys()].sort((a, b) => a - b);
  const bands = velocityBands(keys.length);
  const layers = keys.map((key, i) => {
    const zones = byLayer.get(key)
      .filter((z, j, all) => all.findIndex(o => o.root === z.root) === j)
      .sort((a, b) => a.root - b.root);
    return { velocity: bands[i], zones };
  });

  const baseUrl = arg('--base-url', './');
  const manifest = {
    version: 1,
    name: arg('--name', basename(folder)),
    license: arg('--license', 'UNKNOWN — set this with --license'),
    attribution: arg('--attribution', 'UNKNOWN — set this with --attribution'),
    ...(arg('--attribution-url') ? { attribution_url: arg('--attribution-url') } : {}),
    base_url: baseUrl,
    max_stretch_semitones: Number(arg('--max-stretch', '3')),
    layers,
  };

  const out = arg('--out', 'piano.manifest.json');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n');

  console.log(`Wrote ${out}`);
  console.log(`  ${layers.length} velocity layer(s), ${layers.reduce((n, l) => n + l.zones.length, 0)} zones`);
  layers.forEach((l, i) => {
    const roots = l.zones.map(z => z.root);
    console.log(`  layer ${i + 1}: velocity ${l.velocity[0]}–${l.velocity[1]}, `
      + `${l.zones.length} notes, MIDI ${Math.min(...roots)}–${Math.max(...roots)}`);
  });
  if (manifest.license.startsWith('UNKNOWN')) {
    console.log('\n  ⚠ Set --license and --attribution. The app displays the attribution line,');
    console.log('    which is how a CC-BY library stays honestly used.');
  }
  if (skipped.length) {
    console.log(`\n  Skipped ${skipped.length} file(s) whose names had no readable pitch:`);
    for (const f of skipped.slice(0, 10)) console.log(`    ${f}`);
    if (skipped.length > 10) console.log(`    …and ${skipped.length - 10} more`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
