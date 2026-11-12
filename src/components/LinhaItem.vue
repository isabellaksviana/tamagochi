<script setup lang="ts">
import type { ItemLoja } from '../loja'

// uma linha de item (na loja e na mochila): desenho, nome, descrição e, à direita, o que vier no slot
defineProps<{
  item: ItemLoja
}>()
</script>

<template>
  <li class="linha" :style="{ '--cor-item': item.cor }">
    <!-- aqui vai entrar a ilustração do item; por enquanto, o ícone -->
    <span class="vitrine">
      <component :is="item.icone" weight="duotone" aria-hidden="true" />
    </span>
    <span class="texto">
      <strong>{{ item.nome }}</strong>
      <span>{{ item.descricao }}</span>
    </span>
    <span class="lado">
      <slot />
    </span>
  </li>
</template>

<style scoped>
.linha {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.vitrine {
  display: grid;
  place-items: center;
  width: 4rem;
  height: 4rem;
  color: var(--cor-item);
  background: color-mix(in srgb, var(--cor-item) 18%, transparent);
  border-radius: var(--radius-lg);
}

.vitrine svg {
  width: 2rem;
  height: 2rem;
}

.texto {
  display: grid;
  gap: 2px;
}

.texto span {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.lado {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* :slotted alcança o que veio de fora pelo slot (o scoped sozinho não alcança) */
:slotted(.pilula) {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  min-height: 2.25rem;
  padding: 0 var(--space-3);
  font-weight: 700;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 999px;
}

:slotted(.pilula svg) {
  width: 1.125rem;
  height: 1.125rem;
  color: #d9a15b;
}

/* janela estreita (celular): o lado desce pra baixo do texto e o botão estica */
@container (max-width: 30rem) {
  .linha {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .lado {
    grid-column: 1 / -1;
  }

  :slotted(.button) {
    flex: 1;
  }
}
</style>
