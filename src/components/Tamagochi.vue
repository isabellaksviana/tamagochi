<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import DesenhoBicho from './DesenhoBicho.vue'
import BotaoTema from './BotaoTema.vue'
import IconePixel from './IconePixel.vue'
import { BARRAS } from '../barras'
import { CAIXINHA_SUJA, expressaoDo, LIMITE_BAIXO, MINIMO } from '../regras'
import type { Expressao } from './bicho/cores'
import type { Bicho } from '../tipos'

const props = defineProps<{
  bicho: Bicho
  biscoitos: number
  itensNaMochila: number
}>()

// os botões são o que VOCÊ faz pelo gato (quem joga cuida, não é o gato)
const emit = defineEmits<{
  alimentou: []
  limpouCaixinha: []
  brincou: []
  apagouLuz: []
  soltou: []
  voltou: []
  abriuLoja: []
  abriuMochila: []
}>()

// ============ reação no visor ============
// logo depois de um cuidado, o gato reage por um instante (e a luz apagada escurece a telinha)
const reacao = ref<Expressao | null>(null)
const luzApagada = ref(false)
let relogioDaReacao = 0

function reagir(expressao: Expressao, segundos: number, apagarLuz = false) {
  reacao.value = expressao
  luzApagada.value = apagarLuz
  clearTimeout(relogioDaReacao)
  relogioDaReacao = setTimeout(() => {
    reacao.value = null
    luzApagada.value = false
  }, segundos * 1000)
}

function alimentar() {
  emit('alimentou')
  reagir('carinhoso', 2)
}

function limparCaixinha() {
  emit('limpouCaixinha')
  reagir('feliz', 2)
}

function brincar() {
  emit('brincou')
  reagir('feliz', 2)
}

function apagarLuz() {
  emit('apagouLuz')
  reagir('dormindo', 4, true)
}

// a regra da carinha mora em regras.ts, porque a lista usa a mesma; a reação passa na frente
const expressao = computed(() => reacao.value ?? expressaoDo(props.bicho.status))

const caixinhaSuja = computed(() => props.bicho.status.higiene < CAIXINHA_SUJA)

// cada barra vira 10 bloquinhos: quantos estão acesos
function blocosAcesos(valor: number) {
  return Math.round(valor / 10)
}

// a bateria do visor mostra a energia do bicho (3 risquinhos)
const risquinhosDaBateria = computed(() => Math.ceil(props.bicho.status.energia / 34))

// a hora de verdade no canto do visor, como no aparelhinho
const agora = ref(new Date())
const hora = computed(() =>
  agora.value.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
)
let relogio = 0
onMounted(() => {
  relogio = setInterval(() => {
    agora.value = new Date()
  }, 10_000)
})
onUnmounted(() => {
  clearInterval(relogio)
  clearTimeout(relogioDaReacao)
})
</script>

<template>
  <section class="tela">
    <header class="topo">
      <button class="button so-icone" type="button" aria-label="Voltar para os meus bichinhos" @click="emit('voltou')">
        <IconePixel nome="seta" />
      </button>
      <div class="direita">
        <!-- os biscoitos são a porta da loja (como a moeda nos jogos) -->
        <button
          class="button biscoitos"
          type="button"
          :aria-label="`${biscoitos} biscoitos. Abrir a Lojinha`"
          title="Lojinha"
          @click="emit('abriuLoja')"
        >
          <IconePixel nome="biscoito" />
          <span class="numero">{{ biscoitos }}</span>
        </button>
        <button
          class="button so-icone com-contador"
          type="button"
          :aria-label="`Mochila, ${itensNaMochila} ${itensNaMochila === 1 ? 'item' : 'itens'}`"
          title="Mochila"
          @click="emit('abriuMochila')"
        >
          <IconePixel nome="mochila" />
          <span v-if="itensNaMochila > 0" class="contador numero">{{ itensNaMochila }}</span>
        </button>
        <BotaoTema />
        <!-- soltar não é cuidado: fica longe dos botões de cuidar, pra não clicar sem querer -->
        <button class="button so-icone" type="button" :aria-label="`Soltar ${bicho.nome}`" title="Soltar" @click="emit('soltou')">
          <IconePixel nome="porta" />
        </button>
      </div>
    </header>

    <h1 class="nome">{{ bicho.nome }}</h1>

    <!-- a telinha de LCD: pontinhos, bateria (a energia) e a hora, como no aparelhinho -->
    <div class="visor" :class="{ apagado: luzApagada }">
      <span class="bateria" :aria-label="`Energia: ${risquinhosDaBateria} de 3`">
        <i v-for="n in 3" :key="n" :class="{ acesa: n <= risquinhosDaBateria }" />
      </span>
      <span class="hora numero">{{ hora }}</span>
      <DesenhoBicho class="desenho" :especie="bicho.especie" :cor="bicho.cor" :expressao="expressao" />
      <!-- a caixinha de areia do canto: suja quando a higiene cai (o "cocô" do tamagochi) -->
      <span class="caixinha" :title="caixinhaSuja ? 'A caixinha está suja' : 'Caixinha limpinha'">
        <IconePixel :nome="caixinhaSuja ? 'caixinhaSuja' : 'caixinha'" :escala="3" />
      </span>
      <span class="chao" />
    </div>

    <ul class="barras">
      <li
        v-for="barra in BARRAS"
        :key="barra.chave"
        :class="{ baixa: bicho.status[barra.chave] < LIMITE_BAIXO }"
        :style="{ '--cor': barra.cor }"
      >
        <span class="rotulo">
          <IconePixel :nome="barra.icone" />
          {{ barra.rotulo }}
        </span>
        <div
          class="blocos"
          role="meter"
          :aria-label="barra.rotulo"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="Math.round(bicho.status[barra.chave])"
        >
          <i v-for="n in 10" :key="n" :class="{ aceso: n <= blocosAcesos(bicho.status[barra.chave]) }" />
        </div>
      </li>
    </ul>

    <div class="acoes">
      <button class="acao" type="button" @click="alimentar" :disabled="bicho.status.fome === 100">
        <span class="circulo"><IconePixel nome="tigela" :escala="3" /></span>
        Alimentar
      </button>
      <button class="acao" type="button" @click="limparCaixinha" :disabled="bicho.status.higiene === 100">
        <span class="circulo"><IconePixel nome="caixinha" :escala="3" /></span>
        Limpar caixinha
      </button>
      <button class="acao" type="button" @click="brincar" :disabled="bicho.status.energia <= MINIMO">
        <span class="circulo"><IconePixel nome="novelo" :escala="3" /></span>
        Brincar
      </button>
      <button class="acao" type="button" @click="apagarLuz" :disabled="bicho.status.energia === 100">
        <span class="circulo"><IconePixel nome="lampada" :escala="3" /></span>
        Apagar a luz
      </button>
    </div>
  </section>
