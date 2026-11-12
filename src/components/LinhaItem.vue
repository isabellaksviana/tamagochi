<script setup lang="ts">
import IconePixel from './IconePixel.vue'
import { efeitosDo, type ItemLoja } from '../loja'

// uma linha de item (na loja e na mochila): desenho, nome, o que ele faz e, à direita, o que vier no slot
defineProps<{
  item: ItemLoja
}>()
</script>

<template>
  <li class="linha" :style="{ '--cor-item': item.cor }">
    <span class="vitrine">
      <IconePixel :nome="item.icone" :escala="4" />
    </span>
    <span class="texto">
      <strong>{{ item.nome }}</strong>
      <span class="descricao">{{ item.descricao }}</span>
      <!-- o que o item faz, antes de gastar os biscoitos: "+50 Fome" -->
      <span class="efeitos" :aria-label="`Efeito: ${efeitosDo(item).map((e) => `+${e.quanto} de ${e.barra.rotulo}`).join(', ')}`">
        <span v-for="efeito in efeitosDo(item)" :key="efeito.barra.chave" class="efeito" :style="{ '--cor': efeito.barra.cor }" aria-hidden="true">
          <IconePixel :nome="efeito.barra.icone" />
          <span class="numero">+{{ efeito.quanto }}</span>
          {{ efeito.barra.rotulo }}
        </span>
      </span>
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
  border: 2px solid var(--border);
  border-radius: 16px;
}

.vitrine {
  display: grid;
  place-items: center;
  width: 4rem;
  height: 4rem;
  background: color-mix(in srgb, var(--cor-item) 22%, transparent);
  border-radius: var(--radius-lg);
}

.texto {
  display: grid;
  gap: 2px;
}

.descricao {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.efeitos {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: var(--space-1);
}

.efeito {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 2px var(--space-2);
  font-size: var(--font-size-xs);
  font-weight: 600;
  background: color-mix(in srgb, var(--cor) 18%, var(--surface));
  border: 2px solid color-mix(in srgb, var(--cor) 55%, var(--border));
  border-radius: 999px;
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
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 999px;
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
