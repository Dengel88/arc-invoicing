# Arc Invoicing — trailer (Remotion project)

A ~62-second product trailer, built with [Remotion](https://remotion.dev) (React →
MP4). The full shot-by-shot script, voiceover lines, and Higgsfield prompts for the
abstract motion-graphics shots are in [`../SCRIPT.md`](../SCRIPT.md). The checklist for
recording the two live-app screen captures is in [`../CAPTURE.md`](../CAPTURE.md).

## Status

**Renders end-to-end today**, with placeholders for the two shots that need a real
screen recording (04, 05) — nothing here is blocked on Higgsfield or on any external
asset. Five of the eight shots (01, 02, 03, 06, 08) are built entirely in
Remotion/SVG/typography and need no external clip at all; they can optionally be
swapped for AI-generated motion graphics later without touching any other shot.

## Setup

```bash
npm install
```

## Preview (live-reloading editor)

```bash
npm start
```

Opens Remotion Studio, where you can scrub the full 62-second timeline frame by frame,
or open the `ArcInvoicingTrailer` composition directly.

## Render a still (fast way to check one shot without a full render)

```bash
npx remotion still src/index.ts ArcInvoicingTrailer out/check.png --frame=365
```

Frame numbers for the start of each shot, at 30fps (see `src/timing.ts` for the exact
source of truth):

| Shot | Starts at frame |
|---|---|
| 01 cold-open | 0 |
| 02 problem | 120 |
| 03 turn | 360 |
| 04 issue | 510 |
| 05 pay | 810 |
| 06 why-arc | 1140 |
| 07 proof | 1500 |
| 08 close | 1680 |

## Full render

```bash
npm run render
```

Outputs `out/trailer.mp4`. Takes a few minutes — every frame re-runs the React tree,
and there are ~1,860 of them.

## Adding the two screen recordings

See [`../CAPTURE.md`](../CAPTURE.md) for exactly what to record. Once you have the two
MP4s:

1. Save them to `public/captures/issue-invoice.mp4` and `public/captures/pay-invoice.mp4`
2. In `src/components/MediaOrPlaceholder.tsx`, flip `ready: false → true` for each
3. Re-render

## Adding voiceover / music

Off by default so the project never errors on a missing file. Once you have the audio:

1. Save to `public/audio/voiceover.mp3` and/or `public/audio/music.mp3`
2. In `src/Trailer.tsx`, flip `HAS_VOICEOVER` and/or `HAS_MUSIC` to `true`

## Upgrading the abstract shots with Higgsfield

Shots 01, 02, 03, 06 and 08 are currently pure Remotion (SVG + typography + springs).
They already look finished and the trailer is complete without touching them further.
If Higgsfield is connected later and you want AI-generated motion graphics instead,
the prompts for each are in `../SCRIPT.md`. Generate the clip, save it under
`public/clips/`, and swap the shot's pure-Remotion visual for an `<OffthreadVideo>` —
the caption/typography layer in each shot component stays as-is either way, since text
accuracy should never depend on what a generative model rendered.

## Design tokens

`src/theme.ts` mirrors `web/src/index.css` — colors and fonts are copy-pasted from the
live app, not reinvented, so the trailer and the product read as one thing. If the
app's palette changes, update this file too.
