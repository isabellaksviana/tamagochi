<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import DesenhoBicho from './DesenhoBicho.vue'
import IconePixel from './IconePixel.vue'
import { ALTURA, LARGURA, ovoEmPixel, retangulosDa } from './bicho/pixel'
import { CAIXINHA_SUJA, faseDo } from '../regras'
import type { Expressao } from './bicho/cores'
import type { Bicho } from '../tipos'

// a telinha de LCD onde o bicho mora: ovo, fases, dia e noite, luz e os "toques de vida"
const props = defineProps<{
  bicho: Bicho
  // a cara que as regras pedem (pior status, ou feliz)
  expressao: Expressao
  // uma cara que passa na frente de tudo (reação a um cuidado, minijogo)
  expressaoForcada: Expressao | null
  noite: boolean
  hora: string
  doente: boolean
  // durante a Chuva de petiscos, o visor vira o palco do jogo (o gato de sempre sai de cena)
  jogando?: boolean
}>()

const emit = defineEmits<{
  tocouOvo: []
  carinho: []
}>()

const fase = computed(() => faseDo(props.bicho.chocou, props.bicho.idade))
const ovo = computed(() => retangulosDa(ovoEmPixel(props.bicho.toquesNoOvo)))
const caixinhaSuja = computed(() => props.bicho.status.higiene < CAIXINHA_SUJA)
const risquinhosDaBateria = computed(() => Math.ceil(props.bicho.status.energia / 34))
const dormindo = computed(() => props.bicho.luzApagada)

// ============ toques de vida ============
// "feliz" no dia a dia é o olho aberto (que pisca); a carinha de alegria aparece de vez em quando
const OLHOS_ABERTOS: Expressao[] = ['neutro', 'triste', 'bravo', 'surpreso']
const vida = ref<Expressao | null>(null)
const coracao = ref(false)
let segundo = 0
let relogio = 0
let relogioDaVida = 0
let relogioDoCoracao = 0

const base = computed<Expressao>(() => (props.expressao === 'feliz' ? 'neutro' : props.expressao))

const mostrada = computed<Expressao>(() => {
  if (props.expressaoForcada) return props.expressaoForcada
  if (dormindo.value) return 'dormindo'
  if (props.doente) return 'doente'
  return vida.value ?? base.value
})

function mostrarPor(expressao: Expressao, ms: number) {
  vida.value = expressao
  clearTimeout(relogioDaVida)
  relogioDaVida = setTimeout(() => (vida.value = null), ms)
}

function batida() {
  segundo++
  if (props.expressaoForcada || dormindo.value || props.doente || vida.value) return
  // de noite, com sono e a luz acesa: boceja, pedindo pra apagar a luz
  if (props.noite && props.bicho.status.energia < 50 && segundo % 5 === 0) return mostrarPor('dormindo', 1200)
  // de vez em quando se lambe sozinho
  if (segundo % 23 === 0) return mostrarPor('carinhoso', 2000)
  // quando está tudo bem, a carinha de alegria aparece de vez em quando
  if (props.expressao === 'feliz' && segundo % 11 === 0) return mostrarPor('feliz', 2500)
  // pisca a cada 4 segundos (só quem está de olho aberto)
  if (segundo % 4 === 0 && OLHOS_ABERTOS.includes(base.value)) mostrarPor('piscando', 160)
}

onMounted(() => {
  relogio = setInterval(batida, 1000)
})
onUnmounted(() => {
  clearInterval(relogio)
  clearTimeout(relogioDaVida)
  clearTimeout(relogioDoCoracao)
})

// tocar no gato = carinho (o coraçãozinho sobe)
function tocarNoGato() {
  if (dormindo.value) return
  emit('carinho')
  coracao.value = true
  mostrarPor('carinhoso', 1200)
  clearTimeout(relogioDoCoracao)
  relogioDoCoracao = setTimeout(() => (coracao.value = false), 900)
}

