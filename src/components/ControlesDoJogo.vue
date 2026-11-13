<script setup lang="ts">
import IconePixel from './IconePixel.vue'
import type { NomeIcone } from '../icones'

// a parte de baixo de todo jogo no visor: o placar (vem pelo slot), o botão de pausa e as setas.
// Com "vertical", aparecem também as setas de cima e de baixo (a nave anda nas 4 direções)
const props = defineProps<{
  pausado: boolean
  vertical?: boolean
}>()

const emit = defineEmits<{
  andar: [direcao: number]
  andarVertical: [direcao: number]
  alternarPausa: []
}>()

type Seta = { icone: NomeIcone; rotulo: string; eixo: 'x' | 'y'; direcao: number }
const ESQUERDA: Seta = { icone: 'seta', rotulo: 'Esquerda', eixo: 'x', direcao: -1 }
const DIREITA: Seta = { icone: 'setaDireita', rotulo: 'Direita', eixo: 'x', direcao: 1 }
const CIMA: Seta = { icone: 'setaCima', rotulo: 'Cima', eixo: 'y', direcao: -1 }
const BAIXO: Seta = { icone: 'setaBaixo', rotulo: 'Baixo', eixo: 'y', direcao: 1 }

// apertou/soltou uma seta: avisa no eixo certo
function mover(seta: Seta, apertou: boolean) {
  const direcao = apertou ? seta.direcao : 0
  if (seta.eixo === 'x') emit('andar', direcao)
  else emit('andarVertical', direcao)
}
</script>

<template>
  <div class="placar">
    <slot />
    <button
      class="button so-icone pausa"
      type="button"
      :aria-label="pausado ? 'Continuar' : 'Pausar'"
      :title="pausado ? 'Continuar (P)' : 'Pausar (P)'"
      @click="emit('alternarPausa')"
    >
      <IconePixel :nome="pausado ? 'play' : 'pausa'" :escala="3" />
    </button>
  </div>

  <!-- esquerda · (cima/baixo) · direita -->
  <div class="controles" :class="{ vertical: props.vertical }">
    <template v-for="seta in props.vertical ? [ESQUERDA, CIMA, BAIXO, DIREITA] : [ESQUERDA, DIREITA]" :key="seta.rotulo">
      <button
        class="button lado"
        :class="`seta-${seta.rotulo.toLowerCase()}`"
        type="button"
        :disabled="pausado"
        :aria-label="`Andar pra ${seta.rotulo.toLowerCase()}`"
        @pointerdown="mover(seta, true)"
        @pointerup="mover(seta, false)"
        @pointerleave="mover(seta, false)"
        @pointercancel="mover(seta, false)"
      >
        <IconePixel :nome="seta.icone" :escala="4" />
      </button>
    </template>
  </div>
</template>

<style scoped>
.placar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  margin: 0;
  font-weight: 600;
  color: var(--text);
}

.pausa {
  width: 2.25rem;
  min-height: 2.25rem;
}

.controles {
  display: flex;
  gap: var(--space-4);
}

/* com 4 setas: uma cruzinha, como o direcional de um portátil (cima e baixo no meio, empilhados) */
.controles.vertical {
  display: grid;
  grid-template-columns: repeat(3, auto);
  grid-template-rows: auto auto;
  gap: var(--space-1) var(--space-3);
}

.controles.vertical .seta-esquerda {
  grid-column: 1;
  grid-row: 1 / 3;
  align-self: center;
}

.controles.vertical .seta-cima {
  grid-column: 2;
  grid-row: 1;
}

.controles.vertical .seta-baixo {
  grid-column: 2;
  grid-row: 2;
}

.controles.vertical .seta-direita {
  grid-column: 3;
  grid-row: 1 / 3;
  align-self: center;
}

.controles.vertical .lado {
  height: 2.75rem;
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
</style>
