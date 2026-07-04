import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import {
  Briefcase,
  CloudRain,
  CloudSun,
  Dumbbell,
  ExternalLink,
  Footprints,
  Layers,
  Mars,
  Mountain,
  Palette,
  RefreshCcw,
  Shirt,
  Sparkles,
  Sun,
  Thermometer,
  Umbrella,
  Venus,
  Wind,
} from 'lucide-react'
import outfitDate from './assets/outfit-date.png'
import outfitOffice from './assets/outfit-office.png'
import outfitOutdoor from './assets/outfit-outdoor.png'
import outfitSport from './assets/outfit-sport.png'
import styleBoard from './assets/style-board.png'
import { trackEvent } from './analytics'
import './App.css'

type Weather = 'sunny' | 'cloudy' | 'rainy' | 'windy'
type Occasion = 'work' | 'campus' | 'date' | 'sport' | 'outdoor'
type Commute = 'walk' | 'transit' | 'bike' | 'drive'
type Gender = 'men' | 'women'
type BrandId =
  | 'smart'
  | 'nike'
  | 'adidas'
  | 'uniqlo'
  | 'zara'
  | 'hm'
  | 'thenorthface'
  | 'newbalance'
  | 'lululemon'
  | 'arcteryx'
  | 'underarmour'

type Brand = {
  id: BrandId
  name: string
  shortName: string
  role: string
  signature: string
  pieces: string[]
  bestFor: Occasion[]
  palette: string[]
  source: string
}

type OutfitLogo = {
  initials: string
  name: string
  caption: string
  color: string
  accent: string
}

type Outfit = {
  headline: string
  mood: string
  layers: string[]
  essentials: string[]
  reason: string
  paletteName: string
  palette: string[]
  brand: Brand
  visual: string
  logo: OutfitLogo
  variantLabel: string
  weatherTip: string
}

let hasTrackedInitialPageView = false

