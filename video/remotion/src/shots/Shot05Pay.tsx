import React from 'react'
import {AbsoluteFill} from 'remotion'
import {color} from '../theme'
import {MediaOrPlaceholder} from '../components/MediaOrPlaceholder'
import {DemoFrame} from '../components/DemoFrame'
import {Caption} from '../components/Caption'

/**
 * Seconds into the demo take where this shot starts: 22.6s, already switched to the
 * payer's wallet.
 *
 * The wallet switch itself is deliberately NOT in the trailer. Rabby's account switcher
 * is open from 15.37s to 22.50s and again from 33.27s (measured frame by frame on the
 * popup's white area), and it lists other wallet addresses belonging to the same
 * person — publishing those links them together publicly. So this shot is bounded to
 * 22.6-33.07s, the clean window between the two, with a few frames of margin each side.
 * The header of the page shows the payer's address, which is what makes the switch
 * legible without showing the switcher.
 */
const TRIM_PAY_SECONDS = 22.6

/**
 * Frame (within this shot) where the caption lands: ~30.7s into the take, the moment
 * the badge flips from Pending to Paid and the "Invoice #6 paid" toast appears.
 */
const CAPTION_FRAME = 245

export function Shot05Pay() {
  return (
    <AbsoluteFill>
      <DemoFrame>
        <MediaOrPlaceholder
          assetKey="demo-take"
          trimFrom={TRIM_PAY_SECONDS}
          placeholderNote="Screen recording: paying the invoice"
        />
      </DemoFrame>

      {/* The single most important beat in the trailer: the badge flipping to Paid is
          where the "no approve() step" pitch becomes visible rather than claimed. */}
      <AbsoluteFill
        style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 46}}
      >
        <Caption from={CAPTION_FRAME} size={30} mono color={color.paid}>
          1 signature. No approve().
        </Caption>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
