<template>
  <div class="modal-fundo">
    <div class="modal">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.modal {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  /* 320px, mas nunca mais largo que a tela (16px de folga de cada lado) */
  width: min(20rem, 100vw - 2rem);
  box-sizing: border-box;
  padding: var(--space-6);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.4);
}

.modal-fundo {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgb(0 0 0 / 0.6);
}
</style>