const brands: Brand[] = [
  {
    id: 'smart',
    name: '智能混搭',
    shortName: 'Mix',
    role: '按天气和场合自动挑品牌方向',
    signature: '功能、基础款和趋势单品混合，适合日常快速出门。',
    pieces: ['轻外套', '基础 T 恤', '直筒裤', '舒适运动鞋'],
    bestFor: ['work', 'campus', 'date', 'sport', 'outdoor'],
    palette: ['#202225', '#6e8b7c', '#e46f57', '#f2c66d'],
    source: 'local',
  },
  {
    id: 'nike',
    name: 'Nike',
    shortName: 'Nike',
    role: '运动生活 / 训练通勤',
    signature: 'Dri-FIT、Sportswear、Windrunner 和 Tech Fleece 适合做运动街头底盘。',
    pieces: ['Dri-FIT 上衣', 'Windrunner 外套', 'Tech Fleece 长裤', '运动鞋'],
    bestFor: ['campus', 'sport', 'outdoor'],
    palette: ['#111111', '#f5f5f0', '#f15a3b', '#536d8f'],
    source: 'https://www.nike.com/w/mens-clothing-6ymx6znik1',
  },
  {
    id: 'adidas',
    name: 'adidas',
    shortName: 'adidas',
    role: '三条纹复古 / 运动表现',
    signature: 'Originals 适合复古街头，Performance 适合训练和轻户外。',
    pieces: ['三条纹夹克', '运动卫衣', '针织运动裤', 'Samba / Gazelle 风格鞋'],
    bestFor: ['campus', 'sport', 'date'],
    palette: ['#0d0f13', '#f4f1e8', '#1b5fbf', '#65a86f'],
    source: 'https://www.adidas.com/us/clothing',
  },
  {
    id: 'uniqlo',
    name: 'UNIQLO',
    shortName: 'UNIQLO',
    role: 'LifeWear 基础款',
    signature: 'AIRism、针织、衬衫和轻外套适合干净、耐穿的日常搭配。',
    pieces: ['AIRism 内搭', '牛津纺衬衫', '针织开衫', '感动裤 / 直筒裤'],
    bestFor: ['work', 'campus', 'date'],
    palette: ['#232323', '#f7f1e8', '#9bb8ae', '#c94d3c'],
    source: 'https://www.uniqlo.com/us/en/contents/lifewear/',
  },
  {
    id: 'zara',
    name: 'ZARA',
    shortName: 'ZARA',
    role: '都市趋势 / 约会感',
    signature: '西装、衬衫、廓形裤和季节色适合做更利落的城市风格。',
    pieces: ['短款夹克', '廓形衬衫', '西装裤', '乐福鞋'],
    bestFor: ['work', 'date'],
    palette: ['#1f1f1f', '#faf7ef', '#9a6a51', '#d84e4b'],
    source: 'https://www.zara.com/',
  },
  {
    id: 'hm',
    name: 'H&M',
    shortName: 'H&M',
    role: '趋势快搭 / 预算友好',
    signature: '基础 T、牛仔、针织和外套好组合，适合快速补齐衣橱。',
    pieces: ['罗纹背心', '牛仔外套', '宽松牛仔裤', '帆布鞋'],
    bestFor: ['campus', 'date', 'work'],
    palette: ['#2b2d2f', '#fff8ea', '#c7473d', '#e2b85d'],
    source: 'https://www2.hm.com/en_us/index.html',
  },
  {
    id: 'thenorthface',
    name: 'The North Face',
    shortName: 'TNF',
    role: '户外功能 / 城市机能',
    signature: '冲锋衣、抓绒、徒步裤和防水层适合雨天、风天和户外。',
    pieces: ['防水夹克', '抓绒中层', '徒步长裤', '户外鞋'],
    bestFor: ['outdoor', 'campus'],
    palette: ['#17191c', '#e8ece8', '#d43f34', '#6f8478'],
    source: 'https://www.thenorthface.com/en-us/mens',
  },
  {
    id: 'newbalance',
    name: 'New Balance',
    shortName: 'NB',
    role: '复古跑鞋 / 休闲运动',
    signature: '运动裤、卫衣、跑步外套和复古鞋适合轻松但有型的日常。',
    pieces: ['复古运动鞋', '圆领卫衣', '梭织短裤', '跑步夹克'],
    bestFor: ['campus', 'sport'],
    palette: ['#1f2933', '#f2efe8', '#9fa7ae', '#d95043'],
    source: 'https://www.newbalance.com/men/clothing/',
  },
  {
    id: 'lululemon',
    name: 'lululemon',
    shortName: 'lululemon',
    role: '瑜伽训练 / 高弹通勤',
    signature: '技术面料、训练裤、上衣和轻外套适合运动后直接进日常。',
    pieces: ['训练 T 恤', '弹力长裤', '轻量连帽衫', '腰包'],
    bestFor: ['sport', 'work', 'campus'],
    palette: ['#201d1f', '#f3eee6', '#7f8f7a', '#bb483c'],
    source: 'https://shop.lululemon.com/c/men-clothes/n1oxc7',
  },
  {
    id: 'arcteryx',
    name: "Arc'teryx",
    shortName: "Arc'teryx",
    role: '高性能户外 / 极简机能',
    signature: '硬壳、软壳、保暖层和轻量单品适合天气复杂的一天。',
    pieces: ['硬壳夹克', '软壳裤', '保暖中层', '防水包'],
    bestFor: ['outdoor', 'work'],
    palette: ['#111416', '#eef0e7', '#5f746b', '#f0a44d'],
    source: 'https://arcteryx.com/us/en/c/mens/jackets',
  },
  {
    id: 'underarmour',
    name: 'Under Armour',
    shortName: 'UA',
    role: '训练性能 / 吸湿速干',
    signature: 'HeatGear、ColdGear、训练短裤和卫衣适合高活动量日程。',
    pieces: ['速干训练上衣', '压缩内搭', '训练短裤', '抓地训练鞋'],
    bestFor: ['sport', 'outdoor'],
    palette: ['#151719', '#f7f3eb', '#5f7282', '#c43f3a'],
    source: 'https://www.underarmour.com/en-us/c/mens/clothing/',
  },
]

const weatherOptions: Array<{ id: Weather; label: string; icon: typeof Sun }> = [
  { id: 'sunny', label: '晴天', icon: Sun },
  { id: 'cloudy', label: '多云', icon: CloudSun },
  { id: 'rainy', label: '雨天', icon: CloudRain },
  { id: 'windy', label: '风大', icon: Wind },
]

const genderOptions: Array<{ id: Gender; label: string; icon: typeof Mars }> = [
  { id: 'men', label: '男士', icon: Mars },
  { id: 'women', label: '女士', icon: Venus },
]

const occasionOptions: Array<{
  id: Occasion
  label: string
  icon: typeof Briefcase
}> = [
  { id: 'work', label: '上班', icon: Briefcase },
  { id: 'campus', label: '校园', icon: Shirt },
  { id: 'date', label: '约会', icon: Sparkles },
  { id: 'sport', label: '运动', icon: Dumbbell },
  { id: 'outdoor', label: '户外', icon: Mountain },
]

