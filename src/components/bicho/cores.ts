export type Especie = 'gato' | 'coelho' | 'capivara' | 'tartaruga'

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

// as 5 "cores" são as mesmas chaves pra todas as espécies; cada espécie dá o seu nome pra elas
export type CorGato = 'laranja' | 'preto' | 'branco' | 'cinza' | 'tricolor'

export const NOME_DA_ESPECIE: Record<Especie, string> = {
  gato: 'Gato',
  coelho: 'Coelho',
  capivara: 'Capivara',
  tartaruga: 'Tartaruga',
}

export const NOME_DA_COR: Record<Especie, Record<CorGato, string>> = {
  gato: { laranja: 'Laranja', preto: 'Preto', branco: 'Branco', cinza: 'Cinza', tricolor: 'Tricolor' },
  coelho: { laranja: 'Caramelo', preto: 'Preto', branco: 'Branco', cinza: 'Cinza', tricolor: 'Malhado' },
  capivara: { laranja: 'Caramelo', preto: 'Escura', branco: 'Clarinha', cinza: 'Cinza', tricolor: 'Com laranjinha' },
  tartaruga: { laranja: 'Âmbar', preto: 'Escura', branco: 'Clarinha', cinza: 'Cinza', tricolor: 'Lilás' },
}

// as cores de cada pelagem moram em pixel.ts, junto do desenho
