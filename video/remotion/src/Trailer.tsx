import React from 'react'
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion'
import {color} from './theme'
import {shotStart, shotDuration} from './timing'
import {Shot01ColdOpen} from './shots/Shot01ColdOpen'
import {Shot02Problem} from './shots/Shot02Problem'
import {Shot03Turn} from './shots/Shot03Turn'
import {Shot04Issue} from './shots/Shot04Issue'
import {Shot05Pay} from './shots/Shot05Pay'
import {Shot06WhyArc} from './shots/Shot06WhyArc'
import {Shot07Proof} from './shots/Shot07Proof'
import {Shot08Close} from './shots/Shot08Close'

/**
 * Voiceover and music are wired but OFF by default, so the project renders cleanly
 * with zero missing-asset errors before those files exist. Drop a recording at
 * public/audio/voiceover.mp3 (lines are in video/SCRIPT.md) and a track at
 * public/audio/music.mp3, then flip these two flags.
 */
const HAS_VOICEOVER = false
const HAS_MUSIC = false

export function Trailer() {
  return (
    <AbsoluteFill style={{backgroundColor: color.canvas}}>
      <Sequence from={shotStart('cold-open')} durationInFrames={shotDuration('cold-open')}>
        <Shot01ColdOpen />
      </Sequence>

      <Sequence from={shotStart('problem')} durationInFrames={shotDuration('problem')}>
        <Shot02Problem />
      </Sequence>

      <Sequence from={shotStart('turn')} durationInFrames={shotDuration('turn')}>
        <Shot03Turn />
      </Sequence>

      <Sequence from={shotStart('issue')} durationInFrames={shotDuration('issue')}>
        <Shot04Issue />
      </Sequence>

      <Sequence from={shotStart('pay')} durationInFrames={shotDuration('pay')}>
        <Shot05Pay />
      </Sequence>

      <Sequence from={shotStart('why-arc')} durationInFrames={shotDuration('why-arc')}>
        <Shot06WhyArc />
      </Sequence>

      <Sequence from={shotStart('proof')} durationInFrames={shotDuration('proof')}>
        <Shot07Proof />
      </Sequence>

      <Sequence from={shotStart('close')} durationInFrames={shotDuration('close')}>
        <Shot08Close />
      </Sequence>

      {/* Gated by a flag rather than deleted, so turning audio on later is a one-line
          edit once the file exists — Remotion 404s on a referenced-but-missing
          asset, so these must stay off until the recordings actually land. */}
      {HAS_VOICEOVER && <Audio src={staticFile('audio/voiceover.mp3')} />}
      {HAS_MUSIC && <Audio src={staticFile('audio/music.mp3')} volume={0.35} />}
    </AbsoluteFill>
  )
}
