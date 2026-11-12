<script setup lang="ts">
import { ref } from 'vue'
import IconePixel from './IconePixel.vue'

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
    class="button so-icone"
    type="button"
    :aria-label="tema === 'dark' ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'"
    @click="trocar"
  >
    <IconePixel :nome="tema === 'dark' ? 'sol' : 'lua'" />
  </button>
</template>
