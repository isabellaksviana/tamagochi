import type { NomeIcone } from './icones'
import type { Status } from './tipos'

export type Barra = {
  chave: keyof Status
  rotulo: string
  icone: NomeIcone
  cor: string
}

// as 4 barras, na ordem em que aparecem; a tela do pet e a loja usam as mesmas
export const BARRAS: Barra[] = [
  { chave: 'fome', rotulo: 'Fome', icone: 'tigela', cor: '#f6a96b' },
  { chave: 'higiene', rotulo: 'Higiene', icone: 'gota', cor: '#7cc6f0' },
  { chave: 'felicidade', rotulo: 'Felicidade', icone: 'coracao', cor: '#ff8fb0' },
  { chave: 'energia', rotulo: 'Energia', icone: 'raio', cor: '#f6d365' },
]

export function barraDa(chave: keyof Status): Barra {
  return BARRAS.find((barra) => barra.chave === chave) ?? BARRAS[0]!
}
