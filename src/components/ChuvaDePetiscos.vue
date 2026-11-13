<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import DesenhoBicho from './DesenhoBicho.vue'
import IconePixel from './IconePixel.vue'
import AvisoPausa from './AvisoPausa.vue'
import { comecarMusica, pararMusica, tocar } from '../som'
import type { NomeIcone } from '../icones'
import type { Bicho } from '../tipos'

// "Chuva de petiscos": os petiscos caem do céu e você move o bicho pros lados pra pegar.
// Sem tempo: são 5 vidas, e cada petisco que cai no chão tira uma. Começa devagar e acelera
// a cada ponto. A cada 10 pontos, 1 moeda (no máximo 5 por partida). E tem recorde!
const props = defineProps<{
  bicho: Bicho
}>()

const emit = defineEmits<{
  // avisa a tela que a partida começou/acabou (o visor esconde o bicho de sempre)
  jogando: [ligado: boolean]
  terminou: [moedas: number]
  // saiu no meio, pela pausa (volta pra escolha dos jogos)
  saiu: []
}>()

const VIDAS = 5
const PONTOS_POR_MOEDA = 10
const MAXIMO_DE_MOEDAS = 5
// posições em % da largura/altura da telinha
const VELOCIDADE_DO_GATO = 70 // % por segundo
const ALCANCE = 11 // quão longe do meio do bicho ainda conta como pego (em %)
// a cabeça do bicho, em pixels contados de baixo da telinha (ele tem 90px de largura e fica 20px acima do fundo):
// o topo da cabeça fica a ~102px do fundo. Em pixels, porque o visor muda de altura (fica em pé no jogo)
const TOPO_DA_CABECA = 102
const ALTURA_DO_PETISCO = 24
// a telinha, pra saber a altura de verdade
const ceu = ref<HTMLElement | null>(null)

type Petisco = { id: number; x: number; y: number; icone: NomeIcone }
const ICONES_DE_PETISCO: NomeIcone[] = ['peixe', 'biscoito', 'sache']

type Etapa = 'inicio' | 'jogando' | 'fim'
const etapa = ref<Etapa>('inicio')
const gatoX = ref(50)
const petiscos = ref<Petisco[]>([])
const pontos = ref(0)
const vidas = ref(VIDAS)
const pegouAgora = ref(false)

// o recorde fica salvo (é do jogo, não de um bicho)
const recorde = ref(Number(localStorage.getItem('recordeChuva') ?? 0))
const bateuRecorde = ref(false)

const moedasGanhas = computed(() => Math.min(MAXIMO_DE_MOEDAS, Math.floor(pontos.value / PONTOS_POR_MOEDA)))

// pra onde o gato está andando: -1 esquerda, 0 parado, 1 direita
let direcao = 0
let proximoId = 0
let ultimoQuadro = 0
let tempoPraProximo = 0
let quadro = 0
let relogioDoPegou = 0

function comecar() {
  emit('jogando', true)
  // no celular, sobe a tela pra o visor em pé e os controles aparecerem inteiros
  window.scrollTo({ top: 0, behavior: 'smooth' })
  etapa.value = 'jogando'
  gatoX.value = 50
  petiscos.value = []
  pontos.value = 0
  vidas.value = VIDAS
  bateuRecorde.value = false
  tempoPraProximo = 0.5
  ultimoQuadro = performance.now()
  pausado.value = false
  comecarMusica()
  quadro = requestAnimationFrame(passo)
}

// ============ pausa ============
// pausado: os petiscos ficam parados no ar e a música para, até continuar
const pausado = ref(false)

function pausar() {
  if (etapa.value !== 'jogando' || pausado.value) return
  pausado.value = true
  cancelAnimationFrame(quadro)
  pararMusica()
  direcao = 0
}

// sair pela pausa: acaba sem prêmio e volta pra escolha dos jogos
function sair() {
  cancelAnimationFrame(quadro)
  pararMusica()
  direcao = 0
  pausado.value = false
  petiscos.value = []
  etapa.value = 'inicio'
  emit('jogando', false)
  emit('saiu')
}

function continuar() {
  if (etapa.value !== 'jogando' || !pausado.value) return
  pausado.value = false
  // o relógio recomeça de agora (senão o tempo pausado viraria um "pulo" gigante)
  ultimoQuadro = performance.now()
  comecarMusica()
  quadro = requestAnimationFrame(passo)
}

// saiu da aba ou do app no meio da partida: pausa sozinho
function quandoSumir() {
  if (document.hidden) pausar()
}

