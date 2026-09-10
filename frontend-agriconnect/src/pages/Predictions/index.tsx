import React, { useEffect, useMemo, useState } from 'react'
import PredictiveChat from '../../components/PredictiveChat'
import { getMarketPrices, type PriceData } from '../../services/api'
import { findCatalogProduct } from '../MarketDynamic/marketCatalog'
import './Predictions.css';

const chartLabelDays = ['J1', 'J2', 'J3', 'J4', 'J5', 'J6', 'J7']

type PredictionType = 'price' | 'yield' | 'recommendations'
type ProductKey = 'mais' | 'haricot' | 'manioc' | 'cacao' | 'riz' | 'pomme_de_terre' | 'banane' | 'ananas' | 'orange' | 'mandarine' | 'papaye' | 'gombo' | 'aubergine' | 'tomate' | 'piment' | 'oignon' | 'ail' | 'poivron' | 'sorgho' | 'millet'
type RegionKey = 'national' | 'centre' | 'littoral' | 'ouest' | 'nord' | 'adamaoua' | 'est' | 'sud' | 'sud_ouest' | 'nord_ouest' | 'extreme_nord'

type PredictionContent = {
  title: string
  subtitle: string
  summary: string
  bullets: string[]
  miniMetric: string
  trend: string
  chartPoints: number[]
  comparisonSeries: Array<{ label: string; values: number[]; color: string }>
}

const productOptions: Array<{ value: ProductKey; label: string; region: string }> = [
  { value: 'mais', label: 'Maïs', region: 'Centre et Nord' },
  { value: 'haricot', label: 'Haricot', region: 'Ouest et Adamaoua' },
  { value: 'manioc', label: 'Manioc', region: 'Sud et Littoral' },
  { value: 'cacao', label: 'Cacao', region: 'Sud-Ouest et Centre' },
  { value: 'riz', label: 'Riz', region: 'Littoral et Nord' },
  { value: 'pomme_de_terre', label: 'Pomme de terre', region: 'Ouest et Nord' },
  { value: 'banane', label: 'Banane', region: 'Sud et Littoral' },
  { value: 'ananas', label: 'Ananas', region: 'Sud et Est' },
  { value: 'orange', label: 'Orange', region: 'Centre et Littoral' },
  { value: 'mandarine', label: 'Mandarine', region: 'Ouest et Nord' },
  { value: 'papaye', label: 'Papaye', region: 'Centre et Sud' },
  { value: 'gombo', label: 'Gombo', region: 'Nord et Adamaoua' },
  { value: 'aubergine', label: 'Aubergine', region: 'Centre et Littoral' },
  { value: 'tomate', label: 'Tomate', region: 'Nord et Ouest' },
  { value: 'piment', label: 'Piment', region: 'Centre et Sud' },
  { value: 'oignon', label: 'Oignon', region: 'Nord et Adamaoua' },
  { value: 'ail', label: 'Ail', region: 'Ouest et Nord' },
  { value: 'poivron', label: 'Poivron', region: 'Centre et Littoral' },
  { value: 'sorgho', label: 'Sorgho', region: 'Nord et Extrême-Nord' },
  { value: 'millet', label: 'Millet', region: 'Nord et Extrême-Nord' },
]

const regionOptions: Array<{ value: RegionKey; label: string }> = [
  { value: 'national', label: 'National' },
  { value: 'centre', label: 'Centre' },
  { value: 'littoral', label: 'Littoral' },
  { value: 'ouest', label: 'Ouest' },
  { value: 'nord', label: 'Nord' },
  { value: 'adamaoua', label: 'Adamaoua' },
  { value: 'est', label: 'Est' },
  { value: 'sud', label: 'Sud' },
  { value: 'sud_ouest', label: 'Sud-Ouest' },
  { value: 'nord_ouest', label: 'Nord-Ouest' },
  { value: 'extreme_nord', label: 'Extrême-Nord' },
]

