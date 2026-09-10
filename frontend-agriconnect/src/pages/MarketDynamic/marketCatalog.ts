export type MarketCatalogProduct = {
  id: string
  name: string
  category: string
  imageUrl: string
  aliases: string[]
}

export type MarketProductLocation = {
  regions: string[]
  cities: string[]
}

export const MARKET_CATALOG: MarketCatalogProduct[] = [
  { id: 'mais', name: 'Maïs', category: 'Céréales', imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=640&q=80', aliases: ['maïs', 'mais', 'corn'] },
  { id: 'haricot', name: 'Haricot', category: 'Légumineuses', imageUrl: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=640&q=80', aliases: ['haricot', 'bean', 'beans'] },
  { id: 'manioc', name: 'Manioc', category: 'Tubercules', imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8f/Manihot_esculenta_dsc07325.jpg/960px-Manihot_esculenta_dsc07325.jpg', aliases: ['manioc', 'cassava'] },
  { id: 'cacao', name: 'Cacao', category: 'Cultures de rente', imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/21/Cacao_pods.jpg/960px-Cacao_pods.jpg', aliases: ['cacao', 'cocoa'] },
  { id: 'riz', name: 'Riz', category: 'Céréales', imageUrl: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=640&q=80', aliases: ['riz', 'rice'] },
  { id: 'pomme-de-terre', name: 'Pomme de terre', category: 'Tubercules', imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=640&q=80', aliases: ['pomme de terre', 'potato'] },
  { id: 'banane', name: 'Banane', category: 'Fruits', imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=640&q=80', aliases: ['banane', 'banana'] },
  { id: 'ananas', name: 'Ananas', category: 'Fruits', imageUrl: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=640&q=80', aliases: ['ananas', 'pineapple'] },
  { id: 'orange', name: 'Orange', category: 'Fruits', imageUrl: 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=640&q=80', aliases: ['orange'] },
  { id: 'mandarine', name: 'Mandarine', category: 'Fruits', imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/49/Mandarin_Oranges_%28Citrus_Reticulata%29.jpg/960px-Mandarin_Oranges_%28Citrus_Reticulata%29.jpg', aliases: ['mandarine', 'tangerine'] },
  { id: 'papaye', name: 'Papaye', category: 'Fruits', imageUrl: 'https://images.unsplash.com/photo-1526318472351-c75fcf070305?auto=format&fit=crop&w=640&q=80', aliases: ['papaye', 'papaya'] },
  { id: 'gombo', name: 'Gombo', category: 'Légumes', imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/26/Okra_%28Abelmoschus_esculentus%29_Feb_2019._DSC_0060_01.jpg/960px-Okra_%28Abelmoschus_esculentus%29_Feb_2019._DSC_0060_01.jpg', aliases: ['gombo', 'okra'] },
  { id: 'aubergine', name: 'Aubergine', category: 'Légumes', imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e5/Green_eggplant%2C_potato%2C_carrot_etc._in_A_typical_Bangladeshi_vegetable_shop.jpg/960px-Green_eggplant%2C_potato%2C_carrot_etc._in_A_typical_Bangladeshi_vegetable_shop.jpg', aliases: ['aubergine', 'eggplant'] },
  { id: 'tomate', name: 'Tomate', category: 'Légumes', imageUrl: 'https://images.unsplash.com/photo-1546470427-227e3e6f1c2f?auto=format&fit=crop&w=640&q=80', aliases: ['tomate', 'tomato'] },
  { id: 'piment', name: 'Piment', category: 'Légumes', imageUrl: 'https://images.unsplash.com/photo-1588252303782-cb80119adde6?auto=format&fit=crop&w=640&q=80', aliases: ['piment', 'chili', 'pepper'] },
  { id: 'oignon', name: 'Oignon', category: 'Légumes', imageUrl: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=640&q=80', aliases: ['oignon', 'onion'] },
  { id: 'ail', name: 'Ail', category: 'Légumes', imageUrl: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=640&q=80', aliases: ['ail', 'garlic'] },
  { id: 'poivron', name: 'Poivron', category: 'Légumes', imageUrl: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=640&q=80', aliases: ['poivron', 'bell pepper'] },
  { id: 'sorgho', name: 'Sorgho', category: 'Céréales', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=640&q=80', aliases: ['sorgho', 'sorghum'] },
  { id: 'millet', name: 'Millet', category: 'Céréales', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=640&q=80', aliases: ['millet'] },
]

export const MARKET_PRODUCT_LOCATIONS: Record<string, MarketProductLocation> = {
  mais: { regions: ['Adamaoua', 'Nord', 'Extrême-Nord'], cities: ['Ngaoundéré', 'Garoua', 'Maroua'] },
  haricot: { regions: ['Ouest', 'Nord-Ouest', 'Adamaoua'], cities: ['Bafoussam', 'Bamenda', 'Ngaoundéré'] },
  manioc: { regions: ['Centre', 'Sud', 'Littoral'], cities: ['Yaoundé', 'Ebolowa', 'Douala'] },
  cacao: { regions: ['Centre', 'Sud', 'Sud-Ouest'], cities: ['Yaoundé', 'Ebolowa', 'Kumba'] },
  riz: { regions: ['Nord', 'Extrême-Nord', 'Nord-Ouest'], cities: ['Garoua', 'Maroua', 'Bamenda'] },
  'pomme-de-terre': { regions: ['Ouest', 'Nord-Ouest'], cities: ['Bafoussam', 'Bamenda'] },
  banane: { regions: ['Littoral', 'Sud-Ouest', 'Sud'], cities: ['Douala', 'Buea', 'Kribi'] },
  ananas: { regions: ['Centre', 'Littoral', 'Sud'], cities: ['Yaoundé', 'Douala', 'Ebolowa'] },
  orange: { regions: ['Centre', 'Est', 'Adamaoua'], cities: ['Yaoundé', 'Bertoua', 'Ngaoundéré'] },
  mandarine: { regions: ['Centre', 'Est'], cities: ['Yaoundé', 'Bertoua'] },
  papaye: { regions: ['Centre', 'Littoral', 'Nord'], cities: ['Yaoundé', 'Douala', 'Garoua'] },
  gombo: { regions: ['Nord', 'Extrême-Nord', 'Adamaoua'], cities: ['Garoua', 'Maroua', 'Ngaoundéré'] },
  aubergine: { regions: ['Ouest', 'Centre', 'Littoral'], cities: ['Bafoussam', 'Yaoundé', 'Douala'] },
  tomate: { regions: ['Ouest', 'Nord', 'Adamaoua'], cities: ['Bafoussam', 'Garoua', 'Ngaoundéré'] },
  piment: { regions: ['Extrême-Nord', 'Nord', 'Ouest'], cities: ['Maroua', 'Garoua', 'Bafoussam'] },
  oignon: { regions: ['Nord', 'Extrême-Nord', 'Ouest'], cities: ['Garoua', 'Maroua', 'Bafoussam'] },
  ail: { regions: ['Ouest', 'Nord-Ouest'], cities: ['Bafoussam', 'Bamenda'] },
  poivron: { regions: ['Ouest', 'Centre', 'Littoral'], cities: ['Bafoussam', 'Yaoundé', 'Douala'] },
  sorgho: { regions: ['Nord', 'Extrême-Nord', 'Adamaoua'], cities: ['Garoua', 'Maroua', 'Ngaoundéré'] },
  millet: { regions: ['Extrême-Nord', 'Nord'], cities: ['Maroua', 'Garoua'] },
}

export function normalizeCatalogName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function findCatalogProduct(title: string) {
  const normalizedTitle = normalizeCatalogName(title)
  return MARKET_CATALOG.find(product =>
    product.aliases.some(alias => normalizedTitle.includes(normalizeCatalogName(alias))),
  )
}
