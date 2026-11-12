import type { Component } from 'vue'
import { PhBowlFood, PhDrop, PhHeart, PhLightning } from '@phosphor-icons/vue'
import type { Status } from './tipos'

export type Barra = {
  chave: keyof Status
  rotulo: string
  icone: Component
  cor: string
}

// as 4 barras, na ordem em que aparecem; a tela do pet e a loja usam as mesmas
export const BARRAS: Barra[] = [
  { chave: 'fome', rotulo: 'Fome', icone: PhBowlFood, cor: '#f6a96b' },
  { chave: 'higiene', rotulo: 'Higiene', icone: PhDrop, cor: '#7cc6f0' },
  { chave: 'felicidade', rotulo: 'Felicidade', icone: PhHeart, cor: '#ff8fb0' },
  { chave: 'energia', rotulo: 'Energia', icone: PhLightning, cor: '#f6d365' },
]

export function barraDa(chave: keyof Status): Barra {
  return BARRAS.find((barra) => barra.chave === chave) ?? BARRAS[0]!
}
