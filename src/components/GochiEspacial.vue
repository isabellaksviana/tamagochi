<script setup lang="ts">
import { computed, ref } from 'vue'
import IconePixel from './IconePixel.vue'
import HudDoJogo from './HudDoJogo.vue'
import DicaDoTeclado from './DicaDoTeclado.vue'
import AvisoPausa from './AvisoPausa.vue'
import { rumoAo, useJogoNoVisor } from '../composables/useJogoNoVisor'
import { useTelaDeToque } from '../composables/useTelaDeToque'
import { tocar } from '../som'
import type { NomeIcone } from '../icones'
import type { Bicho } from '../tipos'

// "Gochi Espacial": uma nave que anda nas 4 direções (na metade de baixo da telinha). O tiro sai sozinho,
// reto pra cima. Asteroides descem: o tiro destrói, encostar tira uma vida. Caem moedas e POWER-UPS
// (tiro triplo, tiro rápido, escudo e vida extra). Com pontos suficientes chega o CHEFÃO: bem difícil,
// com leque de tiros e tiros mirados na nave. Os power-ups são o jeito de vencer ele.
// Controles: no celular, a nave vai atrás do dedo (um pouco acima dele, pra o dedo não tampar a nave);
// no computador, as setas.
defineProps<{
  bicho: Bicho
}>()

const emit = defineEmits<{
  jogando: [ligado: boolean]
  terminou: [moedas: number]
  // saiu no meio, pela pausa (volta pra escolha dos jogos)
  saiu: []
}>()

const VIDAS = 5
const MAXIMO_DE_MOEDAS = 5
const VELOCIDADE_NO_TECLADO = 250 // px/s
const VELOCIDADE_NO_DEDO = 460 // px/s
// a nave fica esta distância acima do dedo
const ACIMA_DO_DEDO = 70
const VELOCIDADE_DO_TIRO = 540 // px/s
const PONTOS_PRO_PRIMEIRO_CHEFAO = 200
const PONTOS_ENTRE_CHEFOES = 350
const LARGURA_DO_CHEFAO = 92
const ALTURA_DO_CHEFAO = 44
const DURACAO_DO_PODER = 10 // s

type Coisa = { id: number; x: number; y: number; vx: number; vy: number; tamanho: number }
type TipoDePoder = 'triplo' | 'rapido' | 'escudo' | 'vida'
type Poder = Coisa & { tipo: TipoDePoder }
type Chefao = {
  x: number
  y: number
  vx: number
  tempo: number
  vida: number
  vidaMaxima: number
  recargaLeque: number
  recargaMirado: number
}

const ICONE_DO_PODER: Record<TipoDePoder, NomeIcone> = {
  triplo: 'tiroTriplo',
  rapido: 'raio',
  escudo: 'escudo',
  vida: 'coracao',
}
const NOME_DO_PODER: Record<TipoDePoder, string> = {
  triplo: 'Tiro triplo',
  rapido: 'Tiro rápido',
  escudo: 'Escudo',
  vida: 'Vida extra',
}

const toque = useTelaDeToque()
const ceu = ref<HTMLElement | null>(null)
const naveX = ref(0)
const naveY = ref(0)
const tiros = ref<Coisa[]>([])
const asteroides = ref<Coisa[]>([])
const moedasCaindo = ref<Coisa[]>([])
const poderesCaindo = ref<Poder[]>([])
const tirosDoChefao = ref<Coisa[]>([])
const chefao = ref<Chefao | null>(null)
const pontos = ref(0)
const vidas = ref(VIDAS)
const fase = ref(1)
const moedasPegas = ref(0)
const piscando = ref(false)
// os poderes ligados: segundos que faltam (triplo, rápido) e se tem escudo
const tempoTriplo = ref(0)
const tempoRapido = ref(0)
const temEscudo = ref(false)
// o aviso que aparece no meio da telinha ("Tiro triplo!", "CHEFÃO!")
const aviso = ref('')

const recorde = ref(Number(localStorage.getItem('recordeGochiEspacial') ?? 0))
const bateuRecorde = ref(false)
const moedasGanhas = computed(() => Math.min(MAXIMO_DE_MOEDAS, moedasPegas.value))

