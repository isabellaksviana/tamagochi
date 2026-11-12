import type { Component } from 'vue'
import { PhBed, PhBowlSteam, PhFish, PhSparkle, PhTennisBall } from '@phosphor-icons/vue'
import { barraDa } from './barras'
import type { Status } from './tipos'

export type ItemLoja = {
  id: string
  nome: string
  descricao: string
  preco: number
  // quanto cada barra sobe quando o bicho ganha o item
  efeito: Partial<Status>
  // por enquanto, ícone + cor de fundo; depois, a ilustração
  icone: Component
  cor: string
}

// mais caro = enche mais; os botões de graça (Alimentar, Banho...) continuam existindo
export const ITENS_DA_LOJA: ItemLoja[] = [
  {
    id: 'sache',
    nome: 'Sachê',
    descricao: 'Uma refeição deliciosa para encher a barriguinha.',
    preco: 3,
    efeito: { fome: 50 },
    icone: PhBowlSteam,
    cor: '#f6a96b',
  },
  {
    id: 'peixinho',
    nome: 'Peixinho',
    descricao: 'Um petisco irresistível.',
    preco: 6,
    efeito: { fome: 100, felicidade: 15 },
    icone: PhFish,
    cor: '#7cc6f0',
  },
  {
    id: 'bolinha',
    nome: 'Bolinha',
    descricao: 'Diversão garantida e muita alegria!',
    preco: 4,
    efeito: { felicidade: 50 },
    icone: PhTennisBall,
    cor: '#b89cff',
  },
  {
    id: 'sabonete',
    nome: 'Sabonete cheiroso',
    descricao: 'Um banho caprichado e cheirosinho.',
    preco: 3,
    efeito: { higiene: 60 },
    icone: PhSparkle,
    cor: '#ff8fb0',
  },
  {
    id: 'caminha',
    nome: 'Caminha macia',
    descricao: 'Um cochilo quentinho que vale por dois.',
    preco: 5,
    efeito: { energia: 70 },
    icone: PhBed,
    cor: '#a58bd9',
  },
]

export function itemPeloId(id: string): ItemLoja | undefined {
  return ITENS_DA_LOJA.find((item) => item.id === id)
}

// o efeito em texto: "+50 de fome, +15 de felicidade"
export function ganhosDo(item: ItemLoja): string {
  return (Object.entries(item.efeito) as [keyof Status, number][])
    .map(([chave, quanto]) => `+${quanto} de ${barraDa(chave).rotulo.toLowerCase()}`)
    .join(', ')
}