// um "quadro" do jogo (umas 60 vezes por segundo): anda, cai, pega
function passo(agora: number) {
  const segundos = Math.min(0.05, (agora - ultimoQuadro) / 1000)
  ultimoQuadro = agora

  // começa devagarzinho; a cada ponto, cai mais rápido e aparece mais petisco (com um limite)
  const velocidadeDaQueda = Math.min(80, 16 + pontos.value * 1.5)
  const intervalo = Math.max(0.5, 1.6 - pontos.value * 0.035)

  gatoX.value = Math.min(92, Math.max(8, gatoX.value + direcao * VELOCIDADE_DO_GATO * segundos))

  tempoPraProximo -= segundos
  if (tempoPraProximo <= 0) {
    tempoPraProximo = intervalo
    petiscos.value.push({
      id: proximoId++,
      x: 8 + Math.random() * 84,
      y: -8,
      icone: ICONES_DE_PETISCO[Math.floor(Math.random() * ICONES_DE_PETISCO.length)]!,
    })
  }

  for (const petisco of petiscos.value) petisco.y += velocidadeDaQueda * segundos

  // pegou: chegou na altura da boca e está perto do bicho. Caiu no chão: perde uma vida
  const restantes: Petisco[] = []
  for (const petisco of petiscos.value) {
    // em pixels: onde está o topo do petisco e onde está a cabeça do bicho
    const altura = ceu.value?.clientHeight ?? 240
    const topoDoPetisco = (petisco.y / 100) * altura
    const cabeca = altura - TOPO_DA_CABECA
    const naCabeca = topoDoPetisco + ALTURA_DO_PETISCO >= cabeca && topoDoPetisco <= cabeca + 40
    if (naCabeca && Math.abs(petisco.x - gatoX.value) < ALCANCE) {
      pontos.value++
      tocar('pegou')
      pegouAgora.value = true
      clearTimeout(relogioDoPegou)
      relogioDoPegou = setTimeout(() => (pegouAgora.value = false), 300)
    } else if (topoDoPetisco >= altura - 40) {
      vidas.value--
      tocar('errou')
    } else {
      restantes.push(petisco)
    }
  }
  petiscos.value = restantes

  if (vidas.value <= 0) return terminar()
  quadro = requestAnimationFrame(passo)
}

function terminar() {
  cancelAnimationFrame(quadro)
  pararMusica()
  direcao = 0
  petiscos.value = []
  etapa.value = 'fim'
  if (pontos.value > recorde.value) {
    recorde.value = pontos.value
    bateuRecorde.value = true
    localStorage.setItem('recordeChuva', String(pontos.value))
  }
  emit('jogando', false)
  tocar('fimDoJogo')
  emit('terminou', moedasGanhas.value)
}

// ============ controles: botões (segurar), teclado e toque nos lados da telinha ============
function andar(novaDirecao: number) {
  direcao = novaDirecao
}

function teclaApertada(evento: KeyboardEvent) {
  if (etapa.value !== 'jogando') return
  // P ou Esc: pausa / continua
  if (evento.key === 'p' || evento.key === 'P' || evento.key === 'Escape') {
    evento.preventDefault()
    return pausado.value ? continuar() : pausar()
  }
  if (pausado.value) return
  if (evento.key === 'ArrowLeft') andar(-1)
  if (evento.key === 'ArrowRight') andar(1)
}

function teclaSolta(evento: KeyboardEvent) {
  if (evento.key === 'ArrowLeft' && direcao === -1) andar(0)
  if (evento.key === 'ArrowRight' && direcao === 1) andar(0)
}

// tocar/clicar na metade esquerda ou direita da telinha
function tocarNaTela(evento: PointerEvent) {
  if (pausado.value) return
  const caixa = (evento.currentTarget as HTMLElement).getBoundingClientRect()
  andar(evento.clientX < caixa.left + caixa.width / 2 ? -1 : 1)
}

onMounted(() => {
  window.addEventListener('keydown', teclaApertada)
  window.addEventListener('keyup', teclaSolta)
  document.addEventListener('visibilitychange', quandoSumir)
})
onUnmounted(() => {
  cancelAnimationFrame(quadro)
  clearTimeout(relogioDoPegou)
  pararMusica()
  emit('jogando', false)
  window.removeEventListener('keydown', teclaApertada)
  window.removeEventListener('keyup', teclaSolta)
  document.removeEventListener('visibilitychange', quandoSumir)
})
</script>

