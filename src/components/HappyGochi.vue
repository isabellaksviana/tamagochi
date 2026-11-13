<script setup lang="ts">
import { computed, ref } from 'vue'
import DesenhoBicho from './DesenhoBicho.vue'
import IconePixel from './IconePixel.vue'
import ControlesDoJogo from './ControlesDoJogo.vue'
import { useJogoNoVisor } from '../composables/useJogoNoVisor'
import { tocar } from '../som'
import type { Bicho } from '../tipos'

// "Happy Gochi": o bicho pula sozinho de plataforma em plataforma e você só move pros lados.
// O cenário desce conforme ele sobe; quanto mais alto, mais pontos. Algumas plataformas têm moeda.
// Caiu pra fora da tela, acabou. Tudo em pixels da telinha (o visor fica em pé durante a partida).
const props = defineProps<{
  bicho: Bicho
}>()

const emit = defineEmits<{
  jogando: [ligado: boolean]
  terminou: [moedas: number]
}>()

const GRAVIDADE = 1400 // px/s²
const PULO = -640 // px/s (pra cima é negativo, como na tela)
const VELOCIDADE_DE_LADO = 260 // px/s
const LARGURA_DO_BICHO = 60
const ALTURA_DO_BICHO = 65
const LARGURA_DA_PLATAFORMA = 64
const MAXIMO_DE_MOEDAS = 5

type Plataforma = { id: number; x: number; y: number; moeda: boolean; vx: number }

const ceu = ref<HTMLElement | null>(null)
const bichoX = ref(0) // o meio do bicho
const bichoY = ref(0) // a altura dos pés
const plataformas = ref<Plataforma[]>([])
const pontos = ref(0)
const moedasPegas = ref(0)
const subindo = ref(false)

const recorde = ref(Number(localStorage.getItem('recordeHappyGochi') ?? 0))
const bateuRecorde = ref(false)
const moedasGanhas = computed(() => Math.min(MAXIMO_DE_MOEDAS, moedasPegas.value))

let velocidadeY = 0
let subidaTotal = 0
let proximoId = 0

// o tamanho da telinha (o visor em pé), lido na hora
function tamanho() {
  return { largura: ceu.value?.clientWidth ?? 320, altura: ceu.value?.clientHeight ?? 400 }
}

function novaPlataforma(y: number, largura: number): Plataforma {
  // depois de um tempo, algumas plataformas andam de um lado pro outro
  const anda = pontos.value > 150 && Math.random() < 0.25
  return {
    id: proximoId++,
    x: Math.random() * (largura - LARGURA_DA_PLATAFORMA),
    y,
    moeda: Math.random() < 0.22,
    vx: anda ? (Math.random() < 0.5 ? -70 : 70) : 0,
  }
}

const jogo = useJogoNoVisor({
  avisarJogando: (ligado) => emit('jogando', ligado),
  passo(segundos) {
    const { largura, altura } = tamanho()
    // primeiro quadro: monta a fase já com o tamanho de verdade da telinha
    if (plataformas.value.length === 0) return montarFase(largura, altura)

    // de lado: as setas; quem sai por um lado aparece do outro
    bichoX.value += jogo.controle.direcao * VELOCIDADE_DE_LADO * segundos
    if (bichoX.value < -LARGURA_DO_BICHO / 2) bichoX.value = largura + LARGURA_DO_BICHO / 2
    if (bichoX.value > largura + LARGURA_DO_BICHO / 2) bichoX.value = -LARGURA_DO_BICHO / 2

    // a gravidade puxa pra baixo
    const pesAntes = bichoY.value
    velocidadeY += GRAVIDADE * segundos
    bichoY.value += velocidadeY * segundos
    subindo.value = velocidadeY < 0

    // plataformas que andam
    for (const plataforma of plataformas.value) {
      if (plataforma.vx === 0) continue
      plataforma.x += plataforma.vx * segundos
      if (plataforma.x < 0 || plataforma.x > largura - LARGURA_DA_PLATAFORMA) plataforma.vx *= -1
    }

    // caindo e os pés passaram pelo topo de uma plataforma: pula de novo
    if (velocidadeY > 0) {
      for (const plataforma of plataformas.value) {
        const passouPeloTopo = pesAntes <= plataforma.y && bichoY.value >= plataforma.y
        const emCima = bichoX.value > plataforma.x - 12 && bichoX.value < plataforma.x + LARGURA_DA_PLATAFORMA + 12
        if (passouPeloTopo && emCima) {
          bichoY.value = plataforma.y
          velocidadeY = PULO
          tocar('pulo')
          break
        }
      }
    }

    // moedas: encostou, pegou
    for (const plataforma of plataformas.value) {
      if (!plataforma.moeda) continue
      const moedaX = plataforma.x + LARGURA_DA_PLATAFORMA / 2
      const moedaY = plataforma.y - 16
      if (Math.abs(moedaX - bichoX.value) < 26 && moedaY > bichoY.value - ALTURA_DO_BICHO && moedaY < bichoY.value + 6) {
        plataforma.moeda = false
        moedasPegas.value++
        tocar('pegou')
      }
    }

    // a "câmera": se ele passou de 45% da altura, o cenário desce no lugar dele subir
    const limite = altura * 0.45
    if (bichoY.value < limite) {
      const diferenca = limite - bichoY.value
      bichoY.value = limite
      for (const plataforma of plataformas.value) plataforma.y += diferenca
      subidaTotal += diferenca
      pontos.value = Math.floor(subidaTotal / 10)
    }

    // tira as que sumiram embaixo e cria novas em cima (cada vez mais espaçadas)
    plataformas.value = plataformas.value.filter((plataforma) => plataforma.y < altura + 20)
    let maisAlta = Math.min(altura, ...plataformas.value.map((plataforma) => plataforma.y))
    while (maisAlta > -40) {
      maisAlta -= 55 + Math.random() * (35 + Math.min(45, pontos.value / 20))
      plataformas.value.push(novaPlataforma(maisAlta, largura))
    }

    // caiu pra fora da tela
    if (bichoY.value - ALTURA_DO_BICHO > altura) terminar()
  },
})

