import { barraDa, type Barra } from './barras'
import type { NomeIcone } from './icones'
import type { Status } from './tipos'

export type Categoria = 'comida' | 'brinquedo' | 'caixinha' | 'descanso'

export const CATEGORIAS: { valor: Categoria; rotulo: string; icone: NomeIcone }[] = [
  { valor: 'comida', rotulo: 'Comida', icone: 'tigela' },
  { valor: 'brinquedo', rotulo: 'Brinquedos', icone: 'novelo' },
  { valor: 'caixinha', rotulo: 'Caixinha', icone: 'caixinha' },
  { valor: 'descanso', rotulo: 'Descanso', icone: 'lua' },
]

export type ItemLoja = {
  id: string
  nome: string
  descricao: string
  categoria: Categoria
  preco: number
  // quanto cada barra sobe quando o bicho ganha o item
  efeito: Partial<Status>
  icone: NomeIcone
  // a cor do fundinho atrás do desenho
  cor: string
}

// biscoito custa a ganhar (só quando o bicho precisava de verdade + o bônus do dia),
// então os preços contam: mais caro = enche mais. Os botões de cuidar continuam de graça.
export const ITENS_DA_LOJA: ItemLoja[] = [
  {
    id: 'sache',
    nome: 'Sachê',
    descricao: 'Uma refeição deliciosa para encher a barriguinha.',
    categoria: 'comida',
    preco: 8,
    efeito: { fome: 50 },
    icone: 'sache',
    cor: '#f6a96b',
  },
  {
    id: 'peixinho',
    nome: 'Peixinho',
    descricao: 'Um petisco irresistível.',
    categoria: 'comida',
    preco: 15,
    efeito: { fome: 100, felicidade: 15 },
    icone: 'peixe',
    cor: '#7cc6f0',
  },
  {
    id: 'bolinha',
    nome: 'Bolinha',
    descricao: 'Diversão garantida e muita alegria!',
    categoria: 'brinquedo',
    preco: 10,
    efeito: { felicidade: 50 },
    icone: 'bolinha',
    cor: '#ff8fb0',
  },
  {
    id: 'areia',
    nome: 'Areia perfumada',
    descricao: 'Caixinha trocadinha e cheirosa.',
    categoria: 'caixinha',
    preco: 8,
    efeito: { higiene: 60 },
    icone: 'areia',
    cor: '#c9b6f2',
  },
  {
    id: 'caminha',
    nome: 'Caminha macia',
    descricao: 'Um cochilo quentinho que vale por dois.',
    categoria: 'descanso',
    preco: 12,
    efeito: { energia: 70 },
    icone: 'caminha',
    cor: '#a58bd9',
  },
]

export function itemPeloId(id: string): ItemLoja | undefined {
  return ITENS_DA_LOJA.find((item) => item.id === id)
}

// o efeito do item, barra por barra: [{ barra: Fome, quanto: 50 }]
export function efeitosDo(item: ItemLoja): { barra: Barra; quanto: number }[] {
  return (Object.entries(item.efeito) as [keyof Status, number][]).map(([chave, quanto]) => ({
    barra: barraDa(chave),
    quanto,
  }))
}

// o efeito em texto: "+50 de fome, +15 de felicidade"
export function ganhosDo(item: ItemLoja): string {
  return efeitosDo(item)
    .map(({ barra, quanto }) => `+${quanto} de ${barra.rotulo.toLowerCase()}`)
    .join(', ')
}
