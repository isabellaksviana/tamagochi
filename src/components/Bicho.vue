<script setup lang="ts">
import { computed } from 'vue'
import Gato from './bicho/Gato.vue'
import Rosto from './bicho/Rosto.vue'
import { CORES_PADRAO, PELAGENS_GATO, type CorGato, type Especie, type Expressao } from './bicho/cores'

const props = defineProps<{
  especie: Especie
  cor: CorGato
  expressao: Expressao
}>()

const pelagem = computed(() => PELAGENS_GATO[props.cor])

// junta as cores padrão com as da pelagem e vira variáveis CSS: { '--pelo': '#FFD7B0', ... }
const variaveis = computed(() => {
  const cores = { ...CORES_PADRAO, ...pelagem.value.cores }
  cores['rosto-olho'] ??= cores.rosto
  cores.cauda ??= cores.pelo
  cores.peito ??= cores.focinho

  return Object.fromEntries(Object.entries(cores).map(([nome, valor]) => [`--${nome}`, valor]))
})
</script>

<template>
  <svg class="bicho" viewBox="0 0 200 220" :style="variaveis" role="img" :aria-label="`${especie} ${cor}, ${expressao}`">
    <Gato :padrao="pelagem.padrao" />
    <Rosto :expressao="expressao" :com-nariz="true" />
  </svg>
</template>

<style scoped>
.bicho {
  display: block;
  width: 100%;
  height: auto;
}
</style>