const commuteOptions: Array<{ id: Commute; label: string }> = [
  { id: 'walk', label: '步行多' },
  { id: 'transit', label: '地铁公交' },
  { id: 'bike', label: '骑行' },
  { id: 'drive', label: '开车' },
]

const paletteNames = [
  '深海蓝 + 鼠尾草绿',
  '奶油白 + 焦糖棕',
  '炭黑 + 番茄红',
  '雾灰 + 柠檬黄',
]

const outfitVisuals: Record<Occasion, string> = {
  work: outfitOffice,
  campus: outfitSport,
  date: outfitDate,
  sport: outfitSport,
  outdoor: outfitOutdoor,
}

const variantLabels = ['首选方案', '轻松替换', '天气备选']

const outfitLogos: OutfitLogo[] = [
  {
    initials: 'CT',
    name: 'City Tilt',
    caption: '都市通勤徽标',
    color: '#203A5F',
    accent: '#E6B94F',
  },
  {
    initials: 'MV',
    name: 'Move Lab',
    caption: '运动机能徽标',
    color: '#E9694D',
    accent: '#203A5F',
  },
  {
    initials: 'TR',
    name: 'Trail Ready',
    caption: '户外防护徽标',
    color: '#789487',
    accent: '#E9694D',
  },
]

function pickBrand(
  selectedBrand: BrandId,
  weather: Weather,
  occasion: Occasion,
  temperature: number,
) {
  if (selectedBrand !== 'smart') {
    return brands.find((brand) => brand.id === selectedBrand) ?? brands[0]
  }

  if (weather === 'rainy' || weather === 'windy') {
    return brands.find((brand) => brand.id === (temperature < 12 ? 'arcteryx' : 'thenorthface'))!
  }

  if (occasion === 'sport') {
    return brands.find((brand) => brand.id === (temperature > 24 ? 'underarmour' : 'nike'))!
  }

  if (occasion === 'outdoor') {
    return brands.find((brand) => brand.id === 'thenorthface')!
  }

  if (occasion === 'work') {
    return brands.find((brand) => brand.id === (temperature > 26 ? 'uniqlo' : 'zara'))!
  }

  if (occasion === 'date') {
    return brands.find((brand) => brand.id === 'adidas')!
  }

  return brands.find((brand) => brand.id === 'newbalance')!
}

function getTemperatureLayers(temperature: number) {
  if (temperature <= 5) {
    return {
      headline: '保暖分层，外层要抗风',
      mood: '厚实、利落、低饱和',
      layers: ['保暖内搭', '羊毛衫或抓绒', '羽绒服 / 派克大衣', '厚长裤', '保暖袜和防滑鞋'],
    }
  }

  if (temperature <= 14) {
    return {
      headline: '轻保暖通勤，别让早晚温差偷袭',
      mood: '有层次但不臃肿',
      layers: ['长袖内搭', '针织衫或卫衣', '夹克 / 风衣 / 轻薄羽绒', '直筒裤', '缓震运动鞋'],
    }
  }

  if (temperature <= 23) {
    return {
      headline: '清爽叠穿，外套随手拿',
      mood: '干净、轻盈、可切换',
      layers: ['棉 T 或衬衫', '薄开衫 / 教练夹克', '牛仔裤 / 工装裤', '低帮鞋', '小包'],
    }
  }

  if (temperature <= 30) {
    return {
      headline: '透气优先，版型保持精神',
      mood: '轻薄、松弛、有颜色',
      layers: ['速干 T / 宽松衬衫', '薄长裤 / 百慕大短裤', '透气运动鞋', '防晒帽', '轻便斜挎包'],
    }
  }

  return {
    headline: '高温简化，面料比层次更重要',
    mood: '降温、浅色、少负担',
    layers: ['AIRism / 速干短袖', '短裤或薄阔腿裤', '凉感袜', '网面鞋 / 凉鞋', '墨镜'],
  }
}

function getGenderLabel(gender: Gender) {
  return gender === 'men' ? '男士' : '女士'
}

