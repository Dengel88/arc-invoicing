import React from 'react'
import {interpolate, useCurrentFrame} from 'remotion'
import {color} from '../theme'
import {sansFont, monoFont} from '../fonts'

/**
 * A caption that rises in and settles — the same `animate-rise` motion the live app
 * uses on its cards (web/src/index.css), so the video's motion language matches the
 * product's own.
 */
export function Caption({
  children,
  from = 0,
  size = 42,
  mono = false,
  color: textColor = color.ink,
  align = 'center',
}: {
  children: React.ReactNode
  from?: number
  size?: number
  mono?: boolean
  color?: string
  align?: 'center' | 'left'
}) {
  const frame = useCurrentFrame()
  const local = frame - from
  const opacity = interpolate(local, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const y = interpolate(local, [0, 15], [14, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  if (local < 0) return null

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px)`,
        fontFamily: mono ? monoFont : sansFont,
        fontSize: size,
        fontWeight: mono ? 500 : 600,
        color: textColor,
        textAlign: align,
        letterSpacing: mono ? 0 : -0.5,
        lineHeight: 1.3,
      }}
    >
      {children}
    </div>
  )
}
