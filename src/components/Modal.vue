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
    gap: 16px;
    /* 320px, mas nunca mais largo que a tela (16px de folga de cada lado) */
    width: min(320px, 100vw - 32px);
    box-sizing: border-box;
    padding: 24px;
    background: var(--cor-fundo-afundado);
    border: 1px solid var(--cor-borda);
    border-radius: var(--raio);
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