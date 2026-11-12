<script setup lang="ts">
import { onMounted, ref, useId } from 'vue'
import IconePixel from './IconePixel.vue'

// a moldura de TODOS os modais do jogo (loja, mochila, soltar): o mesmo cabeçalho e o mesmo jeito,
// pra nenhum ficar diferente do outro
const props = defineProps<{
  titulo: string
  subtitulo?: string
  // a versão pequena, pra confirmações
  pequena?: boolean
}>()

const emit = defineEmits<{
  fechou: []
}>()

const idDoTitulo = useId()

// o <dialog> do próprio navegador: prende o foco dentro dele e fecha com Esc
const janela = ref<HTMLDialogElement | null>(null)

onMounted(() => {
  janela.value?.showModal()
})

function fechar() {
  janela.value?.close()
}

// clicar no fundo escuro (fora da caixa) também fecha
function cliqueNoFundo(evento: MouseEvent) {
  if (evento.target === janela.value) {
    fechar()
  }
}
</script>

<template>
  <dialog
    ref="janela"
    class="janela"
    :class="{ pequena: props.pequena }"
    :aria-labelledby="idDoTitulo"
    @close="emit('fechou')"
    @click="cliqueNoFundo"
  >
    <!-- o espaço interno fica aqui dentro, e não no <dialog>: assim, clicar no espaço não conta como "fora" -->
    <div class="conteudo">
      <header class="cabecalho">
        <span v-if="$slots.icone" class="icone"><slot name="icone" /></span>
        <div class="titulos">
          <h2 :id="idDoTitulo">{{ props.titulo }}</h2>
          <p v-if="props.subtitulo">{{ props.subtitulo }}</p>
        </div>
        <slot name="extra" />
        <button class="button so-icone" type="button" :aria-label="`Fechar ${props.titulo.toLowerCase()}`" @click="fechar">
          <IconePixel nome="fechar" />
        </button>
      </header>
      <slot />
    </div>
  </dialog>
</template>

<style scoped>
.janela {
  width: min(40rem, 100vw - 2rem);
  max-height: calc(100dvh - 2rem);
  padding: 0;
  color: var(--text);
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 16px 48px rgb(0 0 0 / 0.45);
}

.janela.pequena {
  width: min(24rem, 100vw - 2rem);
}

.janela::backdrop {
  background: rgb(0 0 0 / 0.6);
}

.conteudo {
  /* as linhas de item se arrumam pela largura da janela, não da tela */
  container-type: inline-size;
  padding: var(--space-5);
}

.cabecalho {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

/* a cabeça do bicho (ou um ícone) no canto do cabeçalho: 45 × 1 = 45px, sem borrar */
.icone {
  flex-shrink: 0;
  width: 45px;
}

.titulos {
  flex: 1;
  min-width: 0;
}

.titulos h2 {
  margin: 0;
  font-size: 1.25rem;
  line-height: 1.2;
  color: var(--primary);
}

.titulos p {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}
</style>
