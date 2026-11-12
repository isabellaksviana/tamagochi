<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import Tamagochi from './components/Tamagochi.vue'
import Modal from './components/Modal.vue'
import CriarPet from './components/CriarPet.vue'
import ListaPets from './components/ListaPets.vue'
import type { CorGato, Especie } from './components/bicho/cores'
import { passarTempoAberto, passarTempoFechado } from './regras'
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
      status: {
        fome: 100 - bicho.fome * 20,
        higiene: 80,
        felicidade: 80,
        energia: 80,
      },
    }
  })
}

// nunca passa de 100 nem fica abaixo de 0
function limitar(valor: number) {
  return Math.min(100, Math.max(0, valor))
}

const bichos = ref<Bicho[]>(carregarBichos())

// quando o jogo abre, desconta o tempo que ele ficou fechado (devagar e com piso)
const ultimaVisita = Number(localStorage.getItem('ultimaVisita'))
if (ultimaVisita > 0) {
  const segundosFechado = (Date.now() - ultimaVisita) / 1000
  bichos.value.forEach((bicho) => passarTempoFechado(bicho.status, segundosFechado))
}
const idSalvo = localStorage.getItem('proximoId')
let proximoId = idSalvo ? Number(idSalvo) : 1
const bichoSoltando = ref<Bicho | null>(null)

// qual tela aparece: sem bicho nenhum, começa na de criar
type Tela = 'lista' | 'criar' | 'pet'
const tela = ref<Tela>(bichos.value.length === 0 ? 'criar' : 'lista')

// qual bicho está aberto na tela do pet (pelo id, não pela posição na lista)
const idAberto = ref<number | null>(null)
const bichoAtual = computed(() => bichos.value.find((bicho) => bicho.id === idAberto.value) ?? null)

function abrir(id: number) {
  idAberto.value = id
  tela.value = 'pet'
}

// voltar sempre leva pra lista; se não sobrou bicho, vai pra de criar
function irParaLista() {
  idAberto.value = null
  tela.value = bichos.value.length === 0 ? 'criar' : 'lista'
}

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

// a tela de criar manda o que a pessoa escolheu; aqui o bicho ganha id e status
function adotar(novo: { nome: string; especie: Especie; cor: CorGato }) {
  const id = proximoId
  bichos.value.unshift({
    id,
    nome: novo.nome,
    especie: novo.especie,
    cor: novo.cor,
    status: { fome: 80, higiene: 80, felicidade: 80, energia: 80 },
  })
  proximoId++
  localStorage.setItem('proximoId', String(proximoId))
  // quem acabou de adotar já cai na tela do bicho novo
  abrir(id)
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
  irParaLista()
}

let relogio = 0
onMounted(() => {
  relogio = setInterval(() => {
    // a cada segundo, todos os bichos sentem o tempo passar (não só o que está aberto)
    bichos.value.forEach((bicho) => passarTempoAberto(bicho.status, 1))
    // anota a hora: se a pessoa fechar o jogo agora, é daqui que conta o tempo fechado
    localStorage.setItem('ultimaVisita', String(Date.now()))
  }, 1000)
})
onUnmounted(() => {
  clearInterval(relogio)
})

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
      v-if="tela === 'pet' && bichoAtual !== null"
      :bicho="bichoAtual"
      :biscoitos="0"
      @comeu="quandoComer"
      @brincou="quandoBrincar"
      @soltou="quandoSoltou"
      @voltou="irParaLista"
    />

    <ListaPets v-else-if="tela === 'lista'" :bichos="bichos" @abriu="abrir" @adotar="tela = 'criar'" />

    <CriarPet v-else :pode-voltar="bichos.length > 0" @adotou="adotar" @voltou="irParaLista" />

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
.acoes {
  display: flex;
  gap: var(--space-3);
  justify-content: end;
}
</style>
