# Voice triggers — beatboxing into the chord wheel

Vochlea's Dubler does two separable things, and it is worth being precise about
which is which, because only one of them was missing here.

| Question | Answer | Where it lives |
|---|---|---|
| *What note is this?* | YIN pitch detection | `src/lib/pitch.ts` — already powered the Kula Mele tuner |
| *Did a sound just start?* | Rectified spectral flux + adaptive threshold | `src/lib/vocalTrigger.ts` |
| *Which sound was it?* | Spectral features → nearest centroid | `src/lib/vocalTrigger.ts` |

Humming a melody was already solved. Beatboxing was not, because a kick and a
hi-hat have **no pitch to find** — what separates them is when they start and
what their noise looks like.

## What it does in this app

Your voice plays the **rhythm**; the chord wheel still picks the **harmony**.
Train one sound for the bass and one for the chord, then beatbox the groove
while your hand moves across the chords. The two targets map onto the zones the
wheel already had: `BASS_HEAD` and `CHORD_BODY`.

Nothing is pretrained. A stranger's kick drum is not yours, and the whole point
is that it learns your mouth.

## Using it

1. Open `/#/piano` and tap a chord — browsers require a gesture before audio.
2. **Enable microphone** under *Voice triggers*.
3. Press **Bass**, make your low sound ("puh") a few times, press it again to stop.
4. Same for **Chord** with a sharp sound ("tss").
5. Beatbox. Voice hits play whichever chord you touched last.

Training is saved to `localStorage` and restored on the next visit.

## How it works

### Onset — did a sound start?

Rectified spectral flux: how much energy *appeared* since the last frame. Only
rises count, because a note ending is not a note starting — counting decay is
what makes naive detectors fire twice on every hit.

The threshold is the median of recent flux times a sensitivity, plus a floor —
adaptive, because a fixed threshold is wrong the moment the room, the mic or the
speaker changes.

Two rules stop double-triggers:

- **Re-arm hysteresis.** Flux must fall back below `threshold × 0.6` before
  another onset can fire. Every real kick drum *sweeps downward in pitch*, which
  keeps lighting up new bins as it falls; rectified flux reads that as a second
  onset. Requiring the flux to subside first is what tells a new hit from the
  tail of the last one.
- **A short refractory floor** (45ms). Kept short deliberately: sixteenths at
  160bpm are only 94ms apart, and a long gate eats fast rolls.

The reported onset position is the first sample of the frame that the *previous*
frame did not already contain. Reporting the frame's start instead puts the
onset up to a full window early — 34–44ms of phantom lead at a 2048-sample
window, which is audible as sloppy timing.

### Timbre — which sound was it?

Six features: spectral centroid, zero-crossing rate, spectral flatness, and the
fraction of energy below 300Hz / 300–3000Hz / above 3000Hz.

**Centroid and band ratios are weighted by power, not magnitude.** Every real
microphone carries a broadband noise floor, and spread across a thousand bins
even a quiet one outweighs a single loud low partial. Weighted by magnitude, a
deep "puh" measured a *4kHz* centroid — brighter than the hi-hat it has to be
told apart from. Squaring favours concentrated peaks over spread hiss, and the
same kick then measures 88Hz: its actual fundamental.

Classification is nearest-centroid over z-scored features. Deliberately not a
neural net: with a dozen takes per sound a centroid is not merely adequate, it
is better behaved — it trains instantly in the browser, it cannot overfit a
handful of examples, and when it is wrong you can read the feature table and see
why. Z-scoring matters because the features live on wildly different scales;
without it the distance is just "how far apart are the centroids in Hz".

**Loudness is excluded from matching** and used only for velocity. How hard you
hit is not part of what makes a kick a kick, and folding it in makes a quiet
kick classify as a hi-hat.

Confidence is the margin to the runner-up, so a sound sitting between two
trained triggers reports low confidence rather than guessing confidently. Hits
below 8% confidence are dropped rather than played.

## Measured against a real voice

A 5.7s beatbox take, run through the real engine (`tools`-side harness, not a
reimplementation):

- **23 onsets detected**; 21 loud enough to pass the rms gate. The two the gate
  discarded were trailing sounds at velocity 1.
- The sounds **do separate**: k-means over the same z-scored features gives a
  silhouette of **0.51** at k=3, 0.46 at k=2 — clearly grouped, not a smear.
- Trained on the front of each sound and scored on held-out hits the app would
  actually play: **5/5 correct**, mean confidence 32%. A small sample, but every
  audible held-out hit was right.

