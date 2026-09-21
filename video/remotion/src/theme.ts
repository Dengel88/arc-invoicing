/**
 * Design tokens mirrored 1:1 from web/src/index.css, so the trailer and the live app
 * read as the same product rather than a video that merely references it. If the
 * app's palette changes, update this file to match — don't let the two drift.
 */
export const color = {
  canvas: '#0a0e17',
  surface: '#111725',
  raised: '#161d2e',
  line: '#232c40',
  lineStrong: '#33405c',

  ink: '#f6f8fc',
  muted: '#9aa6bd',
  faint: '#717e96',

  brand: '#f59e0b',
  brandHi: '#fbbf24',
  onBrand: '#1a1204',

  paid: '#34d399',
  paidBg: '#052e26',
  pending: '#fbbf24',
  pendingBg: '#3a2006',
  danger: '#fca5a5',
} as const

export const font = {
  sans: 'IBM Plex Sans',
  mono: 'IBM Plex Mono',
} as const

/** Pillar copy — kept verbatim from web/src/App.tsx PILLARS so shot 06 never drifts
 *  from what the product actually says about itself. */
export const PILLARS = [
  {
    title: 'USDC is the gas',
    body: 'The invoiced asset and the fee asset are the same token. No second asset to hold, no bridge to cross before you can pay.',
  },
  {
    title: 'Settled on inclusion',
    body: "Arc finalises on inclusion, so a paid invoice is a settled invoice — not one waiting out twelve confirmations.",
  },
  {
    title: 'No approval step',
    body: 'Payment is a native value transfer, so there is no ERC-20 approve transaction to sign, fund and explain first.',
  },
] as const

export const FPS = 30
export const WIDTH = 1920
export const HEIGHT = 1080