function getGenderPieces(gender: Gender, temperature: number, occasion: Occasion, brand: Brand, seed: number) {
  const brandPiece = brand.pieces[Math.abs(seed) % brand.pieces.length]

  if (gender === 'men') {
    if (temperature <= 5) {
      return ['高领保暖内搭', '羊毛衫 / 抓绒中层', '派克大衣 / 羽绒服', '直筒厚长裤', brandPiece]
    }

    if (temperature <= 14) {
      return ['长袖 T / 牛津纺衬衫', '针织衫或连帽卫衣', '短夹克 / 风衣', '直筒休闲裤', brandPiece]
    }

    if (temperature <= 23) {
      return ['干净白 T / 开领衬衫', occasion === 'work' ? '轻薄西装外套' : '教练夹克', '牛仔裤 / 工装裤', '低帮运动鞋', brandPiece]
    }

    if (temperature <= 30) {
      return ['速干 T / 宽松衬衫', '薄长裤 / 百慕大短裤', '透气运动鞋', '棒球帽', brandPiece]
    }

    return ['速干短袖', '轻薄短裤', '网面鞋 / 凉鞋', '墨镜', brandPiece]
  }

  if (temperature <= 5) {
    return ['发热内搭 / 高领针织', '羊毛开衫或抓绒中层', '长款羽绒服 / 羊毛大衣', '厚阔腿裤 / 加绒半裙', brandPiece]
  }

  if (temperature <= 14) {
    return ['贴身长袖 / 衬衫', '针织开衫或短卫衣', '短外套 / 风衣', '直筒裤 / 中长半裙', brandPiece]
  }

  if (temperature <= 23) {
    return ['T 恤 / 轻薄衬衫', occasion === 'date' ? '短开衫 / 小香风外套' : '薄开衫 / 教练夹克', '阔腿裤 / 牛仔裙', '低帮鞋 / 乐福鞋', brandPiece]
  }

  if (temperature <= 30) {
    return ['凉感 T / 宽松衬衫', '薄阔腿裤 / 百慕大短裤', '透气运动鞋 / 凉鞋', '防晒帽', brandPiece]
  }

  return ['AIRism / 速干短袖', '薄半裙 / 短裤', '凉感袜', '网面鞋 / 凉鞋', brandPiece]
}

function getGenderOccasionTip(gender: Gender, occasion: Occasion) {
  const tips: Record<Gender, Record<Occasion, string>> = {
    men: {
      work: '男士上班场景建议保持肩线、领口和鞋面干净，整体会更利落。',
      campus: '男士校园穿搭可以把背包和鞋作为重点，耐走和耐脏优先。',
      date: '男士约会保留一个质感亮点，比如外套面料、腕表或干净鞋型。',
      sport: '男士运动日减少厚重层次，优先速干和活动空间。',
      outdoor: '男士户外搭配注意裤脚、包带和外套下摆的稳定性。',
    },
    women: {
      work: '女士上班场景建议兼顾线条和舒适度，外套、鞋跟高度和包容量要匹配日程。',
      campus: '女士校园穿搭可以保留颜色亮点，但鞋底和包重更影响一整天体验。',
      date: '女士约会可以突出一个视觉重点，比如短外套、半裙线条或耳饰。',
      sport: '女士运动日优先支撑、透气和可替换外层，避免配饰影响活动。',
      outdoor: '女士户外搭配注意防晒、防风和发型固定，收纳位也要留够。',
    },
  }

  return tips[gender][occasion]
}

function getWeatherTip(weather: Weather, temperature: number, occasion: Occasion) {
  if (weather === 'sunny' && temperature >= 30) {
    return occasion === 'sport'
      ? '晴天高温运动，速干上衣、轻薄帽子和补水瓶要一起带。'
      : '晴天高温，防晒、浅色外层和透气鞋会比多叠穿更重要。'
  }

  if (weather === 'rainy') {
    return occasion === 'work'
      ? '雨天通勤，外层防泼水、鞋底防滑，进办公室后也要保持利落。'
      : '雨天出门，把伞、防滑鞋和不怕湿的外层放在优先级第一位。'
  }

  if (weather === 'windy') {
    return occasion === 'outdoor'
      ? '风大户外，外套下摆、帽檐和包带都要能固定。'
      : '风大时少选轻飘长外搭，短夹克或有抽绳的外层更稳。'
  }

  if (temperature <= 10) {
    return '低温天气别只看外套，颈部、脚踝和手部保暖也要补上。'
  }

  const tips: Record<Weather, string> = {
    sunny: '加一件防晒单品，浅色和透气面料会更舒服。',
    cloudy: '保持一层可脱外套，室内外温差更好处理。',
    rainy: '鞋底防滑、外层防泼水，包里放折叠伞。',
    windy: '外套下摆和帽檐要稳，避免太轻飘的长外搭。',
  }
  return tips[weather]
}

