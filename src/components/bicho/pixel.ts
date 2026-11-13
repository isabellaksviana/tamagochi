import type { CorGato, Especie, Expressao } from './cores'

// o gato em pixel art: uma grade de 45 × 49 quadradinhos, montada parte por parte
// (rabo, corpo, patas, orelhas, cabeça) e com o rosto desenhado pixel por pixel
export const LARGURA = 45
export const ALTURA = 49

type Pelagem = {
  contorno: string
  pelo: string
  // manchas (tricolor): a da esquerda e a da direita
  manchaEsquerda?: string
  manchaDireita?: string
  // listras (laranja e cinza)
  listra?: string
  orelha: string
  // o traço do rosto (olho fechado, boca) e a cor do olho aberto
  traco: string
  olho: string
  // bigode: o do gato é comprido, o do coelho é curtinho; capivara e tartaruga não têm
  bigode?: 'longo' | 'curto' | 'nenhum'
  // a cor do nariz (a capivara tem o narizão escuro)
  nariz?: string
}

const PELAGENS: Record<CorGato, Pelagem> = {
  laranja: { contorno: '#5B3A36', pelo: '#FFD7B0', listra: '#F2A06A', orelha: '#FFBCC8', traco: '#5B3A36', olho: '#3A2522' },
  preto: { contorno: '#1F1A21', pelo: '#3E3540', orelha: '#F4A7B0', traco: '#FFE8D6', olho: '#F2C94C' },
  branco: { contorno: '#5B3A36', pelo: '#FFFBF7', orelha: '#FFBCC8', traco: '#5B3A36', olho: '#3A2522' },
  cinza: { contorno: '#5B3A36', pelo: '#D6CFD2', listra: '#958B92', orelha: '#FFBCC8', traco: '#5B3A36', olho: '#3A2522' },
  tricolor: {
    contorno: '#5B3A36',
    pelo: '#FFF8F0',
    manchaEsquerda: '#FFCBA4',
    manchaDireita: '#A99AA6',
    orelha: '#FFBCC8',
    traco: '#5B3A36',
    olho: '#3A2522',
  },
}

// cores que não mudam com a pelagem
const PUPILA = '#3A2522'
const BRILHO = '#FFFFFF'
const BOCHECHA = '#FFA9BE'
const NARIZ = '#FF8FA8'
const BOCA = '#C2555F'
const LINGUA = '#FF9FB3'
const AMARELO = '#F6C343'
const CORACAO = '#FF8FB0'
const LAGRIMA = '#8EC5F0'
const SONO = '#9B8BC9'
const RAIVA = '#E5484D'

type Ponto = [number, number]
export type Grade = (string | null)[][]

// as ferramentas de desenho, iguais pra todos os bichos: uma grade vazia e jeitos de pintar nela
function ferramentas(contorno: string) {
  const g: Grade = Array.from({ length: ALTURA }, () => Array<string | null>(LARGURA).fill(null))

  const pinta = (x: number, y: number, c: string) => {
    if (x >= 0 && y >= 0 && x < LARGURA && y < ALTURA) g[y]![x] = c
  }
  const pintaVarios = (c: string, pontos: Ponto[]) => pontos.forEach(([x, y]) => pinta(x, y, c))
  // o mesmo desenho dos dois lados do rosto (o centro da cabeça é x = 21)
  const espelho = (pontos: Ponto[]): Ponto[] => [...pontos, ...pontos.map(([x, y]): Ponto => [42 - x, y])]

  // uma parte do bicho: primeiro o contorno de 1 pixel em volta, depois o recheio
  function parte(dentro: (x: number, y: number) => boolean, recheio: (x: number, y: number) => string) {
    const s = new Set<number>()
    for (let y = 0; y < ALTURA; y++) for (let x = 0; x < LARGURA; x++) if (dentro(x, y)) s.add(y * LARGURA + x)
    const tem = (x: number, y: number) => x >= 0 && y >= 0 && x < LARGURA && y < ALTURA && s.has(y * LARGURA + x)
    for (let y = 0; y < ALTURA; y++) {
      for (let x = 0; x < LARGURA; x++) {
        if (!tem(x, y) && (tem(x - 1, y) || tem(x + 1, y) || tem(x, y - 1) || tem(x, y + 1))) pinta(x, y, contorno)
      }
    }
    for (const i of s) pinta(i % LARGURA, Math.floor(i / LARGURA), recheio(i % LARGURA, Math.floor(i / LARGURA)))
  }
  const elipse = (cx: number, cy: number, rx: number, ry: number) => (x: number, y: number) =>
    ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1
  const triangulo = (a: Ponto, b: Ponto, c: Ponto) => (x: number, y: number) => {
    const lado = (q: Ponto, r: Ponto) => (x - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (y - r[1])
    const d1 = lado(a, b)
    const d2 = lado(b, c)
    const d3 = lado(c, a)
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))
  }
  return { g, pinta, pintaVarios, espelho, parte, elipse, triangulo }
}

