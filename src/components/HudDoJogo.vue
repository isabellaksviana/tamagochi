<script setup lang="ts">
import IconePixel from './IconePixel.vue'

// O "HUD" dos jogos: fica POR CIMA da telinha, no topo, num tamanho que não atrapalha.
// Esquerda: pontos. Meio: vidas (coraçõezinhos) ou moedas. Direita: pausar e sair.
// No celular, com o visor em tela cheia, é o único controle visível (o resto é o dedo).
const props = defineProps<{
  pontos: number
  vidas?: number
  vidasMaximas?: number
  moedas?: number
}>()

const emit = defineEmits<{
  pausar: []
  sair: []
}>()
</script>

<template>
  <!-- @pointerdown.stop: tocar no HUD não mexe o bicho/nave -->
  <div class="hud" @pointerdown.stop>
    <span class="caixinha numero" aria-label="Pontos">{{ props.pontos }}</span>

    <span v-if="props.vidas !== undefined" class="caixinha vidas" :aria-label="`${props.vidas} de ${props.vidasMaximas} vidas`">
      <IconePixel v-for="n in props.vidasMaximas" :key="n" nome="coracao" :class="{ perdida: n > props.vidas }" />
    </span>
    <span v-else-if="props.moedas !== undefined" class="caixinha moedas" :aria-label="`${props.moedas} moedas`">
      <IconePixel nome="moeda" />
      <span class="numero">{{ props.moedas }}</span>
    </span>

    <span class="botoes">
      <button class="botao" type="button" aria-label="Pausar" title="Pausar (P)" @click="emit('pausar')">
        <IconePixel nome="pausa" :escala="3" />
      </button>
      <button class="botao" type="button" aria-label="Sair do jogo" title="Sair do jogo" @click="emit('sair')">
        <IconePixel nome="fechar" :escala="3" />
      </button>
    </span>
  </div>
</template>

<style scoped>
.hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
  /* no celular em tela cheia, desvia do "entalhe" e da barra de status */
  padding: calc(var(--space-2) + env(safe-area-inset-top, 0px)) var(--space-2) var(--space-2);
  pointer-events: none;
}

/* as caixinhas semi-transparentes: dá pra ver o jogo por trás */
.caixinha,
.botao {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 2.25rem;
  padding: 0 var(--space-2);
  color: var(--text);
  background: color-mix(in srgb, var(--surface) 75%, transparent);
  border: 2px solid var(--border);
  border-radius: var(--radius-lg);
}

.caixinha.numero {
  min-width: 3rem;
  justify-content: center;
  font-size: 1rem;
}

.vidas {
  gap: 2px;
}

.vidas .perdida {
  opacity: 0.2;
  filter: grayscale(1);
}

.botoes {
  display: flex;
  gap: var(--space-1);
}

/* os botões aceitam toque (o resto do HUD deixa o toque passar pro jogo) */
.botao {
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  cursor: pointer;
  pointer-events: auto;
  touch-action: manipulation;
}

.botao:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
</style>
