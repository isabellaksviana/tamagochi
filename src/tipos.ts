import type { CorGato, Especie } from './components/bicho/cores'

// de 0 a 100: barra cheia = bom
export type Status = {
  fome: number
  higiene: number
  felicidade: number
  energia: number
}

export type Bicho = {
  id: number
  nome: string
  especie: Especie
  cor: CorGato
  status: Status
}