</template>

<style scoped>
.tela {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 26.25rem;
  margin: 0 auto;
}

.topo {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.direita {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.biscoitos {
  padding: 0 var(--space-3);
  font-size: var(--font-size-base);
}

/* o numerozinho de itens em cima do botão da mochila */
.com-contador {
  position: relative;
}

.contador {
  position: absolute;
  top: -8px;
  right: -8px;
  display: grid;
  place-items: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.3rem;
  font-size: var(--font-size-xs);
  color: var(--on-primary);
  background: var(--primary);
  border-radius: 999px;
}

.nome {
  margin: 0;
  text-align: center;
  font-size: 1.6rem;
  line-height: 1.2;
}

/* ============ o visor de LCD ============ */
.visor {
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
}

/* o gato em múltiplo inteiro do desenho (45 de largura): 4× no computador, 3× no celular */
.desenho {
  position: relative;
  width: 180px;
}

/* luz apagada: a telinha escurece (o gato continua aparecendo, dormindo) */
.visor {
  transition: background-color 0.4s;
}

.visor.apagado {
  background-color: var(--lcd-escuro);
}

.visor.apagado .hora,
.visor.apagado .bateria {
  color: #6f6a85;
}

.caixinha {
  position: absolute;
  left: 1.5rem;
  bottom: calc(var(--space-4) + 4px);
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

/* ============ barras de bloquinhos ============ */
.barras {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: var(--space-4);
  list-style: none;
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 16px;
}

.barras li {
  display: grid;
  grid-template-columns: 7.5rem 1fr;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.rotulo {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.blocos {
  display: flex;
  gap: 3px;
}

.blocos i {
  flex: 1;
  height: 12px;
  background: var(--surface-strong);
}

.blocos i.aceso {
  background: var(--cor);
}

/* status baixo: os blocos ficam vermelhos (o !important vence a cor que vem no style) */
.baixa {
  --cor: var(--danger-text) !important;
}

/* ============ ações ============ */
.acoes {
  display: flex;
  justify-content: space-between;
}

/* botões redondos do jogo, com a legenda embaixo */
.acao {
  display: grid;
  justify-items: center;
  gap: var(--space-2);
  padding: var(--space-1);
  font: inherit;
  font-weight: 600;
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  background: none;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
}

.circulo {
  display: grid;
  place-items: center;
  width: 3.75rem;
  height: 3.75rem;
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 50%;
}

.acao:hover:not(:disabled) .circulo {
  background: var(--surface-strong);
  border-color: var(--primary);
}

.acao:active:not(:disabled) .circulo {
  transform: translateY(2px);
}

.acao:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.acao:disabled {
  cursor: not-allowed;
  opacity: 45%;
}

@media (max-width: 480px) {
  .desenho {
    width: 135px;
  }

  .visor {
    height: 12rem;
  }
}

/* no computador: a tela ocupa a altura toda (menos o espaço do body); o topo fica em cima
   e o resto (nome, bicho, barras e botões) fica no meio do que sobra */
@media (min-width: 720px) {
  .tela {
    min-height: calc(100dvh - 2 * var(--space-8));
  }

  .nome {
    margin-top: auto;
  }

  .acoes {
    margin-bottom: auto;
  }
}
</style>
