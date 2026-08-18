import React from 'react'
import './PriceChart.css'
import type { PriceHistoryData, PriceZoneSeries } from '../services/api'

type PriceChartProps = {
  productTitle: string
  history: PriceHistoryData[]
  zoneSeries?: PriceZoneSeries
}

export default function PriceChart({ productTitle, history, zoneSeries }: PriceChartProps) {
  if (history.length === 0 && (!zoneSeries || zoneSeries.zones.length === 0)) {
    return <div className="card" style={{ padding: 24 }}>Aucune donnée historique</div>
  }

  const palette = ['var(--primary)', '#10b981', '#f59e0b', '#8b5cf6']

  if (zoneSeries && zoneSeries.zones.length > 0) {
    const prices = zoneSeries.zones.map(zone => zone.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice || 1
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)

    return (
      <div className="price-chart card">
        <div className="chart-header">
          <h3>{productTitle} - Évolution par zone</h3>
          <div className="chart-stats">
            <div>
              <span className="label">Prix moyen</span>
              <span className="value">{avgPrice.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div>
              <span className="label">Min</span>
              <span className="value" style={{ color: 'var(--success)' }}>
                {minPrice.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            <div>
              <span className="label">Max</span>
              <span className="value" style={{ color: 'var(--danger)' }}>
                {maxPrice.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>
        </div>

        <div className="chart-container" style={{ marginTop: 20 }}>
          <svg width="100%" height="220" style={{ borderBottom: '1px solid var(--border-light)' }}>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = (1 - ratio) * 220
              const price = minPrice + ratio * priceRange
              return (
                <g key={idx}>
                  <line x1="0" y1={y} x2="100%" y2={y} stroke="var(--border-light)" strokeWidth="1" strokeDasharray="4,4" />
                  <text x="5" y={y - 5} fontSize="10" fill="var(--text-muted)">
                    {Math.round(price).toLocaleString('fr-FR')}
                  </text>
                </g>
              )
            })}

            {zoneSeries.zones.map((zone, index) => {
              const points = zoneSeries.zones
                .map((item, idx) => {
                  const x = (idx / Math.max(1, zoneSeries.zones.length - 1)) * 100
                  const y = ((maxPrice - item.price) / priceRange) * 220
                  return `${x}% ${y}`
                })
                .join(' ')

              return (
                <g key={zone.zone}>
                  <polyline points={points} fill="none" stroke={palette[index % palette.length]} strokeWidth="2" />
                  <circle cx={`${(index / Math.max(1, zoneSeries.zones.length - 1)) * 100}%`} cy={((maxPrice - zone.price) / priceRange) * 220} r="4" fill={palette[index % palette.length]} />
                </g>
              )
            })}
          </svg>
        </div>

        <div className="chart-legend" style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {zoneSeries.zones.map((zone, index) => (
            <div key={zone.zone} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: palette[index % palette.length] }} />
              <span>{zone.zone}</span>
              <strong>{zone.price.toLocaleString('fr-FR')} FCFA</strong>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const prices = history.map(h => h.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice || 1

  const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
  const change = history[history.length - 1].price - history[0].price
  const changePercent = ((change / history[0].price) * 100).toFixed(2)

  return (
    <div className="price-chart card">
      <div className="chart-header">
        <h3>{productTitle} - Évolution des prix (24h)</h3>
        <div className="chart-stats">
          <div>
            <span className="label">Moyenne</span>
            <span className="value">{avgPrice.toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div>
            <span className="label">Min</span>
            <span className="value" style={{ color: 'var(--success)' }}>
              {minPrice.toLocaleString('fr-FR')} FCFA
            </span>
          </div>
          <div>
            <span className="label">Max</span>
            <span className="value" style={{ color: 'var(--danger)' }}>
              {maxPrice.toLocaleString('fr-FR')} FCFA
            </span>
          </div>
          <div>
            <span className="label">Changement</span>
            <span 
              className="value"
              style={{ color: change > 0 ? 'var(--danger)' : 'var(--success)' }}
            >
              {change > 0 ? '+' : ''}{change} FCFA ({changePercent}%)
            </span>
          </div>
        </div>
      </div>

      <div className="chart-container" style={{ marginTop: 20 }}>
        <svg
          width="100%"
          height="200"
          style={{ borderBottom: '1px solid var(--border-light)' }}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = (1 - ratio) * 200
            const price = minPrice + ratio * priceRange
            return (
              <g key={idx}>
                <line
                  x1="0"
                  y1={y}
                  x2="100%"
                  y2={y}
                  stroke="var(--border-light)"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <text
                  x="5"
                  y={y - 5}
                  fontSize="10"
                  fill="var(--text-muted)"
                >
                  {Math.round(price).toLocaleString('fr-FR')}
                </text>
              </g>
            )
          })}

          {/* Price line */}
          <polyline
            points={history
              .map((h, idx) => {
                const x = (idx / (history.length - 1 || 1)) * 100
                const y = ((maxPrice - h.price) / priceRange) * 200
                return `${x}% ${y}`
              })
              .join(' ')}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
          />

          {/* Filled area under line */}
          <polygon
            points={`0 200 ${history
              .map((h, idx) => {
                const x = (idx / (history.length - 1 || 1)) * 100
                const y = ((maxPrice - h.price) / priceRange) * 200
                return `${x}% ${y}`
              })
              .join(' ')} 100% 200`}
            fill="url(#priceGradient)"
            opacity="0.2"
          />

          <defs>
            <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="chart-legend" style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
        <i className="fas fa-line-chart"></i> Évolution horaire du prix au cours des 24 dernières heures
      </div>
    </div>
  )
}