Two things that take contradicted, which are worth recording:

**Real beatboxing here was voiced, not sibilant.** 66% of the energy sat in
300–1000 Hz, most hits had a detectable pitch (280–600 Hz) and near-zero
flatness. The recording is not band-limited — energy runs to 16kHz — the voice
simply put nothing up there. `highRatio` was 0.00–0.12 on every single hit. So
the "say tss" advice in the UI is a suggestion, not a requirement, and the panel
now says so: any two sounds work provided they differ from each other.

**Adding pitch as a feature made things worse.** It looked like the obvious win
— every hit had a pitch, and the classifier was ignoring it. Measured on the
same held-out hits: accuracy unchanged at 5/5, mean confidence **down from 32%
to 19%**. Pitch varies a lot *within* one sound (295–384 Hz across takes of the
same sound), so it inflates within-class spread without separating the classes.
Not adopted.

## Four real takes: what separates and what doesn't

Four beatbox recordings, each one sound, run through the real engine. Trained on
alternate takes and scored on the rest:

| pair | held-out accuracy |
|---|---|
| take 1 vs take 3 | **93%** |
| take 1 vs take 4 | 88% |
| take 2 vs take 3 | 80% |
| take 2 vs take 4 | 73% |
| take 1 vs take 2 | 67% |
| take 3 vs take 4 | **55% — a coin flip** |

**Two triggers work; four do not.** All four at once scored 42% against 25%
chance: take 1 was identified 9/10, and takes 2–4 were barely distinguished from
each other. They overlap in every feature — pitch 83–190Hz, centroid 200–470Hz,
no high-frequency content at all. The sample is small (10–16 scored hits per
pair) so treat the exact percentages loosely; the ordering is the useful part.

The lesson is not to add features. It is to **pick two sounds that genuinely
differ**. Two attempts at fixing it with features were measured and rejected:

- **Pitch.** Every hit had one and the classifier ignored it. Accuracy unchanged,
  mean confidence fell 32% → 19%: pitch varies more *within* one sound than
  between sounds.
- **Attack and decay envelope.** Net gain about 1%, but it *hurt* the pairs that
  already worked — 93% → 87% and 88% → 75% — while helping the worst pair. A
  bad trade.

## Is my pair any good?

The panel answers this at training time rather than leaving it to be discovered
mid-performance. `TriggerModel.crossValidate()` holds out each recorded take in
turn, refits on the rest, and checks whether the take is still called correctly.

That is measured on takes already recorded — no extra effort — and it predicts
real performance far better than the alternative: across the six pairs above it
correlated **0.80** with held-out accuracy, where mean confidence managed only
0.49. Confidence is actively misleading at the top: the pair with the *highest*
mean confidence (35%) was among the worst performers (67%).

It reads low in absolute terms — leave-one-out on a handful of takes is
pessimistic by construction — so it drives a threshold rather than being shown
as a number. Below 55% the panel says the two sounds are hard to tell apart and
suggests making them more different.

## Known limits

- A sound already in progress when the stream opens can only be noticed one
  window late — there is no earlier frame to compare it against. This is a limit
  of any flux-based detector, not something papered over.
- Two sounds closer than 45ms are treated as one.
- `echoCancellation`, `noiseSuppression` and `autoGainControl` are all requested
  **off**: they are built to flatten exactly the transients this depends on, and
  AGC in particular would erase the loudness that becomes velocity. A browser
  that ignores those constraints will degrade both timing and dynamics.

## Testing

- **`vocalTrigger.ts`** — 33 assertions in Node: the FFT against a direct DFT, a
  1kHz tone landing in the right bin, features separating synthesized kick /
  snare / hi-hat, onset counts and timing across a 16-hit bar, silence producing
  nothing, one hit firing exactly once, and **90/90 held-out takes classified
  correctly** — trained on seeds 1–8 and scored on 100–129, never on its own
  training data.
- **`vocalInput.ts`** — 15 assertions driving the real listener through a stub
  AudioContext: train two sounds, then perform a four-bar groove of unheard
  takes. **32/32 fired and identified correctly.**
- **The page** — 16 assertions in headless Chromium with a *fake microphone*
  playing a real WAV of kicks: the mic opens, takes accumulate from live audio,
  training survives a reload, and a trigger fires and makes sound.

The phantom-onset regression (below) is covered by a test that was checked
against the bug: with the fix reverted, six sounds produce twelve hits.
