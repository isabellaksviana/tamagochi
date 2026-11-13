<script setup lang="ts">
// No computador, embaixo do visor durante o jogo: quais teclas usar
defineProps<{
  // a nave anda pra cima e pra baixo também
  vertical?: boolean
}>()
</script>

<template>
  <p class="dica">
    <span><kbd>←</kbd><kbd>→</kbd> {{ vertical ? '' : 'mover' }}</span>
    <span v-if="vertical"><kbd>↑</kbd><kbd>↓</kbd> mover</span>
    <span><kbd>P</kbd> pausar</span>
    <span class="mouse">ou segure o mouse na telinha</span>
  </p>
</template>

<style scoped>
.dica {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-2) var(--space-4);
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-muted);
}

.dica span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

kbd {
  display: inline-grid;
  place-items: center;
  min-width: 1.75rem;
  height: 1.75rem;
  padding: 0 4px;
  /* a Inter tem as setinhas (a fonte pixel não tem) */
  font-family: var(--font);
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--text);
  background: var(--surface);
  border: 2px solid var(--border);
  border-bottom-width: 4px;
  border-radius: 6px;
}

.mouse {
  font-weight: 400;
}
</style>
