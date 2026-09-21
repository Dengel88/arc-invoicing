import React from 'react'
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion'
import {color} from '../theme'
import {WorldArc, type FeeNode} from '../components/WorldArc'
import {Caption} from '../components/Caption'

const FEE_NODES: FeeNode[] = [
  {t: 0.15, label: '-1.2%'},
  {t: 0.38, label: '-0.8%'},
  {t: 0.62, label: '-1.5%'},
  {t: 0.85, label: '-1.1%'},
]

export function Shot02Problem() {
  const frame = useCurrentFrame()

  const progress = interpolate(frame, [0, 200], [0.55, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill style={{backgroundColor: color.canvas}}>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingTop: 30}}>
        <WorldArc progress={progress} lit={false} feeNodes={FEE_NODES} />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: 80,
          gap: 14,
        }}
      >
        <Caption from={5} size={34} mono color={color.danger}>
          2–5 days
        </Caption>
        <Caption from={55} size={34} mono color={color.danger}>
          3–6% lost to fees
        </Caption>
        <Caption from={105} size={34} mono color={color.muted}>
          no visibility, either side
        </Caption>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
