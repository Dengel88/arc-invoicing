import React from 'react'
import {AbsoluteFill} from 'remotion'
import {color} from '../theme'
import {MediaOrPlaceholder} from '../components/MediaOrPlaceholder'
import {Caption} from '../components/Caption'

/** Seconds into the demo take where issuing begins. Adjust once the real file exists. */
const TRIM_ISSUE_SECONDS = 0

export function Shot04Issue() {
  return (
    <AbsoluteFill style={{backgroundColor: color.canvas}}>
      <AbsoluteFill style={{padding: '60px 220px'}}>
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 40px 100px rgba(0,0,0,0.55)',
          }}
        >
          <MediaOrPlaceholder
            assetKey="demo-take"
            trimFrom={TRIM_ISSUE_SECONDS}
            placeholderNote="Screen recording: issuing the invoice"
          />
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{alignItems: 'flex-start', justifyContent: 'flex-end', paddingLeft: 230, paddingBottom: 40}}
      >
        <Caption from={40} size={26} mono color={color.brand} align="left">
          createInvoice() — one call
        </Caption>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