let proximoId = 0
let recargaDoTiro = 0
let proximoAsteroide = 0
let proximaMoeda = 0
let proximoPoder = 0
let proximoChefao = PONTOS_PRO_PRIMEIRO_CHEFAO
let poderAntesDoChefao = false
let invencivel = 0
let montado = false
let relogioDoAviso = 0

function tamanho() {
  return { largura: ceu.value?.clientWidth ?? 320, altura: ceu.value?.clientHeight ?? 400 }
}

const perto = (a: { x: number; y: number }, b: { x: number; y: number }, distancia: number) =>
  (a.x - b.x) ** 2 + (a.y - b.y) ** 2 <= distancia ** 2

function avisar(texto: string) {
  aviso.value = texto
  clearTimeout(relogioDoAviso)
  relogioDoAviso = setTimeout(() => (aviso.value = ''), 1300)
}

// levou um golpe (asteroide ou tiro do chefão): o escudo segura; sem escudo, perde vida
function levarGolpe() {
  if (invencivel > 0) return
  invencivel = 1.2
  if (temEscudo.value) {
    temEscudo.value = false
    tocar('explosao')
    return
  }
  vidas.value--
  tocar('errou')
  if (vidas.value <= 0) terminar()
}

function soltarPoder(largura: number, tipo?: TipoDePoder) {
  const tipos: TipoDePoder[] = ['triplo', 'rapido', 'escudo', 'vida']
  // vida extra é mais rara (e não cai se as vidas estão cheias)
  const sorteado = tipo ?? (vidas.value < VIDAS && Math.random() < 0.2 ? 'vida' : tipos[Math.floor(Math.random() * 3)]!)
  poderesCaindo.value.push({ id: proximoId++, x: 24 + Math.random() * (largura - 48), y: -24, vx: 0, vy: 90, tamanho: 30, tipo: sorteado })
}

function pegarPoder(tipo: TipoDePoder) {
  if (tipo === 'triplo') tempoTriplo.value = DURACAO_DO_PODER
  if (tipo === 'rapido') tempoRapido.value = DURACAO_DO_PODER
  if (tipo === 'escudo') temEscudo.value = true
  if (tipo === 'vida') vidas.value = Math.min(VIDAS, vidas.value + 1)
  avisar(`${NOME_DO_PODER[tipo]}!`)
  tocar('dar')
}

