<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Tamagochi from './components/Tamagochi.vue'
import Modal from './components/Modal.vue'
import BotaoTema from './components/BotaoTema.vue'
import type { Bicho } from './tipos'

// a versão antiga salvava só isto (e a fome ia de 0 a 5, com 0 = satisfeito)
type BichoAntigo = {
  id: number
  nome: string
  fome: number
}

function carregarBichos(): Bicho[] {
  const salvos = localStorage.getItem('bichos')
  if (!salvos) {
    return []
  }
  const lista: (Bicho | BichoAntigo)[] = JSON.parse(salvos)
  // quem já está no formato novo passa direto; quem é antigo é completado
  return lista.map((bicho) => {
    if ('status' in bicho) {
      return bicho
    }
    return {
      id: bicho.id,
      nome: bicho.nome,
      especie: 'gato',
      cor: 'laranja',
      status: { fome: 100 - bicho.fome * 20, higiene: 80, felicidade: 80, energia: 80 },
    }
  })
}

// nunca passa de 100 nem fica abaixo de 0
function limitar(valor: number) {
  return Math.min(100, Math.max(0, valor))
}

const novoNome = ref('')
const bichos = ref<Bicho[]>(carregarBichos())
const idSalvo = localStorage.getItem('proximoId')
let proximoId = idSalvo ? Number(idSalvo) : 1
const bichoSoltando = ref<Bicho | null>(null)

// a tela mostra um bicho só; por enquanto é o primeiro (trocar entre eles vem depois)
const bichoAtual = computed(() => bichos.value[0] ?? null)

function quandoComer() {
  const bicho = bichoAtual.value
  if (bicho === null) {
    return
  }
  bicho.status.fome = limitar(bicho.status.fome + 25)
}

function quandoBrincar() {
  const bicho = bichoAtual.value
  if (bicho === null) {
    return
  }
  bicho.status.felicidade = limitar(bicho.status.felicidade + 20)
  bicho.status.energia = limitar(bicho.status.energia - 10)
  bicho.status.fome = limitar(bicho.status.fome - 5)
}

function quandoSoltou() {
  bichoSoltando.value = bichoAtual.value
}

function adotar() {
  if (novoNome.value.trim() === '') {
    return
  }
  bichos.value.unshift({
    id: proximoId,
    nome: novoNome.value.trim(),
    especie: 'gato',
    cor: 'laranja',
    status: { fome: 80, higiene: 80, felicidade: 80, energia: 80 },
  })
  proximoId++
  localStorage.setItem('proximoId', String(proximoId))
  novoNome.value = ''
}

function cancelar() {
  bichoSoltando.value = null
}

function soltar() {
  const bicho = bichoSoltando.value
  if (bicho === null) {
    return
  }
  bichos.value = bichos.value.filter((b) => b.id !== bicho.id)
  bichoSoltando.value = null
}

watch(
  bichos,
  (novaLista) => {
    localStorage.setItem('bichos', JSON.stringify(novaLista))
  },
  { deep: true },
)
</script>

<template>
  <main class="jogo">
    <Tamagochi
      v-if="bichoAtual !== null"
      :bicho="bichoAtual"
      :biscoitos="0"
      @comeu="quandoComer"
      @brincou="quandoBrincar"
      @soltou="quandoSoltou"
    />

    <section v-else class="sem-bicho">
      <header class="cabecalho">
        <h1>Tamagochi</h1>
        <BotaoTema />
      </header>
      <p>☹️ Nenhum bichinho por aqui. Adote um!</p>
      <div class="adotar">
        <input v-model="novoNome" placeholder="Dê um nome para adotar" @keyup.enter="adotar" />
        <button class="button button-primary" @click="adotar" :disabled="novoNome.trim() === ''">Adotar</button>
      </div>
    </section>

    <Modal v-if="bichoSoltando !== null">
      <p>Tem certeza que quer soltar {{ bichoSoltando.nome }}?</p>

      <div class="acoes">
        <button class="button" @click="cancelar">Cancelar</button>
        <button class="button button-danger" @click="soltar">Soltar</button>
      </div>
    </Modal>
  </main>
</template>

<style scoped>
.jogo {
  max-width: 420px;
  margin: 0 auto;
}

.sem-bicho {
  display: grid;
  gap: var(--space-3);
}

.cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.acoes {
  display: flex;
  gap: var(--space-3);
  justify-content: end;
}

.adotar {
  display: flex;
  gap: var(--space-3);
}

/* o campo estica e ocupa o espaço que sobra do botão */
.adotar input {
  flex: 1;
  min-width: 0;
}
</style>
