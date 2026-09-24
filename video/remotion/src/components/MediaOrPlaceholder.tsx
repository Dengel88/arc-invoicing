import React from 'react'
import {AbsoluteFill, OffthreadVideo, staticFile} from 'remotion'
import {color} from '../theme'
import {sansFont, monoFont} from '../fonts'

/**
 * The trailer's external media, in one place. Exactly one boolean flips once the real
 * file lands in `public/`; nothing else in the project changes.
 *
 * This exists so `npm run start` / `npm run render` work before any recording exists —
 * every shot falls back to a clearly labelled placeholder instead of Remotion throwing
 * a 404 on a missing file.
 *
 * Shots 04 and 05 deliberately share ONE source file. The demo is recorded as a single
 * continuous take — issue the invoice, switch wallets, pay it — because the wallet
 * switch is part of what makes it believable, and a cut there would look like
 * something was hidden. The two shots just window into different parts of that take
 * via `trimFrom`.
 */
export const ASSETS = {
  'demo-take': {
    ready: true,
    path: 'captures/demo-take.mp4',
    label: 'Screen recording: the demo take',
    howTo: 'See video/CAPTURE.md — one continuous take.',
  },
} as const

export type AssetKey = keyof typeof ASSETS

export function MediaOrPlaceholder({
  assetKey,
  /** Seconds into the source file where this shot should start. */
  trimFrom = 0,
  /** Shown on the placeholder so it is obvious which beat is missing. */
  placeholderNote,
}: {
  assetKey: AssetKey
  trimFrom?: number
  placeholderNote?: string
}) {
  const asset = ASSETS[assetKey]

  if (asset.ready) {
    return (
      <OffthreadVideo
        src={staticFile(asset.path)}
        trimBefore={Math.round(trimFrom * 30)}
        // The file is stored without an audio track, but mute anyway: a raw screen
        // recording can carry system sounds, and the trailer has its own soundtrack.
        muted
        style={{width: '100%', height: '100%', objectFit: 'contain'}}
      />
    )
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: color.surface,
        border: `2px dashed ${color.lineStrong}`,
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 40,
      }}
    >
      <div
        style={{
          fontFamily: sansFont,
          fontWeight: 600,
          fontSize: 28,
          color: color.muted,
          textAlign: 'center',
        }}
      >
        {placeholderNote ?? asset.label}
      </div>
      <div
        style={{
          fontFamily: monoFont,
          fontSize: 18,
          color: color.faint,
          textAlign: 'center',
        }}
      >
        {asset.howTo}
      </div>
    </AbsoluteFill>
  )
}
