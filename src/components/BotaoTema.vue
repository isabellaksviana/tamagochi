<script setup lang="ts">
import { ref } from 'vue'
import { PhMoon, PhSun } from '@phosphor-icons/vue'

type Tema = 'light' | 'dark'

// o index.html já escolheu o tema antes de a página aparecer; aqui só lemos qual foi
const raiz = document.documentElement
const tema = ref<Tema>(raiz.dataset.theme === 'light' ? 'light' : 'dark')

function trocar() {
  tema.value = tema.value === 'dark' ? 'light' : 'dark'
  raiz.dataset.theme = tema.value
  // guardado: no próximo F5 o index.html usa esse em vez do sistema
  localStorage.setItem('tema', tema.value)
}
</script>

<template>
  <!-- o ícone mostra pra onde o botão leva: no escuro aparece o sol -->
  <button
    class="botao-tema"
    type="button"
    :aria-label="tema === 'dark' ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'"
    @click="trocar"
  >
    <PhSun v-if="tema === 'dark'" weight="duotone" :size="22" aria-hidden="true" />
    <PhMoon v-else weight="duotone" :size="22" aria-hidden="true" />
  </button>
</template>

<style scoped>
.botao-tema {
  display: grid;
  place-items: center;
  width: 2.6875rem;
  height: 2.6875rem;
  padding: 0;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.botao-tema:hover {
  background: var(--surface-strong);
}

.botao-tema:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
</style>
