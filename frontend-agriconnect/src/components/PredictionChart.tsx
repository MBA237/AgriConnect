import React from 'react'

type Point = { x: string; y: number }

type Props = {
  data: Point[]
  height?: number
}

function buildPath(points: Point[]) {
  if (points.length === 0) return ''
  const maxY = Math.max(...points.map(p => p.y)) || 1
  const minY = Math.min(...points.map(p => p.y)) || 0
  const range = maxY - minY || 1
  const w = 600
  const h = 120
  return points
    .map((p, i) => {
      const x = (i / (points.length - 1 || 1)) * w
      const y = h - ((p.y - minY) / range) * h
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
}

export default function PredictionChart({ data, height = 120 }: Props) {
  const path = buildPath(data)
  return (
    <div className="card">
      <svg viewBox={`0 0 600 ${height}`} width="100%" height={height} className="rounded">
        <defs>
          <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0" />
          </linearGradient>
        </defs>
        {path && <path d={path} fill="none" stroke="var(--primary)" strokeWidth={2} />}
        {path && <path d={`${path} L 600 ${height} L 0 ${height} Z`} fill="url(#g1)" opacity={0.6} />}
      </svg>
    </div>
  )
}
