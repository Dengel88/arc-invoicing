import React, {useEffect} from 'react'
import {Composition, continueRender, delayRender} from 'remotion'
import {FPS, WIDTH, HEIGHT} from './theme'
import {TOTAL_DURATION} from './timing'
import {waitForFonts} from './fonts'
import {Trailer} from './Trailer'

/** Blocks the first frame until IBM Plex Sans/Mono are actually loaded, so neither
 *  the Studio preview nor a render can show a frame in the wrong fallback font. */
function FontGate({children}: {children: React.ReactNode}) {
  const [handle] = React.useState(() => delayRender('Loading fonts'))

  useEffect(() => {
    waitForFonts()
      .then(() => continueRender(handle))
      .catch((err) => {
        console.error('Font loading failed', err)
        continueRender(handle)
      })
  }, [handle])

  return <>{children}</>
}

export function RemotionRoot() {
  return (
    <FontGate>
      <Composition
        id="ArcInvoicingTrailer"
        component={Trailer}
        durationInFrames={TOTAL_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </FontGate>
  )
}
