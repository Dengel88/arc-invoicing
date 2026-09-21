import React from 'react'
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion'
import {color} from '../theme'
import {monoFont} from '../fonts'

const LINES = ['46 tests', '5 invariants', '100% coverage', '10/10 mutants caught']

/**
 * Deliberately terminal-styled, not a marketing stat card — this beat's whole job is
 * to read as "a real test run happened," which a slick animated counter would
 * undercut. Snappy: each line lands in ~6 frames, the whole thing is done well before
 * the shot ends.
 */
export function Shot07Proof() {
  const frame = useCurrentFrame()
  const {fps} = useVideoConfig()

  return (
    <AbsoluteFill
      style={{
        backgroundColor: color.canvas,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          fontFamily: monoFont,
          fontSize: 34,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {LINES.map((line, i) => {
          const delay = i * 10
          const local = frame - delay
          const opacity = interpolate(local, [0, 6], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
          const x = interpolate(local, [0, 8], [-16, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
          const checkScale = spring({
            frame: local - 4,
            fps,
            config: {damping: 10, stiffness: 260},
          })

          return (
            <div
              key={line}
              style={{
                opacity,
                transform: `translateX(${x}px)`,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  transform: `scale(${Math.max(checkScale, 0)})`,
                  color: color.paid,
                  fontWeight: 700,
                }}
              >
                ✓
              </span>
              <span style={{color: color.ink}}>{line}</span>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}
