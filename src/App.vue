<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import Tamagochi from './components/Tamagochi.vue'
import Janela from './components/Janela.vue'
import DesenhoBicho from './components/DesenhoBicho.vue'
import CriarPet from './components/CriarPet.vue'
import ListaPets from './components/ListaPets.vue'
import type { CorGato, Especie } from './components/bicho/cores'
import LojaModal from './components/LojaModal.vue'
import MochilaModal from './components/MochilaModal.vue'
import { MINIMO, passarTempoAberto, passarTempoFechado } from './regras'
import type { ItemLoja } from './loja'
import type { Bicho, Status } from './tipos'

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

// nunca passa de 100 nem fica abaixo do mínimo (nenhuma barra chega a zero)
function limitar(valor: number) {
  return Math.min(100, Math.max(MINIMO, valor))
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

// os biscoitos são de quem joga, não de um bicho só
const biscoitos = ref(Number(localStorage.getItem('biscoitos') ?? 0))
watch(biscoitos, (quantos) => localStorage.setItem('biscoitos', String(quantos)))

// abaixo disso, a barra "estava precisando": cuidar dela rende biscoito
const PRECISANDO = 90

// sobe uma barra do bicho aberto; se ela estava precisando, ganha 1 biscoito
function cuidar(chave: keyof Status, quanto: number) {
  const bicho = bichoAtual.value
  if (bicho === null) {
    return
  }
  if (bicho.status[chave] < PRECISANDO) {
    biscoitos.value++
  }
  bicho.status[chave] = limitar(bicho.status[chave] + quanto)
}

function quandoAlimentar() {
  cuidar('fome', 25)
}

function quandoLimparCaixinha() {
  cuidar('higiene', 35)
}

function quandoApagarLuz() {
  cuidar('energia', 35)
}

// brincar alegra, mas cansa e dá um pouco de fome
function quandoBrincar() {
  cuidar('felicidade', 20)
  const bicho = bichoAtual.value
  if (bicho === null) {
    return
  }
  bicho.status.energia = limitar(bicho.status.energia - 10)
  bicho.status.fome = limitar(bicho.status.fome - 5)
}

// ============ loja e mochila ============
const lojaAberta = ref(false)
const mochilaAberta = ref(false)

// a mochila é de quem joga (como os biscoitos): quantos de cada item, { sache: 2, bolinha: 1 }
const mochilaSalva = localStorage.getItem('mochila')
const mochila = ref<Record<string, number>>(mochilaSalva ? JSON.parse(mochilaSalva) : {})
watch(mochila, (agora) => localStorage.setItem('mochila', JSON.stringify(agora)), { deep: true })

// comprar: paga e guarda na mochila (depois a pessoa escolhe pra quem dar)
function comprar(item: ItemLoja) {
  if (biscoitos.value < item.preco) {
    return
  }
  biscoitos.value -= item.preco
  mochila.value[item.id] = (mochila.value[item.id] ?? 0) + 1
}

// dar: tira um da mochila e o bicho aberto ganha o efeito
function dar(item: ItemLoja) {
  const bicho = bichoAtual.value
  const quantos = mochila.value[item.id] ?? 0
  if (bicho === null || quantos === 0) {
    return
  }
  mochila.value[item.id] = quantos - 1
  for (const [chave, quanto] of Object.entries(item.efeito) as [keyof Status, number][]) {
    bicho.status[chave] = limitar(bicho.status[chave] + quanto)
  }
}

// total de itens na mochila (o numerozinho no botão)
const itensNaMochila = computed(() => Object.values(mochila.value).reduce((soma, quantos) => soma + quantos, 0))

// da mochila vazia, um atalho pra loja
function daMochilaPraLoja() {
  mochilaAberta.value = false
  lojaAberta.value = true
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
      :biscoitos="biscoitos"
      @alimentou="quandoAlimentar"
      @limpou-caixinha="quandoLimparCaixinha"
      @brincou="quandoBrincar"
      @apagou-luz="quandoApagarLuz"
      @soltou="quandoSoltou"
      @voltou="irParaLista"
      @abriu-loja="lojaAberta = true"
      :itens-na-mochila="itensNaMochila"
      @abriu-mochila="mochilaAberta = true"
    />

    <ListaPets v-else-if="tela === 'lista'" :bichos="bichos" @abriu="abrir" @adotar="tela = 'criar'" />

    <CriarPet v-else :pode-voltar="bichos.length > 0" @adotou="adotar" @voltou="irParaLista" />

    <!-- fica fora da corrente v-if / v-else-if / v-else das telas: ela abre POR CIMA da tela do pet -->
    <LojaModal
      v-if="lojaAberta && bichoAtual !== null"
      :biscoitos="biscoitos"
      :bicho="bichoAtual"
      @comprou="comprar"
      @fechou="lojaAberta = false"
    />

    <MochilaModal
      v-if="mochilaAberta && bichoAtual !== null"
      :mochila="mochila"
      :bicho="bichoAtual"
      @deu="dar"
      @ir-para-loja="daMochilaPraLoja"
      @fechou="mochilaAberta = false"
    />

    <!-- a mesma Janela da loja e da mochila, na versão pequena -->
    <Janela v-if="bichoSoltando !== null" :titulo="`Soltar ${bichoSoltando.nome}?`" pequena @fechou="cancelar">
      <template #icone>
        <DesenhoBicho :especie="bichoSoltando.especie" :cor="bichoSoltando.cor" expressao="triste" so-cabeca />
      </template>

      <p class="aviso-soltar">Essa ação não pode ser desfeita.</p>

      <div class="acoes">
        <button class="button" type="button" @click="cancelar">Cancelar</button>
        <button class="button button-danger" type="button" @click="soltar">Soltar</button>
      </div>
    </Janela>
  </main>
</template>

<style scoped>
.aviso-soltar {
  margin: 0 0 var(--space-5);
  color: var(--text-muted);
}

.acoes {
  display: flex;
  gap: var(--space-3);
  justify-content: end;
}
</style>
