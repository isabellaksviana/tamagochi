<script setup lang="ts">
import { PhCheck, PhCookie, PhShoppingCart } from '@phosphor-icons/vue'
import Janela from './Janela.vue'
import LinhaItem from './LinhaItem.vue'
import DesenhoBicho from './DesenhoBicho.vue'
import { useConfirmacao } from '../composables/useConfirmacao'
import { ITENS_DA_LOJA, type ItemLoja } from '../loja'
import type { Bicho } from '../tipos'

defineProps<{
  biscoitos: number
  // só pra aparecer no cabeçalho: a loja é do jogo, não de um bicho
  bicho: Bicho
}>()

const emit = defineEmits<{
  comprou: [item: ItemLoja]
  fechou: []
}>()

const { idConfirmado, mensagem, confirmar } = useConfirmacao()

function comprar(item: ItemLoja) {
  emit('comprou', item)
  confirmar(item.id, `${item.nome} foi para a sua mochila!`)
}
</script>

<template>
  <Janela titulo="Lojinha" subtitulo="Tudo vai para a sua mochila" @fechou="emit('fechou')">
    <template #icone>
      <DesenhoBicho :especie="bicho.especie" :cor="bicho.cor" expressao="feliz" />
    </template>
    <template #extra>
      <span class="carteira" :aria-label="`${biscoitos} biscoitos`">
        <PhCookie weight="duotone" aria-hidden="true" />
        {{ biscoitos }}
      </span>
    </template>

    <!-- role="status": o leitor de tela anuncia a mensagem sozinho quando ela muda -->
    <p class="confirmacao" :class="{ visivel: mensagem !== '' }" role="status">
      <PhCheck v-if="mensagem !== ''" weight="bold" aria-hidden="true" />
      {{ mensagem }}
    </p>

    <ul class="itens">
      <LinhaItem v-for="item in ITENS_DA_LOJA" :key="item.id" :item="item">
        <span class="pilula" :aria-label="`${item.preco} biscoitos`">
          <PhCookie weight="duotone" aria-hidden="true" />
          {{ item.preco }}
        </span>
        <button
          class="button button-primary"
          :class="{ confirmado: idConfirmado === item.id }"
          type="button"
          :disabled="biscoitos < item.preco && idConfirmado !== item.id"
          :aria-label="`Comprar ${item.nome}`"
          @click="comprar(item)"
        >
          <template v-if="idConfirmado === item.id">
            <PhCheck weight="bold" aria-hidden="true" />
            Comprado!
          </template>
          <template v-else>
            <PhShoppingCart weight="duotone" aria-hidden="true" />
            Comprar
          </template>
        </button>
      </LinhaItem>
    </ul>
  </Janela>
</template>

<style scoped>
.carteira {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  min-height: 2.6875rem;
  padding: 0 var(--space-3);
  font-weight: 700;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 999px;
}

.carteira svg {
  width: 1.125rem;
  height: 1.125rem;
  color: #d9a15b;
}

.itens {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