function getPredictionContent(type: PredictionType, product: ProductKey, region: RegionKey, overview?: ReturnType<typeof getDynamicPredictionOverview>): PredictionContent {
  const productProfile = productOptions.find(option => option.value === product)
  const regionProfile = regionOptions.find(option => option.value === region)
  const regionLabel = regionProfile?.label ?? 'national'
  const regionContext = region === 'national' ? 'à l’échelle nationale' : `dans la région ${regionLabel}`
  const productLabel = productProfile?.label ?? 'produit'

  const dynamicBase = overview?.currentPrice ?? 700
  const dynamicTrend = overview?.delta7 ?? 3.6

  const base = {
    price: {
      title: 'Prévision des prix',
      subtitle: `Analyse des tendances de marché pour le ${productLabel} ${regionContext}`,
      summary: `L’IA compare les prix observés sur les principaux marchés du Cameroun pour le ${productLabel} et estime la direction probable du cours pour la semaine à venir ${regionContext}.`,
      bullets: [
        `Suivi des prix par zone géographique pour le ${productLabel}`,
        'Détection des hausses ou baisses rapides',
        'Alerte sur les périodes de forte volatilité',
      ],
      miniMetric: `${dynamicBase} FCFA · ${dynamicTrend >= 0 ? '+' : ''}${dynamicTrend.toFixed(1)}%`,
      trend: dynamicTrend >= 0 ? 'Hausse possible dans les zones de forte demande' : 'Baisse probable à court terme',
      chartPoints: [Math.round(dynamicBase * 0.92), Math.round(dynamicBase * 0.95), Math.round(dynamicBase * 0.98), Math.round(dynamicBase * 1.01), Math.round(dynamicBase * 1.03), Math.round(dynamicBase * 1.05), Math.round(dynamicBase * 1.08)],
      comparisonSeries: [
        { label: 'Douala', values: [40, 43, 45, 48, 51, 54, 57], color: '#10b981' },
        { label: 'Yaoundé', values: [38, 41, 44, 47, 49, 52, 55], color: '#3b82f6' },
        { label: 'Bamenda', values: [42, 45, 49, 50, 54, 57, 60], color: '#f59e0b' },
      ],
    },
    yield: {
      title: 'Prévision de rendement',
      subtitle: `Estimation de la production à partir des données agricoles pour le ${productLabel} ${regionContext}`,
      summary: `Cette prévision combine la saison, les conditions climatiques et le niveau de rendement observé pour estimer la récolte attendue du ${productLabel} ${regionContext}.`,
      bullets: [
        `Projection du rendement par culture pour le ${productLabel}`,
        'Analyse des facteurs de risque',
        'Conseil pour l’optimisation des intrants',
      ],
      miniMetric: `≈ ${(overview?.productionEstimate ?? 2.2).toFixed(1)} T`,
      trend: overview?.yieldGain && overview.yieldGain > 10 ? 'Rendement au-dessus de la moyenne saisonnière' : 'Rendement proche de la moyenne saisonnière',
      chartPoints: [Math.round((overview?.productionEstimate ?? 2.2) * 100) / 100, Math.round(((overview?.productionEstimate ?? 2.2) + 0.1) * 100) / 100, Math.round(((overview?.productionEstimate ?? 2.2) + 0.2) * 100) / 100, Math.round(((overview?.productionEstimate ?? 2.2) + 0.35) * 100) / 100, Math.round(((overview?.productionEstimate ?? 2.2) + 0.45) * 100) / 100, Math.round(((overview?.productionEstimate ?? 2.2) + 0.55) * 100) / 100, Math.round(((overview?.productionEstimate ?? 2.2) + 0.5) * 100) / 100],
      comparisonSeries: [
        { label: 'Nord', values: [16.5, 17.2, 17.8, 18.2, 18.6, 18.9, 18.7], color: '#10b981' },
        { label: 'Centre', values: [17.8, 18.1, 18.4, 18.7, 19.0, 19.2, 19.1], color: '#3b82f6' },
        { label: 'Ouest', values: [17.2, 17.6, 18.0, 18.3, 18.5, 18.8, 18.9], color: '#f59e0b' },
      ],
    },
    recommendations: {
      title: 'Recommandations IA',
      subtitle: `Conseils d’achat, de vente et de gestion pour le ${productLabel} ${regionContext}`,
      summary: `L’assistant recommande les meilleures actions pour le ${productLabel} selon les prix actuels, la saison et les tendances du marché ${regionContext}.`,
      bullets: [
        'Meilleur moment pour vendre',
        'Moment opportun pour acheter',
        'Conseils pour réduire les pertes et améliorer la marge',
      ],
      miniMetric: `Recommandation prioritaire : ${overview?.recommendation ?? 'surveiller le marché'}`,
      trend: 'Action conseillée selon la volatilité observée',
      chartPoints: [Math.round(dynamicBase * 0.88), Math.round(dynamicBase * 0.9), Math.round(dynamicBase * 0.95), Math.round(dynamicBase * 0.97), Math.round(dynamicBase * 1.0), Math.round(dynamicBase * 1.02), Math.round(dynamicBase * 1.01)],
      comparisonSeries: [
        { label: 'Achat', values: [29, 31, 33, 34, 35, 36, 35], color: '#10b981' },
        { label: 'Vente', values: [32, 35, 38, 37, 40, 42, 41], color: '#3b82f6' },
        { label: 'Stock', values: [30, 32, 34, 36, 38, 39, 40], color: '#f59e0b' },
      ],
    },
  } as const

  return {
    title: base[type].title,
    subtitle: base[type].subtitle,
    summary: base[type].summary,
    bullets: [...base[type].bullets],
    miniMetric: base[type].miniMetric,
    trend: base[type].trend,
    chartPoints: [...base[type].chartPoints],
    comparisonSeries: base[type].comparisonSeries.map(series => ({ ...series, values: [...series.values] })),
  }
}