<template>
  <section class="jogo">
    <!-- durante a partida, o título some pra caber o visor em pé e os controles -->
    <h2 v-if="etapa !== 'jogando'">Chuva de petiscos</h2>

    <template v-if="etapa === 'inicio'">
      <p>
        Mexa {{ bicho.nome }} pros lados pra pegar os petiscos. São {{ VIDAS }} vidas: cada petisco que cai no chão
        tira uma. Começa devagar e vai acelerando. A cada {{ PONTOS_POR_MOEDA }} pontos, 1 moeda.
      </p>
      <p v-if="recorde > 0" class="recorde">Recorde: <span class="numero">{{ recorde }}</span> pontos</p>
      <p v-if="bicho.status.energia < 20" class="aviso">Cansado demais pra brincar. Apague a luz um pouquinho.</p>
      <button class="button button-primary grande" type="button" :disabled="bicho.status.energia < 20" @click="comecar">
        <IconePixel nome="controle" />
        Jogar
      </button>
    </template>

    <template v-else-if="etapa === 'jogando'">
      <p class="placar">
        <span>Pontos <span class="numero">{{ pontos }}</span></span>
        <!-- as vidas em coraçõezinhos: cheios = ainda tem, apagados = perdeu -->
        <span class="vidas" :aria-label="`${vidas} de ${VIDAS} vidas`">
          <IconePixel v-for="n in VIDAS" :key="n" nome="coracao" :class="{ perdida: n > vidas }" />
        </span>
        <button
          class="button so-icone pausa"
          type="button"
          :aria-label="pausado ? 'Continuar' : 'Pausar'"
          :title="pausado ? 'Continuar (P)' : 'Pausar (P)'"
          @click="pausado ? continuar() : pausar()"
        >
          <IconePixel :nome="pausado ? 'play' : 'pausa'" :escala="3" />
        </button>
      </p>

      <!-- o jogo acontece DENTRO do visor de LCD (o Teleport leva este pedaço pra lá).
           Tocar num lado da telinha anda pra aquele lado. -->
      <Teleport to="#palco-do-jogo">
        <div
          ref="ceu"
          class="ceu"
          @pointerdown="tocarNaTela"
          @pointerup="andar(0)"
          @pointerleave="andar(0)"
          @pointercancel="andar(0)"
        >
          <span v-for="petisco in petiscos" :key="petisco.id" class="petisco" :style="{ left: `${petisco.x}%`, top: `${petisco.y}%` }">
            <IconePixel :nome="petisco.icone" :escala="3" />
          </span>
          <span class="gato" :style="{ left: `${gatoX}%` }">
            <DesenhoBicho :especie="bicho.especie" :cor="bicho.cor" :expressao="pegouAgora ? 'feliz' : 'surpreso'" />
          </span>
          <!-- pausado: o aviso no meio da telinha (tocar nele continua) -->
          <AvisoPausa v-if="pausado" @continuar="continuar" @sair="sair" />
        </div>
      </Teleport>

      <div class="controles">
        <button
          class="button lado"
          type="button"
          :disabled="pausado"
          aria-label="Andar pra esquerda"
          @pointerdown="andar(-1)"
          @pointerup="andar(0)"
          @pointerleave="andar(0)"
          @pointercancel="andar(0)"
        >
          <IconePixel nome="seta" :escala="4" />
        </button>
        <button
          class="button lado"
          type="button"
          :disabled="pausado"
          aria-label="Andar pra direita"
          @pointerdown="andar(1)"
          @pointerup="andar(0)"
          @pointerleave="andar(0)"
          @pointercancel="andar(0)"
        >
          <IconePixel nome="setaDireita" :escala="4" />
        </button>
      </div>
    </template>

    <template v-else>
      <p class="resultado">Fim de jogo! <span class="numero">{{ pontos }}</span> pontos</p>
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

.placar {
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-weight: 600;
  color: var(--text);
}

.placar > span {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.vidas {
  gap: 3px !important;
}

.pausa {
  width: 2.25rem;
  min-height: 2.25rem;
}


/* vida perdida: o coraçãozinho fica apagado */
.vidas .perdida {
  opacity: 0.2;
  filter: grayscale(1);
}

.recorde {
  font-weight: 600;
}

.recorde.novo {
  font-family: var(--font-pixel);
  color: var(--primary);
}

/* o palco dentro do visor: ocupa a telinha toda (o fundo de LCD é o do próprio visor) */
.ceu {
  position: absolute;
  inset: 0;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  cursor: pointer;
}

.petisco,
.gato {
  position: absolute;
  transform: translateX(-50%);
}

/* em pé no chão do visor; 90px = 2× o desenho, pra caber correndo de um lado pro outro */
.gato {
  bottom: calc(var(--space-4) + 4px);
  width: 90px;
}

.controles {
  display: flex;
  gap: var(--space-4);
}

/* segurar a seta no celular não abre menu nem seleciona nada */
.lado {
  width: 5.5rem;
  height: 4rem;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
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
