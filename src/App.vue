<script setup lang="ts">
import { ref, watch } from 'vue';
import Tamagochi from './components/Tamagochi.vue';
import Modal from './components/Modal.vue';

type Bicho = {
  id: number;
  nome: string;
  fome: number;
};

const aviso = ref('Ninguém comeu ainda.');
const novoNome = ref('');
const salvas = localStorage.getItem('bichos');
const bichos = ref<Bicho[]>(salvas ? JSON.parse(salvas) : []);
const idSalvo = localStorage.getItem('proximoId');
let proximoId = idSalvo ? Number(idSalvo) : 1;
const bichoSoltando = ref<Bicho | null>(null);

function quandoComer(bicho: Bicho) {
  bicho.fome--;
  aviso.value = bicho.nome + ' comeu!';
}

function quandoBrincar(bicho: Bicho) {
  bicho.fome++;
}

function quandoSoltou(bicho: Bicho) {
  bichoSoltando.value = bicho;
}

function adotar() {
  if (novoNome.value.trim() === '') {
    return;
  }
  bichos.value.unshift({ id: proximoId, nome: novoNome.value.trim(), fome: 5 });
  proximoId++;
  localStorage.setItem('proximoId', String(proximoId));
  novoNome.value = '';
}

function cancelar() {
  bichoSoltando.value = null;
}

function soltar() {
  const bicho = bichoSoltando.value;
  if (bicho === null) {
    return;
  }
  bichos.value = bichos.value.filter((b) => b.id !== bicho.id);
  bichoSoltando.value = null;
}

watch(
  bichos,
  (novaLista) => {
    localStorage.setItem('bichos', JSON.stringify(novaLista));
  },
  { deep: true },
);
</script>

<template>
  <h1>Tamagochi</h1>

  <p v-if="bichos.length >= 1">{{ aviso }}</p>

  <div class="adotar">
    <input
      v-model="novoNome"
      placeholder="Dê um nome para adotar"
      @keyup.enter="adotar"
    />
    <button @click="adotar" :disabled="novoNome.trim() === ''">Adotar</button>
  </div>
  <p>Você vai adotar... {{ novoNome }}</p>

  <p v-if="bichos.length === 0">☹️ Nenhum bichinho por aqui. Adote um!</p>

  <template v-else>
    <Tamagochi
      v-for="bicho in bichos"
      :key="bicho.id"
      :nome="bicho.nome"
      :fome="bicho.fome"
      @comeu="quandoComer(bicho)"
      @brincou="quandoBrincar(bicho)"
      @soltou="quandoSoltou(bicho)"
    />
  </template>

  <Modal v-if="bichoSoltando !== null">
    <p>Tem certeza que quer soltar {{ bichoSoltando.nome }}?</p>

    <div class="acoes">
      <button @click="cancelar">Cancelar</button>
      <button @click="soltar">Soltar</button>
    </div>
  </Modal>
</template>

<style scoped>
.acoes {
  display: flex;
  gap: 10px;
  justify-content: end;
}

.acoes button {
  padding: 8px 16px;
  font: inherit;
  color: var(--cor-texto);
  background: var(--cor-primaria);
  border: none;
  border-radius: var(--raio);
  cursor: pointer;
}

.acoes button:hover {
  background: var(--cor-secundaria);
}

.adotar {
  display: flex;
  gap: 10px;
}

.adotar button {
  padding: 8px 16px;
  background: var(--cor-primaria);
  color: var(--cor-texto);
  border-radius: 4px;
  font-size: 16px;
  border: none;
  cursor: pointer;
}

.adotar button:hover {
  background: var(--cor-secundaria);
}

.adotar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--cor-disabled);
}
</style>