const jogo = useJogoNoVisor({
  avisarJogando: (ligado) => emit('jogando', ligado),
  passo(segundos) {
    const { largura, altura } = tamanho()
    if (!montado) {
      naveX.value = largura / 2
      naveY.value = altura - 80
      montado = true
    }

    // ============ a nave: atrás do dedo (celular/mouse) ou pelas setas (teclado) ============
    const dedo = jogo.controle.dedo
    const dx = dedo ? rumoAo(dedo.x, naveX.value) : jogo.controle.direcao
    const dy = dedo ? rumoAo(dedo.y - ACIMA_DO_DEDO, naveY.value) : jogo.controle.direcaoY
    const velocidade = dedo ? VELOCIDADE_NO_DEDO : VELOCIDADE_NO_TECLADO
    naveX.value = Math.min(largura - 26, Math.max(26, naveX.value + dx * velocidade * segundos))
    // pra cima, só até a metade da telinha (lá em cima é do chefão)
    naveY.value = Math.min(altura - 50, Math.max(altura * 0.45, naveY.value + dy * velocidade * segundos))
    const centroDaNave = { x: naveX.value, y: naveY.value }

    invencivel = Math.max(0, invencivel - segundos)
    piscando.value = invencivel > 0
    tempoTriplo.value = Math.max(0, tempoTriplo.value - segundos)
    tempoRapido.value = Math.max(0, tempoRapido.value - segundos)

    // ============ o tiro sai sozinho (mais rápido e triplo com os poderes) ============
    recargaDoTiro -= segundos
    if (recargaDoTiro <= 0) {
      recargaDoTiro = tempoRapido.value > 0 ? 0.12 : 0.3
      const saida = naveY.value - 24
      const desvios = tempoTriplo.value > 0 ? [-140, 0, 140] : [0]
      for (const vx of desvios) {
        tiros.value.push({ id: proximoId++, x: naveX.value, y: saida, vx, vy: -VELOCIDADE_DO_TIRO, tamanho: 4 })
      }
    }

    // ============ o que cai do céu ============
    if (!chefao.value) {
      proximoAsteroide -= segundos
      if (proximoAsteroide <= 0) {
        proximoAsteroide = Math.max(0.3, 1.0 - fase.value * 0.12 - pontos.value / 3000)
        const grande = Math.random() < 0.35
        asteroides.value.push({
          id: proximoId++,
          x: 16 + Math.random() * (largura - 32),
          y: -20,
          vx: (Math.random() - 0.5) * 50,
          vy: 90 + fase.value * 20 + Math.random() * 70,
          tamanho: grande ? 36 : 27,
        })
      }
    }

    proximaMoeda -= segundos
    if (proximaMoeda <= 0) {
      proximaMoeda = 4 + Math.random() * 4
      moedasCaindo.value.push({ id: proximoId++, x: 16 + Math.random() * (largura - 32), y: -20, vx: 0, vy: 100, tamanho: 18 })
    }

    // power-up de vez em quando; e um garantido pouco antes do chefão
    proximoPoder -= segundos
    if (proximoPoder <= 0) {
      proximoPoder = 11 + Math.random() * 6
      soltarPoder(largura)
    }
    if (!chefao.value && !poderAntesDoChefao && pontos.value >= proximoChefao - 60) {
      poderAntesDoChefao = true
      soltarPoder(largura, Math.random() < 0.5 ? 'triplo' : 'rapido')
    }

    // ============ o chefão ============
    if (!chefao.value && pontos.value >= proximoChefao) {
      const vida = 45 + fase.value * 20
      chefao.value = {
        x: largura / 2,
        y: 60,
        vx: 80 + fase.value * 20,
        tempo: 0,
        vida,
        vidaMaxima: vida,
        recargaLeque: 2,
        recargaMirado: 1.2,
      }
      avisar('CHEFÃO!')
      tocar('alerta')
    }

    const mover = (lista: Coisa[]) =>
      lista.forEach((coisa) => {
        coisa.x += coisa.vx * segundos
        coisa.y += coisa.vy * segundos
      })
    mover(tiros.value)
    mover(asteroides.value)
    mover(moedasCaindo.value)
    mover(poderesCaindo.value)
    mover(tirosDoChefao.value)

    const chefe = chefao.value
    if (chefe) {
      // anda de um lado pro outro e balança pra cima e pra baixo
      chefe.tempo += segundos
      chefe.x += chefe.vx * segundos
      if (chefe.x < LARGURA_DO_CHEFAO / 2 || chefe.x > largura - LARGURA_DO_CHEFAO / 2) chefe.vx *= -1
      chefe.y = 60 + Math.sin(chefe.tempo * 1.6) * 22

      // ataque 1: um leque de 5 tiros
      chefe.recargaLeque -= segundos
      if (chefe.recargaLeque <= 0) {
        chefe.recargaLeque = Math.max(1.1, 2.1 - fase.value * 0.15)
        const velocidade = 170 + fase.value * 20
        for (const angulo of [-0.5, -0.25, 0, 0.25, 0.5]) {
          tirosDoChefao.value.push({
            id: proximoId++,
            x: chefe.x,
            y: chefe.y + ALTURA_DO_CHEFAO / 2,
            vx: Math.sin(angulo) * velocidade,
            vy: Math.cos(angulo) * velocidade,
            tamanho: 6,
          })
        }
      }

      // ataque 2: um tiro mirado direto na nave
      chefe.recargaMirado -= segundos
      if (chefe.recargaMirado <= 0) {
        chefe.recargaMirado = Math.max(0.55, 1.1 - fase.value * 0.1)
        const ax = naveX.value - chefe.x
        const ay = naveY.value - chefe.y
        const distancia = Math.hypot(ax, ay) || 1
        const velocidade = 240 + fase.value * 25
        tirosDoChefao.value.push({
          id: proximoId++,
          x: chefe.x,
          y: chefe.y + ALTURA_DO_CHEFAO / 2,
          vx: (ax / distancia) * velocidade,
          vy: (ay / distancia) * velocidade,
          tamanho: 6,
        })
      }
    }

    // ============ batidas ============
    for (const tiro of tiros.value) {
      const acertado = asteroides.value.find((asteroide) => perto(tiro, asteroide, asteroide.tamanho / 2 + 3))
      if (acertado) {
        tiro.y = -999
        acertado.y = 9999
        pontos.value += acertado.tamanho > 30 ? 15 : 10
        tocar('explosao')
        continue
      }
      if (chefe && Math.abs(tiro.x - chefe.x) < LARGURA_DO_CHEFAO / 2 && Math.abs(tiro.y - chefe.y) < ALTURA_DO_CHEFAO / 2) {
        tiro.y = -999
        chefe.vida--
        if (chefe.vida <= 0) {
          pontos.value += 150
          fase.value++
          proximoChefao = pontos.value + PONTOS_ENTRE_CHEFOES
          poderAntesDoChefao = false
          chefao.value = null
          tirosDoChefao.value = []
          avisar(`Fase ${fase.value}!`)
          tocar('chocou')
        }
      }
    }

    for (const asteroide of asteroides.value) {
      if (perto(asteroide, centroDaNave, asteroide.tamanho / 2 + 14)) {
        asteroide.y = 9999
        levarGolpe()
      }
    }
    for (const tiro of tirosDoChefao.value) {
      if (perto(tiro, centroDaNave, 15)) {
        tiro.y = 9999
        levarGolpe()
      }
    }
    for (const moeda of moedasCaindo.value) {
      if (perto(moeda, centroDaNave, 28)) {
        moeda.y = 9999
        moedasPegas.value++
        tocar('pegou')
      }
    }
    for (const poder of poderesCaindo.value) {
      if (perto(poder, centroDaNave, 32)) {
        poder.y = 9999
        pegarPoder(poder.tipo)
      }
    }

    // tira o que saiu da telinha
    const dentro = (coisa: Coisa) => coisa.y > -40 && coisa.y < altura + 40 && coisa.x > -40 && coisa.x < largura + 40
    tiros.value = tiros.value.filter(dentro)
    asteroides.value = asteroides.value.filter(dentro)
    moedasCaindo.value = moedasCaindo.value.filter(dentro)
    poderesCaindo.value = poderesCaindo.value.filter(dentro)
    tirosDoChefao.value = tirosDoChefao.value.filter(dentro)
  },
})

