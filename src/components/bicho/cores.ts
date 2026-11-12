export type Especie = 'gato'

export type Expressao = 'feliz' | 'neutro' | 'carinhoso' | 'surpreso' | 'triste' | 'dormindo' | 'bravo'

export type CorGato = 'laranja' | 'preto' | 'branco' | 'cinza' | 'tricolor'

// desenho extra por cima da cor de base
export type Padrao = 'listras' | 'tricolor' | null

type Pelagem = {
  cores: Record<string, string>
  padrao: Padrao
}

// cada chave vira uma variável CSS no desenho: pelo → --pelo
export const PELAGENS_GATO: Record<CorGato, Pelagem> = {
  laranja: { cores: { pelo: '#FFD7B0', listra: '#FFA76E', focinho: '#FFF6EE' }, padrao: 'listras' },
  preto: {
    cores: { pelo: '#3E3540', focinho: '#3E3540', olho: '#F2C94C', rosto: '#FFE8D6', orelha: '#F4A7B0' },
    padrao: null,
  },
  branco: { cores: { pelo: '#FFFBF7', focinho: '#FFFFFF' }, padrao: null },
  cinza: { cores: { pelo: '#CFC8CB', listra: '#8F878C', focinho: '#F4F0F1' }, padrao: 'listras' },
  tricolor: { cores: { pelo: '#FFF8F0', focinho: '#FFFFFF', cauda: '#FFA76E' }, padrao: 'tricolor' },
}

// o que vale quando a pelagem não diz nada
export const CORES_PADRAO: Record<string, string> = {
  olho: '#3A2522',
  rosto: '#5B3A36',
  orelha: '#FFBCB6',
  nariz: '#FF9FB3',
}
