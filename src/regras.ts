import type { Expressao } from './components/bicho/cores'
import type { Status } from './tipos'

// abaixo disso, a barra fica vermelha e a cara do bicho muda
export const LIMITE_BAIXO = 30

// a cara que cada status faz quando está baixo
const CARA_QUANDO_BAIXO: Record<keyof Status, Expressao> = {
  fome: 'bravo',
  higiene: 'neutro',
  felicidade: 'triste',
  energia: 'dormindo',
}

// o que aparece na lista quando o status está baixo
const AVISO_QUANDO_BAIXO: Record<keyof Status, string> = {
  fome: 'Com fome',
  higiene: 'Precisa de banho',
  felicidade: 'Carente',
  energia: 'Cansado',
}

// ============ o tempo passando ============

// quanto cada barra cai por segundo com o jogo aberto: 100 ÷ (minutos até esvaziar × 60)
const QUEDA_POR_SEGUNDO: Status = {
  fome: 100 / (8 * 60),
  felicidade: 100 / (10 * 60),
  energia: 100 / (12 * 60),
  higiene: 100 / (15 * 60),
}

// nenhuma barra chega a zero: no máximo fica "no cheiro" (quase vazia, no vermelho)
export const MINIMO = 5

// com o jogo fechado, o tempo passa 20 vezes mais devagar...
const LENTIDAO_FECHADO = 20
// ...e nunca deixa a barra abaixo disto (o bicho fica carente, mas não no vermelho)
const PISO_FECHADO = 40

function chavesDo(status: Status) {
  return Object.keys(status) as (keyof Status)[]
}

// jogo aberto: cai no ritmo normal, até o mínimo
export function passarTempoAberto(status: Status, segundos: number) {
  for (const chave of chavesDo(status)) {
    status[chave] = Math.max(MINIMO, status[chave] - QUEDA_POR_SEGUNDO[chave] * segundos)
  }
}

// jogo fechado: cai devagar e para no piso (se já estava abaixo do piso, fica onde está)
export function passarTempoFechado(status: Status, segundos: number) {
  for (const chave of chavesDo(status)) {
    const depois = status[chave] - (QUEDA_POR_SEGUNDO[chave] * segundos) / LENTIDAO_FECHADO
    const piso = Math.min(status[chave], PISO_FECHADO)
    status[chave] = Math.max(piso, depois)
  }
}

// o status mais baixo do bicho
function piorStatus(status: Status): keyof Status {
  return chavesDo(status).reduce((a, b) => (status[a] <= status[b] ? a : b))
}

// a carinha segue o pior status; se nenhum estiver baixo, ele fica feliz
export function expressaoDo(status: Status): Expressao {
  const pior = piorStatus(status)
  return status[pior] < LIMITE_BAIXO ? CARA_QUANDO_BAIXO[pior] : 'feliz'
}

export function avisoDo(status: Status): string {
  const pior = piorStatus(status)
  return status[pior] < LIMITE_BAIXO ? AVISO_QUANDO_BAIXO[pior] : 'Tudo bem'
}