// o passeio: anda uns pixels pros lados (parado quando dorme, no ovo ou no minijogo)
const passeando = computed(() => fase.value !== 'ovo' && !dormindo.value && !props.expressaoForcada && !props.doente)
</script>

<template>
  <div class="visor" :class="[`fase-${fase}`, { noite, apagado: dormindo }]">
    <!-- de noite aparecem as estrelinhas -->
    <span v-if="noite" class="estrelas" aria-hidden="true" />

    <span class="bateria" :aria-label="`Energia: ${risquinhosDaBateria} de 3`">
      <i v-for="n in 3" :key="n" :class="{ acesa: n <= risquinhosDaBateria }" />
    </span>
    <span class="hora numero">{{ hora }}</span>

    <!-- o palco dos jogos: a Chuva de petiscos "teleporta" o jogo pra cá -->
    <div id="palco-do-jogo" class="palco-do-jogo" :class="{ ativo: jogando }" />

    <!-- o ovo: balança e racha a cada toque -->
    <button v-if="!jogando && fase === 'ovo'" class="ovo" type="button" :aria-label="`Tocar no ovo (${bicho.toquesNoOvo} de 5)`" @click="emit('tocouOvo')">
      <svg :viewBox="`0 0 ${LARGURA} ${ALTURA}`" shape-rendering="crispEdges" aria-hidden="true">
        <rect v-for="(r, i) in ovo" :key="i" :x="r.x" :y="r.y" :width="r.largura" height="1" :fill="r.cor" />
      </svg>
    </button>

    <button
      v-else-if="!jogando"
      class="gato"
      :class="{ passeando }"
      type="button"
      :aria-label="dormindo ? `${bicho.nome} está dormindo` : `Fazer carinho em ${bicho.nome}`"
      @click="tocarNoGato"
    >
      <DesenhoBicho :especie="bicho.especie" :cor="bicho.cor" :expressao="mostrada" respirando />
      <span v-if="coracao" class="coracao"><IconePixel nome="coracao" :escala="3" /></span>
    </button>

    <!-- a caixinha de areia do canto: suja quando a higiene cai (o "cocô" do tamagochi) -->
    <span v-if="fase !== 'ovo' && !jogando" class="caixinha" :title="caixinhaSuja ? 'A caixinha está suja' : 'Caixinha limpinha'">
      <IconePixel :nome="caixinhaSuja ? 'caixinhaSuja' : 'caixinha'" :escala="3" />
    </span>

    <!-- doente: o remedinho piscando no canto -->
    <span v-if="doente" class="alerta-doente" title="Doente: precisa de remédio">
      <IconePixel nome="remedio" :escala="3" />
    </span>

    <span class="chao" />
  </div>
</template>

<style scoped>
.visor {
  /* o tamanho do gato muda com a fase, sempre em múltiplo inteiro de 45 (a largura do desenho) */
  --tamanho: 180px;
  position: relative;
  display: grid;
  place-items: end center;
  height: 15rem;
  padding-bottom: var(--space-4);
  overflow: hidden;
  background-color: var(--lcd);
  /* os pontinhos da telinha */
  background-image: radial-gradient(var(--lcd-ponto) 1px, transparent 1.5px);
  background-size: 4px 4px;
  border: 2px solid var(--border);
  border-radius: 16px;
  /* a moldura de dentro, como a borda do visor de um aparelho */
  box-shadow:
    inset 0 0 0 4px var(--surface),
    inset 0 0 0 6px var(--border);
  transition: background-color 0.4s;
}

.fase-filhote {
  --tamanho: 90px;
}

.fase-jovem {
  --tamanho: 135px;
}

.fase-ovo {
  --tamanho: 135px;
}

/* de noite, o LCD fica azul-arroxeado escuro; com a luz apagada, mais escuro ainda */
.visor.noite {
  background-color: #241f3d;
}

.visor.apagado {
  background-color: var(--lcd-escuro);
}

.visor.noite .hora,
.visor.noite .bateria,
.visor.apagado .hora,
.visor.apagado .bateria {
  color: #8f89a8;
}

