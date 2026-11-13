<script setup lang="ts">
import { computed, ref } from 'vue'
import DesenhoBicho from './DesenhoBicho.vue'
import IconePixel from './IconePixel.vue'
import AvisoPausa from './AvisoPausa.vue'
import HudDoJogo from './HudDoJogo.vue'
import DicaDoTeclado from './DicaDoTeclado.vue'
import { rumoAo, useJogoNoVisor } from '../composables/useJogoNoVisor'
import { useTelaDeToque } from '../composables/useTelaDeToque'
import { tocar } from '../som'
import type { NomeIcone } from '../icones'
import type { Bicho } from '../tipos'

// "Chuva de petiscos": os petiscos caem do céu e você move o bicho pros lados pra pegar.
// Sem tempo: são 5 vidas, e cada petisco que cai no chão tira uma. Começa devagar e acelera
// a cada ponto. A cada 10 pontos, 1 moeda (no máximo 5 por partida). E tem recorde!
// Controles: no celular, o bicho vai atrás do dedo; no computador, as setas.
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
const PONTOS_POR_MOEDA = 10
const MAXIMO_DE_MOEDAS = 5
// posições em % da largura/altura da telinha
const VELOCIDADE_NO_TECLADO = 75 // % por segundo
const VELOCIDADE_NO_DEDO = 160 // % por segundo (o dedo é preciso: o bicho corre pra lá)
const ALTURA_DO_PETISCO = 24 // px
const LARGURA_DO_PETISCO = 27 // px

type Petisco = { id: number; x: number; y: number; icone: NomeIcone }
const ICONES_DE_PETISCO: NomeIcone[] = ['peixe', 'biscoito', 'sache']

const toque = useTelaDeToque()
// a telinha e o bicho, pra medir em pixels (o tamanho muda: em pé no computador, tela cheia no celular)
const ceu = ref<HTMLElement | null>(null)
const desenhoDoBicho = ref<HTMLElement | null>(null)
const bichoX = ref(50)
const petiscos = ref<Petisco[]>([])
const pontos = ref(0)
const vidas = ref(VIDAS)
const pegouAgora = ref(false)

const recorde = ref(Number(localStorage.getItem('recordeChuva') ?? 0))
const bateuRecorde = ref(false)
const moedasGanhas = computed(() => Math.min(MAXIMO_DE_MOEDAS, Math.floor(pontos.value / PONTOS_POR_MOEDA)))

let proximoId = 0
let tempoPraProximo = 0
let relogioDoPegou = 0

const jogo = useJogoNoVisor({
  avisarJogando: (ligado) => emit('jogando', ligado),
  passo(segundos) {
    const largura = ceu.value?.clientWidth ?? 320
    const altura = ceu.value?.clientHeight ?? 400

    // começa devagarzinho; a cada ponto, cai mais rápido e aparece mais petisco (com um limite)
    const velocidadeDaQueda = Math.min(75, 15 + pontos.value * 1.4)
    const intervalo = Math.max(0.5, 1.6 - pontos.value * 0.035)

    // o bicho: atrás do dedo (celular/mouse) ou pelas setas (teclado)
    const dedo = jogo.controle.dedo
    if (dedo) {
      const alvo = (dedo.x / largura) * 100
      bichoX.value += rumoAo(alvo, bichoX.value, 6) * VELOCIDADE_NO_DEDO * segundos
    } else {
      bichoX.value += jogo.controle.direcao * VELOCIDADE_NO_TECLADO * segundos
    }
    bichoX.value = Math.min(92, Math.max(8, bichoX.value))

    tempoPraProximo -= segundos
    if (tempoPraProximo <= 0) {
      tempoPraProximo = intervalo
      petiscos.value.push({
        id: proximoId++,
        x: 8 + Math.random() * 84,
        // começa embaixo do placar (não nasce escondido atrás dele)
        y: 8,
        icone: ICONES_DE_PETISCO[Math.floor(Math.random() * ICONES_DE_PETISCO.length)]!,
      })
    }

    for (const petisco of petiscos.value) petisco.y += velocidadeDaQueda * segundos

    // o bicho, medido de verdade (em pixels): da cabeça (16% do desenho, abaixo das orelhas) às patinhas
    const desenho = desenhoDoBicho.value
    const larguraDoBicho = desenho?.offsetWidth ?? 90
    const cabeca = desenho ? desenho.offsetTop + desenho.offsetHeight * 0.16 : altura - 102
    const patas = desenho ? desenho.offsetTop + desenho.offsetHeight * 0.95 : altura - 25
    const meioDoBicho = (bichoX.value / 100) * largura

    // pegou: o petisco encostou em QUALQUER parte do bicho (antes só valia uma faixa na altura da cabeça,
    // e o petisco que já tinha passado dela atravessava o corpo sem contar).
    // Passou das patinhas sem encostar: caiu no chão e perde uma vida
    const restantes: Petisco[] = []
    for (const petisco of petiscos.value) {
      const topo = (petisco.y / 100) * altura
      const meioDoPetisco = (petisco.x / 100) * largura
      const naAltura = topo + ALTURA_DO_PETISCO >= cabeca && topo <= patas
      // de lado: as bordas se encostam (com uma folguinha de 6px pra não exigir pixel perfeito)
      const deLado = Math.abs(meioDoPetisco - meioDoBicho) < larguraDoBicho / 2 + LARGURA_DO_PETISCO / 2 - 6
      if (naAltura && deLado) {
        pontos.value++
        tocar('pegou')
        pegouAgora.value = true
        clearTimeout(relogioDoPegou)
        relogioDoPegou = setTimeout(() => (pegouAgora.value = false), 300)
      } else if (topo > patas) {
        vidas.value--
        tocar('errou')
      } else {
        restantes.push(petisco)
      }
    }
    petiscos.value = restantes

    if (vidas.value <= 0) terminar()
  },
})

