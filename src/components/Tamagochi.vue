<script setup lang="ts">
import { computed } from 'vue'
import {
  PhArrowLeft,
  PhBackpack,
  PhBowlFood,
  PhCookie,
  PhDrop,
  PhHandWaving,
  PhMoon,
  PhYarn,
} from '@phosphor-icons/vue'
import DesenhoBicho from './DesenhoBicho.vue'
import BotaoTema from './BotaoTema.vue'
import { BARRAS } from '../barras'
import { expressaoDo, LIMITE_BAIXO } from '../regras'
import type { Bicho } from '../tipos'

const props = defineProps<{
  bicho: Bicho
  biscoitos: number
  itensNaMochila: number
}>()

const emit = defineEmits<{
  comeu: []
  seLambeu: []
  brincou: []
  dormiu: []
  soltou: []
  voltou: []
  abriuLoja: []
  abriuMochila: []
}>()


// a regra da carinha mora em regras.ts, porque a lista usa a mesma
const expressao = computed(() => expressaoDo(props.bicho.status))

// o bichinho não mexe nos status: só avisa o que aconteceu
function alimentar() {
  emit('comeu')
}

function brincar() {
  emit('brincou')
}

function excluir() {
  emit('soltou')
}
</script>

<template>
  <section class="tela">
    <header class="topo">
      <div class="esquerda">
        <button class="button so-icone" type="button" aria-label="Voltar para os meus bichinhos" @click="emit('voltou')">
          <PhArrowLeft weight="duotone" aria-hidden="true" />
        </button>
      </div>
      <div class="direita">
        <!-- os biscoitos são a porta da loja (como a moeda nos jogos) -->
        <button
          class="button"
          type="button"
          :aria-label="`${biscoitos} biscoitos. Abrir a Lojinha`"
          title="Lojinha"
          @click="emit('abriuLoja')"
        >
          <PhCookie weight="duotone" aria-hidden="true" class="icone-biscoito" />
          {{ biscoitos }}
        </button>
        <button
          class="button"
          type="button"
          :aria-label="`Mochila, ${itensNaMochila} ${itensNaMochila === 1 ? 'item' : 'itens'}`"
          @click="emit('abriuMochila')"
        >
          <PhBackpack weight="duotone" aria-hidden="true" />
          <span class="rotulo-botao">Mochila</span>
          <span v-if="itensNaMochila > 0" class="quantidade">{{ itensNaMochila }}</span>
        </button>
        <BotaoTema />
        <!-- soltar não é cuidado: fica longe dos botões de cuidar, pra não clicar sem querer -->
        <button class="button so-icone" type="button" :aria-label="`Soltar ${bicho.nome}`" title="Soltar" @click="excluir">
          <PhHandWaving weight="duotone" aria-hidden="true" />
        </button>
      </div>
    </header>

    <h1 class="nome">{{ bicho.nome }}</h1>

    <div class="palco">
      <DesenhoBicho class="desenho" :especie="bicho.especie" :cor="bicho.cor" :expressao="expressao" />
    </div>

    <ul class="barras">
      <li
        v-for="barra in BARRAS"
        :key="barra.chave"
        :class="{ baixa: bicho.status[barra.chave] < LIMITE_BAIXO }"
        :style="{ '--cor': barra.cor }"
      >
        <span class="rotulo">
          <component :is="barra.icone" weight="duotone" :size="20" />
          {{ barra.rotulo }}
        </span>
        <div
          class="trilho"
          role="meter"
          :aria-label="barra.rotulo"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="bicho.status[barra.chave]"
        >
          <div class="preenchido" :style="{ width: `${bicho.status[barra.chave]}%` }" />
        </div>
      </li>
    </ul>

    <div class="acoes">
      <button class="acao" type="button" @click="alimentar" :disabled="bicho.status.fome === 100">
        <span class="circulo"><PhBowlFood weight="duotone" :size="30" aria-hidden="true" /></span>
        Alimentar
      </button>
      <button class="acao" type="button" @click="emit('seLambeu')" :disabled="bicho.status.higiene === 100">
        <span class="circulo"><PhDrop weight="duotone" :size="30" aria-hidden="true" /></span>
        Se lamber
      </button>
      <button class="acao" type="button" @click="brincar" :disabled="bicho.status.energia === 0">
        <span class="circulo"><PhYarn weight="duotone" :size="30" aria-hidden="true" /></span>
        Brincar
      </button>
      <button class="acao" type="button" @click="emit('dormiu')" :disabled="bicho.status.energia === 100">
        <span class="circulo"><PhMoon weight="duotone" :size="30" aria-hidden="true" /></span>
        Dormir
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

.esquerda,
.direita {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.icone-biscoito {
  color: #d9a15b;
}

.nome {
  margin: 0;
  text-align: center;
  font-size: 1.5rem;
}

/* o círculo de luz atrás do bicho */
.palco {
  display: grid;
  place-items: center;
  width: min(300px, 80vw);
  aspect-ratio: 1;
  margin: 0 auto;
  background: radial-gradient(closest-side, var(--primary-soft) 0 92%, transparent 93%);
}

.desenho {
  width: min(240px, 70vw);
}

.barras {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.barras li {
  display: grid;
  grid-template-columns: 120px 1fr;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.rotulo {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* o ícone usa a cor da barra (o Phosphor pinta com a cor do texto) */
.rotulo svg {
  color: var(--cor);
}

.trilho {
  height: 12px;
  overflow: hidden;
  background: var(--surface-strong);
  border-radius: 999px;
}

.preenchido {
  height: 100%;
  background: var(--cor);
  border-radius: inherit;
  transition: width 0.3s;
}

/* status baixo: barra e ícone ficam vermelhos (o !important vence a cor que vem no style) */
.baixa {
  --cor: var(--danger-text) !important;
}

.acoes {
  display: flex;
  justify-content: space-around;
}

/* botões redondos do jogo, com a legenda embaixo (não são o Button do DS, de propósito) */
.acao {
  display: grid;
  justify-items: center;
  gap: var(--space-2);
  padding: var(--space-1);
  font: inherit;
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  background: none;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
}

.circulo {
  display: grid;
  place-items: center;
  width: 3.875rem;
  height: 3.875rem;
  color: var(--on-primary);
  background: var(--primary);
  border-radius: 50%;
}

.acao:hover:not(:disabled) .circulo {
  filter: brightness(1.08);
}

.acao:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.acao:disabled {
  cursor: not-allowed;
  opacity: 45%;
}

/* o numerozinho de itens na mochila */
.quantidade {
  display: grid;
  place-items: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.3rem;
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--on-primary);
  background: var(--primary);
  border-radius: 999px;
}

/* celular: Loja e Mochila ficam só com o ícone (o nome continua no aria-label) */
@media (max-width: 480px) {
  .rotulo-botao {
    display: none;
  }

  .direita .button:not(.so-icone) {
    padding: 0 var(--space-3);
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