function comecar() {
  tiros.value = []
  asteroides.value = []
  moedasCaindo.value = []
  poderesCaindo.value = []
  tirosDoChefao.value = []
  chefao.value = null
  pontos.value = 0
  vidas.value = VIDAS
  fase.value = 1
  moedasPegas.value = 0
  tempoTriplo.value = 0
  tempoRapido.value = 0
  temEscudo.value = false
  aviso.value = ''
  bateuRecorde.value = false
  proximoChefao = PONTOS_PRO_PRIMEIRO_CHEFAO
  poderAntesDoChefao = false
  proximoAsteroide = 1
  proximaMoeda = 3
  proximoPoder = 7
  recargaDoTiro = 0
  invencivel = 0
  montado = false
  jogo.comecar()
}

// sair pela pausa: acaba sem prêmio e volta pra escolha dos jogos
function sair() {
  jogo.sair()
  emit('saiu')
}

function terminar() {
  jogo.terminar()
  clearTimeout(relogioDoAviso)
  aviso.value = ''
  if (pontos.value > recorde.value) {
    recorde.value = pontos.value
    bateuRecorde.value = true
    localStorage.setItem('recordeGochiEspacial', String(pontos.value))
  }
  tocar('fimDoJogo')
  emit('terminou', moedasGanhas.value)
}
</script>

