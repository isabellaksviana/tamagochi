<script setup lang="ts">
import { computed, ref } from 'vue'
import DesenhoBicho from './DesenhoBicho.vue'
import IconePixel from './IconePixel.vue'
import ControlesDoJogo from './ControlesDoJogo.vue'
import { useJogoNoVisor } from '../composables/useJogoNoVisor'
import { tocar } from '../som'
import type { Bicho } from '../tipos'

// "Gochi Espacial": o bicho pilota uma nave embaixo da telinha e só anda pros lados.
// O tiro sai sozinho, reto pra cima. Asteroides descem: o tiro destrói, encostar tira uma vida.
// De vez em quando desce uma moeda no meio deles. Com pontos suficientes, chega o CHEFÃO:
// uma nave grandona lá em cima, que atira de volta. Venceu, a próxima fase vem mais rápida.
const props = defineProps<{
  bicho: Bicho
}>()

const emit = defineEmits<{
  jogando: [ligado: boolean]
  terminou: [moedas: number]
}>()

const VIDAS = 5
const MAXIMO_DE_MOEDAS = 5
const VELOCIDADE_DA_NAVE = 240 // px/s
const INTERVALO_DO_TIRO = 0.3 // s
const VELOCIDADE_DO_TIRO = 520 // px/s
const LARGURA_DA_NAVE = 39
const PONTOS_PRO_PRIMEIRO_CHEFAO = 200
const PONTOS_ENTRE_CHEFOES = 300
const LARGURA_DO_CHEFAO = 92
const ALTURA_DO_CHEFAO = 44

type Coisa = { id: number; x: number; y: number; vx: number; vy: number; tamanho: number }
type Chefao = { x: number; y: number; vx: number; vida: number; vidaMaxima: number; recarga: number }

const ceu = ref<HTMLElement | null>(null)
const naveX = ref(0)
const tiros = ref<Coisa[]>([])
const asteroides = ref<Coisa[]>([])
const moedasCaindo = ref<Coisa[]>([])
const tirosDoChefao = ref<Coisa[]>([])
const chefao = ref<Chefao | null>(null)
const pontos = ref(0)
const vidas = ref(VIDAS)
const fase = ref(1)
const moedasPegas = ref(0)
const piscando = ref(false)

const recorde = ref(Number(localStorage.getItem('recordeGochiEspacial') ?? 0))
const bateuRecorde = ref(false)
const moedasGanhas = computed(() => Math.min(MAXIMO_DE_MOEDAS, moedasPegas.value))

let proximoId = 0
let recargaDoTiro = 0
let proximoAsteroide = 0
let proximaMoeda = 0
let proximoChefao = PONTOS_PRO_PRIMEIRO_CHEFAO
let invencivel = 0
let montado = false

function tamanho() {
  return { largura: ceu.value?.clientWidth ?? 320, altura: ceu.value?.clientHeight ?? 400 }
}

// a nave fica perto do chão da telinha (este é o topo da nave, onde nasce o tiro)
function naveY(altura: number) {
  return altura - 64
}

const perto = (a: { x: number; y: number }, b: { x: number; y: number }, distancia: number) =>
  (a.x - b.x) ** 2 + (a.y - b.y) ** 2 <= distancia ** 2

// levou um golpe (asteroide ou tiro do chefão): perde vida e fica piscando um tempinho
function levarGolpe() {
  if (invencivel > 0) return
  vidas.value--
  invencivel = 1.2
  tocar('errou')
  if (vidas.value <= 0) terminar()
}

