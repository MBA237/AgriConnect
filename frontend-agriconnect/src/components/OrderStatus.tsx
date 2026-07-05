import React from 'react'

type Props = {
  status: string
}

const STEPS = ['placed', 'confirmed', 'packed', 'shipped', 'delivered']

export default function OrderStatus({ status }: Props) {
  const idx = STEPS.indexOf(status)
  return (
    <div className="order-status">
      <div className="order-timeline">
        {STEPS.map((s, i) => {
          const active = i <= idx
          return (
            <div key={s} className={`order-step ${active ? 'active' : ''}`} aria-current={active ? 'step' : undefined}>
              <div className="step-dot" />
              <div className="step-label">{s.charAt(0).toUpperCase() + s.slice(1)}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
