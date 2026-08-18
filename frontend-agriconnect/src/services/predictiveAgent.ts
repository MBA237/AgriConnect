export type SiteSignal = {
  currentPrice?: number
  forecast7?: number
  delta7?: number
  recommendation?: string
  yieldGain?: number
  productionEstimate?: number
  droughtRisk?: number
  weatherLabel?: string
}

export type ExternalSignal = {
  source: string
  summary: string
}

export function composePredictiveReply(
  input: string,
  siteContext: { productName?: string; regionName?: string; siteData?: SiteSignal },
  externalContext?: ExternalSignal,
) {
  const text = input.toLowerCase()
  const productName = siteContext.productName ?? 'ce produit'
  const regionName = siteContext.regionName ?? 'votre région'
  const siteData = siteContext.siteData
  const externalSummary = externalContext?.summary ? ` Les données externes (${externalContext.source}) indiquent : ${externalContext.summary}.` : ''

  if (!siteData && !externalContext?.summary) {
    return 'Aucune prédiction IA vérifiée n’est disponible pour le moment. Configurez le service IA externe pour obtenir une analyse basée sur des données réelles.'
  }

  if (/(prix|marché|cfa|vente|acheter)/.test(text)) {
    const price = siteData?.forecast7 ?? siteData?.currentPrice
    const delta = siteData?.delta7
    if (price === undefined || delta === undefined) return 'Les données de prix nécessaires à cette prédiction ne sont pas disponibles.'
    return `D’après les signaux disponibles, le prix du ${productName} dans ${regionName} devrait se rapprocher de ${price} FCFA avec une variation de ${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%.${externalSummary}`
  }

  if (/(rendement|récolte|production|culture|météo)/.test(text)) {
    const yieldGain = siteData?.yieldGain
    const productionEstimate = siteData?.productionEstimate
    const weatherLabel = siteData?.weatherLabel
    if (yieldGain === undefined || productionEstimate === undefined || !weatherLabel) return 'Les données agricoles et météorologiques nécessaires à cette prédiction ne sont pas disponibles.'
    return `L’IA combine les données disponibles pour estimer un rendement de ${productionEstimate.toFixed(1)} T pour ${productName} à ${regionName}. Le gain est évalué à +${yieldGain}%, avec ${weatherLabel}.${externalSummary}`
  }

  if (/(conseil|recommand|plan|agir|action)/.test(text)) {
    return `Je vous conseille de baser votre décision sur la plateforme AgriConnect et sur les signaux externes disponibles. ${externalSummary} Priorisez les ventes lorsque le prix dépasse le seuil observé sur la plateforme, puis sécurisez votre stock.`
  }

  return `Je peux vous aider à analyser les prix, les rendements et les risques pour ${productName} dans ${regionName}. Je combine les données de votre plateforme avec les indicateurs externes pour vous proposer un conseil plus robuste.${externalSummary}`
}