// começa em cima de uma plataforma bem no meio, embaixo, já pulando
function montarFase(largura: number, altura: number) {
  const chao: Plataforma = { id: proximoId++, x: largura / 2 - LARGURA_DA_PLATAFORMA / 2, y: altura - 30, moeda: false, vx: 0 }
  plataformas.value = [chao]
  bichoX.value = largura / 2
  bichoY.value = chao.y
  velocidadeY = PULO
}

function comecar() {
  plataformas.value = []
  subidaTotal = 0
  pontos.value = 0
  moedasPegas.value = 0
  bateuRecorde.value = false
  jogo.comecar()
}

function terminar() {
  jogo.terminar()
  if (pontos.value > recorde.value) {
    recorde.value = pontos.value
    bateuRecorde.value = true
    localStorage.setItem('recordeHappyGochi', String(pontos.value))
  }
  tocar('fimDoJogo')
  emit('terminou', moedasGanhas.value)
}
</script>

<template>
  <section class="jogo">
    <template v-if="jogo.etapa.value === 'inicio'">
      <h2>Happy Gochi</h2>
      <p>
        {{ bicho.nome }} pula sozinho: mexa pros lados pra cair nas plataformas. Quanto mais alto, mais pontos.
        Pegue as moedas no caminho (até {{ MAXIMO_DE_MOEDAS }} por partida).
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
        <span class="moedas"><IconePixel nome="moeda" /> <span class="numero">{{ moedasPegas }}</span></span>
      </ControlesDoJogo>

      <!-- o jogo acontece DENTRO do visor (o Teleport leva este pedaço pra lá) -->
      <Teleport to="#palco-do-jogo">
        <div
          ref="ceu"
          class="ceu"
          @pointerdown="jogo.tocarNaTela"
          @pointerup="jogo.andar(0)"
          @pointerleave="jogo.andar(0)"
          @pointercancel="jogo.andar(0)"
        >
          <template v-for="plataforma in plataformas" :key="plataforma.id">
            <span class="plataforma" :class="{ anda: plataforma.vx !== 0 }" :style="{ left: `${plataforma.x}px`, top: `${plataforma.y}px` }" />
            <span v-if="plataforma.moeda" class="moeda" :style="{ left: `${plataforma.x + 32}px`, top: `${plataforma.y - 26}px` }">
              <IconePixel nome="moeda" />
            </span>
          </template>
          <span class="bicho" :style="{ left: `${bichoX - 30}px`, top: `${bichoY - 65}px` }">
            <DesenhoBicho :especie="bicho.especie" :cor="bicho.cor" :expressao="subindo ? 'feliz' : 'surpreso'" />
          </span>
          <button v-if="jogo.pausado.value" class="aviso-pausa" type="button" @pointerdown.stop @click="jogo.continuar">
            Pausado
            <small>toque pra continuar</small>
          </button>
        </div>
      </Teleport>
    </template>

    <template v-else>
      <h2>Happy Gochi</h2>
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

.moedas {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
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
  cursor: pointer;
}

/* plataforma em pixel: um bloquinho com a borda de baixo mais escura */
.plataforma {
  position: absolute;
  width: 64px;
  height: 10px;
  background: #c9b6f2;
  border: 2px solid #5b3a36;
  box-shadow: inset 0 -3px 0 #a58fe0;
}

.plataforma.anda {
  background: #f6d365;
  box-shadow: inset 0 -3px 0 #e8a55b;
}

.moeda,
.bicho {
  position: absolute;
}

.moeda {
  transform: translateX(-50%);
}

.bicho {
  width: 60px;
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
