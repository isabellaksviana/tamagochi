export type Especie = 'gato'

export type Expressao =
  | 'feliz'
  | 'neutro'
  | 'carinhoso'
  | 'surpreso'
  | 'triste'
  | 'dormindo'
  | 'bravo'
  // as de "vida": piscar, olhar pros lados (no minijogo) e ficar doente
  | 'piscando'
  | 'olhandoEsquerda'
  | 'olhandoDireita'
  | 'doente'

export type CorGato = 'laranja' | 'preto' | 'branco' | 'cinza' | 'tricolor'

// as cores de cada pelagem moram em pixel.ts, junto do desenho
