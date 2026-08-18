import { describe, expect, it } from 'vitest'
import { composePredictiveReply } from './predictiveAgent'

describe('composePredictiveReply', () => {
  it('mentions both platform and external signals for price questions', () => {
    const reply = composePredictiveReply(
      'Quel sera le prix du maïs cette semaine ?',
      {
        productName: 'Maïs',
        regionName: 'Centre',
        siteData: {
          currentPrice: 650,
          forecast7: 670,
          delta7: 3.1,
          recommendation: 'Vendre à partir de 670 FCFA',
          yieldGain: 12,
          productionEstimate: 2.4,
          droughtRisk: 18,
          weatherLabel: 'Conditions météo favorables',
        },
      },
      {
        source: 'Open-Meteo',
        summary: 'Quelques averses sont attendues',
      },
    )

    expect(reply).toContain('plateforme')
    expect(reply).toContain('météo')
    expect(reply).toContain('670')
  })
})
