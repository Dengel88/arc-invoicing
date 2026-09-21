/**
 * Same two families the live app uses (web/src/index.css), loaded the Remotion way —
 * self-hosted at render time rather than a runtime Google Fonts <link>, so rendering
 * never depends on network access and every frame is reproducible.
 */
import {loadFont as loadSans} from '@remotion/google-fonts/IBMPlexSans'
import {loadFont as loadMono} from '@remotion/google-fonts/IBMPlexMono'

// Restricted to the latin subset: the script is English-only, and the default of
// "every subset" turns four weights into ~24 network requests per font.
const sans = loadSans('normal', {weights: ['400', '500', '600', '700'], subsets: ['latin']})
const mono = loadMono('normal', {weights: ['400', '500', '600'], subsets: ['latin']})

export const sansFont = sans.fontFamily
export const monoFont = mono.fontFamily

export function waitForFonts(): Promise<unknown> {
  return Promise.all([sans.waitUntilDone(), mono.waitUntilDone()])
}
