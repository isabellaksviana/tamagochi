<script setup lang="ts">
// o aviso de pausa no meio do visor, igual em todos os jogos: continuar ou sair do jogo
const emit = defineEmits<{
  continuar: []
  sair: []
}>()
</script>

<template>
  <!-- @pointerdown.stop: tocar aqui não mexe o bicho/nave lá embaixo -->
  <div class="aviso-pausa" @pointerdown.stop>
    <strong>Pausado</strong>
    <button class="button button-primary" type="button" @click="emit('continuar')">Continuar</button>
    <button class="button" type="button" @click="emit('sair')">Sair do jogo</button>
  </div>
</template>

<style scoped>
.aviso-pausa {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: grid;
  place-content: center;
  gap: var(--space-3);
  background: color-mix(in srgb, var(--lcd) 80%, transparent);
}

strong {
  font-family: var(--font-pixel);
  font-weight: 400;
  font-size: 1.5rem;
  text-align: center;
  color: var(--text);
}

.button {
  min-width: 10rem;
}
</style>
