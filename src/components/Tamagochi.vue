<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import BotaoTema from './BotaoTema.vue'
import BotaoSom from './BotaoSom.vue'
import { tocar } from '../som'
import IconePixel from './IconePixel.vue'
import Visor from './Visor.vue'
import Minijogo from './Minijogo.vue'
import ChuvaDePetiscos from './ChuvaDePetiscos.vue'
import Diario from './Diario.vue'
import { BARRAS } from '../barras'
import { diasDe, expressaoDo, faseDo, LIMITE_BAIXO, MINIMO, NOME_DA_FASE, type Periodo } from '../regras'
import type { NomeIcone } from '../icones'
import type { Expressao } from './bicho/cores'
import type { Bicho } from '../tipos'

const props = defineProps<{
  bicho: Bicho
  biscoitos: number
  itensNaMochila: number
  noite: boolean
  doente: boolean
  demo: boolean
  periodo: Periodo
}>()

// os botões são o que VOCÊ faz pelo gato (quem joga cuida, não é o gato)
const emit = defineEmits<{
  alimentou: []
  limpouCaixinha: []
  brincou: []
  apagouLuz: []
  acendeuLuz: []
  soltou: []
  voltou: []
  abriuLoja: []
  abriuMochila: []
  tocouOvo: []
  carinho: []
  jogou: [acertos: number]
  trocouDemo: [ligado: boolean]
  trocouPeriodo: [periodo: Periodo]
}>()

// ============ as abas de baixo ============
type Aba = 'pet' | 'jogar' | 'diario'
const aba = ref<Aba>('pet')

const NAVEGACAO: { id: Aba | 'loja' | 'mochila'; rotulo: string; icone: NomeIcone }[] = [
  { id: 'pet', rotulo: 'Pet', icone: 'casa' },
  { id: 'loja', rotulo: 'Loja', icone: 'biscoito' },
  { id: 'mochila', rotulo: 'Mochila', icone: 'mochila' },
  { id: 'jogar', rotulo: 'Jogar', icone: 'controle' },
  { id: 'diario', rotulo: 'Diário', icone: 'livro' },
]

// na aba Jogar: qual jogo está aberto (null = a escolha)
type Jogo = 'lado' | 'chuva'
const jogo = ref<Jogo | null>(null)
// a Chuva de petiscos acontece dentro do visor: enquanto ela roda, o gato de sempre sai de cena
const jogandoNoVisor = ref(false)

function escolherJogo(qual: Jogo | null) {
  tocar('clique')
  jogo.value = qual
  olharDoJogo.value = null
}

// Loja e Mochila abrem as janelas; as outras trocam o que aparece embaixo do visor
function navegar(id: Aba | 'loja' | 'mochila') {
  tocar('clique')
  if (id === 'loja') return emit('abriuLoja')
  if (id === 'mochila') return emit('abriuMochila')
  aba.value = id
}

// ============ fase e estado ============
const fase = computed(() => faseDo(props.bicho.chocou, props.bicho.idade))
const ehOvo = computed(() => fase.value === 'ovo')
const dormindo = computed(() => props.bicho.luzApagada)
const dias = computed(() => diasDe(props.bicho.idade))
const legenda = computed(() =>
  ehOvo.value ? 'Ovo · toque nele pra chocar' : `${NOME_DA_FASE[fase.value]} · ${dias.value} ${dias.value === 1 ? 'dia' : 'dias'}`,
)

// ============ reação no visor ============
// logo depois de um cuidado, o gato reage por um instante; o minijogo também controla a cara
const reacao = ref<Expressao | null>(null)
const olharDoJogo = ref<Expressao | null>(null)
let relogioDaReacao = 0

function reagir(expressao: Expressao, segundos: number) {
  reacao.value = expressao
  clearTimeout(relogioDaReacao)
  relogioDaReacao = setTimeout(() => (reacao.value = null), segundos * 1000)
}

const expressaoForcada = computed(() => olharDoJogo.value ?? reacao.value)

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

function trocarLuz() {
  if (dormindo.value) emit('acendeuLuz')
  else emit('apagouLuz')
}