// o desenho de qualquer bicho: cada espécie tem o seu corpo; o rosto é o mesmo pra todos
export function bichoEmPixel(especie: Especie, cor: CorGato, expressao: Expressao): Grade {
  if (especie === 'coelho') return coelhoEmPixel(cor, expressao)
  if (especie === 'capivara') return capivaraEmPixel(cor, expressao)
  if (especie === 'tartaruga') return tartarugaEmPixel(cor, expressao)
  return gatoEmPixel(cor, expressao)
}

function gatoEmPixel(cor: CorGato, expressao: Expressao): Grade {
  const p = PELAGENS[cor]
  const { g, pinta, pintaVarios, espelho, parte, elipse, triangulo } = ferramentas(p.contorno)

  // ---------- rabo: bolinhas ao longo de uma curva, com listras ----------
  const curva: [number, number, number][] = []
  for (let t = 0; t <= 1; t += 0.02) {
    const u = 1 - t
    const x = u ** 3 * 27 + 3 * u * u * t * 39 + 3 * u * t * t * 43 + t ** 3 * 38
    const y = u ** 3 * 41 + 3 * u * u * t * 45 + 3 * u * t * t * 36 + t ** 3 * 30
    curva.push([x, y, t])
  }
  const pertoDoRabo = (x: number, y: number) => curva.find(([cx, cy]) => (x - cx) ** 2 + (y - cy) ** 2 <= 2.4 ** 2)
  const listraDoRabo = p.manchaDireita ?? p.listra
  parte(
    (x, y) => pertoDoRabo(x, y) !== undefined,
    (x, y) => {
      const faixa = Math.floor((pertoDoRabo(x, y)?.[2] ?? 0) * 6) % 2
      if (listraDoRabo === undefined) return p.pelo
      return faixa ? listraDoRabo : (p.manchaEsquerda ?? p.pelo)
    },
  )

  // ---------- corpo ----------
  parte(elipse(21, 38, 10, 9), (x, y) => {
    if (p.manchaEsquerda && (x - 12) ** 2 + (y - 44) ** 2 <= 30) return p.manchaEsquerda
    if (p.manchaDireita && (x - 30) ** 2 + (y - 39) ** 2 <= 18) return p.manchaDireita
    return p.pelo
  })
  if (p.listra) pintaVarios(p.listra, espelho([[12, 36], [13, 36], [12, 39], [13, 39]]))

  // ---------- patinhas ----------
  parte(elipse(16, 45, 3.6, 2.2), () => p.pelo)
  parte(elipse(26, 45, 3.6, 2.2), () => p.pelo)
  pintaVarios(p.contorno, [[15, 46], [17, 46], [25, 46], [27, 46]])

  // ---------- orelhas, com o rosinha por dentro ----------
  parte(triangulo([5, 18], [8, 2], [20, 10]), () => p.manchaEsquerda ?? p.pelo)
  parte(triangulo([37, 18], [34, 2], [22, 10]), () => p.manchaDireita ?? p.pelo)
  const dentroEsquerda = triangulo([9, 13], [10, 6], [16, 11])
  const dentroDireita = triangulo([33, 13], [32, 6], [26, 11])
  for (let y = 0; y < ALTURA; y++) {
    for (let x = 0; x < LARGURA; x++) if (dentroEsquerda(x, y) || dentroDireita(x, y)) pinta(x, y, p.orelha)
  }

  // ---------- cabeça ----------
  parte(elipse(21, 21, 17, 12.5), (x, y) => {
    if (p.manchaEsquerda && (x - 6) ** 2 + (y - 11) ** 2 <= 110) return p.manchaEsquerda
    if (p.manchaDireita && (x - 37) ** 2 + (y - 12) ** 2 <= 85) return p.manchaDireita
    return p.pelo
  })
  if (p.listra) {
    pintaVarios(p.listra, [[18, 10], [18, 11], [18, 12], [21, 9], [21, 10], [21, 11], [21, 12], [24, 10], [24, 11], [24, 12]])
    pintaVarios(p.listra, espelho([[5, 17], [6, 17], [7, 17], [5, 19], [6, 19]]))
  }

  // ---------- rosto ----------
  desenharRosto(expressao, p, pintaVarios, espelho)

  return g
}

