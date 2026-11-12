<script setup lang="ts">
import { computed, ref } from 'vue'
import { PhCat, PhHeart } from '@phosphor-icons/vue'
import DesenhoBicho from './DesenhoBicho.vue'
import BotaoTema from './BotaoTema.vue'
import type { CorGato, Especie } from './bicho/cores'

const emit = defineEmits<{
  adotou: [novo: { nome: string; especie: Especie; cor: CorGato }]
}>()

const CORES: { valor: CorGato; rotulo: string }[] = [
  { valor: 'laranja', rotulo: 'Laranja' },
  { valor: 'preto', rotulo: 'Preto' },
  { valor: 'branco', rotulo: 'Branco' },
  { valor: 'cinza', rotulo: 'Cinza' },
  { valor: 'tricolor', rotulo: 'Tricolor' },
]

// o que a pessoa está escolhendo; o desenho grande lê daqui e muda ao vivo
const especie = ref<Especie>('gato')
const cor = ref<CorGato>('laranja')
const nome = ref('')

const nomeLimpo = computed(() => nome.value.trim())

// quem guarda o bicho é o App: aqui só avisamos que alguém foi adotado
function adotar() {
  if (nomeLimpo.value === '') {
    return
  }
  emit('adotou', { nome: nomeLimpo.value, especie: especie.value, cor: cor.value })
}
</script>

<template>
  <section class="criar">
    <header class="topo">
      <h1>Novo bichinho</h1>
      <BotaoTema />
    </header>

    <div class="lado-a-lado">
      <div class="vitrine">
        <div class="palco">
          <DesenhoBicho class="desenho" :especie="especie" :cor="cor" expressao="feliz" />
        </div>
        <p class="nome-preview" :class="{ vazio: nomeLimpo === '' }">
          {{ nomeLimpo === '' ? 'sem nome ainda' : nomeLimpo }}
        </p>
      </div>

      <!-- form: o Enter no campo de nome já adota -->
      <form class="escolhas" @submit.prevent="adotar">
        <div class="grupo">
          <span class="titulo-grupo">Espécie</span>
          <div>
            <button class="especie" type="button" aria-pressed="true">
              <PhCat weight="duotone" aria-hidden="true" />
              Gato
            </button>
          </div>
        </div>

        <div class="grupo">
          <span class="titulo-grupo">Cor</span>
          <div class="cores">
            <button
              v-for="opcao in CORES"
              :key="opcao.valor"
              class="cor"
              type="button"
              :aria-pressed="cor === opcao.valor"
              @click="cor = opcao.valor"
            >
              <DesenhoBicho class="miniatura" :especie="especie" :cor="opcao.valor" expressao="neutro" />
              {{ opcao.rotulo }}
            </button>
          </div>
        </div>

        <div class="grupo">
          <label class="titulo-grupo" for="nome-do-bicho">Nome</label>
          <input id="nome-do-bicho" v-model="nome" placeholder="Como ele vai se chamar?" maxlength="20" />
        </div>

        <button class="button button-primary adotar" type="submit" :disabled="nomeLimpo === ''">
          <PhHeart weight="duotone" aria-hidden="true" />
          Adotar
        </button>
      </form>
    </div>
  </section>
</template>

<style scoped>
.criar {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-5);
  max-width: 60rem;
  margin: 0 auto;
}

.topo {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.topo h1 {
  margin: 0;
  font-size: 1.25rem;
}

.lado-a-lado {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-5);
}

.vitrine {
  display: grid;
  gap: var(--space-2);
}

/* o círculo de luz atrás do bicho */
.palco {
  display: grid;
  place-items: center;
  width: min(14rem, 70vw);
  aspect-ratio: 1;
  margin: 0 auto;
  background: radial-gradient(closest-side, var(--primary-soft) 0 92%, transparent 93%);
}

.desenho {
  width: 80%;
}

.nome-preview {
  margin: 0;
  min-height: 1.6em;
  text-align: center;
  font-weight: 700;
  font-size: 1.25rem;
}

.nome-preview.vazio {
  font-weight: 600;
  font-size: var(--font-size-base);
  color: var(--text-muted);
}

.escolhas {
  display: grid;
  gap: var(--space-5);
}

.grupo {
  display: grid;
  gap: var(--space-2);
}

.titulo-grupo {
  font-weight: 700;
  font-size: var(--font-size-sm);
}

.especie {
  display: inline-flex;
  align-items: center;
  gap: 0.4375rem;
  min-height: 2.6875rem;
  padding: 0 var(--space-4);
  font: inherit;
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--text);
  background: var(--primary-soft);
  border: 2px solid var(--primary);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.especie svg {
  width: 1rem;
  height: 1rem;
}

.cores {
  display: grid;
  /* minmax(0, ...) deixa as colunas encolherem; só 1fr nunca fica menor que o conteúdo */
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--space-2);
}

.cor {
  display: grid;
  justify-items: center;
  gap: 2px;
  padding: 6px 2px;
  font: inherit;
  font-weight: 600;
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
}

.cor:hover {
  background: var(--surface-strong);
}

.cor[aria-pressed='true'] {
  color: var(--text);
  background: var(--primary-soft);
  border-color: var(--primary);
}

.cor:focus-visible,
.especie:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.miniatura {
  width: 2.75rem;
}

.escolhas input,
.adotar {
  width: 100%;
}

/* no computador: o bicho à esquerda, as escolhas à direita */
@media (min-width: 720px) {
  /* a tela ocupa a altura toda (menos o espaço do body): o topo fica em cima
     e o bloco do bicho + escolhas fica no meio do que sobra */
  .criar {
    min-height: calc(100dvh - 2 * var(--space-8));
    grid-template-rows: auto 1fr;
  }

  .lado-a-lado {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: var(--space-10);
    align-items: center;
    align-self: center;
  }

  .palco {
    width: min(100%, 24rem);
  }

  .nome-preview {
    font-size: 1.6rem;
  }

  .nome-preview.vazio {
    font-size: var(--font-size-lg);
  }
}
</style>
