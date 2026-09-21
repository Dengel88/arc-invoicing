# Recording shots 04–05 (the real screen capture)

These two shots are **not** generated — a real signature in a real wallet, paying a
real invoice on Arc mainnet, is more convincing than any AI render of a UI, and it's
the one part of the trailer that has to be exactly correct. Everything else (shots 01,
02, 03, 06, 08) is already built in pure Remotion/SVG and needs no recording at all.

## Before you start

- Two wallets ready in Rabby: **A** (issues the invoice) and **B** (pays it), both
  holding a little USDC on Arc. Reuse the same two wallets from the mainnet demo — the
  balances don't need to be large, the deploy/demo already proved the flow works.
- The live app open: `https://arc-invoicing-iota.vercel.app`
- Browser window resized to a clean **1440×900** (matches the shot's crop). On Windows,
  snap the window or use a browser dev-tools device-size override.
- Screen recorder at **60fps** if your tool supports it — the freeze-frame in shot 05
  needs the extra frames to land cleanly on the exact moment the badge turns green.
- **Do one full dry run without recording first.** The two-wallet switch in shot 05 is
  the one part worth rehearsing — get the Rabby account-switcher muscle memory down
  before the take that matters.

## Shot 04 — Issue (target: ~12s of usable footage, trimmed to 10s)

1. Start on the app with **Wallet A** already connected.
2. Click into the **Bill to** field, paste Wallet B's address.
3. Click **Amount**, type `0.5` — type it naturally, don't paste, the keystrokes read
   as more authentic.
4. Click **Reference**, type `INV-2026-014 · Q3 design retainer`.
5. Pause ~1s so the filled form is readable, then click **Issue invoice**.
6. Let the Rabby confirmation popup appear and stay on screen ~1.5s before clicking
   confirm — don't rush through it, the trailer wants the viewer to register "this is
   a real wallet."
7. Hold ~1s on the ledger with the new **Pending** card visible.

## Shot 05 — Pay (target: ~14s of usable footage, trimmed to 11s)

1. Continue from shot 04, or start fresh with Wallet A connected and the Pending
   invoice already visible.
2. Open Rabby, switch the active account to **Wallet B** — keep this visible, it's a
   good authentic beat, don't cut around it.
3. Let the page notice the account change and show the **Pay 0.50** button.
4. Click **Pay**, let the Rabby confirmation sit on screen ~1.5s, confirm.
5. **This is the shot's one essential frame:** hold on the card for a full 2 seconds
   after the badge flips from Pending (amber) to Paid (green). Don't cut away early —
   Shot05Pay.tsx freezes a caption ("1 signature. No approve().") right on this beat,
   so the source footage needs real breathing room here, not a quick flash.

## After recording

1. Trim each clip to roughly the target length above — a few seconds of slack is fine,
   `MediaOrPlaceholder` in the Remotion project will crop/cover to fill the frame.
2. Export as MP4, H.264, no audio track needed (the trailer's own audio track, if any,
   plays underneath).
3. Save as:
   - `video/remotion/public/captures/issue-invoice.mp4`
   - `video/remotion/public/captures/pay-invoice.mp4`
4. In `video/remotion/src/components/MediaOrPlaceholder.tsx`, flip `ready: false` to
   `ready: true` for each asset in the `ASSETS` map. That's the only code change
   needed — the placeholder disappears and the real footage takes its place.
5. Re-render a still at that shot's frame to confirm it looks right before doing a
   full render (see `video/remotion/README.md` for the exact commands).
