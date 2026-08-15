# Kula Mele — the Color Piano (11 Hawaiian letters)

The "piano made of color": eleven Hawaiian letters, each bound to a color and a
pitch. Five **warm vowels** then six **cool consonants** = 11 keys. Pitches are a
rising C-major run so any Hawaiian word played across the keys sounds musical;
the colors flow as a spectrum so the keyboard reads as light.

Source of truth: `src/pages/SignatureSong.tsx` (`LETTERS`). Keep this table in sync.

| Slot | Letter | Note | Freq (Hz) | Color   | Family    |
|:----:|:------:|:----:|:---------:|:--------|:----------|
| 0    | A      | C4   | 261.63    | #ff3b6b | vowel     |
| 1    | E      | D4   | 293.66    | #ff7a1a | vowel     |
| 2    | I      | E4   | 329.63    | #ffc400 | vowel     |
| 3    | O      | F4   | 349.23    | #7ed321 | vowel     |
| 4    | U      | G4   | 392.00    | #23c48e | vowel     |
| 5    | H      | A4   | 440.00    | #22b8d6 | consonant |
| 6    | K      | B4   | 493.88    | #2f80ed | consonant |
| 7    | L      | C5   | 523.25    | #5b6bff | consonant |
| 8    | M      | D5   | 587.33    | #8b5cf6 | consonant |
| 9    | N      | E5   | 659.25    | #c04bd6 | consonant |
| 10   | P      | F5   | 698.46    | #ff4fa3 | consonant |

## Why 11 (not 12/13)

The traditional Hawaiian alphabet is 12 letters — 5 vowels (A E I O U) + 7
consonants (H K L M N P **W**) — plus the ʻokina. This first release uses **11**
(drops **W**) so the keyboard stays a comfortable single-hand span and every key
maps to a distinct color-note. **W** (and the ʻokina as a rhythmic rest) are the
natural 12th/13th keys for a later revision. Spelling ignores diacritics, the
ʻokina, and any unsupported letter, so kahakō vowels and ʻokina in words like
`ʻohana` / `ʻāina` still resolve to their base letters.

## Signature song → sign-in

A chosen Hawaiian word becomes a sequence of color-notes — the player's
**signature song**. Reproducing it (by tapping the keys, or singing into the mic)
lights them in.

**Voice path:** mic audio → **YIN** pitch detector (`detectPitch`: squared
difference function → CMNDF → absolute threshold → parabolic interpolation) →
nearest key within ±130 cents → same match logic as a tap. Validated to resolve
all 11 keys through harmonics + noise.

**Security boundary (important):** a short melody is low-entropy, so the
signature song is an **accessible local unlock** — it opens the player's profile
on the device and lights the screen. It is **not** an account password and must
never be presented as protecting the account from someone else. Real account
security stays with Supabase email magic-link (offered immediately after
lighting in). Front door of color and light; real lock behind it.

## Open thread — "Powers of Ten" (Unreal)

Planned: emit a `user_spectrum.json` from a player's signature and drive an
Unreal Engine LevelSequence "Powers of Ten" zoom (planet → individual). Blocked
on re-sharing the exact Level Sequence Python script + the expected
`user_spectrum.json` schema so the app's export matches the importer's contract.
