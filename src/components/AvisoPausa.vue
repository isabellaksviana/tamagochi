<script setup lang="ts">
// o aviso de pausa no meio do visor, igual em todos os jogos: continuar ou sair do jogo.
// Sair pede confirmação (um toque sem querer, com o celular largado na mesa, não perde a partida).
// "confirmando" vem de fora: o X do HUD já abre direto na pergunta.
const confirmando = defineModel<boolean>('confirmando', { default: false })

const emit = defineEmits<{
  continuar: []
  sair: []
}>()
</script>

<template>
  <!-- @pointerdown.stop: tocar aqui não mexe o bicho/nave lá embaixo -->
  <div class="aviso-pausa" @pointerdown.stop>
    <template v-if="!confirmando">
      <strong>Pausado</strong>
      <button class="button button-primary" type="button" @click="emit('continuar')">Continuar</button>
      <button class="button" type="button" @click="confirmando = true">Sair do jogo</button>
    </template>

    <template v-else>
      <strong>Sair mesmo?</strong>
      <p>Você perde esta partida.</p>
      <button class="button button-primary" type="button" @click="emit('continuar')">Não, continuar jogando</button>
      <button class="button button-danger" type="button" @click="emit('sair')">Sim, sair</button>
    </template>
  </div>
</template>

<style scoped>
.aviso-pausa {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: grid;
  place-content: center;
  gap: var(--space-3);
  padding: var(--space-4);
  text-align: center;
  background: color-mix(in srgb, var(--lcd) 88%, transparent);
}

strong {
  font-family: var(--font-pixel);
  font-weight: 400;
  font-size: 1.5rem;
  color: var(--text);
}

p {
  margin: 0;
  font-weight: 600;
  color: var(--text-muted);
}

.button {
  min-width: 12rem;
  min-height: 3rem;
}
</style>
