import React from 'react'
import {color} from '../theme'

/**
 * The exact mark from web/public/favicon.svg, scaled up. Same shape, same two colors
 * — so the closing card and the browser tab the viewer might open next read as the
 * same brand.
 */
export function LogoMark({size = 120}: {size?: number}) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect width="32" height="32" rx="8" fill={color.brand} />
      <path
        d="M10 8.5h12v15.2l-3-2.1-3 2.1-3-2.1-3 2.1V8.5Z"
        fill="none"
        stroke={color.onBrand}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d="M13 13h6M13 17h4"
        stroke={color.onBrand}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  )
}