function desenharRosto(
  expressao: Expressao,
  p: Pelagem,
  pintaVarios: (c: string, pontos: Ponto[]) => void,
  espelho: (pontos: Ponto[]) => Ponto[],
) {
  // os pedaços que se repetem entre as caras (olho esquerdo; o direito sai no espelho)
  const olhoFechadoFeliz: Ponto[] = [[13, 20], [14, 20], [15, 20], [12, 21], [16, 21]]
  const olhoFechadoDormindo: Ponto[] = [[13, 21], [14, 21], [15, 21], [12, 20], [16, 20]]
  const olhoAberto = (topo: number, altura: number) => {
    const olho: Ponto[] = []
    for (let y = topo; y < topo + altura; y++) for (let x = 13; x <= 15; x++) olho.push([x, y])
    pintaVarios(p.olho, espelho(olho))
    // olho amarelo (gato preto) ganha a pupila no meio
    if (p.olho !== PUPILA) {
      const pupila: Ponto[] = []
      for (let y = topo + 1; y < topo + altura - 1; y++) pupila.push([14, y])
      pintaVarios(PUPILA, espelho(pupila))
    }
    // o brilho fica no canto de cima, do lado de fora (o espelho joga pro outro lado)
    pintaVarios(BRILHO, [[15, topo], [29, topo]])
  }
  const bocaW: Ponto[] = [[19, 25], [21, 25], [23, 25], [20, 26], [22, 26]]
  const bocaTriste: Ponto[] = [[20, 26], [21, 26], [22, 26], [19, 27], [23, 27]]

  // bochechas e nariz (iguais em todas as caras)
  const bochecha: Ponto[] = []
  for (let x = 9; x < 12; x++) bochecha.push([x, 23], [x, 24])
  pintaVarios(BOCHECHA, espelho(bochecha))
  pintaVarios(p.nariz ?? NARIZ, [[20, 23], [21, 23], [22, 23], [21, 24]])

  // bigodes
  const tipoDeBigode = p.bigode ?? 'longo'
  if (tipoDeBigode !== 'nenhum') {
    const bigode: Ponto[] = []
    const inicio = tipoDeBigode === 'longo' ? 0 : 3
    for (let x = inicio; x <= 5; x++) bigode.push([x, 22], [x, 25])
    // no bicho preto, o bigode é clarinho (marrom sumiria no pelo)
    pintaVarios(p.olho === PUPILA ? p.contorno : '#9A8E9E', espelho(bigode))
  }

  switch (expressao) {
    case 'feliz':
      pintaVarios(p.traco, espelho(olhoFechadoFeliz))
      // boca aberta com linguinha
      pintaVarios(p.contorno, [[19, 25], [20, 25], [21, 25], [22, 25], [23, 25], [19, 26], [23, 26], [19, 27], [23, 27], [20, 28], [21, 28], [22, 28]])
      pintaVarios(BOCA, [[20, 26], [21, 26], [22, 26]])
      pintaVarios(LINGUA, [[20, 27], [21, 27], [22, 27]])
      // risquinhos de alegria
      pintaVarios(AMARELO, [[1, 9], [2, 10], [0, 14], [1, 14], [3, 5], [4, 6]])
      break

    case 'neutro':
      olhoAberto(19, 4)
      pintaVarios(p.traco, bocaW)
      break

    case 'carinhoso':
      pintaVarios(p.traco, espelho(olhoFechadoFeliz))
      pintaVarios(p.traco, bocaW)
      // coraçãozinho no canto
      pintaVarios(CORACAO, [[39, 2], [41, 2], [38, 3], [39, 3], [40, 3], [41, 3], [42, 3], [39, 4], [40, 4], [41, 4], [40, 5]])
      break

    case 'surpreso':
      olhoAberto(18, 5)
      // boquinha em "o"
      pintaVarios(p.contorno, [[20, 25], [21, 25], [22, 25], [20, 26], [22, 26], [20, 27], [21, 27], [22, 27]])
      pintaVarios(BOCA, [[21, 26]])
      pintaVarios(AMARELO, [[19, 4], [19, 5], [23, 4], [23, 5]])
      break

    case 'triste':
      olhoAberto(19, 4)
      // sobrancelha subindo pro meio
      pintaVarios(p.traco, espelho([[12, 17], [13, 16], [14, 16]]))
      pintaVarios(p.traco, bocaTriste)
      pintaVarios(LAGRIMA, [[12, 23], [12, 24]])
      break

    case 'dormindo':
      pintaVarios(p.traco, espelho(olhoFechadoDormindo))
      pintaVarios(p.traco, [[20, 26], [21, 26], [22, 26]])
      // Zz no canto
      pintaVarios(SONO, [[37, 7], [38, 7], [39, 7], [38, 8], [37, 9], [38, 9], [39, 9]])
      pintaVarios(SONO, [[40, 1], [41, 1], [42, 1], [43, 1], [42, 2], [41, 3], [40, 4], [41, 4], [42, 4], [43, 4]])
      break

    case 'piscando':
      // o olho fechado num risquinho reto, e a boquinha de sempre
      pintaVarios(p.traco, espelho([[13, 21], [14, 21], [15, 21]]))
      pintaVarios(p.traco, bocaW)
      break

    case 'olhandoEsquerda':
    case 'olhandoDireita': {
      // os dois olhos deslocados 2 pixels pro lado (sem espelho: os dois vão pro mesmo lado)
      const dx = expressao === 'olhandoEsquerda' ? -2 : 2
      const olhos: Ponto[] = []
      for (let y = 19; y < 23; y++) for (const x of [13, 14, 15, 27, 28, 29]) olhos.push([x + dx, y])
      pintaVarios(p.olho, olhos)
      if (p.olho !== PUPILA) pintaVarios(PUPILA, [[14 + dx, 20], [14 + dx, 21], [28 + dx, 20], [28 + dx, 21]])
      pintaVarios(BRILHO, [[15 + dx, 19], [29 + dx, 19]])
      pintaVarios(p.traco, bocaW)
      break
    }

    case 'doente':
      // olhinho caído, boca ondulada e a bolsinha de gelo... no caso, a cruzinha vermelha
      pintaVarios(p.traco, espelho([[12, 20], [13, 21], [14, 21], [15, 21], [16, 20]]))
      pintaVarios(p.traco, [[19, 26], [20, 25], [21, 26], [22, 25], [23, 26]])
      pintaVarios(RAIVA, [[40, 2], [40, 3], [38, 4], [39, 4], [40, 4], [41, 4], [42, 4], [40, 5], [40, 6]])
      pintaVarios(LAGRIMA, [[30, 14], [30, 15]])
      break

    case 'bravo':
      olhoAberto(20, 3)
      // sobrancelha descendo pro meio
      pintaVarios(p.traco, espelho([[12, 17], [13, 18], [14, 18], [15, 19]]))
      pintaVarios(p.traco, bocaTriste)
      // a "veinha" de raiva
      pintaVarios(RAIVA, [[39, 3], [41, 3], [38, 4], [42, 4], [38, 6], [42, 6], [39, 7], [41, 7]])
      break
  }
}

