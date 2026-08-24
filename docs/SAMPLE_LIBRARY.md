# Giving the Smart Piano a real instrument

The piano at `/#/piano` plays without downloading anything: `src/lib/pianoEngine.ts`
renders three velocity layers by additive synthesis when the audio context wakes
up. That is honest, and it is playable, but it is not a piano.

This document is how you replace it with recordings — start to finish, with the
exact commands.

---

## What you are actually allowed to use

Nobody owns the sound a piano makes. A piano tone is a hammer, a string and a
room — a physical fact, not property. What copyright covers is **one particular
recording** of it: that microphone, that room, that day, that engineering.

Which is exactly why free libraries exist. The people who made these recordings
own them, and chose to give them away:

| Library | What it is | Licence | Size |
|---|---|---|---|
| **Salamander Grand Piano** | Yamaha C5, 16 velocity layers, by Alexander Holm | CC-BY-3.0 | ~1 GB |
| **University of Iowa piano** | Steinway, note-by-note, chromatic | Public domain | ~500 MB |
| **FluidR3_GM** | General MIDI grand, one layer, small | MIT | ~740 KB |
| **Sonatina Symphonic Orchestra** | Includes a piano; orchestral set | CC-BY-3.0 | ~500 MB |

CC-BY means one thing in practice: **display the attribution line.** The app does
that for you — whatever you put in the manifest's `attribution` field is rendered
under the instrument panel whenever the library is loaded.

---

## The fast path — nothing to download or host

FluidR3 is already wired up. `public/piano/fluidr3.manifest.json` points at
`raw.githubusercontent.com`, which serves the files with
`access-control-allow-origin: *`, so the browser can fetch them directly.

1. Open `/#/piano`.
2. Touch any chord. (The audio context needs a gesture; that is a browser rule.)
3. Press **Load**.

The eight chords of the wheel are then warmed in the background — about **250 KB**
for every note the wheel can play. A full 88-key range costs 30 files, ~740 KB,
because neighbouring notes share one recording and are pitch-shifted to fit.

That is the whole thing working. Everything below is for a *better* instrument.

---

## The good path — Salamander, step by step

### Step 1 — Get the files

Download Salamander Grand Piano V3 and unzip it. You want the folder containing
the audio, which looks like `A0v1.ogg`, `A0v3.ogg`, `C4v9.ogg` — a note name plus
a velocity number.

```
~/Downloads/SalamanderGrandPianoV3/48khz24bit/
```

### Step 2 — Put the files where the site can serve them

The browser has to be able to reach them over HTTP. Copy them into `public/`,
which Vite serves in development and copies into `dist/` on build:

```bash
mkdir -p public/piano/salamander
cp ~/Downloads/SalamanderGrandPianoV3/48khz24bit/*.ogg public/piano/salamander/
```

> **Do not commit a gigabyte to this repository.** `public/piano/salamander/` is
> already in `.gitignore`. For production, put the files on any static host that
> sends `Access-Control-Allow-Origin` and use its URL as `--base-url` in Step 3.

### Step 3 — Build the manifest

Do not write it by hand. The generator reads the file names:

```bash
node tools/piano/make-manifest.mjs public/piano/salamander \
  --name "Salamander Grand Piano" \
  --license CC-BY-3.0 \
  --attribution "Salamander Grand Piano V3 — Alexander Holm (CC-BY-3.0)" \
  --attribution-url "https://archive.org/details/SalamanderGrandPianoV3" \
  --base-url "piano/salamander/" \
  --max-stretch 3 \
  --out public/piano/salamander.manifest.json
```

It prints what it found, and — importantly — **lists any file it could not read a
pitch from**, so nothing is silently dropped:

```
Wrote public/piano/salamander.manifest.json
  16 velocity layer(s), 1408 zones
  layer 1: velocity 1–7, 88 notes, MIDI 21–108
  ...
```

`--base-url` is how the **browser** reaches the files, not where they sit on your
disk. With the files in `public/piano/salamander/`, the browser sees them at
`piano/salamander/`.

### Step 4 — Point the app at it

Open `/#/piano`, put the manifest URL in the box, and press **Load**:

```
piano/salamander.manifest.json
```

To make it the default instead of typing it every time, change one line in
`src/pages/SmartPiano.tsx`:

```ts
const BUILT_IN_MANIFEST = `${import.meta.env.BASE_URL}piano/salamander.manifest.json`;
```

### Step 5 — Check it took

The **Instrument** panel is the readout. After loading and playing a few chords:

- **Notes ready** climbs as recordings arrive.
- **Unavailable** must stay at **0**. Anything above zero is a filename in the
  manifest that isn't on the server — compare it against `base_url`.
- **Downloaded** shows what it has actually cost so far.
- The line under the chord wheel says `recorded piano` instead of `synthesized`.

If it still says `synthesized` after several strikes of the same chord, the
recording is not arriving. Go to Troubleshooting.

---

## How the loading actually behaves

The rule that shapes `src/lib/sampleLoader.ts`: **`acquire()` never waits.**

1. You strike a key. The engine asks the library for a recording.
2. If it is in memory, you hear it.
3. If it is not, `acquire()` returns `null` **immediately**, the engine
   synthesizes that note, and the download starts behind it.
