<script setup lang="ts">
import { computed } from 'vue'
import { CORES_DO_ICONE, ICONES, type NomeIcone } from '../icones'

const props = withDefaults(
  defineProps<{
    nome: NomeIcone
    // quantos pixels de tela vale cada quadradinho (número inteiro, pra não borrar)
    escala?: number
  }>(),
  { escala: 2 },
)

const linhas = computed(() => ICONES[props.nome])
const largura = computed(() => Math.max(...linhas.value.map((linha) => linha.length)))
const altura = computed(() => linhas.value.length)

// cada letra vira um quadradinho; vizinhos da mesma cor viram um retângulo só
const retangulos = computed(() => {
  const lista: { x: number; y: number; w: number; cor: string }[] = []
  linhas.value.forEach((linha, y) => {
    let x = 0
    while (x < linha.length) {
      const letra = linha[x]!
      let fim = x + 1
      while (fim < linha.length && linha[fim] === letra) fim++
      if (letra !== '.') {
        lista.push({ x, y, w: fim - x, cor: letra === 'T' ? 'currentColor' : (CORES_DO_ICONE[letra] ?? 'currentColor') })
      }
      x = fim
    }
  })
  return lista
})
</script>

<template>
  <svg
    class="icone-pixel"
    :width="largura * escala"
    :height="altura * escala"
    :viewBox="`0 0 ${largura} ${altura}`"
    shape-rendering="crispEdges"
    aria-hidden="true"
  >
    <rect v-for="(r, i) in retangulos" :key="i" :x="r.x" :y="r.y" :width="r.w" height="1" :fill="r.cor" />
  </svg>
</template>

<style scoped>
.icone-pixel {
  display: block;
  flex-shrink: 0;
}
</style>
