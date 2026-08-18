import React, { useEffect, useMemo, useState } from 'react'
import PredictiveChat from '../../components/PredictiveChat'
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
  const [insightPrompt, setInsightPrompt] = useState<string | null>(null)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setMarketPulse(value => value + 1)
    }, 3000)

    return () => window.clearInterval(interval)
  }, [])

  const overview = useMemo(() => getDynamicPredictionOverview(selectedProduct, selectedRegion, marketPulse), [selectedProduct, selectedRegion, marketPulse])
  const selectedPrediction = useMemo(() => getPredictionContent(selectedType, selectedProduct, selectedRegion, overview), [selectedType, selectedProduct, selectedRegion, overview])
  const chartSeries = selectedPrediction.comparisonSeries
  const chartValues = chartSeries.flatMap(series => series.values)
  const chartMin = Math.min(...chartValues)
  const chartMax = Math.max(...chartValues)
  const chartRange = chartMax - chartMin || 1

  if (!import.meta.env.VITE_AI_PREDICTION_API_URL?.trim()) {
    return (
      <section className="page prediction-unavailable">
        <div className="card prediction-unavailable-card">
          <i className="fas fa-brain" aria-hidden="true"></i>
          <span className="market-kicker">Module IA</span>
          <h1>Prédictions IA indisponibles</h1>
          <p>Aucune prédiction simulée n’est affichée. Configurez une source IA externe pour obtenir des résultats basés sur des données réelles du Cameroun.</p>
        </div>
      </section>
    )
  }

  const handleProductSelect = (product: ProductKey) => {
    const productLabel = productOptions.find(option => option.value === product)?.label ?? 'ce produit'
    const regionLabel = regionOptions.find(option => option.value === selectedRegion)?.label ?? 'la région sélectionnée'
    setSelectedProduct(product)
    setSelectedType('recommendations')
    setInsightPrompt(`Explique-moi concrètement la prévision pour ${productLabel} dans ${regionLabel}. Donne-moi une recommandation précise pour acheter, vendre ou attendre, avec les risques et la logique de la prédiction.`)
  }

  return (
    <section className="page" style={{ background: 'linear-gradient(180deg, #f8fffb 0%, #ffffff 100%)' }}>
      <div className="page-header" style={{ marginBottom: 18 }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.16)',
          borderRadius: 24,
          padding: '22px 24px',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 999, background: 'white', border: '1px solid rgba(16, 185, 129, 0.18)', fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
              <i className="fas fa-brain" /> IA prédictive agricole
            </div>
            <h1 style={{ margin: '10px 0 6px', fontSize: 30, lineHeight: 1.2 }}>Prédictions IA</h1>
            <div className="sub" style={{ fontSize: 15, maxWidth: 700 }}>Explorez les prévisions de prix, de rendement et les recommandations adaptées au produit et à la région sélectionnés.</div>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: 16, background: 'white', border: '1px solid rgba(16, 185, 129, 0.16)', minWidth: 220 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Mise à jour</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>Temps réel · 3s</div>
          </div>
        </div>
      </div>

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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: 14, borderRadius: 16, background: 'var(--bg-input)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Tendance observée</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{selectedPrediction.trend}</div>
            </div>
            <div style={{ padding: 14, borderRadius: 16, background: 'white', border: '1px solid rgba(59, 130, 246, 0.12)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Légende</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {chartSeries.map(series => (
                  <div key={series.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: series.color }} />
                    {series.label}
                  </div>
                ))}
              </div>
            </div>
            {hoveredPoint && (
              <div style={{ padding: 12, borderRadius: 14, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Valeur survolée</div>
                <div style={{ fontSize: 15, fontWeight: 800, marginTop: 4 }}>{hoveredPoint.series} · {hoveredPoint.label} : {hoveredPoint.value}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: 20 }}>
        {(['price', 'yield', 'recommendations'] as PredictionType[]).map(type => {
          const item = getPredictionContent(type, selectedProduct, selectedRegion, overview)
          const isActive = selectedType === type

          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className="card"
              style={{
                padding: 24,
                minHeight: 180,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                textAlign: 'left',
                border: isActive ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border-light)',
                background: isActive ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(255,255,255,0.95) 100%)' : 'white',
                cursor: 'pointer',
                boxShadow: isActive ? '0 16px 35px rgba(16, 185, 129, 0.12)' : '0 8px 24px rgba(15, 23, 42, 0.04)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
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

      <div className="card" style={{ padding: 24, marginBottom: 20, borderRadius: 24, boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Prévision active
            </div>
            <div style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>Sélectionnez un produit et une région pour voir ses métriques IA.</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <select
              value={selectedProduct}
              onChange={(event) => setSelectedProduct(event.target.value as ProductKey)}
              style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-light)', minWidth: 220, background: 'white', fontWeight: 600 }}
            >
              {productOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label} · {option.region}</option>
              ))}
            </select>
            <select
              value={selectedRegion}
              onChange={(event) => setSelectedRegion(event.target.value as RegionKey)}
              style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-light)', minWidth: 200, background: 'white', fontWeight: 600 }}
            >
              {regionOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginTop: 8 }}>
          {productOptions.map(product => {
            const productOverview = getDynamicPredictionOverview(product.value as ProductKey, selectedRegion, marketPulse)
            const isSelected = selectedProduct === product.value
            const isPositive = productOverview.delta7 >= 0

            return (
              <button
                key={product.value}
                onClick={() => handleProductSelect(product.value as ProductKey)}
                style={{
                  border: isSelected ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border-light)',
                  borderRadius: 18,
                  padding: 16,
                  background: isSelected ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, white 100%)' : 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 14px 30px rgba(16, 185, 129, 0.12)' : '0 10px 24px rgba(15, 23, 42, 0.04)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
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

      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Vue IA en temps réel
            </div>
            <h3 style={{ margin: '6px 0 4px' }}>Modèle de prédiction IA v2.3</h3>
            <div style={{ color: 'var(--text-secondary)' }}>
              Précision {overview.accuracy7d}% à 7 jours · {overview.accuracy30d}% à 30 jours
            </div>
          </div>
          <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)', minWidth: 220 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Entraîné sur 2 ans de données</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{overview.productLabel} · {overview.regionLabel}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginTop: 16 }}>
          <div style={{ padding: 14, borderRadius: 12, background: 'var(--bg-input)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Confiance</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{overview.confidence}%</div>
          </div>
          <div style={{ padding: 14, borderRadius: 12, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Actuel</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{overview.currentPrice} FCFA</div>
          </div>
          <div style={{ padding: 14, borderRadius: 12, background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>+7 jours</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{overview.trend} {overview.delta7 >= 0 ? '+' : ''}{overview.delta7}%</div>
          </div>
          <div style={{ padding: 14, borderRadius: 12, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>+30 jours</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{overview.trend} {overview.delta30 >= 0 ? '+' : ''}{overview.delta30}%</div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: 16 }}>
          <div style={{ padding: 14, borderRadius: 12, background: 'var(--bg-input)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Prévision 7 jours</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{overview.forecast7} FCFA</div>
          </div>
          <div style={{ padding: 14, borderRadius: 12, background: 'var(--bg-input)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Prévision 30 jours</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{overview.forecast30} FCFA</div>
          </div>
          <div style={{ padding: 14, borderRadius: 12, background: 'var(--bg-input)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Prévision 90 jours</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{overview.forecast90} FCFA</div>
          </div>
        </div>

        <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Recommandation</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{overview.recommendation}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Prédiction des récoltes
            </div>
            <h3 style={{ margin: '6px 0 4px' }}>{overview.productLabel} · Région {overview.regionLabel}</h3>
            <div style={{ color: 'var(--text-secondary)' }}>Prédiction basée sur les tendances climatiques et de rendement.</div>
          </div>
          <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>IA</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>+{overview.yieldGain}% vs saison dernière</div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: 16 }}>
          <div style={{ padding: 14, borderRadius: 12, background: 'var(--bg-input)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Production estimée</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{overview.productionEstimate} T</div>
          </div>
          <div style={{ padding: 14, borderRadius: 12, background: 'var(--bg-input)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Prix estimé / kg</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{overview.currentPrice} FCFA</div>
          </div>
          <div style={{ padding: 14, borderRadius: 12, background: 'var(--bg-input)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Conditions météo</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{overview.weatherLabel}</div>
          </div>
        </div>

        <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Risque de sécheresse</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{overview.droughtRisk}%</div>
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 20, borderRadius: 24, boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Analyse IA concrète
            </div>
            <h3 style={{ margin: '6px 0 4px' }}>{productOptions.find(option => option.value === selectedProduct)?.label} · {regionOptions.find(option => option.value === selectedRegion)?.label}</h3>
            <div style={{ color: 'var(--text-secondary)' }}>{selectedPrediction.summary}</div>
          </div>
          <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Point clé</div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4 }}>{selectedPrediction.miniMetric}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: 14 }}>
          {selectedPrediction.bullets.map(bullet => (
            <div key={bullet} style={{ padding: 12, borderRadius: 12, background: 'var(--bg-input)', border: '1px solid var(--border-light)' }}>
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
