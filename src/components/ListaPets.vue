<script setup lang="ts">
import DesenhoBicho from './DesenhoBicho.vue'
import BotaoTema from './BotaoTema.vue'
import IconePixel from './IconePixel.vue'
import { avisoDo, expressaoDo } from '../regras'
import type { Bicho } from '../tipos'

defineProps<{
  bichos: Bicho[]
}>()

// a lista não troca de tela sozinha: avisa o App qual bicho foi escolhido
const emit = defineEmits<{
  abriu: [id: number]
  adotar: []
}>()
</script>

<template>
  <section class="lista">
    <header class="topo">
      <h1>Meus bichinhos</h1>
      <BotaoTema />
    </header>

    <ul class="cards">
      <li v-for="bicho in bichos" :key="bicho.id">
        <button class="card" type="button" @click="emit('abriu', bicho.id)">
          <DesenhoBicho class="desenho" :especie="bicho.especie" :cor="bicho.cor" :expressao="expressaoDo(bicho.status)" />
          <span class="nome">{{ bicho.nome }}</span>
          <span class="aviso" :class="{ 'tudo-bem': avisoDo(bicho.status) === 'Tudo bem' }">
            {{ avisoDo(bicho.status) }}
          </span>
        </button>
      </li>

      <li>
        <button class="card novo" type="button" @click="emit('adotar')">
          <span class="mais"><IconePixel nome="mais" :escala="3" /></span>
          <span class="nome">Adotar</span>
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.lista {
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
  font-size: 1.4rem;
}

.cards {
  display: grid;
  /* quantos couberem, cada um com pelo menos 10rem */
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}

.card {
  display: grid;
  justify-items: center;
  align-content: center;
  gap: var(--space-1);
  width: 100%;
  height: 100%;
  padding: var(--space-4) var(--space-3);
  font: inherit;
  color: var(--text);
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 16px;
  cursor: pointer;
}

.card:hover {
  background: var(--surface-strong);
}

.card:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* 45 × 2 = 90px: múltiplo inteiro do desenho, sem borrar */
.desenho {
  width: 90px;
  margin-bottom: var(--space-2);
}

.nome {
  font-family: var(--font-pixel);
  font-size: 1.05rem;
}

.aviso {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--danger-text);
}

.aviso.tudo-bem {
  color: var(--text-muted);
}

/* o card de adotar: tracejado, pra parecer um espaço vazio esperando */
.novo {
  min-height: 12rem;
  color: var(--text-muted);
  background: transparent;
  border-style: dashed;
}

.mais {
  display: grid;
  place-items: center;
  width: 3.5rem;
  height: 3.5rem;
  margin-bottom: var(--space-2);
  color: var(--primary);
  background: var(--primary-soft);
  border-radius: 50%;
}
</style>