function getEnvironmentEssential(temperature: number, weather: Weather, occasion: Occasion, gender: Gender) {
  const occasionFocus: Record<Occasion, string> = {
    work: '上班场景要保持领口和裤线干净，避免看起来太随意。',
    campus: '校园日程走动多，背包、鞋底和外套收纳都要轻便。',
    date: '约会可以留一个颜色或材质亮点，但配饰不要堆太满。',
    sport: '运动日优先排汗和活动幅度，减少厚重配饰。',
    outdoor: '户外场景先看防风、防雨和收纳，再考虑造型层次。',
  }
  const genderTip = getGenderOccasionTip(gender, occasion)

  if (weather === 'rainy') {
    return `${getGenderLabel(gender)} · ${temperature}°C 雨天：外层和鞋子先选防水防滑，${occasionFocus[occasion]} ${genderTip}`
  }

  if (weather === 'windy') {
    return `${getGenderLabel(gender)} · ${temperature}°C 风大：外套、帽子和裤脚要固定，${occasionFocus[occasion]} ${genderTip}`
  }

  if (temperature >= 30) {
    return `${getGenderLabel(gender)} · ${temperature}°C 高温：少层次、重透气，${occasionFocus[occasion]} ${genderTip}`
  }

  if (temperature <= 10) {
    return `${getGenderLabel(gender)} · ${temperature}°C 低温：内搭保暖和外层挡风都要到位，${occasionFocus[occasion]} ${genderTip}`
  }

  return `${getGenderLabel(gender)} · ${temperature}°C ${weather === 'sunny' ? '晴天' : '多云'}：保留一层可脱外套，${occasionFocus[occasion]} ${genderTip}`
}

function getOccasionNotes(occasion: Occasion, brand: Brand) {
  const notes: Record<Occasion, string[]> = {
    work: ['领口保持整洁', '裤装选直线条', '鞋子避开过度运动感'],
    campus: ['背包容量留够', '鞋底要耐走', '颜色可以更轻松'],
    date: ['上半身留一个亮点', '面料选更有质感的', '香水和配饰少量就好'],
    sport: ['优先速干排汗', '减少金属配饰', '鞋子跟运动类型匹配'],
    outdoor: ['外层抗风抗雨', '裤脚不要拖地', '留一个收纳位给雨具'],
  }

  return [...notes[occasion], `${brand.shortName}：${brand.pieces[0]} 可以当主视觉单品`]
}

function getCommuteEssential(commute: Commute, weather: Weather, temperature: number, occasion: Occasion, gender: Gender) {
  const commuteBase: Record<Commute, string> = {
    walk: '步行多：鞋底缓震、袜子透气，裤脚不要拖地。',
    transit: '地铁公交：外套要方便单手脱穿，包里留出收纳位。',
    bike: '骑行：防风外层、固定裤脚和斜挎包带会更省心。',
    drive: '开车：外套别太臃肿，坐下后肩背和腰部要舒服。',
  }

  const weatherAddOn: Record<Weather, string> = {
    sunny: temperature >= 28 ? '太阳强时加墨镜或帽子。' : '晴天可以把鞋包颜色做得轻一点。',
    cloudy: temperature <= 16 ? '多云偏凉时带薄外套。' : '多云天保持一层可拆层就够。',
    rainy: '雨天要优先防滑鞋底和可折叠雨具。',
    windy: '风大时包带、帽檐、外套下摆都要稳。',
  }

  const occasionAddOn: Record<Occasion, string> = {
    work: '进办公室前能快速整理仪容最重要。',
    campus: '课间移动多，背负重量别太高。',
    date: '到达后保持衣服不皱，比堆单品更加分。',
    sport: '运动后预留换洗或除味空间。',
    outdoor: '路线长的话，水、纸巾和备用袜优先级很高。',
  }
  const genderAddOn: Record<Gender, string> = {
    men: '男士注意鞋面、裤脚和外套肩线，通勤后更容易保持精神。',
    women: '女士注意鞋跟高度、包重和外套长度，走动多时舒适度更稳。',
  }

  return `${commuteBase[commute]} ${weatherAddOn[weather]} ${occasionAddOn[occasion]} ${genderAddOn[gender]}`
}

function createOutfit(
  temperature: number,
  weather: Weather,
  occasion: Occasion,
  commute: Commute,
  selectedBrand: BrandId,
  gender: Gender,
  seed: number,
  variantIndex = 0,
  visualOccasion: Occasion = occasion,
): Outfit {
  const brand = pickBrand(selectedBrand, weather, occasion, temperature)
  const temperatureLook = getTemperatureLayers(temperature)
  const paletteIndex = Math.abs(seed + variantIndex + temperature + brand.name.length) % paletteNames.length
  const genderPieces = getGenderPieces(gender, temperature, occasion, brand, seed + variantIndex)
  const essentials = [
    getEnvironmentEssential(temperature, weather, occasion, gender),
    getCommuteEssential(commute, weather, temperature, occasion, gender),
    `${brand.shortName} 品牌方向：${brand.signature}`,
  ]

  return {
    headline: temperatureLook.headline,
    mood: temperatureLook.mood,
    layers: genderPieces,
    essentials,
    reason: `${getOccasionNotes(occasion, brand).join('；')}；${getGenderOccasionTip(gender, occasion)}`,
    paletteName: paletteNames[paletteIndex],
    palette: brand.palette,
    brand,
    visual: outfitVisuals[visualOccasion],
    logo: outfitLogos[variantIndex % outfitLogos.length],
    variantLabel: variantLabels[variantIndex % variantLabels.length],
    weatherTip: getWeatherTip(weather, temperature, occasion),
  }
}

