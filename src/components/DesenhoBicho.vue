<script setup lang="ts">
import { computed } from 'vue'
import { ALTURA, gatoEmPixel, LARGURA, retangulosDa } from './bicho/pixel'
import type { CorGato, Especie, Expressao } from './bicho/cores'

const props = defineProps<{
  especie: Especie
  cor: CorGato
  expressao: Expressao
}>()

// cada quadradinho da grade vira um <rect>; vizinhos da mesma cor viram um só
const retangulos = computed(() => retangulosDa(gatoEmPixel(props.cor, props.expressao)))
</script>

<template>
  <!-- crispEdges: sem suavizar as bordas, pra cada pixel ficar "duro" -->
  <svg
    class="bicho"
    :viewBox="`0 0 ${LARGURA} ${ALTURA}`"
    shape-rendering="crispEdges"
    role="img"
    :aria-label="`${especie} ${cor}, ${expressao}`"
  >
    <rect v-for="(r, i) in retangulos" :key="i" :x="r.x" :y="r.y" :width="r.largura" height="1" :fill="r.cor" />
  </svg>
</template>

<style scoped>
.bicho {
  display: block;
  width: 100%;
  height: auto;
}
</style>