// ============ coelho ============
// orelhas compridas, pompom no rabinho, bigodinho curto. "tricolor" = malhado
const PELAGENS_COELHO: Record<CorGato, Pelagem> = {
  laranja: { contorno: '#5B3A36', pelo: '#EBC59D', orelha: '#FFBCC8', traco: '#5B3A36', olho: PUPILA, bigode: 'curto' },
  preto: { contorno: '#1F1A21', pelo: '#3E3540', orelha: '#F4A7B0', traco: '#FFE8D6', olho: '#F2C94C', bigode: 'curto' },
  branco: { contorno: '#5B3A36', pelo: '#FFFBF7', orelha: '#FFBCC8', traco: '#5B3A36', olho: PUPILA, bigode: 'curto' },
  cinza: { contorno: '#5B3A36', pelo: '#D6CFD2', orelha: '#FFBCC8', traco: '#5B3A36', olho: PUPILA, bigode: 'curto' },
  tricolor: {
    contorno: '#5B3A36',
    pelo: '#FFF8F0',
    manchaEsquerda: '#EBC59D',
    manchaDireita: '#8E7F8C',
    orelha: '#FFBCC8',
    traco: '#5B3A36',
    olho: PUPILA,
    bigode: 'curto',
  },
}

function coelhoEmPixel(cor: CorGato, expressao: Expressao): Grade {
  const p = PELAGENS_COELHO[cor]
  const { g, pinta, pintaVarios, espelho, parte, elipse } = ferramentas(p.contorno)

  // pompom do rabinho (aparece do lado direito do corpo)
  parte(elipse(33, 42, 3.4, 3.2), () => '#FFFFFF')

  // corpo
  parte(elipse(21, 39, 10, 8.5), (x, y) => (p.manchaEsquerda && (x - 13) ** 2 + (y - 43) ** 2 <= 22 ? p.manchaEsquerda : p.pelo))

  // patinhas
  parte(elipse(16, 45, 3.6, 2.2), () => p.pelo)
  parte(elipse(26, 45, 3.6, 2.2), () => p.pelo)
  pintaVarios(p.contorno, [[15, 46], [17, 46], [25, 46], [27, 46]])

  // orelhas compridas, com o rosinha por dentro
  parte(elipse(14, 9, 3.6, 9.5), () => p.manchaEsquerda ?? p.pelo)
  parte(elipse(28, 9, 3.6, 9.5), () => p.manchaDireita ?? p.pelo)
  const dentro = (cx: number) => elipse(cx, 9, 1.6, 6.5)
  for (let y = 0; y < ALTURA; y++) for (let x = 0; x < LARGURA; x++) if (dentro(14)(x, y) || dentro(28)(x, y)) pinta(x, y, p.orelha)

  // cabeça redondinha
  parte(elipse(21, 22, 15, 11.5), (x, y) => {
    if (p.manchaEsquerda && (x - 9) ** 2 + (y - 16) ** 2 <= 40) return p.manchaEsquerda
    if (p.manchaDireita && (x - 34) ** 2 + (y - 17) ** 2 <= 30) return p.manchaDireita
    return p.pelo
  })

  desenharRosto(expressao, p, pintaVarios, espelho)
  return g
}