<template>
  <section class="jogo">
    <template v-if="jogo.etapa.value === 'inicio'">
      <h2>Gochi Espacial</h2>
      <p>
        Pilote a nave pra todos os lados: o tiro sai sozinho. Destrua os asteroides,
        pegue moedas e power-ups e enfrente o chefão. São {{ VIDAS }} vidas.
      </p>
      <p class="como">{{ toque ? 'Arraste o dedo na tela: a nave vai atrás.' : 'Use as setas ← → ↑ ↓ do teclado pra pilotar.' }}</p>
      <p v-if="recorde > 0" class="recorde">Recorde: <span class="numero">{{ recorde }}</span> pontos</p>
      <p v-if="bicho.status.energia < 20" class="aviso">Cansado demais pra brincar. Apague a luz um pouquinho.</p>
      <button class="button button-primary grande" type="button" :disabled="bicho.status.energia < 20" @click="comecar">
        <IconePixel nome="controle" />
        Jogar
      </button>
    </template>

    <template v-else-if="jogo.etapa.value === 'jogando'">
      <!-- no computador, a dica das teclas embaixo do visor (no celular o jogo está em tela cheia) -->
      <DicaDoTeclado v-if="!toque" vertical />

      <Teleport to="#palco-do-jogo">
        <div
          ref="ceu"
          class="ceu"
          @pointerdown="jogo.dedoDesceu"
          @pointermove="jogo.dedoMexeu"
          @pointerup="jogo.dedoSubiu"
          @pointercancel="jogo.dedoSubiu"
        >
          <HudDoJogo :pontos="pontos" :vidas="vidas" :vidas-maximas="VIDAS" @pausar="jogo.pausar" @sair="jogo.pedirSaida" />
          <span class="fase numero">Fase {{ fase }}</span>

          <!-- os poderes ligados, no canto de baixo -->
          <span class="poderes-ligados">
            <span v-if="tempoTriplo > 0" class="ligado"><IconePixel nome="tiroTriplo" /> <span class="numero">{{ Math.ceil(tempoTriplo) }}</span></span>
            <span v-if="tempoRapido > 0" class="ligado"><IconePixel nome="raio" /> <span class="numero">{{ Math.ceil(tempoRapido) }}</span></span>
            <span v-if="temEscudo" class="ligado"><IconePixel nome="escudo" /></span>
          </span>

          <span v-for="tiro in tiros" :key="tiro.id" class="tiro" :style="{ left: `${tiro.x}px`, top: `${tiro.y}px` }" />
          <span v-for="tiro in tirosDoChefao" :key="tiro.id" class="tiro-chefao" :style="{ left: `${tiro.x}px`, top: `${tiro.y}px` }" />
          <span v-for="asteroide in asteroides" :key="asteroide.id" class="coisa" :style="{ left: `${asteroide.x}px`, top: `${asteroide.y}px` }">
            <IconePixel nome="asteroide" :escala="asteroide.tamanho > 30 ? 4 : 3" />
          </span>
          <span v-for="moeda in moedasCaindo" :key="moeda.id" class="coisa" :style="{ left: `${moeda.x}px`, top: `${moeda.y}px` }">
            <IconePixel nome="moeda" />
          </span>
          <!-- o power-up vem numa bolha (pra não confundir com moeda) -->
          <span v-for="poder in poderesCaindo" :key="poder.id" class="coisa bolha" :style="{ left: `${poder.x}px`, top: `${poder.y}px` }">
            <IconePixel :nome="ICONE_DO_PODER[poder.tipo]" />
          </span>

          <!-- o chefão, com a barrinha de vida -->
          <span v-if="chefao" class="coisa chefao" :style="{ left: `${chefao.x}px`, top: `${chefao.y}px` }">
            <span class="vida-do-chefao"><i :style="{ width: `${(chefao.vida / chefao.vidaMaxima) * 100}%` }" /></span>
            <IconePixel nome="chefao" :escala="4" />
          </span>

          <!-- a nave (com o escudo, quando tiver) -->
          <span class="coisa nave" :class="{ piscando, 'com-escudo': temEscudo }" :style="{ left: `${naveX}px`, top: `${naveY}px` }">
            <IconePixel nome="nave" :escala="4" />
          </span>

          <span v-if="aviso" class="aviso-no-meio">{{ aviso }}</span>

          <AvisoPausa v-if="jogo.pausado.value" v-model:confirmando="jogo.confirmandoSaida.value" @continuar="jogo.continuar" @sair="sair" />
        </div>
      </Teleport>
    </template>

    <template v-else>
      <h2>Gochi Espacial</h2>
      <p class="resultado">Fim de jogo! <span class="numero">{{ pontos }}</span> pontos</p>
      <p>Chegou até a fase <span class="numero">{{ fase }}</span></p>
      <p v-if="bateuRecorde" class="recorde novo">Recorde novo!</p>
      <p v-else class="recorde">Recorde: <span class="numero">{{ recorde }}</span> pontos</p>
      <p class="ganho">
        <IconePixel nome="moeda" />
        <span class="numero">+{{ moedasGanhas }}</span> {{ moedasGanhas === 1 ? 'moeda' : 'moedas' }}
      </p>
      <button class="button button-primary grande" type="button" :disabled="bicho.status.energia < 20" @click="comecar">Jogar de novo</button>
    </template>
  </section>
