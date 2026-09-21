import React from 'react'
import {color} from '../theme'

/**
 * The shared visual thread across shots 01–03: two points (Lisbon, Singapore) and the
 * line between them. `progress` (0–1) draws the dashed/solid line; `lit` switches it
 * from unlit grey to glowing amber; `nodes` optionally renders intermediate
 * fee-deduction stops for shot 02.
 *
 * Kept as a single component so the geometry — dot positions, the curve — is defined
 * once and shots 01→02→03 read as the same map, not three different illustrations.
 */

const LISBON = {x: 260, y: 260}
const SINGAPORE = {x: 1020, y: 340}

// A gentle arc, not a straight line — reads as "a path across the globe" rather than
// a ruler.
const controlPoint = {x: 640, y: 120}

const pathD = `M ${LISBON.x} ${LISBON.y} Q ${controlPoint.x} ${controlPoint.y} ${SINGAPORE.x} ${SINGAPORE.y}`

function pointOnQuadratic(t: number) {
  const x =
    (1 - t) ** 2 * LISBON.x + 2 * (1 - t) * t * controlPoint.x + t ** 2 * SINGAPORE.x
  const y =
    (1 - t) ** 2 * LISBON.y + 2 * (1 - t) * t * controlPoint.y + t ** 2 * SINGAPORE.y
  return {x, y}
}

export type FeeNode = {t: number; label: string}

export function WorldArc({
  progress,
  lit,
  glow = false,
  feeNodes,
}: {
  /** 0–1: how much of the path is drawn. */
  progress: number
  /** Unlit grey vs. lit amber. */
  lit: boolean
  /** Extra outer glow, used for the shot-03 ignition beat. */
  glow?: boolean
  feeNodes?: FeeNode[]
}) {
  const lineColor = lit ? color.brand : color.lineStrong
  const pathLength = 1000 // arbitrary unit length; used with dash offset below

  return (
    <svg
      viewBox="0 0 1280 480"
      width={1280}
      height={480}
      style={{overflow: 'visible'}}
    >
      {/* Faint dot grid, echoing the app's own .grid-veil texture. */}
      {Array.from({length: 12}).map((_, col) =>
        Array.from({length: 6}).map((_, row) => (
          <circle
            key={`${col}-${row}`}
            cx={col * 110 + 20}
            cy={row * 90 + 20}
            r={1.2}
            fill="#ffffff"
            opacity={0.04}
          />
        )),
      )}

      {glow && (
        <path
          d={pathD}
          fill="none"
          stroke={color.brand}
          strokeWidth={14}
          strokeLinecap="round"
          opacity={0.25}
          style={{filter: 'blur(8px)'}}
          strokeDasharray={pathLength}
          strokeDashoffset={pathLength * (1 - progress)}
        />
      )}

      <path
        d={pathD}
        fill="none"
        stroke={lineColor}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={lit ? undefined : '10 10'}
        style={{
          strokeDasharray: `${pathLength}`,
          strokeDashoffset: pathLength * (1 - progress),
        }}
      />

      {feeNodes?.map((node, i) => {
        const p = pointOnQuadratic(node.t)
        const visible = progress >= node.t
        return (
          <g
            key={i}
            opacity={visible ? 1 : 0}
            style={{transition: 'opacity 200ms'}}
          >
            <circle cx={p.x} cy={p.y} r={7} fill={color.danger} opacity={0.85} />
            <text
              x={p.x}
              y={p.y - 16}
              textAnchor="middle"
              fill={color.danger}
              fontSize={15}
              fontWeight={600}
            >
              {node.label}
            </text>
          </g>
        )
      })}

      {/* Endpoints */}
      {[
        {p: LISBON, label: 'Lisbon'},
        {p: SINGAPORE, label: 'Singapore'},
      ].map(({p, label}) => (
        <g key={label}>
          <circle cx={p.x} cy={p.y} r={7} fill={lineColor} />
          <circle cx={p.x} cy={p.y} r={14} fill={lineColor} opacity={0.18} />
          <text
            x={p.x}
            y={p.y + 34}
            textAnchor="middle"
            fill={color.muted}
            fontSize={16}
            fontWeight={500}
          >
            {label}
          </text>
        </g>
      ))}
    </svg>
  )
}
