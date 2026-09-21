import React from 'react'
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion'
import {color} from '../theme'
import {sansFont} from '../fonts'
import {WorldArc} from '../components/WorldArc'
import {LogoMark} from '../components/LogoMark'

/** The payoff of shots 01–02: the unlit line snaps to a full, glowing, solid amber
 *  arc in well under a second, then dissolves into the wordmark. This is the shot the
 *  whole cold open was building toward — the "turn" — so the snap needs to feel
 *  sudden, not eased in gently. */
export function Shot03Turn() {
  const frame = useCurrentFrame()
  const {fps} = useVideoConfig()

  // A fast spring: high damping-adjacent stiffness reads as a "snap", not a glide.
  const ignite = spring({frame, fps, config: {damping: 12, stiffness: 220, mass: 0.6}})
  const lit = ignite > 0.15

  const mapOpacity = interpolate(frame, [55, 80], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const logoIn = spring({
    frame: frame - 60,
    fps,
    config: {damping: 14, stiffness: 160},
  })
  const wordmarkOpacity = interpolate(frame, [78, 100], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill style={{backgroundColor: color.canvas}}>
      <AbsoluteFill
        style={{alignItems: 'center', justifyContent: 'center', opacity: mapOpacity}}
      >
        <WorldArc progress={ignite} lit={lit} glow={lit} />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          opacity: frame > 60 ? 1 : 0,
        }}
      >
        <div
          style={{
            transform: `scale(${Math.max(logoIn, 0)})`,
            opacity: Math.max(logoIn, 0),
          }}
        >
          <LogoMark size={110} />
        </div>
        <div
          style={{
            opacity: wordmarkOpacity,
            fontFamily: sansFont,
            fontWeight: 700,
            fontSize: 56,
            letterSpacing: -1,
            color: color.ink,
          }}
        >
          Arc Invoicing
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