const jogo = useJogoNoVisor({
  avisarJogando: (ligado) => emit('jogando', ligado),
  passo(segundos) {
    const { largura, altura } = tamanho()
    if (!montado) {
      naveX.value = largura / 2
      montado = true
    }
    const centroDaNave = { x: naveX.value, y: naveY(altura) + 8 }

    // a nave anda pros lados (sem sair da telinha)
    naveX.value = Math.min(largura - 22, Math.max(22, naveX.value + jogo.controle.direcao * VELOCIDADE_DA_NAVE * segundos))

    // piscando depois de levar golpe
    invencivel = Math.max(0, invencivel - segundos)
    piscando.value = invencivel > 0

    // o tiro sai sozinho
    recargaDoTiro -= segundos
    if (recargaDoTiro <= 0) {
      recargaDoTiro = INTERVALO_DO_TIRO
      tiros.value.push({ id: proximoId++, x: naveX.value, y: naveY(altura) - 6, vx: 0, vy: -VELOCIDADE_DO_TIRO, tamanho: 4 })
    }

    // asteroides (só quando o chefão não está), cada vez mais rápidos e frequentes
    if (!chefao.value) {
      proximoAsteroide -= segundos
      if (proximoAsteroide <= 0) {
        proximoAsteroide = Math.max(0.35, 1.1 - fase.value * 0.12 - pontos.value / 3000)
        const grande = Math.random() < 0.35
        asteroides.value.push({
          id: proximoId++,
          x: 16 + Math.random() * (largura - 32),
          y: -20,
          vx: (Math.random() - 0.5) * 40,
          vy: 80 + fase.value * 18 + Math.random() * 60,
          tamanho: grande ? 36 : 27,
        })
      }
    }

    // de vez em quando, uma moeda
    proximaMoeda -= segundos
    if (proximaMoeda <= 0) {
      proximaMoeda = 4 + Math.random() * 4
      moedasCaindo.value.push({ id: proximoId++, x: 16 + Math.random() * (largura - 32), y: -20, vx: 0, vy: 100, tamanho: 18 })
    }

    // chegou a hora do chefão
    if (!chefao.value && pontos.value >= proximoChefao) {
      const vida = 12 + fase.value * 6
      chefao.value = { x: largura / 2, y: 46, vx: 70 + fase.value * 15, vida, vidaMaxima: vida, recarga: 1.5 }
      tocar('alerta')
    }

    // tudo se mexe
    const mover = (lista: Coisa[]) =>
      lista.forEach((coisa) => {
        coisa.x += coisa.vx * segundos
        coisa.y += coisa.vy * segundos
      })
    mover(tiros.value)
    mover(asteroides.value)
    mover(moedasCaindo.value)
    mover(tirosDoChefao.value)

    // o chefão anda de um lado pro outro e atira 3 tiros pra baixo
    const chefe = chefao.value
    if (chefe) {
      chefe.x += chefe.vx * segundos
      if (chefe.x < LARGURA_DO_CHEFAO / 2 || chefe.x > largura - LARGURA_DO_CHEFAO / 2) chefe.vx *= -1
      chefe.recarga -= segundos
      if (chefe.recarga <= 0) {
        chefe.recarga = Math.max(0.6, 1.3 - fase.value * 0.1)
        for (const vx of [-70, 0, 70]) {
          tirosDoChefao.value.push({ id: proximoId++, x: chefe.x, y: chefe.y + ALTURA_DO_CHEFAO / 2, vx, vy: 200 + fase.value * 15, tamanho: 6 })
        }
      }
    }

    // tiro contra asteroide e contra o chefão
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
          pontos.value += 100
          fase.value++
          proximoChefao = pontos.value + PONTOS_ENTRE_CHEFOES
          chefao.value = null
          tirosDoChefao.value = []
          tocar('chocou')
        }
      }
    }

    // asteroide ou tiro do chefão na nave: perde vida
    for (const asteroide of asteroides.value) {
      if (perto(asteroide, centroDaNave, asteroide.tamanho / 2 + 14)) {
        asteroide.y = 9999
        levarGolpe()
      }
    }
    for (const tiro of tirosDoChefao.value) {
      if (perto(tiro, centroDaNave, 16)) {
        tiro.y = 9999
        levarGolpe()
      }
    }

    // moeda encostou na nave: pegou
    for (const moeda of moedasCaindo.value) {
      if (perto(moeda, centroDaNave, 26)) {
        moeda.y = 9999
        moedasPegas.value++
        tocar('pegou')
      }
    }

    // tira o que saiu da telinha
    const dentro = (coisa: Coisa) => coisa.y > -40 && coisa.y < altura + 40
    tiros.value = tiros.value.filter(dentro)
    asteroides.value = asteroides.value.filter(dentro)
    moedasCaindo.value = moedasCaindo.value.filter(dentro)
    tirosDoChefao.value = tirosDoChefao.value.filter(dentro)
  },
})

function comecar() {
  tiros.value = []
  asteroides.value = []
  moedasCaindo.value = []
  tirosDoChefao.value = []
  chefao.value = null
  pontos.value = 0
  vidas.value = VIDAS
  fase.value = 1
  moedasPegas.value = 0
  bateuRecorde.value = false
  proximoChefao = PONTOS_PRO_PRIMEIRO_CHEFAO
  proximoAsteroide = 1
  proximaMoeda = 3
  recargaDoTiro = 0
  invencivel = 0
  montado = false
  jogo.comecar()
}