// ============ capivara ============
// cabeça quadradona, focinho grande, narizão escuro e orelhinhas redondas.
// "tricolor" = capivara com uma laranjinha na cabeça (clássico!)
type PelagemCapivara = Pelagem & { focinho: string; laranjinha?: boolean }
const BASE_CAPIVARA = { contorno: '#5B3A36', traco: '#3A2520', olho: PUPILA, bigode: 'nenhum', nariz: '#3A2520' } as const
const PELAGENS_CAPIVARA: Record<CorGato, PelagemCapivara> = {
  laranja: { ...BASE_CAPIVARA, pelo: '#C9915F', focinho: '#B07C50', orelha: '#A9734A' },
  preto: { ...BASE_CAPIVARA, contorno: '#2E1E18', pelo: '#7A5640', focinho: '#664632', orelha: '#553827', traco: '#2E1E18' },
  branco: { ...BASE_CAPIVARA, pelo: '#E3C9A6', focinho: '#D2B48D', orelha: '#C9A57E' },
  cinza: { ...BASE_CAPIVARA, pelo: '#ADA197', focinho: '#988C82', orelha: '#8B8077' },
  tricolor: { ...BASE_CAPIVARA, pelo: '#C9915F', focinho: '#B07C50', orelha: '#A9734A', laranjinha: true },
}

