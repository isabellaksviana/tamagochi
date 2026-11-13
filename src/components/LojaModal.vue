<script setup lang="ts">
import { computed, ref } from 'vue'
import Janela from './Janela.vue'
import LinhaItem from './LinhaItem.vue'
import DesenhoBicho from './DesenhoBicho.vue'
import IconePixel from './IconePixel.vue'
import { useConfirmacao } from '../composables/useConfirmacao'
import { CATEGORIAS, ITENS_DA_LOJA, type Categoria, type ItemLoja } from '../loja'
import type { Bicho } from '../tipos'

defineProps<{
  moedas: number
  // só pra aparecer no cabeçalho: a loja é do jogo, não de um bicho
  bicho: Bicho
}>()

const emit = defineEmits<{
  comprou: [item: ItemLoja]
  fechou: []
}>()

// a categoria escolhida nas abinhas ("tudo" mostra a loja inteira)
const categoria = ref<Categoria | 'tudo'>('tudo')
const itens = computed(() =>
  categoria.value === 'tudo' ? ITENS_DA_LOJA : ITENS_DA_LOJA.filter((item) => item.categoria === categoria.value),
)

const { idConfirmado, mensagem, confirmar } = useConfirmacao()

function comprar(item: ItemLoja) {
  emit('comprou', item)
  confirmar(item.id, `${item.nome} foi para a sua mochila!`)
}
</script>

<template>
  <Janela titulo="Lojinha" subtitulo="Tudo vai para a sua mochila" fixa @fechou="emit('fechou')">
    <template #icone>
      <DesenhoBicho :especie="bicho.especie" :cor="bicho.cor" expressao="feliz" so-cabeca />
    </template>
    <template #extra>
      <span class="carteira" :aria-label="`${moedas} moedas`">
        <IconePixel nome="moeda" />
        <span class="numero">{{ moedas }}</span>
      </span>
    </template>

    <div class="abas" role="group" aria-label="Categorias">
      <button class="aba" type="button" :aria-pressed="categoria === 'tudo'" @click="categoria = 'tudo'">Tudo</button>
      <button
        v-for="opcao in CATEGORIAS"
        :key="opcao.valor"
        class="aba"
        type="button"
        :aria-pressed="categoria === opcao.valor"
        @click="categoria = opcao.valor"
      >
        <IconePixel :nome="opcao.icone" />
        {{ opcao.rotulo }}
      </button>
    </div>

    <!-- role="status": o leitor de tela anuncia a mensagem sozinho quando ela muda -->
    <p v-if="mensagem !== ''" class="confirmacao" role="status">
      <IconePixel nome="certo" />
      {{ mensagem }}
    </p>

    <ul class="itens">
      <LinhaItem v-for="item in itens" :key="item.id" :item="item">
        <span class="pilula" :aria-label="`${item.preco} moedas`">
          <IconePixel nome="moeda" />
          <span class="numero">{{ item.preco }}</span>
        </span>
        <button
          class="button button-primary"
          :class="{ confirmado: idConfirmado === item.id }"
          type="button"
          :disabled="moedas < item.preco && idConfirmado !== item.id"
          :aria-label="`Comprar ${item.nome}`"
          @click="comprar(item)"
        >
          <template v-if="idConfirmado === item.id">
            <IconePixel nome="certo" />
            Comprado!
          </template>
          <template v-else>Comprar</template>
        </button>
      </LinhaItem>
    </ul>
  </Janela>
</template>

<style scoped>
.carteira {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding: 0 var(--space-3);
  background: var(--bg);
  border: 2px solid var(--border);
  border-radius: var(--radius-lg);
}

/* as abinhas de categoria: quebram em linhas no celular, pra todas ficarem à vista
   (rolar pro lado escondia as últimas, e ninguém adivinhava que dava pra arrastar) */
.abas {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.aba {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.375rem;
  min-height: 2.25rem;
  padding: 0 var(--space-3);
  font: inherit;
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  background: var(--bg);
  border: 2px solid var(--border);
  border-radius: 999px;
  cursor: pointer;
}

.aba:hover {
  background: var(--surface-strong);
}

.aba[aria-pressed='true'] {
  color: var(--text);
  background: var(--primary-soft);
  border-color: var(--primary);
}

.aba:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.itens {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
