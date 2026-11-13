<script setup lang="ts">
import IconePixel from './IconePixel.vue'

// a parte de baixo de todo jogo no visor: o placar (vem pelo slot), o botão de pausa e as setas
defineProps<{
  pausado: boolean
}>()

const emit = defineEmits<{
  andar: [direcao: number]
  alternarPausa: []
}>()
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

  <div class="controles">
    <button
      class="button lado"
      type="button"
      :disabled="pausado"
      aria-label="Andar pra esquerda"
      @pointerdown="emit('andar', -1)"
      @pointerup="emit('andar', 0)"
      @pointerleave="emit('andar', 0)"
      @pointercancel="emit('andar', 0)"
    >
      <IconePixel nome="seta" :escala="4" />
    </button>
    <button
      class="button lado"
      type="button"
      :disabled="pausado"
      aria-label="Andar pra direita"
      @pointerdown="emit('andar', 1)"
      @pointerup="emit('andar', 0)"
      @pointerleave="emit('andar', 0)"
      @pointercancel="emit('andar', 0)"
    >
      <IconePixel nome="setaDireita" :escala="4" />
    </button>
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
