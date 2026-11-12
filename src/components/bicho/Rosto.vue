<script setup lang="ts">
import { computed } from 'vue'
import type { Expressao } from './cores'

const props = defineProps<{
  expressao: Expressao
  comNariz: boolean
}>()

// olhos fechados viram um arco; o do lado direito é o mesmo, 60 pra direita
const arcosDosOlhos: Partial<Record<Expressao, string>> = {
  feliz: 'M60 91 Q70 78 80 91',
  carinhoso: 'M60 90 Q70 80 80 90',
  dormindo: 'M60 88 Q70 96 80 88',
}

// boca de risquinho (feliz e surpreso têm boca aberta, desenhada no template)
const bocas: Partial<Record<Expressao, string>> = {
  neutro: 'M90 107 Q95 113 100 108 Q105 113 110 107',
  carinhoso: 'M90 107 Q95 113 100 108 Q105 113 110 107',
  dormindo: 'M93 109 Q100 113 107 109',
  triste: 'M93 115 Q100 109 107 115',
  bravo: 'M92 113 Q100 108 108 113',
}

const arco = computed(() => arcosDosOlhos[props.expressao])
const boca = computed(() => bocas[props.expressao])
const olhoAberto = computed(() => props.expressao === 'neutro' || props.expressao === 'triste')
</script>

<template>
  <g>
    <!-- olhos -->
    <template v-if="olhoAberto">
      <g v-for="x in [70, 130]" :key="x">
        <ellipse :cx="x" cy="88" rx="10" ry="12" fill="var(--olho)" />
        <ellipse :cx="x" cy="89" rx="7" ry="9" fill="#3A2522" />
        <circle :cx="x + 3" cy="84" r="3.5" fill="#fff" />
        <circle :cx="x - 3" cy="93" r="1.6" fill="#fff" />
      </g>
    </template>

    <template v-else-if="expressao === 'surpreso'">
      <g v-for="x in [70, 130]" :key="x">
        <circle :cx="x" cy="87" r="12" fill="var(--olho)" />
        <circle :cx="x" cy="88" r="8" fill="#3A2522" />
        <circle :cx="x + 3.5" cy="83.5" r="3.8" fill="#fff" />
        <circle :cx="x - 3" cy="92" r="1.6" fill="#fff" />
      </g>
    </template>

    <template v-else-if="arco">
      <path
        v-for="deslocamento in [0, 60]"
        :key="deslocamento"
        :d="arco"
        :transform="`translate(${deslocamento} 0)`"
        fill="none"
        stroke="var(--rosto-olho)"
        stroke-width="4"
        stroke-linecap="round"
      />
    </template>

    <template v-else-if="expressao === 'bravo'">
      <path d="M60 86 L80 91 Q80 101 70 101 Q60 101 60 86 Z" fill="#3A2522" />
      <path d="M140 86 L120 91 Q120 101 130 101 Q140 101 140 86 Z" fill="#3A2522" />
      <circle cx="73" cy="94" r="2.2" fill="#fff" />
      <circle cx="127" cy="94" r="2.2" fill="#fff" />
    </template>

    <!-- sobrancelhas -->
    <path
      v-if="expressao === 'triste'"
      d="M58 80 L80 73 M142 80 L120 73"
      stroke="var(--rosto-olho)"
      stroke-width="4"
      stroke-linecap="round"
    />
    <path
      v-if="expressao === 'bravo'"
      d="M56 77 L80 83 M144 77 L120 83"
      stroke="var(--rosto-olho)"
      stroke-width="4"
      stroke-linecap="round"
    />

    <!-- nariz -->
    <path
      v-if="comNariz"
      d="M95 99 Q100 97 105 99 Q102 104 100 105 Q98 104 95 99 Z"
      fill="var(--nariz)"
      stroke="#5B3A36"
      stroke-width="1.5"
      stroke-linejoin="round"
    />

    <!-- boca -->
    <g fill="none" stroke="var(--rosto)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path v-if="boca && comNariz" d="M100 105 L100 108" />
      <path v-if="boca" :d="boca" />
    </g>

    <template v-if="expressao === 'feliz'">
      <path
        d="M88 107 Q100 104 112 107 Q110 125 100 125 Q90 125 88 107 Z"
        fill="#C2555F"
        stroke="#5B3A36"
        stroke-width="2.5"
        stroke-linejoin="round"
      />
      <path d="M93 119 Q100 113 107 119 Q104 124 100 124 Q96 124 93 119 Z" fill="#FF9FB3" />
    </template>

    <ellipse
      v-if="expressao === 'surpreso'"
      cx="100"
      cy="114"
      rx="5"
      ry="6.5"
      fill="#C2555F"
      stroke="#5B3A36"
      stroke-width="2.5"
    />

    <!-- enfeites em volta da cabeça -->
    <path
      v-if="expressao === 'feliz'"
      d="M22 44 L10 36 M16 58 L3 56 M30 32 L24 20"
      stroke="#F6C343"
      stroke-width="4"
      stroke-linecap="round"
    />
    <path
      v-if="expressao === 'carinhoso'"
      transform="translate(168 22) scale(1.5)"
      d="M0 8 C-10 0 -10 -10 -3 -10 C0 -10 0 -7 0 -7 C0 -7 0 -10 3 -10 C10 -10 10 0 0 8 Z"
      fill="#FF9FB3"
      stroke="#D9566B"
      stroke-width="1.5"
    />
    <path
      v-if="expressao === 'surpreso'"
      d="M92 18 L88 6 M108 18 L112 6"
      stroke="#F6C343"
      stroke-width="4"
      stroke-linecap="round"
    />
    <path
      v-if="expressao === 'triste'"
      d="M63 101 Q58 110 63 113 Q68 110 63 101 Z"
      fill="#8EC5F0"
      stroke="#5E9BCB"
      stroke-width="1.2"
    />
    <g v-if="expressao === 'dormindo'" font-family="Nunito, sans-serif" font-weight="800" fill="#9B8BC9">
      <text x="150" y="30" font-size="16">z</text>
      <text x="162" y="18" font-size="22">Z</text>
    </g>
    <path
      v-if="expressao === 'bravo'"
      d="M154 14 Q159 19 164 14 M154 32 Q159 27 164 32 M150 18 Q155 23 150 28 M168 18 Q163 23 168 28"
      fill="none"
      stroke="#E5484D"
      stroke-width="3.5"
      stroke-linecap="round"
    />
  </g>
</template>
