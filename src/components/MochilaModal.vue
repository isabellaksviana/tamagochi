<script setup lang="ts">
import { computed } from 'vue'
import Janela from './Janela.vue'
import LinhaItem from './LinhaItem.vue'
import DesenhoBicho from './DesenhoBicho.vue'
import IconePixel from './IconePixel.vue'
import { useConfirmacao } from '../composables/useConfirmacao'
import { ganhosDo, itemPeloId, type ItemLoja } from '../loja'
import type { Bicho } from '../tipos'

const props = defineProps<{
  // quantos de cada item a pessoa tem: { sache: 2, bolinha: 1 }
  mochila: Record<string, number>
  // quem vai ganhar o mimo: o bicho que está aberto
  bicho: Bicho
}>()

const emit = defineEmits<{
  deu: [item: ItemLoja]
  irParaLoja: []
  fechou: []
}>()

// só os itens que a pessoa tem, com a quantidade
const guardados = computed(() =>
  Object.entries(props.mochila)
    .filter(([, quantos]) => quantos > 0)
    .map(([id, quantos]) => ({ item: itemPeloId(id), quantos }))
    .filter((guardado): guardado is { item: ItemLoja; quantos: number } => guardado.item !== undefined),
)

const { idConfirmado, mensagem, confirmar } = useConfirmacao()

function dar(item: ItemLoja) {
  emit('deu', item)
  confirmar(item.id, `${props.bicho.nome} ganhou ${item.nome}! ${ganhosDo(item)}`)
}
</script>

<template>
  <Janela titulo="Mochila" :subtitulo="`Escolha um mimo para ${bicho.nome}`" @fechou="emit('fechou')">
    <template #icone>
      <DesenhoBicho :especie="bicho.especie" :cor="bicho.cor" expressao="carinhoso" so-cabeca />
    </template>

    <!-- o aviso fica até o próximo mimo (ou até fechar), mesmo se a mochila esvaziar -->
    <p v-if="mensagem !== ''" class="confirmacao" role="status">
      <IconePixel nome="certo" />
      {{ mensagem }}
    </p>

    <ul v-if="guardados.length > 0" class="itens">
      <LinhaItem v-for="guardado in guardados" :key="guardado.item.id" :item="guardado.item">
        <span class="pilula" :aria-label="`${guardado.quantos} na mochila`">
          × <span class="numero">{{ guardado.quantos }}</span>
        </span>
        <button
          class="button button-primary"
          :class="{ confirmado: idConfirmado === guardado.item.id }"
          type="button"
          :aria-label="`Dar ${guardado.item.nome} para ${bicho.nome}`"
          @click="dar(guardado.item)"
        >
          <template v-if="idConfirmado === guardado.item.id">
            <IconePixel nome="certo" />
            Dado!
          </template>
          <template v-else>Dar</template>
        </button>
      </LinhaItem>
    </ul>

    <!-- mochila vazia: em vez de uma tela em branco, um caminho pra loja -->
    <div v-else class="vazia">
      <p>A mochila está vazia.</p>
      <button class="button button-primary" type="button" @click="emit('irParaLoja')">
        <IconePixel nome="biscoito" />
        Ir para a Lojinha
      </button>
    </div>
  </Janela>
</template>

<style scoped>
.itens {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.vazia {
  display: grid;
  justify-items: center;
  gap: var(--space-3);
  padding: var(--space-6) 0 var(--space-4);
  color: var(--text-muted);
}

.vazia p {
  margin: 0;
}
</style>
