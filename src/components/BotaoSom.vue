<script setup lang="ts">
import { ref } from 'vue'
import IconePixel from './IconePixel.vue'
import { ligarSom, somLigado, tocar } from '../som'

// liga e desliga os bips (fica salvo pro próximo F5)
const ligado = ref(somLigado())

function trocar() {
  ligado.value = !ligado.value
  ligarSom(ligado.value)
  tocar('clique')
}
</script>

<template>
  <button
    class="button so-icone"
    type="button"
    :aria-label="ligado ? 'Desligar o som' : 'Ligar o som'"
    :aria-pressed="ligado"
    :title="ligado ? 'Som ligado' : 'Som desligado'"
    @click="trocar"
  >
    <IconePixel :nome="ligado ? 'som' : 'mudo'" />
  </button>
</template>
