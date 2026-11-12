<script setup lang="ts">
import { computed } from 'vue'
import { ALTURA, gatoEmPixel, LARGURA, retangulosDa } from './bicho/pixel'
import type { CorGato, Especie, Expressao } from './bicho/cores'

const props = defineProps<{
  especie: Especie
  cor: CorGato
  expressao: Expressao
  // só a cabeça (nos cabeçalhos das janelas): recorta o desenho logo abaixo do queixo
  soCabeca?: boolean
  // a animação de respirar (no visor e na tela de criar; nas miniaturas fica parado)
  respirando?: boolean
}>()

// cada quadradinho da grade vira um <rect>; vizinhos da mesma cor viram um só
const retangulos = computed(() => retangulosDa(gatoEmPixel(props.cor, props.expressao)))

// pra respirar, o desenho se divide em duas partes: a de cima (cabeça e peito), que desce
// 1 pixel e volta, e a de baixo (barriga e patinhas), que fica parada no chão
const LINHA_DO_FOLEGO = 37
const decima = computed(() => retangulos.value.filter((r) => r.y < LINHA_DO_FOLEGO))
const debaixo = computed(() => retangulos.value.filter((r) => r.y >= LINHA_DO_FOLEGO))

// a cabeça vai até a linha 34 da grade
const alturaVisivel = computed(() => (props.soCabeca ? 35 : ALTURA))
</script>

<template>
  <!-- crispEdges: sem suavizar as bordas, pra cada pixel ficar "duro" -->
  <svg
    class="bicho"
    :viewBox="`0 0 ${LARGURA} ${alturaVisivel}`"
    shape-rendering="crispEdges"
    role="img"
    :aria-label="`${especie} ${cor}, ${expressao}`"
  >
    <g>
      <rect v-for="(r, i) in debaixo" :key="i" :x="r.x" :y="r.y" :width="r.largura" height="1" :fill="r.cor" />
    </g>
    <!-- a parte de cima vem depois: quando desce, cobre a primeira linha da barriga (o "expirar") -->
    <g :class="{ folego: respirando, devagar: expressao === 'dormindo' }">
      <rect v-for="(r, i) in decima" :key="i" :x="r.x" :y="r.y" :width="r.largura" height="1" :fill="r.cor" />
    </g>
  </svg>
</template>

<style scoped>
.bicho {
  display: block;
  width: 100%;
  height: auto;
}

/* dentro do SVG, 1px = 1 quadradinho da grade. steps(1): pula de uma posição pra outra,
   sem meio-termo, como animação de pixel art (sem borrar) */
.folego {
  animation: respirar 2.6s steps(1) infinite;
}

/* dormindo, respira mais devagar */
.folego.devagar {
  animation-duration: 4s;
}

@keyframes respirar {
  0% {
    transform: translateY(0);
  }
  55% {
    transform: translateY(1px);
  }
}

/* quem pediu menos movimento no sistema fica com o gato parado */
@media (prefers-reduced-motion: reduce) {
  .folego {
    animation: none;
  }
}
</style>
