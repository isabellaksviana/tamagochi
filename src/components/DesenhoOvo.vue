<script setup lang="ts">
import { computed } from 'vue'
import { ALTURA, LARGURA, ovoEmPixel, retangulosDa } from './bicho/pixel'

// o ovo em pixel (no visor e na lista): cada toque abre uma rachadura nova
const props = defineProps<{
  rachaduras: number
}>()

const retangulos = computed(() => retangulosDa(ovoEmPixel(props.rachaduras)))
</script>

<template>
  <svg class="ovo" :viewBox="`0 0 ${LARGURA} ${ALTURA}`" shape-rendering="crispEdges" aria-hidden="true">
    <rect v-for="(r, i) in retangulos" :key="i" :x="r.x" :y="r.y" :width="r.largura" height="1" :fill="r.cor" />
  </svg>
</template>

<style scoped>
.ovo {
  display: block;
  width: 100%;
  height: auto;
}
</style>