function getDynamicPredictionOverview(product: ProductKey, region: RegionKey, tick = 0) {
  const productProfile = productOptions.find(option => option.value === product)
  const regionProfile = regionOptions.find(option => option.value === region)
  const productLabel = productProfile?.label ?? 'Produit'
  const regionLabel = regionProfile?.label ?? 'National'

  const basePrices: Record<ProductKey, number> = {
    mais: 650,
    haricot: 850,
    manioc: 240,
    cacao: 1850,
    riz: 480,
    pomme_de_terre: 360,
    banane: 330,
    ananas: 420,
    orange: 500,
    mandarine: 560,
    papaye: 400,
    gombo: 720,
    aubergine: 600,
    tomate: 700,
    piment: 1100,
    oignon: 450,
    ail: 1250,
    poivron: 900,
    sorgho: 300,
    millet: 280,
  }

  const regionFactor: Record<RegionKey, number> = {
    national: 1,
    centre: 1.03,
    littoral: 1.06,
    ouest: 1.04,
    nord: 0.96,
    adamaoua: 0.98,
    est: 0.97,
    sud: 1.01,
    sud_ouest: 1.05,
    nord_ouest: 1.02,
    extreme_nord: 0.94,
  }

  const pulse = Math.sin((tick + 1) * 0.7) * 0.02
  const currentPrice = Math.round(basePrices[product] * regionFactor[region] * (1 + pulse))
  const delta7 = (region === 'nord' || region === 'extreme_nord' ? -2.4 : 3.6) + Math.sin((tick + 1) * 0.5) * 0.8
  const delta30 = (region === 'nord' || region === 'extreme_nord' ? -6.8 : 8.2) + Math.sin((tick + 2) * 0.4) * 0.9
  const delta90 = (region === 'nord' || region === 'extreme_nord' ? -11.4 : 14.1) + Math.sin((tick + 3) * 0.3) * 1.1

  const forecast7 = Math.round(currentPrice * (1 + delta7 / 100))
  const forecast30 = Math.round(currentPrice * (1 + delta30 / 100))
  const forecast90 = Math.round(currentPrice * (1 + delta90 / 100))

  const confidence = Math.min(96, 88 + (region === 'littoral' || region === 'sud_ouest' ? 3 : 0) + (product === 'tomate' || product === 'piment' ? 2 : 0) + Math.round(Math.sin((tick + 4) * 0.6) * 2))
  const accuracy7d = Math.min(92, 84 + Math.round((confidence - 88) / 2))
  const accuracy30d = Math.min(78, 70 + Math.round((confidence - 88) / 4))

  const trend = delta7 >= 0 ? '▲' : '▼'
  const recommendation = delta7 >= 0 ? `Vendre à partir de ${forecast7} FCFA` : 'Vendre maintenant avant la baisse'
  const yieldGain = region === 'nord' || region === 'extreme_nord' ? 8 : 15
  const productionEstimate = Math.round((product === 'tomate' ? 2.4 : product === 'piment' ? 1.8 : product === 'banane' ? 3.6 : 2.2) * (1 + yieldGain / 100) * 10) / 10
  const droughtRisk = region === 'nord' || region === 'extreme_nord' ? 28 : region === 'centre' || region === 'ouest' ? 14 : 18
  const weatherLabel = droughtRisk < 20 ? 'Conditions météo favorables' : 'Risque de sécheresse modéré'

  return {
    productLabel,
    regionLabel,
    confidence,
    accuracy7d,
    accuracy30d,
    currentPrice,
    forecast7,
    forecast30,
    forecast90,
    delta7,
    delta30,
    delta90,
    recommendation,
    trend,
    yieldGain,
    productionEstimate,
    droughtRisk,
    weatherLabel,
  }
}

