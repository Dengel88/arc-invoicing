# Recording the demo (one continuous take)

This is the one part that cannot be generated or delegated: a real signature in a real
wallet, paying a real invoice on Arc mainnet. Everything else in the trailer (shots 01,
02, 03, 06, 08) is already built in Remotion and needs no recording.

**Record it as a single unbroken take.** Issue the invoice, switch wallets, pay it — no
stopping, no re-takes stitched together. The wallet switch is part of what makes it
believable, and a cut at exactly that moment would look like something was hidden. The
Remotion project windows into different parts of the same file for shots 04 and 05, so
one file is all that's needed.

## Before you start

- **Do step 6а of MORNING.md first** — seed the ledger with the four states. On the
  recording, the right-hand column will then show a working product with history
  instead of an almost-empty demo.
- Two wallets in Rabby: **A** (issues) and **B** (pays), both funded on Arc.
- Live app open: `https://arc-invoicing-iota.vercel.app`, **Wallet A connected**.
- Browser window at **1440×900**.
- **Windows Snipping Tool (Ножницы) is the right recorder here** — and not just because
  it is already installed. It captures a screen *region*, so the Rabby confirmation
  popup gets recorded no matter which window it belongs to. Xbox Game Bar records a
  single window, and the extension popup is a separate one, so it can silently miss the
  most important frames of the whole demo. OBS is better still if you already have it,
  but it is not worth installing for this.
- **30fps is fine.** An earlier version of this file asked for 60 — that was
  over-specified: the trailer itself renders at 30fps, so extra source frames are
  discarded anyway.
- **Pre-fill the long fields before hitting Record.** Paste Wallet B's address into
  **Bill to** and type the **Reference** in advance. Nobody needs to watch a 40-character
  hex address being pasted, and the footage gets trimmed anyway. Leave the **Amount**
  empty and type it on camera — three characters, but seeing a number entered by hand is
  what makes the take read as live rather than staged.
- **One full dry run without recording.** The wallet switch is the only fiddly part;
  get the Rabby account-switcher muscle memory down before the take that counts.

## The take (~30 seconds of usable footage)

Values, chosen so they don't collide with the invoices seeded in step 6а:

| Field | Value |
|---|---|
| Bill to | Wallet B's address |
| Amount | `0.5` |
| Reference | `INV-2026-005 · Q4 brand system, milestone 1` |

1. Start on the app, Wallet A connected, invoice list visible on the right, **Bill to**
   and **Reference** already filled in from the prep above.
2. Click **Amount** and **type** `0.5` — type it, don't paste.
3. Pause ~1s on the filled form, then click **Issue invoice**.
6. Let the Rabby popup sit on screen ~1.5s before confirming — don't rush it, the
   viewer needs to register that this is a real wallet.
7. Hold ~1s on the new **Pending** card.
8. Open Rabby and switch the active account to **Wallet B**. Keep this in frame.
9. Let the page notice the change and show the **Pay 0.50** button.
10. Click **Pay**. Let the Rabby confirmation sit ~2s — **this is the shot**: one
    signature, no `approve` before it. Confirm.
11. **Hold for a full 2 seconds** after the badge flips Pending → Paid. Do not cut
    early; a caption lands right on this beat and needs room.
12. *(Optional tail — keep rolling.)* Switch Rabby back to **Wallet A** and let the page
    reload its view. This is not needed for the story: the status already flipped on
    screen in step 11, and that is the beat the trailer captions. But it costs nothing
    while the recorder is still running, and it gives the edit the option of ending on
    the creditor's side. Record it, and it may or may not make the cut.
13. Stop recording.

## After recording

1. Trim only the dead air at the very start and end. Leave the middle intact.
2. Export MP4, H.264, no audio track needed.
3. Save as `video/remotion/public/captures/demo-take.mp4`
4. Note the timestamp (in seconds) where **step 8 begins** — the wallet switch.
5. Two edits in the Remotion project:
   - `src/components/MediaOrPlaceholder.tsx` → `ready: false` becomes `ready: true`
   - `src/shots/Shot05Pay.tsx` → set `TRIM_PAY_SECONDS` to that timestamp
6. Check a still before a full render:

```powershell
cd D:\AI\Kwork\ARcHakaton\video\remotion
npx remotion still src/index.ts ArcInvoicingTrailer out/check.png --frame=900
```

## The README GIF comes from this same take

No second recording. The GIF is a ~15–20s window of this file — roughly step 5 through
step 11, the part where the invoice is issued and then paid — scaled down, no audio,
looping. It goes at the top of the README, above the fold. Hand over the file and that
gets cut from it.
