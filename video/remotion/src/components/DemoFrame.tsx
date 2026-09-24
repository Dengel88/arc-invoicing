import React from 'react'
import {AbsoluteFill} from 'remotion'
import {color} from '../theme'

/** Native size of the recorded take (video/remotion/public/captures/demo-take.mp4). */
export const TAKE_WIDTH = 1912
export const TAKE_HEIGHT = 1000

/** Rendered width of the recording inside the 1920x1080 frame. Height follows from the
 *  aspect ratio, so the recording is never cropped — the form sits at its left edge and
 *  the invoice list at its right, and a crop from either side would cut one of them. */
const FRAME_WIDTH = 1640
const FRAME_HEIGHT = Math.round((FRAME_WIDTH * TAKE_HEIGHT) / TAKE_WIDTH)

/**
 * The window both demo shots (04, 05) play the screen recording in: centred, rounded,
 * with a soft shadow, and leaving a strip at the bottom for the shot's caption.
 */
export function DemoFrame({children}: {children: React.ReactNode}) {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: color.canvas,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 44,
      }}
    >
      <div
        style={{
          width: FRAME_WIDTH,
          height: FRAME_HEIGHT,
          borderRadius: 18,
          overflow: 'hidden',
          position: 'relative',
          border: `1px solid ${color.line}`,
          boxShadow: '0 40px 100px rgba(0,0,0,0.55)',
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  )
}
