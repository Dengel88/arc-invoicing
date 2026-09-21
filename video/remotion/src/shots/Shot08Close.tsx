import React from 'react'
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion'
import {color} from '../theme'
import {sansFont, monoFont} from '../fonts'
import {LogoMark} from '../components/LogoMark'

const CONTRACT_ADDRESS = '0x4AC461f079E9dd4f49f4d8254e4e0cA79b2102BA'
const LIVE_URL = 'arc-invoicing-iota.vercel.app'

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function Shot08Close() {
  const frame = useCurrentFrame()
  const {fps, durationInFrames} = useVideoConfig()

  const logoIn = spring({frame, fps, config: {damping: 16, stiffness: 150}})
  const textOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const footerOpacity = interpolate(frame, [45, 65], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Fade to black over the last half-second, per the script's "hold 0.5s" beat.
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames],
    [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  )

  return (
    <AbsoluteFill style={{backgroundColor: color.canvas}}>
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          gap: 22,
        }}
      >
        <div
          style={{
            transform: `scale(${Math.max(logoIn, 0)})`,
            opacity: Math.max(logoIn, 0),
          }}
        >
          <LogoMark size={100} />
        </div>
        <div
          style={{
            opacity: textOpacity,
            fontFamily: sansFont,
            fontWeight: 700,
            fontSize: 48,
            letterSpacing: -1,
            color: color.ink,
          }}
        >
          Arc Invoicing
        </div>
        <div
          style={{
            opacity: footerOpacity,
            fontFamily: monoFont,
            fontSize: 22,
            color: color.brand,
          }}
        >
          {LIVE_URL}
        </div>
        <div
          style={{
            opacity: footerOpacity,
            fontFamily: monoFont,
            fontSize: 16,
            color: color.faint,
          }}
        >
          {short(CONTRACT_ADDRESS)} · Arc mainnet
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{backgroundColor: '#000000', opacity: fadeOut}} />
    </AbsoluteFill>
  )
}