// a regra da carinha mora em regras.ts, porque a lista usa a mesma
const expressao = computed(() => expressaoDo(props.bicho.status))

// ============ a hora de verdade no canto do visor ============
const agora = ref(new Date())
const hora = computed(() => agora.value.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
let relogio = 0
onMounted(() => {
  relogio = setInterval(() => (agora.value = new Date()), 10_000)
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
        <BotaoSom />
        <BotaoTema />
      </div>
    </header>

    <div class="titulo">
      <h1 class="nome">{{ bicho.nome }}</h1>
      <p class="legenda">{{ legenda }}</p>
    </div>

    <Visor
      :bicho="bicho"
      :expressao="expressao"
      :expressao-forcada="expressaoForcada"
      :noite="noite"
      :hora="hora"
      :doente="doente"
      :jogando="jogandoNoVisor"
      @tocou-ovo="emit('tocouOvo')"
      @carinho="emit('carinho')"
    />

    <!-- ============ aba Pet: barras e cuidados ============ -->
    <template v-if="aba === 'pet'">
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
            <i v-for="n in 10" :key="n" :class="{ aceso: n <= Math.round(bicho.status[barra.chave] / 10) }" />
          </div>
        </li>
      </ul>

      <p v-if="ehOvo" class="dica">Toque no ovo pra ajudar a chocar (ou espere um pouquinho).</p>
      <p v-else-if="dormindo" class="dica">Psiu, {{ bicho.nome }} está dormindo. A energia sobe enquanto a luz estiver apagada.</p>
      <p v-else-if="doente" class="dica alerta">{{ bicho.nome }} está doente! Compre um remédio na Lojinha e dê pela Mochila.</p>
      <p v-else-if="noite && bicho.status.energia < 50" class="dica">Já é noite e {{ bicho.nome }} está com sono. Que tal apagar a luz?</p>

      <div class="acoes">
        <button class="acao" type="button" @click="alimentar" :disabled="ehOvo || dormindo || bicho.status.fome === 100">
          <span class="circulo"><IconePixel nome="tigela" :escala="3" /></span>
          Alimentar
        </button>
        <button class="acao" type="button" @click="limparCaixinha" :disabled="ehOvo || dormindo || bicho.status.higiene === 100">
          <span class="circulo"><IconePixel nome="caixinha" :escala="3" /></span>
          Limpar caixinha
        </button>
        <button class="acao" type="button" @click="brincar" :disabled="ehOvo || dormindo || bicho.status.energia <= MINIMO">
          <span class="circulo"><IconePixel nome="novelo" :escala="3" /></span>
          Brincar
        </button>
        <button class="acao" type="button" :class="{ ligada: dormindo }" @click="trocarLuz" :disabled="ehOvo">
          <span class="circulo"><IconePixel :nome="dormindo ? 'sol' : 'lampada'" :escala="3" /></span>
          {{ dormindo ? 'Acender a luz' : 'Apagar a luz' }}
        </button>
      </div>
    </template>

    <!-- ============ aba Jogar ============ -->
    <template v-else-if="aba === 'jogar'">
      <p v-if="ehOvo" class="dica">Ainda é um ovo! Espere chocar pra brincar.</p>
      <p v-else-if="dormindo" class="dica">Psiu, {{ bicho.nome }} está dormindo. Acenda a luz pra brincar.</p>

      <!-- a escolha do jogo -->
      <div v-else-if="jogo === null" class="escolha">
        <button class="cartao-jogo" type="button" @click="escolherJogo('lado')">
          <IconePixel nome="setaDireita" :escala="4" />
          <strong>Pra que lado?</strong>
          <span>Adivinhe pra onde {{ bicho.nome }} vai olhar.</span>
        </button>
        <button class="cartao-jogo" type="button" @click="escolherJogo('chuva')">
          <IconePixel nome="peixe" :escala="4" />
          <strong>Chuva de petiscos</strong>
          <span>Mexa {{ bicho.nome }} pra pegar o que cai do céu.</span>
        </button>
      </div>

      <template v-else>
        <button class="button trocar-jogo" type="button" @click="escolherJogo(null)">
          <IconePixel nome="seta" />
          Trocar de jogo
        </button>
        <Minijogo
          v-if="jogo === 'lado'"
          :nome="bicho.nome"
          :energia="bicho.status.energia"
          @olhou="olharDoJogo = $event"
          @terminou="emit('jogou', $event)"
        />
        <ChuvaDePetiscos v-else :bicho="bicho" @jogando="jogandoNoVisor = $event" @terminou="emit('jogou', $event)" />
      </template>
    </template>

    <!-- ============ aba Diário ============ -->
    <Diario
      v-else
      :bicho="bicho"
      :demo="demo"
      :periodo="periodo"
      @trocou-demo="emit('trocouDemo', $event)"
      @trocou-periodo="emit('trocouPeriodo', $event)"
      @soltou="emit('soltou')"
    />

    <!-- ============ a navegação de baixo ============ -->
    <nav class="navegacao" aria-label="Seções do bichinho">
      <button
        v-for="item in NAVEGACAO"
        :key="item.id"
        class="item-nav"
        type="button"
        :aria-current="item.id === aba ? 'page' : undefined"
        @click="navegar(item.id)"
      >
        <span class="icone-nav">
          <IconePixel :nome="item.icone" :escala="3" />
          <span v-if="item.id === 'mochila' && itensNaMochila > 0" class="contador numero">{{ itensNaMochila }}</span>
        </span>
        {{ item.rotulo }}
      </button>
    </nav>
  </section>
</template>

<style scoped>
.tela {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 26.25rem;
  margin: 0 auto;
  /* espaço pra navegação fixa embaixo não cobrir o fim da tela */
  padding-bottom: 6rem;
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

.titulo {
  display: grid;
  gap: var(--space-1);
  text-align: center;
}

.nome {
  margin: 0;
  font-size: 1.6rem;
  line-height: 1.2;
}

.legenda {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-muted);
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

.dica {
  margin: 0;
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-align: center;
  color: var(--text-muted);
  background: var(--surface);
  border: 2px dashed var(--border);
  border-radius: var(--radius-lg);
}

.dica.alerta {
  color: var(--danger-text);
  border-color: var(--danger-text);
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

.acao.ligada .circulo {
  background: var(--primary-soft);
  border-color: var(--primary);
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

/* ============ escolha do jogo ============ */
.escolha {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.cartao-jogo {
  display: grid;
  justify-items: center;
  align-content: start;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-3);
  font: inherit;
  color: var(--text);
  text-align: center;
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 16px;
  cursor: pointer;
}

.cartao-jogo:hover {
  background: var(--surface-strong);
  border-color: var(--primary);
}

.cartao-jogo:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.cartao-jogo strong {
  font-family: var(--font-pixel);
  font-weight: 400;
  font-size: 0.95rem;
}

.cartao-jogo span {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.trocar-jogo {
  align-self: flex-start;
  min-height: 2.25rem;
  padding: 0 var(--space-3);
}

/* ============ navegação de baixo ============ */
.navegacao {
  position: fixed;
  left: 50%;
  bottom: var(--space-3);
  z-index: 5;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--space-1);
  width: min(26.25rem, 100vw - 2rem);
  padding: var(--space-2);
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 20px;
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.2);
  transform: translateX(-50%);
}

.item-nav {
  display: grid;
  justify-items: center;
  gap: 2px;
  padding: var(--space-2) 0;
  font: inherit;
  font-weight: 600;
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  background: none;
  border: 2px solid transparent;
  border-radius: 14px;
  cursor: pointer;
}

.item-nav:hover {
  background: var(--surface-strong);
}

.item-nav[aria-current='page'] {
  color: var(--text);
  background: var(--primary-soft);
  border-color: var(--primary);
}

.item-nav:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.icone-nav {
  position: relative;
  display: grid;
  place-items: center;
  height: 30px;
}

/* o numerozinho de itens em cima da mochila */
.contador {
  position: absolute;
  top: -6px;
  right: -14px;
  display: grid;
  place-items: center;
  min-width: 1.125rem;
  height: 1.125rem;
  padding: 0 0.25rem;
  font-size: 0.65rem;
  color: var(--on-primary);
  background: var(--primary);
  border-radius: 999px;
}
</style>
