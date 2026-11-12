<script setup lang="ts">
import { computed } from 'vue'
import { diasDe, faseDo, NOME_DA_FASE, type Periodo } from '../regras'
import type { Bicho } from '../tipos'

// o Diário do bicho: fase, idade e tudo o que já aconteceu com ele.
// Embaixo, o modo demonstração (pra apresentar o jogo sem esperar dias).
const props = defineProps<{
  bicho: Bicho
  demo: boolean
  periodo: Periodo
}>()

const emit = defineEmits<{
  trocouDemo: [ligado: boolean]
  trocouPeriodo: [periodo: Periodo]
}>()

const fase = computed(() => faseDo(props.bicho.chocou, props.bicho.idade))
const dias = computed(() => diasDe(props.bicho.idade))
const adotadoEm = computed(() => new Date(props.bicho.adotadoEm).toLocaleDateString('pt-BR'))

const linhas = computed(() => [
  { rotulo: 'Refeições', valor: props.bicho.contadores.alimentou },
  { rotulo: 'Caixinhas limpas', valor: props.bicho.contadores.caixinhas },
  { rotulo: 'Brincadeiras', valor: props.bicho.contadores.brincou },
  { rotulo: 'Carinhos', valor: props.bicho.contadores.carinhos },
  { rotulo: 'Noites dormidas', valor: props.bicho.contadores.noites },
  { rotulo: 'Biscoitos no minijogo', valor: props.bicho.contadores.biscoitosNoJogo },
])

const PERIODOS: { valor: Periodo; rotulo: string }[] = [
  { valor: 'auto', rotulo: 'Hora real' },
  { valor: 'dia', rotulo: 'Dia' },
  { valor: 'noite', rotulo: 'Noite' },
]
</script>

<template>
  <section class="diario">
    <h2>Diário</h2>

    <dl class="ficha">
      <div>
        <dt>Fase</dt>
        <dd>{{ NOME_DA_FASE[fase] }}</dd>
      </div>
      <div>
        <dt>Idade</dt>
        <dd><span class="numero">{{ dias }}</span> {{ dias === 1 ? 'dia' : 'dias' }}</dd>
      </div>
      <div>
        <dt>Adotado em</dt>
        <dd>{{ adotadoEm }}</dd>
      </div>
    </dl>

    <ul class="contadores">
      <li v-for="linha in linhas" :key="linha.rotulo">
        <span>{{ linha.rotulo }}</span>
        <span class="numero">{{ linha.valor }}</span>
      </li>
    </ul>

    <div class="demo">
      <h3>Modo demonstração</h3>
      <p>Pra mostrar o jogo sem esperar dias: um dia passa em 1 minuto, e as barras caem 20 vezes mais rápido.</p>
      <button class="button" :class="{ 'button-primary': demo }" type="button" :aria-pressed="demo" @click="emit('trocouDemo', !demo)">
        {{ demo ? 'Tempo acelerado: ligado' : 'Acelerar o tempo' }}
      </button>
      <div class="periodos" role="group" aria-label="Dia ou noite">
        <button
          v-for="opcao in PERIODOS"
          :key="opcao.valor"
          class="aba"
          type="button"
          :aria-pressed="periodo === opcao.valor"
          @click="emit('trocouPeriodo', opcao.valor)"
        >
          {{ opcao.rotulo }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.diario {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 16px;
}

h2 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--primary);
}

h3 {
  margin: 0;
  font-size: var(--font-size-base);
}

.ficha {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
  margin: 0;
}

.ficha div {
  padding: var(--space-2);
  text-align: center;
  background: var(--bg);
  border: 2px solid var(--border);
  border-radius: var(--radius-lg);
}

.ficha dt {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.ficha dd {
  margin: 0;
  font-weight: 700;
}

.contadores {
  display: grid;
  gap: var(--space-1);
  margin: 0;
  padding: 0;
  list-style: none;
}

.contadores li {
  display: flex;
  justify-content: space-between;
  padding: var(--space-1) 0;
  font-size: var(--font-size-sm);
  border-bottom: 2px dashed var(--border);
}

.demo {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--bg);
  border: 2px dashed var(--border);
  border-radius: var(--radius-lg);
}

.demo p {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.periodos {
  display: flex;
  gap: var(--space-2);
}

.aba {
  min-height: 2.25rem;
  padding: 0 var(--space-3);
  font: inherit;
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 999px;
  cursor: pointer;
}

.aba[aria-pressed='true'] {
  color: var(--text);
  background: var(--primary-soft);
  border-color: var(--primary);
}
</style>