function capivaraEmPixel(cor: CorGato, expressao: Expressao): Grade {
  const p = PELAGENS_CAPIVARA[cor]
  const { g, pinta, pintaVarios, espelho, parte, elipse } = ferramentas(p.contorno)

  // corpo largo e baixinho
  parte(elipse(21, 40, 14, 7.5), () => p.pelo)

  // patinhas
  parte(elipse(13, 46, 3.4, 2), () => p.pelo)
  parte(elipse(29, 46, 3.4, 2), () => p.pelo)

  // orelhinhas redondas
  parte(elipse(8, 12, 3, 2.6), () => p.orelha)
  parte(elipse(34, 12, 3, 2.6), () => p.orelha)

  // a cabeça quadradona (um "retângulo arredondado": potência 4 em vez de 2)
  parte(
    (x, y) => ((x - 21) / 18) ** 4 + ((y - 22) / 12) ** 4 <= 1,
    () => p.pelo,
  )
  // o focinho grandão, um tom mais escuro
  const focinho = elipse(21, 27, 9, 5.5)
  for (let y = 0; y < ALTURA; y++) for (let x = 0; x < LARGURA; x++) if (focinho(x, y)) pinta(x, y, p.focinho)

  // a laranjinha na cabeça, com folhinha
  if (p.laranjinha) {
    parte(elipse(21, 7, 4, 3.5), () => '#F6A04D')
    pintaVarios('#FFFFFF', [[19, 6]])
    pintaVarios('#6DBB6A', [[22, 2], [23, 2], [23, 1], [24, 1]])
  }

  desenharRosto(expressao, p, pintaVarios, espelho)
  return g
}

// ============ tartaruga ============
// cabeça redonda em cima do casco; quem muda de cor é o casco
type PelagemTartaruga = Pelagem & { casco: string; desenhoDoCasco: string }
const BASE_TARTARUGA = { contorno: '#5B3A36', pelo: '#A7D99A', orelha: '#A7D99A', traco: '#3F5B3A', olho: PUPILA, bigode: 'nenhum' } as const
const PELAGENS_TARTARUGA: Record<CorGato, PelagemTartaruga> = {
  laranja: { ...BASE_TARTARUGA, casco: '#E8A55B', desenhoDoCasco: '#B9784F' },
  preto: { ...BASE_TARTARUGA, casco: '#5A4D52', desenhoDoCasco: '#3E3540' },
  branco: { ...BASE_TARTARUGA, casco: '#F0E6D2', desenhoDoCasco: '#CDBFA5' },
  cinza: { ...BASE_TARTARUGA, casco: '#A9A3A6', desenhoDoCasco: '#7F7A7D' },
  tricolor: { ...BASE_TARTARUGA, casco: '#C9B6F2', desenhoDoCasco: '#FF8FB0' },
}

