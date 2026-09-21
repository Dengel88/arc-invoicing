import React from 'react'
import {AbsoluteFill, OffthreadVideo, staticFile} from 'remotion'
import {color} from '../theme'
import {sansFont, monoFont} from '../fonts'

/**
 * Central registry of every external asset the trailer references — screen
 * recordings and (optionally) Higgsfield-generated clips. Exactly one boolean flips
 * per asset once the real file lands in `public/`; nothing else in the project
 * changes.
 *
 * This exists so `npm run start` / `npm run render` work today, before a single
 * recording or generated clip exists — every shot falls back to a clearly labelled
 * placeholder instead of Remotion throwing a 404 on a missing file.
 */
export const ASSETS = {
  'issue-invoice': {
    ready: false,
    path: 'captures/issue-invoice.mp4',
    label: 'Screen recording: issue invoice',
    howTo: 'See video/CAPTURE.md — record shot 04.',
  },
  'pay-invoice': {
    ready: false,
    path: 'captures/pay-invoice.mp4',
    label: 'Screen recording: pay invoice',
    howTo: 'See video/CAPTURE.md — record shot 05.',
  },
} as const

export type AssetKey = keyof typeof ASSETS

export function MediaOrPlaceholder({assetKey}: {assetKey: AssetKey}) {
  const asset = ASSETS[assetKey]

  if (asset.ready) {
    return (
      <OffthreadVideo
        src={staticFile(asset.path)}
        style={{width: '100%', height: '100%', objectFit: 'cover'}}
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
        {asset.label}
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
