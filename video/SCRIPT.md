# Arc Invoicing — trailer script

Target length: **55–65 seconds**. Reference pacing: NeuroclipStudio promo (1:51,
product-trailer style) — this is shorter because the product itself is one focused
action (issue → pay), not a multi-feature tool.

Two tracks per shot: **Higgsfield prompt** (what to generate) and **Remotion layer**
(what gets composited on top — captions, UI screen-recordings, motion graphics). The
screen-recording shots use the actual live app, not a generated mockup — a real
signature in a real wallet is more convincing than any AI render of a UI, and we have
one sitting on mainnet already (invoice #1, `INV-2026-001`).

Voiceover is written to be readable at a calm, confident pace — NOT hyped crypto-bro
delivery. This product's whole pitch is "boring and it just works," so the read should
match: a systems engineer explaining something they're proud of, not a launch-trailer
narrator.

---

## Shot list

### 01 — Cold open (0:00–0:04)

**VO:** "A freelancer in Lisbon. A client in Singapore."

**On screen:** Two pins on a dark world map, a thin arc connecting them — not yet lit.

**Higgsfield prompt:**
> Minimal dark UI animation, world map in deep navy with a single glowing amber dot in
> Lisbon and a single glowing amber dot in Singapore, thin unlit dashed arc between
> them, cinematic, no text, 4s, subtle camera drift, product-trailer style, Swiss
> minimalist aesthetic, black background #0a0e17

**Remotion layer:** none yet — pure generated clip, full bleed.

---

### 02 — The problem (0:04–0:12)

**VO:** "Today, that invoice takes days. Loses money to fees on the way. And neither
side can see where it is."

**On screen:** The arc from shot 1, but now shown crawling through 3–4 intermediate
bank-icon nodes, each with a small red "$-3%" tag, a clock ticking up: 1 day → 3 days →
5 days.

**Higgsfield prompt:**
> Same dark navy world-map scene, now show a payment path crossing through 4
> intermediate glowing red nodes labeled with small fee-deduction tags, a subtle
> clock/timer overlay counting days, tense but minimal motion graphics, 8s, dark
> fintech aesthetic, muted red accents on navy background, no readable text needed
> just abstract tags

**Remotion layer:** `<Sequence>` overlays the real numbers as crisp typeset captions
(Higgsfield text in-frame is unreliable — always re-set text in Remotion):
`"2–5 days"` `"3–6% lost to fees"` `"no visibility"` — IBM Plex Mono, fades in staggered.

---

### 03 — The turn (0:12–0:17)

**VO:** "On Arc, it's one transaction."

**On screen:** Hard cut. The dashed arc snaps straight and lights up amber instantly,
end to end. Logo mark forms from the same line.

**Higgsfield prompt:**
> Same world map, but now the arc between the two dots instantly ignites into a solid
> bright amber line end-to-end in under 1 second, energetic snap transition, particle
> trail along the line, then the line folds into a minimal geometric invoice/document
> icon mark, dark background, premium motion graphics, 5s

**Remotion layer:** Logo lockup fades in under the mark: **"Arc Invoicing"** in IBM Plex
Sans, tight tracking.

---

### 04 — Product demo: issue (0:17–0:27)

**VO:** "Issue an invoice. Address it to a wallet. Done."

**On screen:** **Real screen recording**, not generated — this is the live app on
Vercel. Capture at 1440×900, cursor visible:
1. Land on `arc-invoicing-iota.vercel.app`, wallet already connected (Wallet A)
2. Fill the New Invoice form: paste Wallet B's address, type `0.5`, type
   `INV-2026-014 · Q3 design retainer`
3. Click **Issue invoice**
4. Rabby popup appears, confirm
5. Card lands in the ledger, status **Pending** (amber, pulsing dot)

**Higgsfield prompt:** none — real capture.

**Remotion layer:** Screen recording placed in a subtle rounded-frame "browser chrome"
(no OS chrome, just the page — keep it clean). Light vignette. Small caption
lower-third: `"createInvoice() — one call"`.

---

### 05 — Product demo: pay (0:27–0:38)

**VO:** "The payer settles it. No approval step first — on Arc, USDC *is* the gas, so
the payment and the signature are the same transaction."

**On screen:** **Real screen recording**, continuous or a clean cut:
1. Switch wallet to B in Rabby (show the extension switch, it's a good authentic beat)
2. Page updates, **Pay 0.50** button now visible on the card
3. Click it, Rabby confirms — **this is the one signature, make it linger ~1s**
4. Status flips **Pending → Paid**, badge turns green, subtle success pulse

**Higgsfield prompt:** none — real capture.

**Remotion layer:** On the exact frame the badge flips to green, freeze 300ms and
stamp a caption: `"1 signature. No approve()."` — this is the single most important
beat in the whole video, give it room to breathe.

---

### 06 — Why Arc (0:38–0:50)

**VO:** "Native USDC gas. Finality on inclusion. One balance, not two assets."

**On screen:** Three-panel split reveal, matching the app's own "pillar" cards
(USDC is the gas / Settled on inclusion / No approval step) — literally reuse the same
copy and icons the app already has, for brand consistency.

**Higgsfield prompt:**
> Three minimal icon cards animating in left-to-right with a staggered slide-fade, dark
> navy background, amber accent icons — a fuel/gas pump icon, a lightning bolt icon, a
> shield-check icon — clean geometric line-icon style matching Phosphor/Lucide icon
> language, Swiss minimalist, 6s, no text needed on the cards

**Remotion layer:** Re-set the exact headline text under each icon (pull verbatim from
`web/src/App.tsx` PILLARS array, so copy never drifts from the product):
`"USDC is the gas"` `"Settled on inclusion"` `"No approval step"`.

---

### 07 — Proof, not vibes (0:50–0:56)

**VO:** "Forty-six tests. Five invariants. A published security review."

**On screen:** Fast typographic beat — numbers counting up, terminal-style monospace,
green checkmarks ticking in. This is the "engineering credibility" beat that separates
this project from a typical hackathon demo.

**Higgsfield prompt:** none — pure Remotion typography, no generated video needed here.
Numbers should feel like a terminal test run, not a marketing stat card.

**Remotion layer:** `spring()`-eased count-up animation:
`46 tests` → `5 invariants` → `100% coverage` → `10/10 mutants caught`, each with a
green `✓` that ticks in, IBM Plex Mono, left-aligned like real CLI output. ~1.5s total,
snappy — this beat must not drag.

---

### 08 — Close / CTA (0:56–1:02)

**VO:** "Arc Invoicing. Live on Arc mainnet."

**On screen:** Logo mark from shot 3 returns, centered, with the live URL beneath it
and the contract address in small monospace at the very bottom — same as the app's own
footer, for consistency.

**Higgsfield prompt:**
> Same amber geometric invoice mark from earlier, now centered and settled, calm
> ambient particle drift behind it on dark navy, premium closing card, 4s, minimal

**Remotion layer:**
```
Arc Invoicing
arc-invoicing-iota.vercel.app
0x4AC4…02BA · Arc mainnet
```
Fade to black, hold 0.5s.

---

## Music direction

Minimal, driving, not epic-trailer bombast — think a restrained synth pulse with a
tempo lift exactly at shot 03 (the "turn"), and a second, smaller lift at shot 05 (the
payment signature). No vocals. Reference mood: the kind of track that plays under a
fintech product launch, not a movie trailer.

## What NOT to generate with Higgsfield

Never generate the actual app UI, the wallet popup, or any on-screen text that needs to
be legible and accurate (numbers, addresses, code). AI video generation is unreliable
at rendering correct small text and exact UI chrome — anything the viewer needs to read
precisely goes through Remotion's own typography, or is a real screen capture. Higgsfield
is for the abstract motion-graphics beats (01, 02, 03, 06, 08) where there is nothing
that needs to be technically accurate, only evocative.

## Recording checklist for shots 04–05 (do this first — it unblocks everything else)

1. Open `https://arc-invoicing-iota.vercel.app` in a clean 1440×900 window
2. Have Wallet A connected and holding enough USDC for one more demo invoice
3. Have Wallet B ready to switch to in Rabby
4. Screen-record at 60fps if possible (smoother for the freeze-frame in shot 05)
5. Do a full dry run first without recording — the two-wallet-switch choreography is
   the one part worth rehearsing once before the take that matters
