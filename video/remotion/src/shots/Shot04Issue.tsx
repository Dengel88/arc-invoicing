import React from 'react'
import {AbsoluteFill} from 'remotion'
import {color} from '../theme'
import {MediaOrPlaceholder} from '../components/MediaOrPlaceholder'
import {DemoFrame} from '../components/DemoFrame'
import {Caption} from '../components/Caption'

/**
 * Seconds into the demo take where this shot starts. 0.0-10.5s of the recording:
 * wallet A fills the form, confirms createInvoice in Rabby, and the "Invoice issued"
 * toast lands.
 */
const TRIM_ISSUE_SECONDS = 0

export function Shot04Issue() {
  return (
    <AbsoluteFill>
      <DemoFrame>
        <MediaOrPlaceholder
          assetKey="demo-take"
          trimFrom={TRIM_ISSUE_SECONDS}
          placeholderNote="Screen recording: issuing the invoice"
        />
      </DemoFrame>

      <AbsoluteFill
        style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 46}}
      >
        <Caption from={40} size={28} mono color={color.brand}>
          createInvoice() — one call
        </Caption>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
