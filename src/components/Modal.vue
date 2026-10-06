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
    min-width: 320px;
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