/* o palco do jogo cobre a telinha só durante a partida (fora dela, não atrapalha os cliques) */
.palco-do-jogo {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.palco-do-jogo.ativo {
  pointer-events: auto;
}

/* as estrelinhas: quadradinhos de pixel espalhados (um elemento só, várias sombras) */
.estrelas {
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 3px;
  background: transparent;
  box-shadow:
    40px 40px #f6d365,
    90px 70px #fff8f0,
    150px 30px #fff8f0,
    210px 60px #f6d365,
    270px 35px #fff8f0,
    320px 80px #fff8f0,
    60px 110px #fff8f0,
    300px 120px #f6d365,
    250px 100px #fff8f0;
  animation: cintilar 3s steps(1) infinite;
}

@keyframes cintilar {
  50% {
    opacity: 0.5;
  }
}

.gato,
.ovo {
  position: relative;
  z-index: 1;
  width: var(--tamanho);
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
}

.ovo svg {
  display: block;
  width: 100%;
  height: auto;
  animation: balancar 1.2s steps(1) infinite;
}

/* balança 1 pixel pra cada lado (o pixel do desenho, não o da tela) */
@keyframes balancar {
  0% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(calc(var(--tamanho) / 45));
  }
  50% {
    transform: translateX(0);
  }
  75% {
    transform: translateX(calc(var(--tamanho) / -45));
  }
}

/* o passeio: alguns passos de pixel pra cada lado, devagar */
.gato.passeando {
  animation: passear 16s steps(1) infinite;
}

@keyframes passear {
  0% {
    transform: translateX(0);
  }
  40% {
    transform: translateX(calc(var(--tamanho) / 45 * 4));
  }
  45% {
    transform: translateX(calc(var(--tamanho) / 45 * 8));
  }
  55% {
    transform: translateX(calc(var(--tamanho) / 45 * 4));
  }
  60% {
    transform: translateX(0);
  }
  80% {
    transform: translateX(calc(var(--tamanho) / 45 * -4));
  }
  85% {
    transform: translateX(calc(var(--tamanho) / 45 * -8));
  }
  95% {
    transform: translateX(calc(var(--tamanho) / 45 * -4));
  }
}

.gato:focus-visible,
.ovo:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 4px;
}

/* o coraçãozinho do carinho sobe e some */
.coracao {
  position: absolute;
  top: 0;
  right: 10%;
  animation: subir 0.9s steps(4) forwards;
}

@keyframes subir {
  to {
    transform: translateY(-24px);
    opacity: 0;
  }
}

.caixinha {
  position: absolute;
  left: 1.5rem;
  bottom: calc(var(--space-4) + 4px);
}

.alerta-doente {
  position: absolute;
  right: 1.5rem;
  bottom: calc(var(--space-4) + 10px);
  animation: cintilar 1s steps(1) infinite;
}

.chao {
  position: absolute;
  left: 1.5rem;
  right: 1.5rem;
  bottom: var(--space-4);
  height: 4px;
  background: var(--border);
}

.bateria,
.hora {
  position: absolute;
  top: 0.9rem;
  z-index: 1;
  color: var(--text-muted);
}

.bateria {
  left: 1rem;
  display: flex;
  gap: 2px;
  width: 1.75rem;
  height: 0.875rem;
  padding: 2px;
  border: 2px solid currentColor;
}

/* o "biquinho" da bateria */
.bateria::after {
  content: '';
  position: absolute;
  right: -6px;
  top: 2px;
  width: 3px;
  height: 4px;
  background: currentColor;
}

.bateria i {
  flex: 1;
}

.bateria i.acesa {
  background: currentColor;
}

.hora {
  right: 1rem;
  font-size: var(--font-size-sm);
  line-height: 1;
}

@media (max-width: 480px) {
  .visor {
    height: 14rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .gato.passeando,
  .ovo svg,
  .estrelas {
    animation: none;
  }
}
</style>