function tartarugaEmPixel(cor: CorGato, expressao: Expressao): Grade {
  const p = PELAGENS_TARTARUGA[cor]
  const { g, pintaVarios, espelho, parte, elipse } = ferramentas(p.contorno)

  // perninhas e rabinho (atrás do casco)
  parte(elipse(8, 42, 3.5, 3), () => p.pelo)
  parte(elipse(34, 42, 3.5, 3), () => p.pelo)
  parte(elipse(14, 47, 3, 1.8), () => p.pelo)
  parte(elipse(28, 47, 3, 1.8), () => p.pelo)
  parte(elipse(38, 39, 2, 1.5), () => p.pelo)

  // o casco, com o desenho de placas: um anel no meio, duas linhas dos lados e a borda de baixo
  parte(elipse(21, 38, 15, 9.5), (x, y) => {
    const anel = ((x - 21) / 7) ** 2 + ((y - 37) / 4.5) ** 2
    if (anel >= 0.7 && anel <= 1.15) return p.desenhoDoCasco
    if ((x === 12 || x === 30) && y >= 33 && y <= 42) return p.desenhoDoCasco
    if (y >= 45) return p.desenhoDoCasco
    return p.casco
  })

  // cabeça redonda, por cima do casco
  parte(elipse(21, 20, 12.5, 10.5), () => p.pelo)

  desenharRosto(expressao, p, pintaVarios, espelho)
  return g
}

// ============ o ovo ============
// um ovo creme com bolinhas lilás; cada toque abre uma rachadura nova
export function ovoEmPixel(rachaduras: number): Grade {
  const g: Grade = Array.from({ length: ALTURA }, () => Array<string | null>(LARGURA).fill(null))
  const contorno = '#5B3A36'
  const dentro = (x: number, y: number) => {
    // mais fino em cima, mais gordinho embaixo
    const ry = y < 30 ? 17 : 14
    return ((x - 22) / 13) ** 2 + ((y - 30) / ry) ** 2 <= 1
  }
  for (let y = 0; y < ALTURA; y++) {
    for (let x = 0; x < LARGURA; x++) {
      if (dentro(x, y)) {
        const bolinha = (x - 16) ** 2 + (y - 24) ** 2 <= 5 || (x - 27) ** 2 + (y - 34) ** 2 <= 6 || (x - 18) ** 2 + (y - 38) ** 2 <= 3
        g[y]![x] = bolinha ? '#C9B6F2' : '#FFF6E6'
      } else if (dentro(x - 1, y) || dentro(x + 1, y) || dentro(x, y - 1) || dentro(x, y + 1)) {
        g[y]![x] = contorno
      }
    }
  }
  // brilho
  for (const [x, y] of [[14, 19], [14, 20], [15, 18]] as Ponto[]) g[y]![x] = '#FFFFFF'
  // as rachaduras, em zigue-zague, uma a mais por toque
  const rachas: Ponto[][] = [
    [[20, 22], [21, 23], [22, 22], [23, 23]],
    [[24, 22], [25, 23], [26, 22], [27, 23]],
    [[16, 23], [17, 22], [18, 23], [19, 22]],
    [[22, 24], [22, 25], [21, 26]],
    [[28, 22], [29, 23], [30, 22], [26, 24], [26, 25]],
  ]
  rachas.slice(0, rachaduras).forEach((racha) => racha.forEach(([x, y]) => (g[y]![x] = contorno)))
  return g
}

// junta os quadradinhos vizinhos da mesma cor numa linha só (menos elementos no SVG)
export function retangulosDa(grade: Grade) {
  const rects: { x: number; y: number; largura: number; cor: string }[] = []
  grade.forEach((linha, y) => {
    let x = 0
    while (x < linha.length) {
      const cor = linha[x]
      if (cor === null || cor === undefined) {
        x++
        continue
      }
      let fim = x + 1
      while (fim < linha.length && linha[fim] === cor) fim++
      rects.push({ x, y, largura: fim - x, cor })
      x = fim
    }
  })
  return rects
}