function terminar() {
  jogo.terminar()
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
        {{ bicho.nome }} pilota a nave: mexa pros lados, que o tiro sai sozinho. Destrua os asteroides, pegue as moedas
        e enfrente o chefão. São {{ VIDAS }} vidas.
      </p>
      <p v-if="recorde > 0" class="recorde">Recorde: <span class="numero">{{ recorde }}</span> pontos</p>
      <p v-if="bicho.status.energia < 20" class="aviso">Cansado demais pra brincar. Apague a luz um pouquinho.</p>
      <button class="button button-primary grande" type="button" :disabled="bicho.status.energia < 20" @click="comecar">
        <IconePixel nome="controle" />
        Jogar
      </button>
    </template>

    <template v-else-if="jogo.etapa.value === 'jogando'">
      <ControlesDoJogo :pausado="jogo.pausado.value" @andar="jogo.andar" @alternar-pausa="jogo.alternarPausa">
        <span>Pontos <span class="numero">{{ pontos }}</span></span>
        <span class="vidas" :aria-label="`${vidas} de ${VIDAS} vidas`">
          <IconePixel v-for="n in VIDAS" :key="n" nome="coracao" :class="{ perdida: n > vidas }" />
        </span>
      </ControlesDoJogo>

      <Teleport to="#palco-do-jogo">
        <div
          ref="ceu"
          class="ceu"
          @pointerdown="jogo.tocarNaTela"
          @pointerup="jogo.andar(0)"
          @pointerleave="jogo.andar(0)"
          @pointercancel="jogo.andar(0)"
        >
          <span class="fase numero">Fase {{ fase }}</span>

          <span v-for="tiro in tiros" :key="tiro.id" class="tiro" :style="{ left: `${tiro.x}px`, top: `${tiro.y}px` }" />
          <span v-for="tiro in tirosDoChefao" :key="tiro.id" class="tiro-chefao" :style="{ left: `${tiro.x}px`, top: `${tiro.y}px` }" />
          <span
            v-for="asteroide in asteroides"
            :key="asteroide.id"
            class="coisa"
            :style="{ left: `${asteroide.x}px`, top: `${asteroide.y}px` }"
          >
            <IconePixel nome="asteroide" :escala="asteroide.tamanho > 30 ? 4 : 3" />
          </span>
          <span v-for="moeda in moedasCaindo" :key="moeda.id" class="coisa" :style="{ left: `${moeda.x}px`, top: `${moeda.y}px` }">
            <IconePixel nome="moeda" />
          </span>

          <!-- o chefão, com a barrinha de vida -->
          <span v-if="chefao" class="coisa chefao" :style="{ left: `${chefao.x}px`, top: `${chefao.y}px` }">
            <span class="vida-do-chefao"><i :style="{ width: `${(chefao.vida / chefao.vidaMaxima) * 100}%` }" /></span>
            <IconePixel nome="chefao" :escala="4" />
          </span>

          <!-- a nave, com o bicho de piloto -->
          <span class="nave" :class="{ piscando }" :style="{ left: `${naveX}px`, bottom: '24px' }">
            <span class="piloto">
              <DesenhoBicho :especie="bicho.especie" :cor="bicho.cor" expressao="surpreso" so-cabeca />
            </span>
            <IconePixel nome="nave" :escala="4" />
          </span>

          <button v-if="jogo.pausado.value" class="aviso-pausa" type="button" @pointerdown.stop @click="jogo.continuar">
            Pausado
            <small>toque pra continuar</small>
          </button>
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

.fase {
  position: absolute;
  top: 0.9rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

/* tudo que se mexe fica "pendurado" pelo meio */
.coisa,
.nave,
.tiro,
.tiro-chefao {
  position: absolute;
  transform: translate(-50%, -50%);
}

.nave {
  display: grid;
  justify-items: center;
  transform: translateX(-50%);
}

/* o bicho piloto, sentadinho na cabine (45px = o desenho em tamanho inteiro, sem borrar) */
.piloto {
  width: 45px;
  margin-bottom: -16px;
}

.nave.piscando {
  animation: piscar 0.2s steps(1) infinite;
}

@keyframes piscar {
  50% {
    opacity: 0.25;
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

.aviso-pausa {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  gap: var(--space-1);
  font-family: var(--font-pixel);
  font-size: 1.4rem;
  color: var(--text);
  background: color-mix(in srgb, var(--lcd) 70%, transparent);
  border: none;
  cursor: pointer;
}

.aviso-pausa small {
  font-family: var(--font);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-muted);
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