function comecar() {
  bichoX.value = 50
  petiscos.value = []
  pontos.value = 0
  vidas.value = VIDAS
  bateuRecorde.value = false
  tempoPraProximo = 0.6
  jogo.comecar()
}

function terminar() {
  jogo.terminar()
  petiscos.value = []
  if (pontos.value > recorde.value) {
    recorde.value = pontos.value
    bateuRecorde.value = true
    localStorage.setItem('recordeChuva', String(pontos.value))
  }
  tocar('fimDoJogo')
  emit('terminou', moedasGanhas.value)
}

// sair pela pausa: acaba sem prêmio e volta pra escolha dos jogos
function sair() {
  jogo.sair()
  petiscos.value = []
  emit('saiu')
}
</script>

<template>
  <section class="jogo">
    <template v-if="jogo.etapa.value === 'inicio'">
      <h2>Chuva de petiscos</h2>
      <p>
        Pegue os petiscos que caem! São {{ VIDAS }} vidas: cada petisco que cai no chão tira uma. Começa devagar e vai
        acelerando. A cada {{ PONTOS_POR_MOEDA }} pontos, 1 moeda.
      </p>
      <p class="como">{{ toque ? 'Arraste o dedo na tela pra mover.' : 'Use as setas ← → do teclado pra mover.' }}</p>
      <p v-if="recorde > 0" class="recorde">Recorde: <span class="numero">{{ recorde }}</span> pontos</p>
      <p v-if="bicho.status.energia < 20" class="aviso">Cansado demais pra brincar. Apague a luz um pouquinho.</p>
      <button class="button button-primary grande" type="button" :disabled="bicho.status.energia < 20" @click="comecar">
        <IconePixel nome="controle" />
        Jogar
      </button>
    </template>

    <template v-else-if="jogo.etapa.value === 'jogando'">
      <!-- no computador, a dica das teclas embaixo do visor (no celular o jogo está em tela cheia) -->
      <DicaDoTeclado v-if="!toque" />

      <!-- o jogo acontece DENTRO do visor de LCD (o Teleport leva este pedaço pra lá) -->
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

          <span v-for="petisco in petiscos" :key="petisco.id" class="petisco" :style="{ left: `${petisco.x}%`, top: `${petisco.y}%` }">
            <IconePixel :nome="petisco.icone" :escala="3" />
          </span>
          <span ref="desenhoDoBicho" class="lugar-do-bicho" :style="{ left: `${bichoX}%` }">
            <DesenhoBicho :especie="bicho.especie" :cor="bicho.cor" :expressao="pegouAgora ? 'feliz' : 'surpreso'" />
          </span>

          <AvisoPausa
            v-if="jogo.pausado.value"
            v-model:confirmando="jogo.confirmandoSaida.value"
            @continuar="jogo.continuar"
            @sair="sair"
          />
        </div>
      </Teleport>
    </template>

    <template v-else>
      <h2>Chuva de petiscos</h2>
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

.como {
  font-weight: 600;
  color: var(--text);
}

.aviso {
  color: var(--danger-text);
  font-weight: 600;
}

/* o palco dentro do visor: ocupa a telinha toda */
.ceu {
  position: absolute;
  inset: 0;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

.petisco,
.lugar-do-bicho {
  position: absolute;
  transform: translateX(-50%);
}

/* em pé no chão do visor; 90px = 2× o desenho, sem borrar */
.lugar-do-bicho {
  bottom: calc(var(--space-4) + 4px + env(safe-area-inset-bottom, 0px));
  width: 90px;
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