function createOutfitVariants(
  temperature: number,
  weather: Weather,
  occasion: Occasion,
  commute: Commute,
  selectedBrand: BrandId,
  gender: Gender,
  seed: number,
) {
  const weatherSafeBrand: BrandId = weather === 'rainy' || weather === 'windy' ? 'thenorthface' : 'uniqlo'
  const activeBrand: BrandId = occasion === 'sport' || occasion === 'outdoor' ? 'nike' : 'adidas'
  const alternateOccasion: Occasion = occasion === 'work' ? 'campus' : occasion === 'outdoor' ? 'sport' : 'work'

  return [
    createOutfit(temperature, weather, occasion, commute, selectedBrand, gender, seed, 0, occasion),
    createOutfit(temperature, weather, alternateOccasion, commute, activeBrand, gender, seed + 3, 1, alternateOccasion),
    createOutfit(temperature, weather, weather === 'rainy' || weather === 'windy' ? 'outdoor' : occasion, commute, weatherSafeBrand, gender, seed + 6, 2, weather === 'rainy' || weather === 'windy' ? 'outdoor' : occasion),
  ]
}

function App() {
  const [temperature, setTemperature] = useState(24)
  const [weather, setWeather] = useState<Weather>('cloudy')
  const [occasion, setOccasion] = useState<Occasion>('work')
  const [commute, setCommute] = useState<Commute>('transit')
  const [gender, setGender] = useState<Gender>('men')
  const [brandId, setBrandId] = useState<BrandId>('smart')
  const [seed, setSeed] = useState(2)
  const [rouletteIndex, setRouletteIndex] = useState(0)
  const [wheelRotation, setWheelRotation] = useState(0)
  const [isWheelSpinning, setIsWheelSpinning] = useState(false)

  useEffect(() => {
    if (hasTrackedInitialPageView) {
      return
    }

    hasTrackedInitialPageView = true
    trackEvent('page_view')
  }, [])

  const outfits = useMemo(
    () => createOutfitVariants(temperature, weather, occasion, commute, brandId, gender, seed),
    [temperature, weather, occasion, commute, brandId, gender, seed],
  )
  const outfit = outfits[rouletteIndex % outfits.length] ?? outfits[0]

  const spinWheel = () => {
    if (isWheelSpinning) {
      return
    }

    trackEvent('wheel_spin', {
      temperature,
      weather,
      occasion,
      commute,
      gender,
      brandId,
    })

    const nextIndex = Math.floor(Math.random() * outfits.length)
    const segmentAngle = 360 / outfits.length
    const targetAngle = nextIndex * segmentAngle + segmentAngle / 2

    setIsWheelSpinning(true)
    setWheelRotation((currentRotation) => {
      const normalizedRotation = ((currentRotation % 360) + 360) % 360
      const desiredRotation = (360 - targetAngle) % 360
      const correction = (desiredRotation - normalizedRotation + 360) % 360
      const extraTurns = 4 + Math.floor(Math.random() * 3)
      return currentRotation + extraTurns * 360 + correction
    })

    window.setTimeout(() => {
      setRouletteIndex(nextIndex)
      setIsWheelSpinning(false)
    }, 1900)
  }

  const today = new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date())

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand-mark" href="#today">
          <img className="logo-mark" src={`${import.meta.env.BASE_URL}logo.svg`} alt="" />
          <span>今天穿什么</span>
        </a>
        <nav className="top-actions" aria-label="页面导航">
          <a href="#brand-lab">品牌库</a>
        </nav>
      </header>

      <section className="studio" id="today">
        <div className="studio-copy">
          <span className="eyebrow">{today}</span>
          <h1>根据天气、场合和品牌偏好，生成今天的穿搭。</h1>
          <p>
            内置 Nike、adidas、UNIQLO、ZARA、H&M、The North Face 等品牌风格线索，本地运行也能直接用。
          </p>

          <div className="visual-strip" aria-hidden="true">
            <img src={styleBoard} alt="" />
          </div>
        </div>

        <section className="control-panel" aria-labelledby="controls-title">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">今日条件</span>
              <h2 id="controls-title">穿搭参数</h2>
            </div>
            <button
              className="icon-button"
              type="button"
              title="换一套"
              onClick={() => {
                trackEvent('shuffle_outfit', { temperature, weather, occasion, commute, gender, brandId })
                setSeed((value) => value + 1)
              }}
            >
              <RefreshCcw size={18} />
            </button>
          </div>

          <label className="temperature-control" htmlFor="temperature">
            <span>
              <Thermometer size={18} />
              气温
            </span>
            <strong>{temperature}°C</strong>
          </label>
          <input
            id="temperature"
            type="range"
            min="-5"
            max="40"
            value={temperature}
            onChange={(event) => setTemperature(Number(event.target.value))}
          />

          <div className="segmented gender-grid" aria-label="男女区分">
            {genderOptions.map((item) => {
              const Icon = item.icon
              return (
                <button
                  className={gender === item.id ? 'active' : ''}
                  key={item.id}
                  type="button"
                  onClick={() => {
                    trackEvent('filter_change', { filter: 'gender', value: item.id })
                    setGender(item.id)
                  }}
                >
                  <Icon size={17} />
                  {item.label}
                </button>
              )
            })}
          </div>

          <div className="segmented" aria-label="天气">
            {weatherOptions.map((item) => {
              const Icon = item.icon
              return (
                <button
                  className={weather === item.id ? 'active' : ''}
                  key={item.id}
                  type="button"
                  onClick={() => {
                    trackEvent('filter_change', { filter: 'weather', value: item.id })
                    setWeather(item.id)
                  }}
                >
                  <Icon size={17} />
                  {item.label}
                </button>
              )
            })}
          </div>

          <div className="segmented occasion-grid" aria-label="场合">
            {occasionOptions.map((item) => {
              const Icon = item.icon
              return (
                <button
                  className={occasion === item.id ? 'active' : ''}
                  key={item.id}
                  type="button"
                  onClick={() => {
                    trackEvent('filter_change', { filter: 'occasion', value: item.id })
                    setOccasion(item.id)
                  }}
                >
                  <Icon size={17} />
                  {item.label}
                </button>
              )
            })}
          </div>

          <label className="select-row" htmlFor="commute">
            <span>
              <Footprints size={18} />
              出行方式
            </span>
            <select
              id="commute"
              value={commute}
              onChange={(event) => {
                trackEvent('filter_change', { filter: 'commute', value: event.target.value })
                setCommute(event.target.value as Commute)
              }}
            >
              {commuteOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <div className="brand-picker" aria-label="品牌偏好">
            {brands.map((brand) => (
              <button
                className={brandId === brand.id ? 'brand-choice active' : 'brand-choice'}
                key={brand.id}
                type="button"
                onClick={() => {
                  trackEvent('filter_change', { filter: 'brand', value: brand.id })
                  setBrandId(brand.id)
                }}
              >
                <span>{brand.shortName}</span>
                <small>{brand.role}</small>
              </button>
            ))}
          </div>
        </section>
      </section>

      <section className="outfit-showcase" aria-label="多套穿搭推荐">
        <div className="section-head showcase-head">
          <span className="section-kicker">Outfit sets</span>
          <h2>今天可以这样穿</h2>
          <p>一次给出三套可替换方案，先看整体图，再决定具体品牌和单品。</p>
        </div>

        <div className="random-wheel-panel">
          <div className="wheel-stage" aria-live="polite">
            <div className="wheel-pointer"></div>
            <button
              className={isWheelSpinning ? 'random-wheel spinning' : 'random-wheel'}
              type="button"
              onClick={spinWheel}
              disabled={isWheelSpinning}
              style={
                {
                  '--wheel-a': outfits[0]?.logo.color,
                  '--wheel-b': outfits[1]?.logo.color,
                  '--wheel-c': outfits[2]?.logo.color,
                  '--wheel-rotation': `${wheelRotation}deg`,
                } as CSSProperties
              }
            >
              <span className="wheel-face">
                {outfits.map((set, index) => (
                  <span
                    className="wheel-chip"
                    key={set.logo.name}
                    style={{ '--chip-angle': `${index * 120 + 60}deg` } as CSSProperties}
                  >
                    <span className="wheel-chip-mark">{set.logo.initials}</span>
                    <span>{set.logo.name}</span>
                  </span>
                ))}
              </span>
              <span className="wheel-center">
                <Sparkles size={20} />
                {isWheelSpinning ? '转动中' : '抽一套'}
              </span>
            </button>
          </div>

          <article className="wheel-result-card">
            <div
              className="outfit-logo static"
              style={
                {
                  '--logo-accent': outfit.logo.accent,
                  '--logo-color': outfit.logo.color,
                } as CSSProperties
              }
            >
              <span className="outfit-logo-mark">{outfit.logo.initials}</span>
              <span className="outfit-logo-copy">
                <strong>{outfit.logo.name}</strong>
                <small>{outfit.logo.caption}</small>
              </span>
            </div>
            <span className="wheel-result-kicker">{outfit.variantLabel}</span>
            <h3>{outfit.brand.shortName} · {outfit.headline}</h3>
            <p>{outfit.mood}</p>
            <div className="mini-swatches" aria-hidden="true">
              {outfit.palette.map((color) => (
                <span key={color} style={{ backgroundColor: color }} />
              ))}
            </div>
          </article>
        </div>

        <div className="outfit-board" aria-label="穿搭方案对比">
          {outfits.map((set, index) => (
            <article
              className={outfit === set ? 'outfit-set-card selected' : 'outfit-set-card'}
              key={`${set.variantLabel}-${set.brand.id}`}
            >
              <div className="outfit-image">
                <img src={set.visual} alt={`${set.brand.name} ${set.variantLabel}穿搭图`} />
                <div
                  className="outfit-logo"
                  style={
                    {
                      '--logo-accent': set.logo.accent,
                      '--logo-color': set.logo.color,
                    } as CSSProperties
                  }
                >
                  <span className="outfit-logo-mark">{set.logo.initials}</span>
                  <span className="outfit-logo-copy">
                    <strong>{set.logo.name}</strong>
                    <small>{set.logo.caption}</small>
                  </span>
                </div>
              </div>
              <div className="outfit-set-body">
                <div className="card-title">
                  <span>
                    <Sparkles size={18} />
                    {set.variantLabel}
                  </span>
                  <strong>{set.brand.shortName}</strong>
                </div>
                <h3>{set.headline}</h3>
                <p>{set.mood}</p>
                <div className="piece-list compact">
                  {set.layers.slice(0, 5).map((piece) => (
                    <div className="piece-row" key={piece}>
                      <Layers size={17} />
                      <span>{piece}</span>
                    </div>
                  ))}
                </div>
                <div className="outfit-card-actions">
                  <button
                    type="button"
                    onClick={() => {
                      trackEvent('select_outfit', {
                        index,
                        brand: set.brand.id,
                        variant: set.variantLabel,
                      })
                      setRouletteIndex(index)
                    }}
                  >
                    {outfit === set ? '已选中' : '选这套'}
                  </button>
                  <a className="source-link" href={set.brand.source} target="_blank" rel="noreferrer">
                    查看品牌灵感
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="results" aria-label="穿搭策略">
        <article className="result-card">
          <div className="card-title">
            <span>
              <Palette size={18} />
              配色
            </span>
          </div>
          <h2>{outfit.paletteName}</h2>
          <div className="swatches">
            {outfit.palette.map((color) => (
              <span key={color} style={{ backgroundColor: color }} />
            ))}
          </div>
          <p>{outfit.reason}</p>
        </article>

        <article className="result-card">
          <div className="card-title">
            <span>
              <Umbrella size={18} />
              随身清单
            </span>
          </div>
          <ul className="plain-list">
            {outfit.essentials.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="brand-lab" id="brand-lab">
        <div className="section-head">
          <span className="section-kicker">Brand research</span>
          <h2>大品牌穿搭灵感库</h2>
          <p>按官方服装分类和品牌定位整理，点击可打开对应品牌页面。</p>
        </div>

        <div className="brand-grid">
          {brands
            .filter((brand) => brand.id !== 'smart')
            .map((brand) => (
              <article className="brand-card" key={brand.id}>
                <div className="brand-card-top">
                  <div>
                    <span className="brand-logo-text">{brand.shortName}</span>
                    <h3>{brand.name}</h3>
                  </div>
                  <a href={brand.source} target="_blank" rel="noreferrer" title={`打开 ${brand.name} 官方页面`}>
                    <ExternalLink size={17} />
                  </a>
                </div>
                <p>{brand.signature}</p>
                <div className="mini-swatches" aria-hidden="true">
                  {brand.palette.map((color) => (
                    <span key={color} style={{ backgroundColor: color }} />
                  ))}
                </div>
                <div className="tag-row">
                  {brand.pieces.slice(0, 3).map((piece) => (
                    <span key={piece}>{piece}</span>
                  ))}
                </div>
              </article>
            ))}
        </div>
      </section>
    </main>
  )
}

export default App
