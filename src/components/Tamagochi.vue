<script setup lang="ts">

  import { computed } from 'vue'

const props = defineProps<{
  nome: string
  fome: number
}>()

const emit = defineEmits<{
  comeu: []
  brincou: []
  soltou: []
}>()

// a carinha lê a fome que veio da vitrine
const avatar = computed(() => {
  if (props.fome === 0) {
    return '😸'
  } else {
    return '😿'
  }
})

// o bichinho não mexe na fome: só avisa que foi alimentado
function alimentar() {
  emit('comeu')
}

function brincar() {
  emit('brincou')
}

function excluir() {
  emit('soltou')
}

  
</script>

<template>

  <div class="tamagochi">
      <div>
      <p>{{ avatar }}</p>
      <p>Nome: {{ nome }}</p>
      <p>fome: {{ fome }}</p>
      </div>
 
      <div> 
        <button @click='alimentar' :disabled="fome === 0">Alimentar</button> 
        <button @click='brincar' :disabled="fome === 5" class="brincar">Brincar</button> 
        <button @click='excluir' class="excluir">Soltar</button> 
      </div>
  </div>

</template>

<style scoped>

  .tamagochi {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    align-items: center;
    background: var(--cor-fundo-afundado);
    border: 1px solid var(--cor-borda);
    padding: 20px;
    margin-bottom: 20px;
    border-radius: 8px;
  }

  .tamagochi div {
    display: flex;
    gap: 20px;

  }


  .tamagochi button {
    padding: 16px 32px;
    background: var(--cor-primaria);
    color: var(--cor-texto);
    border-radius: 4px;
    font-size: 16px;
    border: none;
    cursor: pointer;
  }

  .tamagochi button:hover {
    background: var(--cor-secundaria);
  }

  .tamagochi button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--cor-disabled);
  }

  .tamagochi .brincar {
  background: var(--cor-secundaria);
  color: var(--cor-texto);

  }

  .tamagochi .brincar:hover {
  background: var(--cor-secundaria);
  }
  
  .tamagochi .brincar:disabled {
  background: var(--cor-secundaria);
  }

  .tamagochi .excluir {
  background: #e53935;
  color: #fff;
  }

  .tamagochi .excluir:hover {
  background: #c62828;
  }
  
  .tamagochi .excluir:disabled {
  background: #c62828;
  }

  /* no celular não cabe tudo numa linha: os dados ficam em cima e os botões
     embaixo, dividindo a largura. Fica no fim do bloco: com a mesma
     especificidade, a regra que vem depois ganha */
  @media (max-width: 600px) {
    .tamagochi {
      flex-direction: column;
      align-items: stretch;
    }

    .tamagochi div {
      gap: 8px;
    }

    .tamagochi button {
      flex: 1;
      padding: 12px 8px;
    }
  }

</style>
