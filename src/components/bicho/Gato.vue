<script setup lang="ts">
import { useId } from 'vue'
import type { Padrao } from './cores'

defineProps<{
  padrao: Padrao
}>()

// cada gato na tela precisa de recortes com nome próprio, senão um usa o do outro
const id = useId()

const contorno = '#5B3A36'
const cabeca = 'M28 88 C28 50 58 30 100 30 C142 30 172 50 172 88 C172 122 142 138 100 138 C58 138 28 122 28 88 Z'
const corpo = 'M62 202 C56 172 66 132 100 128 C134 132 144 172 138 202 Q100 210 62 202 Z'
const cauda = 'M128 198 C170 202 184 170 171 150 C165 140 156 138 152 146'
</script>

<template>
  <g>
    <defs>
      <clipPath :id="`cabeca-${id}`"><path :d="cabeca" /></clipPath>
      <clipPath :id="`corpo-${id}`"><path :d="corpo" /></clipPath>
    </defs>

    <!-- sombra no chão -->
    <ellipse cx="100" cy="210" rx="72" ry="8" fill="#E9D5F6" />

    <!-- cauda: contorno largo por baixo, pelo por cima -->
    <path :d="cauda" fill="none" :stroke="contorno" stroke-width="24" stroke-linecap="round" />
    <path :d="cauda" fill="none" stroke="var(--cauda)" stroke-width="16" stroke-linecap="round" />
    <path
      v-if="padrao === 'tricolor'"
      :d="cauda"
      fill="none"
      stroke="var(--mancha-escura)"
      stroke-width="16"
      stroke-dasharray="16 20"
    />

    <!-- corpo -->
    <path :d="corpo" fill="var(--pelo)" />
    <g :clip-path="`url(#corpo-${id})`">
      <path
        v-if="padrao === 'listras'"
        d="M62 158 Q72 160 78 167 M60 174 Q70 175 75 182 M138 158 Q128 160 122 167 M140 174 Q130 175 125 182"
        stroke="var(--listra)"
        stroke-width="5"
        stroke-linecap="round"
        fill="none"
      />
      <template v-if="padrao === 'tricolor'">
        <path d="M50 150 Q72 140 80 160 Q76 186 50 196 Z" fill="var(--mancha-clara)" />
        <path d="M150 168 Q126 166 124 186 Q130 206 150 206 Z" fill="var(--mancha-escura)" />
      </template>
    </g>
    <path :d="corpo" fill="none" :stroke="contorno" stroke-width="4" stroke-linejoin="round" />

    <!-- peito -->
    <path
      d="M82 140 Q100 132 118 140 L116 158 Q112 166 108 160 Q104 170 100 162 Q96 170 92 160 Q88 166 84 158 Z"
      fill="var(--peito)"
    />

    <!-- patinhas -->
    <g fill="var(--pelo)" :stroke="contorno" stroke-width="3.5">
      <ellipse cx="84" cy="203" rx="13" ry="8" />
      <ellipse cx="116" cy="203" rx="13" ry="8" />
    </g>
    <path
      d="M80 200 L80 206 M88 200 L88 206 M112 200 L112 206 M120 200 L120 206"
      :stroke="contorno"
      stroke-width="2"
      stroke-linecap="round"
    />

    <!-- orelhas -->
    <g :stroke="contorno" stroke-width="4" stroke-linejoin="round">
      <path
        d="M38 70 C34 45 38 20 46 12 C52 8 58 12 88 34 Z"
        :fill="padrao === 'tricolor' ? 'var(--mancha-clara)' : 'var(--pelo)'"
      />
      <path
        d="M162 70 C166 45 162 20 154 12 C148 8 142 12 112 34 Z"
        :fill="padrao === 'tricolor' ? 'var(--mancha-escura)' : 'var(--pelo)'"
      />
    </g>
    <path d="M48 58 C46 42 48 28 52 22 L76 38 Z" fill="var(--orelha)" />
    <path d="M152 58 C154 42 152 28 148 22 L124 38 Z" fill="var(--orelha)" />

    <!-- cabeça -->
    <path :d="cabeca" fill="var(--pelo)" />
    <g :clip-path="`url(#cabeca-${id})`">
      <g v-if="padrao === 'listras'" stroke="var(--listra)" stroke-width="6" stroke-linecap="round" fill="none">
        <path d="M100 32 L100 50 M87 35 Q90 43 88 50 M113 35 Q110 43 112 50" />
        <path d="M28 80 L44 83 M28 93 L41 93 M172 80 L156 83 M172 93 L159 93" />
      </g>
      <template v-if="padrao === 'tricolor'">
        <path d="M20 20 L92 20 Q84 46 74 70 Q56 96 20 104 Z" fill="var(--mancha-clara)" />
        <path d="M180 20 L110 20 Q118 44 128 66 Q146 90 180 96 Z" fill="var(--mancha-escura)" />
      </template>
    </g>
    <path :d="cabeca" fill="none" :stroke="contorno" stroke-width="4" />

    <!-- focinho e bochechas -->
    <ellipse cx="100" cy="108" rx="28" ry="19" fill="var(--focinho)" />
    <g fill="#FF9FB3" opacity=".55">
      <ellipse cx="55" cy="106" rx="10" ry="6" />
      <ellipse cx="145" cy="106" rx="10" ry="6" />
    </g>

    <!-- bigodes -->
    <path
      d="M36 96 L14 92 M36 103 L13 105 M164 96 L186 92 M164 103 L187 105"
      stroke="var(--rosto)"
      stroke-width="2.5"
      stroke-linecap="round"
    />
  </g>
</template>
