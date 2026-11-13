import type { Especie, Expressao } from './components/bicho/cores'
import type { NomeIcone } from './icones'
import type { Bicho, Status } from './tipos'

// abaixo disso, a barra fica vermelha e a cara do bicho muda
export const LIMITE_BAIXO = 30

// abaixo disso, a caixinha de areia aparece suja no visor
export const CAIXINHA_SUJA = 50

// ============ higiene de cada bicho ============
// a barra é a mesma (Higiene), mas o cuidado faz sentido pra cada um:
// gato e coelho usam caixinha; a capivara ama água (piscininha); a tartaruga precisa de água limpa
export type Higiene = {
  acao: string
  icone: NomeIcone
  iconeSujo: NomeIcone
  aviso: string
}

export const HIGIENE: Record<Especie, Higiene> = {
  gato: { acao: 'Limpar caixinha', icone: 'caixinha', iconeSujo: 'caixinhaSuja', aviso: 'Caixinha suja' },
  coelho: { acao: 'Limpar caixinha', icone: 'caixinhaFeno', iconeSujo: 'caixinhaFenoSuja', aviso: 'Caixinha suja' },
  capivara: { acao: 'Encher a piscininha', icone: 'piscina', iconeSujo: 'piscinaSuja', aviso: 'Piscininha suja' },
  tartaruga: { acao: 'Trocar a água', icone: 'agua', iconeSujo: 'aguaSuja', aviso: 'Água suja' },
}

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
  higiene: 'Caixinha suja',
  felicidade: 'Carente',
  energia: 'Cansado',
}

// ============ o tempo passando ============

// quanto cada barra cai por segundo: 100 ÷ (horas até esvaziar × 3600)
// em horas, como num tamagochi: cuida de manhã, volta à noite e ele está com fome
const QUEDA_POR_SEGUNDO: Status = {
  fome: 100 / (4 * 3600),
  felicidade: 100 / (5 * 3600),
  higiene: 100 / (6 * 3600),
  energia: 100 / (8 * 3600),
}

// nenhuma barra chega a zero: no máximo fica "no cheiro" (quase vazia, no vermelho)
export const MINIMO = 5

// com o jogo fechado, o tempo passa no mesmo ritmo, mas nunca deixa a barra abaixo disto
// (o bicho fica carente, mas não no vermelho)
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

// jogo fechado: cai no mesmo ritmo e para no piso (se já estava abaixo do piso, fica onde está)
export function passarTempoFechado(status: Status, segundos: number) {
  for (const chave of chavesDo(status)) {
    const depois = status[chave] - QUEDA_POR_SEGUNDO[chave] * segundos
    const piso = Math.min(status[chave], PISO_FECHADO)
    status[chave] = Math.max(piso, depois)
  }
}

// luz apagada: a energia sobe (cheia em ~10 minutos) e as outras barras param de cair.
// Era 1 hora, mas quem jogou achou que demorava demais (a irmã e uma colega da Bella)
const SONO_POR_SEGUNDO = 100 / (10 * 60)

export function dormirUmPouco(status: Status, segundos: number) {
  status.energia = Math.min(100, status.energia + SONO_POR_SEGUNDO * segundos)
}

// ============ crescer ============
export type Fase = 'ovo' | 'filhote' | 'jovem' | 'adulto'

const UM_DIA = 24 * 3600

export function faseDo(chocou: boolean, idade: number): Fase {
  if (!chocou) return 'ovo'
  if (idade < UM_DIA) return 'filhote'
  if (idade < 3 * UM_DIA) return 'jovem'
  return 'adulto'
}

export const NOME_DA_FASE: Record<Fase, string> = {
  ovo: 'Ovo',
  filhote: 'Filhote',
  jovem: 'Jovem',
  adulto: 'Adulto',
}

export function diasDe(idade: number) {
  return Math.floor(idade / UM_DIA)
}

// o ovo choca sozinho depois disto (ou com toques)
export const OVO_CHOCA_EM = 30_000
export const TOQUES_PRA_CHOCAR = 5

// ============ dia e noite ============
// noite = das 20h às 7h (hora de verdade), a não ser que o modo demonstração force
export type Periodo = 'auto' | 'dia' | 'noite'

export function ehNoite(agora: Date, periodo: Periodo) {
  if (periodo !== 'auto') return periodo === 'noite'
  const hora = agora.getHours()
  return hora >= 20 || hora < 7
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

// o aviso da higiene muda com o bicho ("Piscininha suja" pra capivara...)
export function avisoDo(status: Status, especie: Especie = 'gato'): string {
  const pior = piorStatus(status)
  if (status[pior] >= LIMITE_BAIXO) return 'Tudo bem'
  return pior === 'higiene' ? HIGIENE[especie].aviso : AVISO_QUANDO_BAIXO[pior]
}

// ============ como o bicho aparece na lista ============
// o mesmo estado da tela dele: ovo, dormindo, doente ou a cara do pior status
export type NaLista = {
  ovo: boolean
  dormindo: boolean
  expressao: Expressao
  aviso: string
  // aviso em vermelho (precisa de cuidado)
  alerta: boolean
}

export function comoNaLista(bicho: Bicho): NaLista {
  if (!bicho.chocou) return { ovo: true, dormindo: false, expressao: 'neutro', aviso: 'Ovo · quase chocando', alerta: false }
  if (bicho.luzApagada) return { ovo: false, dormindo: true, expressao: 'dormindo', aviso: 'Dormindo', alerta: false }
  if (bicho.doente) return { ovo: false, dormindo: false, expressao: 'doente', aviso: 'Doente!', alerta: true }
  const aviso = avisoDo(bicho.status, bicho.especie)
  return { ovo: false, dormindo: false, expressao: expressaoDo(bicho.status), aviso, alerta: aviso !== 'Tudo bem' }
}
