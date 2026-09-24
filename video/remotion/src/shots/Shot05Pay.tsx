import React from 'react'
import {AbsoluteFill} from 'remotion'
import {color} from '../theme'
import {MediaOrPlaceholder} from '../components/MediaOrPlaceholder'
import {Caption} from '../components/Caption'

/**
 * Seconds into the demo take where the payment beat begins — i.e. just before
 * switching wallets. Set this to the real timestamp once the take is recorded.
 */
const TRIM_PAY_SECONDS = 12

export function Shot05Pay() {
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
            trimFrom={TRIM_PAY_SECONDS}
            placeholderNote="Screen recording: paying the invoice"
          />
        </div>
      </AbsoluteFill>

      {/*
        The single most important beat in the trailer: the moment the badge flips to
        Paid is the moment the whole "no approve() step" pitch becomes visible, not
        just claimed. Give the caption room — it should land near the end of the shot,
        after the real payment confirmation has had time to register.
      */}
      <AbsoluteFill
        style={{alignItems: 'flex-start', justifyContent: 'flex-end', paddingLeft: 230, paddingBottom: 40}}
      >
        <Caption from={230} size={30} mono color={color.paid} align="left">
          1 signature. No approve().
        </Caption>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
