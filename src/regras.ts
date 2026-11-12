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

// o status mais baixo do bicho
function piorStatus(status: Status): keyof Status {
  const chaves = Object.keys(status) as (keyof Status)[]
  return chaves.reduce((a, b) => (status[a] <= status[b] ? a : b))
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
