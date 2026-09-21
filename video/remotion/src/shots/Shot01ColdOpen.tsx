import React from 'react'
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion'
import {color} from '../theme'
import {WorldArc} from '../components/WorldArc'
import {Caption} from '../components/Caption'

export function Shot01ColdOpen() {
  const frame = useCurrentFrame()

  // Line draws in slowly over the whole shot — deliberately incomplete by the end,
  // so shot 03's "snap to solid" reads as a payoff rather than a repeat.
  const progress = interpolate(frame, [10, 100], [0, 0.55], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill style={{backgroundColor: color.canvas}}>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <WorldArc progress={progress} lit={false} />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: 90,
        }}
      >
        <Caption from={15} size={40}>
          A freelancer in Lisbon. A client in Singapore.
        </Caption>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