</template>

<style scoped>
.jogo {
  display: grid;
  justify-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  text-align: center;
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 16px;
}

h2 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--primary);
}

p {
  margin: 0;
  color: var(--text-muted);
}

.aviso {
  color: var(--danger-text);
  font-weight: 600;
}

.vidas {
  display: inline-flex;
  gap: 3px;
}

.vidas .perdida {
  opacity: 0.2;
  filter: grayscale(1);
}

/* o palco dentro do visor */
.ceu {
  position: absolute;
  inset: 0;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  cursor: pointer;
}

.como {
  font-weight: 600;
  color: var(--text);
}

/* logo abaixo do placar do topo */
.fase {
  position: absolute;
  top: calc(3.6rem + env(safe-area-inset-top, 0px));
  left: 50%;
  transform: translateX(-50%);
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.poderes-ligados {
  position: absolute;
  left: 0.75rem;
  bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
  display: flex;
  gap: var(--space-2);
}

.ligado {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: var(--font-size-xs);
  color: var(--text);
}

/* tudo que se mexe fica "pendurado" pelo meio */
.coisa,
.tiro,
.tiro-chefao {
  position: absolute;
  transform: translate(-50%, -50%);
}

.nave.piscando {
  animation: piscar 0.2s steps(1) infinite;
}

@keyframes piscar {
  50% {
    opacity: 0.25;
  }
}

/* o escudo: um anel azul em volta da nave */
.nave.com-escudo::after {
  content: '';
  position: absolute;
  inset: -8px;
  border: 3px solid #7cc6f0;
  border-radius: 50%;
}

/* a bolha do power-up */
.bolha {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  background: rgb(255 255 255 / 0.6);
  border: 2px solid #b89cff;
  border-radius: 50%;
  animation: pulsar 0.6s steps(1) infinite;
}

@keyframes pulsar {
  50% {
    border-color: #f6c343;
  }
}

/* tiro da nave: um risquinho amarelo; tiro do chefão: uma bolinha vermelha */
.tiro {
  width: 4px;
  height: 10px;
  background: #f6c343;
  box-shadow: 0 0 0 1px #5b3a36;
}

.tiro-chefao {
  width: 8px;
  height: 8px;
  background: #e5484d;
  box-shadow: 0 0 0 2px #5b3a36;
}

.chefao {
  display: grid;
  justify-items: center;
  gap: 4px;
}

.vida-do-chefao {
  width: 80px;
  height: 6px;
  background: #3e3540;
  border: 1px solid #5b3a36;
}

.vida-do-chefao i {
  display: block;
  height: 100%;
  background: #e5484d;
}

.aviso-no-meio {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: var(--font-pixel);
  font-size: 1.3rem;
  white-space: nowrap;
  color: var(--primary);
  text-shadow: 2px 2px 0 var(--lcd);
  pointer-events: none;
}


.recorde {
  font-weight: 600;
}

.recorde.novo {
  font-family: var(--font-pixel);
  color: var(--primary);
}

.resultado {
  font-family: var(--font-pixel);
  font-size: 1.2rem;
  color: var(--text);
}

.grande {
  min-width: 10rem;
}

.ganho {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: 600;
  color: var(--text);
}
</style>
