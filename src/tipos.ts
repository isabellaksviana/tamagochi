import type { CorGato, Especie } from './components/bicho/cores'

// de 0 a 100: barra cheia = bom
export type Status = {
  fome: number
  higiene: number
  felicidade: number
  energia: number
}

// o que aparece no Diário: quantas vezes cada cuidado aconteceu
export type Contadores = {
  alimentou: number
  brincou: number
  caixinhas: number
  noites: number
  biscoitosNoJogo: number
  carinhos: number
}

export type Bicho = {
  id: number
  nome: string
  especie: Especie
  cor: CorGato
  status: Status
  // o ovo: até chocar, o bicho é um ovo no visor
  chocou: boolean
  ovoDesde: number
  toquesNoOvo: number
  // segundos de vida desde que chocou (no modo demonstração, passa mais rápido)
  idade: number
  // quando foi adotado (data de verdade, pro Diário)
  adotadoEm: number
  // luz apagada = dormindo até acender
  luzApagada: boolean
  // doente: alguma barra ficou no vermelho tempo demais; cura com remédio
  doente: boolean
  segundosNoVermelho: number
  contadores: Contadores
}

export const CONTADORES_ZERADOS: Contadores = {
  alimentou: 0,
  brincou: 0,
  caixinhas: 0,
  noites: 0,
  biscoitosNoJogo: 0,
  carinhos: 0,
}
