import React from 'react'
import {Fuel, ShieldCheck, Zap} from 'lucide-react'
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion'
import {color, PILLARS} from '../theme'
import {sansFont} from '../fonts'

const ICONS = [Fuel, Zap, ShieldCheck]

/** Same three cards, same copy, as web/src/App.tsx PILLARS — reused verbatim rather
 *  than re-written for video, so the pitch never drifts from what the product itself
 *  says. */
export function Shot06WhyArc() {
  const frame = useCurrentFrame()
  const {fps} = useVideoConfig()

  return (
    <AbsoluteFill
      style={{
        backgroundColor: color.canvas,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 36,
        padding: '0 90px',
      }}
    >
      {PILLARS.map((pillar, i) => {
        const Icon = ICONS[i]
        const delay = i * 12
        const enter = spring({
          frame: frame - delay,
          fps,
          config: {damping: 16, stiffness: 140},
        })
        const opacity = interpolate(frame - delay, [0, 12], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })

        return (
          <div
            key={pillar.title}
            style={{
              flex: 1,
              maxWidth: 460,
              backgroundColor: color.surface,
              border: `1px solid ${color.line}`,
              borderRadius: 20,
              padding: 36,
              opacity,
              transform: `translateY(${(1 - Math.max(enter, 0)) * 30}px)`,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                backgroundColor: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <Icon color={color.brand} size={26} />
            </div>
            <div
              style={{
                fontFamily: sansFont,
                fontWeight: 600,
                fontSize: 26,
                color: color.ink,
                marginBottom: 10,
              }}
            >
              {pillar.title}
            </div>
            <div
              style={{
                fontFamily: sansFont,
                fontWeight: 400,
                fontSize: 18,
                lineHeight: 1.5,
                color: color.muted,
              }}
            >
              {pillar.body}
            </div>
          </div>
        )
      })}
    </AbsoluteFill>
  )
}