4. The next strike of that key is the real instrument.

So there is no spinner, no silence, and no all-or-nothing gigabyte. The cost is
that the very first strike of each note is synthesized — which is why the app
calls `prefetch()` on the chord wheel's notes the moment a library loads, when
you are plainly about to play.

**Levels are matched for you.** Libraries are mastered to wildly different
levels — FluidR3's notes peak near 0.09, some 14–24 dB below the engine's
rendered layers. Without correction, loading a real piano would make the
instrument almost inaudible, which reads as "it broke". So each recording is
scaled on decode to the same **loudness** as the synthesized layer it replaces,
and held under a ceiling so a boosted note cannot clip.

Loudness is matched on RMS, not peak. A struck string is a sharp transient over
a quiet decay while a rendered layer is a dense sum of partials; match their
peaks and the recording still sounds about 10 dB softer. Matching is per file,
which does flatten the recorded loudness difference between velocity layers —
but that difference is already supplied by `gainFor(velocity)`, and applying both
would double-count it. What survives is the part synthesis cannot fake: the
*timbre* of a hard strike. Use a layer's `gain_db` if you want manual trim on top.

Other behaviour worth knowing:

- **Neighbours share a file.** MIDI 59, 60 and 61 all resolve to the C4 recording,
  pitch-shifted. One download, three notes. This is why 30 files cover 88 keys.
- **`max_stretch_semitones` is a quality floor.** Stretch a recording too far and
  a piano stops sounding like one, so past that limit the loader declines and
  the note is synthesized instead. Declining is a normal outcome, not an error.
- **A 404 is permanent.** It is not retried; the file is not coming. A network
  error is retried three times with backoff.
- **Failure never breaks playing.** A bad manifest, a dead host, a missing file —
  each one just means synthesis for the notes it affects.

---

## Manifest format

```json
{
  "version": 1,
  "name": "Salamander Grand Piano",
  "license": "CC-BY-3.0",
  "attribution": "Salamander Grand Piano V3 — Alexander Holm (CC-BY-3.0)",
  "attribution_url": "https://archive.org/details/SalamanderGrandPianoV3",
  "base_url": "piano/salamander/",
  "max_stretch_semitones": 3,
  "layers": [
    {
      "velocity": [1, 42],
      "gain_db": 0,
      "zones": [
        { "root": 48, "file": "C3v1.ogg" },
        { "root": 60, "file": "C4v1.ogg" }
      ]
    }
  ]
}
```

| Field | Meaning |
|---|---|
| `version` | Must be `1`. |
| `name`, `license`, `attribution` | Required. `attribution` is displayed in the app. |
| `base_url` | Prefix for every `file`. Relative values resolve against the manifest's own location, so `"./"` works when the audio sits beside it. |
| `max_stretch_semitones` | Optional. Beyond this, synthesize rather than stretch. |
| `layers[].velocity` | Inclusive `[low, high]` within 1–127. Softest first. |
| `layers[].gain_db` | Optional trim, so a hot layer matches a quiet one. |
| `layers[].zones[].root` | The MIDI note the file was *recorded* at. This is the one field that must be right — everything is pitched relative to it. |

`validateManifest()` checks all of this and reports every problem at once.
Velocities no layer covers are reported as warnings and fall back to synthesis.

---

## Troubleshooting

**"did not return a manifest — the server answered with a web page"**
The path is wrong. A single-page host answers an unknown URL with `index.html`,
which is not JSON. Check the URL resolves: open it directly in a browser tab.

**Unavailable climbs**
The manifest's filenames don't match what is on the server. Take one zone's
`file`, join it to `base_url`, and open that in a tab. Case matters:
`C4.mp3` and `c4.mp3` are different files on most hosts.

**Everything stays "synthesized"**
Either every fetch is failing (check **Unavailable**), or the velocity you are
playing has no layer (the panel warns about gaps at load time), or every note you
try exceeds `max_stretch_semitones` from the nearest zone. Raise `--max-stretch`
or add zones.

**It works locally and fails when deployed**
Cross-origin. The sample host must send `Access-Control-Allow-Origin`. Check with:

```bash
curl -sI <one sample URL> | grep -i access-control
```

**It is slow on a phone**
Prefer `.ogg` or `.mp3` over `.wav` — an uncompressed library is roughly ten times
the bytes for no audible gain over a phone speaker. Trim the layer count too:
16 velocity layers is a studio luxury; 3–4 is inaudible from a food truck.

---

## Testing

- **Pure logic** — validation, selection, stretch limits, caching, retry,
  dedupe, gap reporting, level normalization — runs in Node against a fake fetch
  and decoder.
- **Level matching** decodes all 30 real MP3s offline and checks every one lands
  within 2× of the synthesized layer's loudness, and that none can clip. Offline,
  so the answer is the same every run.
- **The page** is driven in headless Chromium against real MP3s with the audio
  output metered by a node that sees every sample — polling an `AnalyserNode`
  on a timer misses a 5 ms piano transient and produces flaky numbers.

See `CHANGELOG.md` for what those runs currently report.