export default function Predictions() {
  const [selectedType, setSelectedType] = useState<PredictionType>('price')
  const [selectedProduct, setSelectedProduct] = useState<ProductKey>('mais')
  const [selectedRegion, setSelectedRegion] = useState<RegionKey>('national')
  const [hoveredPoint, setHoveredPoint] = useState<{ label: string; value: number; series: string } | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [marketPulse, setMarketPulse] = useState(0)
  const [marketNotice, setMarketNotice] = useState<string | null>(null)
  const [insightPrompt, setInsightPrompt] = useState<string | null>(null)
  const [isLoadingAi, setIsLoadingAi] = useState(false)
  const [liveOverview, setLiveOverview] = useState(() => getDynamicPredictionOverview('mais', 'national', 0))

  useEffect(() => {
    const interval = window.setInterval(() => {
      setMarketPulse(value => value + 1)
    }, 10000)

    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const baseUrl = (import.meta.env.VITE_AI_PREDICTION_API_URL ?? 'http://localhost:8000/api/ai').replace(/\/$/, '')
    const productMap: Record<ProductKey, number> = {
      mais: 1,
      haricot: 2,
      manioc: 3,
      cacao: 4,
      riz: 5,
      pomme_de_terre: 6,
      banane: 7,
      ananas: 8,
      orange: 9,
      mandarine: 10,
      papaye: 11,
      gombo: 12,
      aubergine: 13,
      tomate: 14,
      piment: 15,
      oignon: 16,
      ail: 17,
      poivron: 18,
      sorgho: 19,
      millet: 20,
    }

    let active = true

    async function loadLiveInsight() {
      setIsLoadingAi(true)
      try {
        const productId = productMap[selectedProduct] ?? 1
        const regionName = selectedRegion === 'national' ? 'national' : selectedRegion
        const [marketResult, priceResponse, yieldResponse, recommendationResponse] = await Promise.all([
          getMarketPrices(),
          fetch(`${baseUrl}/price-forecast/${productId}`),
          fetch(`${baseUrl}/yield-forecast/${regionName}`),
          fetch(`${baseUrl}/recommendations/${productId}`),
        ])

        setMarketNotice(marketResult.data.meta?.message ?? null)

        const marketPrices: PriceData[] = Array.isArray(marketResult.data.prices) ? marketResult.data.prices : []
        const selectedMarketPrice = marketPrices.find(price => {
          const catalogProduct = findCatalogProduct(price.productTitle)
          return catalogProduct?.id === selectedProduct || price.productId === selectedProduct
        })

        const [priceJson, yieldJson, recommendationJson] = await Promise.all([
          priceResponse.ok ? priceResponse.json() : Promise.resolve({}),
          yieldResponse.ok ? yieldResponse.json() : Promise.resolve({}),
          recommendationResponse.ok ? recommendationResponse.json() : Promise.resolve({}),
        ])

        if (!active) return

        const currentPrice = Number(selectedMarketPrice?.currentPrice ?? priceJson.current ?? priceJson.estimate ?? 0)
        const priceSeries = Array.isArray(priceJson.series) ? priceJson.series : []
        const yieldCurrent = Number(yieldJson.estimate ?? yieldJson.current ?? 0)
        const recommendationText = Array.isArray(recommendationJson.recommendations) && recommendationJson.recommendations.length > 0
          ? recommendationJson.recommendations[0]
          : 'Vendre maintenant avant la baisse'

        const baseOverview = getDynamicPredictionOverview(selectedProduct, selectedRegion, marketPulse)
        const nextForecast7 = priceSeries.length > 0 ? Number(priceSeries[priceSeries.length - 1].price ?? priceSeries[priceSeries.length - 1].y ?? currentPrice) : Math.round(baseOverview.forecast7)
        const marketDelta = selectedMarketPrice?.priceChangePercent
        const delta7 = Number.isFinite(marketDelta) && selectedMarketPrice
          ? marketDelta
          : currentPrice > 0 ? ((nextForecast7 - currentPrice) / currentPrice) * 100 : baseOverview.delta7
        const delta30 = baseOverview.delta30
        const delta90 = baseOverview.delta90

        const nextOverview = {
          ...baseOverview,
          currentPrice: currentPrice > 0 ? currentPrice : baseOverview.currentPrice,
          forecast7: selectedMarketPrice ? Math.round(currentPrice * (1 + delta7 / 100)) : nextForecast7,
          forecast30: Math.max(nextForecast7, Math.round(baseOverview.forecast30)),
          forecast90: Math.max(nextForecast7, Math.round(baseOverview.forecast90)),
          delta7,
          delta30,
          delta90,
          recommendation: recommendationText,
          confidence: Math.max(58, Math.min(97, Number(yieldJson.confidence ?? baseOverview.confidence))),
          accuracy7d: Math.max(60, Math.min(94, Number(yieldJson.accuracy ?? baseOverview.accuracy7d))),
          accuracy30d: Math.max(58, Math.min(90, Number(yieldJson.accuracy ?? baseOverview.accuracy30d))),
          productionEstimate: yieldCurrent > 0 ? Number((yieldCurrent / 1000).toFixed(1)) : baseOverview.productionEstimate,
          yieldGain: yieldCurrent > 0 ? Math.max(5, Math.min(30, Math.round((yieldCurrent / 1000) * 6))) : baseOverview.yieldGain,
          weatherLabel: yieldJson.region ? `Conditions climatiques ${yieldJson.region}` : baseOverview.weatherLabel,
          productLabel: productOptions.find(option => option.value === selectedProduct)?.label ?? baseOverview.productLabel,
          regionLabel: regionOptions.find(option => option.value === selectedRegion)?.label ?? baseOverview.regionLabel,
        }

        setLiveOverview(nextOverview)
      } catch (error) {
        if (!active) return
        setLiveOverview(getDynamicPredictionOverview(selectedProduct, selectedRegion, marketPulse))
      } finally {
        if (active) setIsLoadingAi(false)
      }
    }

    loadLiveInsight()
    return () => { active = false }
  }, [selectedProduct, selectedRegion, marketPulse])

  const overview = liveOverview
  const selectedPrediction = useMemo(() => getPredictionContent(selectedType, selectedProduct, selectedRegion, overview), [selectedType, selectedProduct, selectedRegion, overview])
  const chartSeries = selectedPrediction.comparisonSeries
  const chartValues = chartSeries.flatMap(series => series.values)
  const chartMin = Math.min(...chartValues)
  const chartMax = Math.max(...chartValues)
  const chartRange = chartMax - chartMin || 1

  const handleProductSelect = (product: ProductKey) => {
    const productLabel = productOptions.find(option => option.value === product)?.label ?? 'ce produit'
    const regionLabel = regionOptions.find(option => option.value === selectedRegion)?.label ?? 'la région sélectionnée'
    setSelectedProduct(product)
    setSelectedType('recommendations')
    setInsightPrompt(`Explique-moi concrètement la prévision pour ${productLabel} dans ${regionLabel}. Donne-moi une recommandation précise pour acheter, vendre ou attendre, avec les risques et la logique de la prédiction.`)
  }

  return (
    <section className="prediction-page" style={{ background: 'linear-gradient(180deg, #f8fffb 0%, #ffffff 100%)' }}>
      <div className="prediction-page-header">
        <div className="prediction-header-card">
          <div>
            <div className="prediction-badge">
              <i className="fas fa-brain" /> IA prédictive agricole
            </div>
            <h1 className="prediction-title">Prédictions IA</h1>
            <div className="prediction-subtitle">Explorez les prévisions de prix, de rendement et les recommandations adaptées au produit et à la région sélectionnés.</div>
          </div>
          <div className="prediction-header-cta">
            <div className="prediction-label">Mise à jour</div>
            <div className="prediction-value">Temps réel · 3s</div>
          </div>
        </div>
      </div>

      {marketNotice && (
        <div className="prediction-notice" role="status">
          <i className="fas fa-info-circle" aria-hidden="true" />
          <span>{marketNotice}</span>
        </div>
      )}

      <div className="card" style={{ padding: 24, marginBottom: 20, borderRadius: 24, boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)', background: 'linear-gradient(135deg, #ffffff 0%, #f7fdf9 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Graphique de tendance IA
            </div>
            <h3 style={{ margin: '6px 0 4px' }}>{selectedPrediction.title}</h3>
            <div style={{ color: 'var(--text-secondary)', maxWidth: 680 }}>{selectedPrediction.summary}</div>
          </div>
          <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)', minWidth: 180 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Métrique clé</div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4 }}>{selectedPrediction.miniMetric}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1.7fr 0.9fr' }}>
          <div style={{ padding: 16, borderRadius: 18, background: 'white', border: '1px solid rgba(16, 185, 129, 0.12)', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)' }}>
            <svg viewBox="0 0 360 220" width="100%" height="280" style={{ display: 'block' }}>
              <rect x="0" y="0" width="360" height="220" rx="18" fill="url(#chartArea)" />
              <defs>
                <linearGradient id="chartArea" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f7fdf9" />
                  <stop offset="100%" stopColor="#eefbf4" />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3, 4].map(level => (
                <line key={level} x1="40" y1={40 + level * 32} x2="330" y2={40 + level * 32} stroke="rgba(148, 163, 184, 0.22)" strokeDasharray="4 4" />
              ))}
              {[0, 1, 2, 3, 4, 5, 6].map(index => (
                <line key={index} x1={40 + index * 42} y1="40" x2={40 + index * 42} y2="188" stroke="rgba(148, 163, 184, 0.18)" />
              ))}
              {chartSeries.map(series => {
                const points = series.values.map((value, index) => {
                  const x = 40 + index * 42
                  const y = 188 - ((value - chartMin) / chartRange) * 148
                  return { x, y }
                })
                const pathData = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
                return (
                  <g key={series.label}>
                    <path d={`${pathData}`} fill="none" stroke={series.color} strokeWidth="3.2" strokeLinecap="round" />
                    {points.map((point, index) => (
                      <g key={`${series.label}-${index}`}>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="5.5"
                          fill={series.color}
                          stroke="white"
                          strokeWidth="2"
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={() => setHoveredPoint({ label: chartLabelDays[index], value: series.values[index], series: series.label })}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      </g>
                    ))}
                  </g>
                )
              })}
              {chartLabelDays.map((label, index) => (
                <text key={label} x={40 + index * 42} y="210" textAnchor="middle" fontSize="11" fill="var(--text-muted)">{label}</text>
              ))}
            </svg>
          </div>

          <div className="prediction-side-stack">
            <div className="prediction-insight-box">
              <div className="prediction-label">Tendance observée</div>
              <div className="prediction-trend">{selectedPrediction.trend}</div>
            </div>
            <div className="prediction-legend-box">
              <div className="prediction-label">Légende</div>
              <div className="prediction-legend-list">
                {chartSeries.map(series => (
                  <div key={series.label} className="prediction-legend-item">
                    <span className="prediction-legend-dot" style={{ background: series.color }} />
                    {series.label}
                  </div>
                ))}
              </div>
            </div>
            {hoveredPoint && (
              <div className="prediction-hover-box">
                <div className="prediction-label">Valeur survolée</div>
                <div className="prediction-hover-value">{hoveredPoint.series} · {hoveredPoint.label} : {hoveredPoint.value}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="prediction-type-grid">
        {(['price', 'yield', 'recommendations'] as PredictionType[]).map(type => {
          const item = getPredictionContent(type, selectedProduct, selectedRegion, overview)
          const isActive = selectedType === type

          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`prediction-type-card ${isActive ? 'is-active' : ''}`}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>
                  {type === 'price' ? 'Prix' : type === 'yield' ? 'Rendement' : 'Conseils'}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>{item.title}</div>
              </div>
              <span className="btn-small btn-small-outline">Sélectionner</span>
            </button>
          )
        })}
      </div>

      <div className="prediction-panel prediction-panel--compact">
        <div className="prediction-controls-head">
          <div>
            <div className="prediction-kicker">Prévision active</div>
            <div className="prediction-summary small">Sélectionnez un produit et une région pour voir ses métriques IA.</div>
          </div>
          <div className="prediction-controls">
            <select
              value={selectedProduct}
              onChange={(event) => setSelectedProduct(event.target.value as ProductKey)}
              className="prediction-select"
            >
              {productOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label} · {option.region}</option>
              ))}
            </select>
            <select
              value={selectedRegion}
              onChange={(event) => setSelectedRegion(event.target.value as RegionKey)}
              className="prediction-select prediction-select--small"
            >
              {regionOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="prediction-product-grid">
          {productOptions.map(product => {
            const productOverview = getDynamicPredictionOverview(product.value as ProductKey, selectedRegion, marketPulse)
            const isSelected = selectedProduct === product.value
            const isPositive = productOverview.delta7 >= 0

            return (
              <button
                key={product.value}
                onClick={() => handleProductSelect(product.value as ProductKey)}
                className={`prediction-product-card ${isSelected ? 'is-selected' : ''}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{product.label}</div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>Confiance {productOverview.confidence}%</span>
                </div>
                <div style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: 13 }}>{product.region}</div>
                <div style={{ marginTop: 12, fontSize: 28, fontWeight: 800 }}>{productOverview.currentPrice} FCFA</div>
                <div style={{ marginTop: 6, color: 'var(--text-secondary)', fontSize: 13 }}>Actuel</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
                  <div style={{ padding: 8, borderRadius: 10, background: 'var(--bg-input)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>+7j</div>
                    <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2 }}>{isPositive ? '▲' : '▼'} {Math.abs(productOverview.delta7).toFixed(1)}%</div>
                  </div>
                  <div style={{ padding: 8, borderRadius: 10, background: 'var(--bg-input)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>+30j</div>
                    <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2 }}>{isPositive ? '▲' : '▼'} {Math.abs(productOverview.delta30).toFixed(1)}%</div>
                  </div>
                  <div style={{ padding: 8, borderRadius: 10, background: 'var(--bg-input)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>+90j</div>
                    <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2 }}>{isPositive ? '▲' : '▼'} {Math.abs(productOverview.delta90).toFixed(1)}%</div>
                  </div>
                </div>

                <div style={{ marginTop: 12, padding: 10, borderRadius: 10, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Recommandation</div>
                  <div style={{ fontSize: 14, fontWeight: 800, marginTop: 4 }}>{productOverview.recommendation}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="prediction-panel prediction-panel--metrics">
        <div className="prediction-panel-header prediction-panel-header--compact">
          <div>
            <div className="prediction-kicker">Vue IA en temps réel</div>
            <h3>Modèle de prédiction IA v2.3</h3>
            <div className="prediction-summary">Précision {overview.accuracy7d}% à 7 jours · {overview.accuracy30d}% à 30 jours</div>
          </div>
          <div className="prediction-metric-box prediction-metric-box--alt">
            <div className="prediction-label">Entraîné sur 2 ans de données</div>
            <div className="prediction-value">{overview.productLabel} · {overview.regionLabel}</div>
          </div>
        </div>

        <div className="prediction-metric-grid">
          <div className="prediction-metric-item">
            <div className="prediction-label">Confiance</div>
            <div className="prediction-metric-value">{overview.confidence}%</div>
          </div>
          <div className="prediction-metric-item prediction-metric-item--success">
            <div className="prediction-label">Actuel</div>
            <div className="prediction-metric-value">{overview.currentPrice} FCFA</div>
          </div>
          <div className="prediction-metric-item prediction-metric-item--info">
            <div className="prediction-label">+7 jours</div>
            <div className="prediction-metric-value">{overview.trend} {overview.delta7 >= 0 ? '+' : ''}{overview.delta7}%</div>
          </div>
          <div className="prediction-metric-item prediction-metric-item--warning">
            <div className="prediction-label">+30 jours</div>
            <div className="prediction-metric-value">{overview.trend} {overview.delta30 >= 0 ? '+' : ''}{overview.delta30}%</div>
          </div>
        </div>

        <div className="prediction-small-grid">
          <div className="prediction-metric-item prediction-metric-item--flat">
            <div className="prediction-label">Prévision 7 jours</div>
            <div className="prediction-metric-value small">{overview.forecast7} FCFA</div>
          </div>
          <div className="prediction-metric-item prediction-metric-item--flat">
            <div className="prediction-label">Prévision 30 jours</div>
            <div className="prediction-metric-value small">{overview.forecast30} FCFA</div>
          </div>
          <div className="prediction-metric-item prediction-metric-item--flat">
            <div className="prediction-label">Prévision 90 jours</div>
            <div className="prediction-metric-value small">{overview.forecast90} FCFA</div>
          </div>
        </div>

        <div className="prediction-highlight-box">
          <div className="prediction-label">Recommandation</div>
          <div className="prediction-highlight-value">{overview.recommendation}</div>
        </div>
      </div>

      <div className="prediction-panel prediction-panel--harvest">
        <div className="prediction-panel-header prediction-panel-header--compact">
          <div>
            <div className="prediction-kicker">Prédiction des récoltes</div>
            <h3>{overview.productLabel} · Région {overview.regionLabel}</h3>
            <div className="prediction-summary">Prédiction basée sur les tendances climatiques et de rendement.</div>
          </div>
          <div className="prediction-metric-box prediction-metric-box--alt">
            <div className="prediction-label">IA</div>
            <div className="prediction-value">+{overview.yieldGain}% vs saison dernière</div>
          </div>
        </div>

        <div className="prediction-metric-grid">
          <div className="prediction-metric-item">
            <div className="prediction-label">Production estimée</div>
            <div className="prediction-metric-value">{overview.productionEstimate} T</div>
          </div>
          <div className="prediction-metric-item">
            <div className="prediction-label">Prix estimé / kg</div>
            <div className="prediction-metric-value">{overview.currentPrice} FCFA</div>
          </div>
          <div className="prediction-metric-item prediction-metric-item--info">
            <div className="prediction-label">Conditions météo</div>
            <div className="prediction-metric-value small">{overview.weatherLabel}</div>
          </div>
        </div>

        <div className="prediction-highlight-box prediction-highlight-box--warning">
          <div className="prediction-label">Risque de sécheresse</div>
          <div className="prediction-highlight-value">{overview.droughtRisk}%</div>
        </div>
      </div>

      <div className="prediction-panel prediction-panel--analysis">
        <div className="prediction-panel-header prediction-panel-header--compact">
          <div>
            <div className="prediction-kicker">Analyse IA concrète</div>
            <h3>{productOptions.find(option => option.value === selectedProduct)?.label} · {regionOptions.find(option => option.value === selectedRegion)?.label}</h3>
            <div className="prediction-summary">{selectedPrediction.summary}</div>
          </div>
          <div className="prediction-metric-box prediction-metric-box--alt">
            <div className="prediction-label">Point clé</div>
            <div className="prediction-value">{selectedPrediction.miniMetric}</div>
          </div>
        </div>

        <div className="prediction-bullet-grid">
          {selectedPrediction.bullets.map(bullet => (
            <div key={bullet} className="prediction-bullet-item">
              {bullet}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 6 }}>
        <PredictiveChat
          productName={productOptions.find(option => option.value === selectedProduct)?.label}
          regionName={regionOptions.find(option => option.value === selectedRegion)?.label}
          autoPrompt={insightPrompt ?? undefined}
        />
      </div>
    </section>
  )
}
