<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import Tamagochi from './components/Tamagochi.vue'
import Janela from './components/Janela.vue'
import DesenhoBicho from './components/DesenhoBicho.vue'
import IconePixel from './components/IconePixel.vue'
import CriarPet from './components/CriarPet.vue'
import ListaPets from './components/ListaPets.vue'
import type { CorGato, Especie } from './components/bicho/cores'
import LojaModal from './components/LojaModal.vue'
import MochilaModal from './components/MochilaModal.vue'
import {
  dormirUmPouco,
  ehNoite,
  MINIMO,
  OVO_CHOCA_EM,
  passarTempoAberto,
  passarTempoFechado,
  TOQUES_PRA_CHOCAR,
  type Periodo,
} from './regras'
import type { ItemLoja } from './loja'
import { tocar } from './som'
import { CONTADORES_ZERADOS, type Bicho, type Status } from './tipos'

// a versão antiga salvava só isto (e a fome ia de 0 a 5, com 0 = satisfeito)
type BichoAntigo = {
  id: number
  nome: string
  fome: number
}

const TRES_DIAS = 3 * 24 * 3600

// completa o que faltar em bichos salvos por versões antigas do jogo
function completar(bicho: Partial<Bicho> & Pick<Bicho, 'id' | 'nome' | 'status'>): Bicho {
  return {
    especie: 'gato',
    cor: 'laranja',
    // quem já existia antes do ovo é adulto
    chocou: true,
    ovoDesde: 0,
    toquesNoOvo: 0,
    idade: TRES_DIAS,
    adotadoEm: Date.now(),
    luzApagada: false,
    doente: false,
    segundosNoVermelho: 0,
    ...bicho,
    contadores: { ...CONTADORES_ZERADOS, ...bicho.contadores },
  }
}

function carregarBichos(): Bicho[] {
  const salvos = localStorage.getItem('bichos')
  if (!salvos) {
    return []
  }
  const lista: (Bicho | BichoAntigo)[] = JSON.parse(salvos)
  return lista.map((bicho) => {
    if ('status' in bicho) {
      return completar(bicho)
    }
    // o formato bem antigo (só nome e fome de 0 a 5)
    return completar({
      id: bicho.id,
      nome: bicho.nome,
      status: { fome: 100 - bicho.fome * 20, higiene: 80, felicidade: 80, energia: 80 },
    })
  })
}

// nunca passa de 100 nem fica abaixo do mínimo (nenhuma barra chega a zero)
function limitar(valor: number) {
  return Math.min(100, Math.max(MINIMO, valor))
}

const bichos = ref<Bicho[]>(carregarBichos())

// quando o jogo abre, desconta o tempo que ele ficou fechado (com piso) e soma na idade
const ultimaVisita = Number(localStorage.getItem('ultimaVisita'))
if (ultimaVisita > 0) {
  const segundosFechado = (Date.now() - ultimaVisita) / 1000
  bichos.value.forEach((bicho) => {
    if (!bicho.chocou) return
    if (bicho.luzApagada) dormirUmPouco(bicho.status, segundosFechado)
    else passarTempoFechado(bicho.status, segundosFechado)
    bicho.idade += segundosFechado
  })
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

// ============ modo demonstração e dia/noite ============
// demo: um dia de idade passa em 1 minuto e as barras caem 20× mais rápido (pra apresentar)
const demo = ref(localStorage.getItem('demo') === 'sim')
watch(demo, (ligado) => localStorage.setItem('demo', ligado ? 'sim' : 'nao'))
const ritmoDasBarras = computed(() => (demo.value ? 20 : 1))
const ritmoDaIdade = computed(() => (demo.value ? 1440 : 1))

const periodo = ref<Periodo>((localStorage.getItem('periodo') as Periodo | null) ?? 'auto')
watch(periodo, (agora) => localStorage.setItem('periodo', agora))
const agora = ref(new Date())
const noite = computed(() => ehNoite(agora.value, periodo.value))

// ============ moedas ============
// as moedas são de quem joga, não de um bicho só.
// Ficam salvas com o nome 'biscoitos' (a moeda era o biscoito no começo): assim ninguém perde as suas
const moedas = ref(Number(localStorage.getItem('biscoitos') ?? 0))
watch(moedas, (quantas) => localStorage.setItem('biscoitos', String(quantas)))

// abaixo disso, a barra "estava precisando de verdade": só aí cuidar rende moeda
// (moeda custa a ganhar, pra loja e os pets raros terem valor)
const PRECISANDO = 50

// bônus do dia: a primeira visita de cada dia ganha algumas moedas
const BONUS_DO_DIA = 5
const hoje = new Date().toLocaleDateString('pt-BR')
const ganhouBonus = ref(false)
if (localStorage.getItem('ultimoBonus') !== hoje) {
  moedas.value += BONUS_DO_DIA
  localStorage.setItem('ultimoBonus', hoje)
  ganhouBonus.value = true
  setTimeout(() => (ganhouBonus.value = false), 6000)
}

// ============ cuidados ============
// sobe uma barra do bicho aberto; se ela estava precisando, ganha 1 moeda
function cuidar(chave: keyof Status, quanto: number) {
  const bicho = bichoAtual.value
  if (bicho === null) {
    return
  }
  if (bicho.status[chave] < PRECISANDO) {
    moedas.value++
  }
  bicho.status[chave] = limitar(bicho.status[chave] + quanto)
}

function quandoAlimentar() {
  cuidar('fome', 25)
  tocar('comer')
  if (bichoAtual.value) bichoAtual.value.contadores.alimentou++
}

function quandoLimparCaixinha() {
  cuidar('higiene', 35)
  tocar('cuidar')
  if (bichoAtual.value) bichoAtual.value.contadores.caixinhas++
}

// apagar a luz: ele dorme até acender (a energia sobe aos poucos no relógio do jogo)
function quandoApagarLuz() {
  const bicho = bichoAtual.value
  if (bicho === null) return
  bicho.luzApagada = true
  tocar('apagarLuz')
  if (noite.value) bicho.contadores.noites++
}

function quandoAcenderLuz() {
  if (bichoAtual.value) bichoAtual.value.luzApagada = false
  tocar('acenderLuz')
}

// brincar alegra, mas cansa e dá um pouco de fome
function quandoBrincar() {
  cuidar('felicidade', 20)
  tocar('cuidar')
  const bicho = bichoAtual.value
  if (bicho === null) {
    return
  }
  bicho.status.energia = limitar(bicho.status.energia - 10)
  bicho.status.fome = limitar(bicho.status.fome - 5)
  bicho.contadores.brincou++
}

// carinho: um pouquinho de felicidade, no máximo 1 vez a cada 5 segundos (pra não virar fábrica)
let ultimoCarinho = 0
function quandoCarinho() {
  tocar('carinho')
  const bicho = bichoAtual.value
  if (bicho === null || Date.now() - ultimoCarinho < 5000) return
  ultimoCarinho = Date.now()
  bicho.status.felicidade = limitar(bicho.status.felicidade + 2)
  bicho.contadores.carinhos++
}

// jogos: o que eles renderam em moedas; alegra e cansa
function quandoJogou(ganhas: number) {
  const bicho = bichoAtual.value
  if (bicho === null) return
  moedas.value += ganhas
  tocar('fimDoJogo')
  bicho.status.felicidade = limitar(bicho.status.felicidade + 15)
  bicho.status.energia = limitar(bicho.status.energia - 10)
  bicho.contadores.biscoitosNoJogo += ganhas
  bicho.contadores.brincou++
}

// ============ o ovo ============
function chocar(bicho: Bicho) {
  bicho.chocou = true
  bicho.idade = 0
  tocar('chocou')
}

function quandoTocarNoOvo() {
  const bicho = bichoAtual.value
  if (bicho === null || bicho.chocou) return
  bicho.toquesNoOvo++
  tocar('ovo')
  if (bicho.toquesNoOvo >= TOQUES_PRA_CHOCAR) chocar(bicho)
}

// ============ doença ============
// uma barra abaixo disso por tempo demais deixa o bicho doente
const VERMELHO_DOENTE = 15
const TEMPO_PRA_ADOECER = 30 * 60

// ============ loja e mochila ============
const lojaAberta = ref(false)
const mochilaAberta = ref(false)

// a mochila é de quem joga (como as moedas): quantos de cada item, { sache: 2, bolinha: 1 }
const mochilaSalva = localStorage.getItem('mochila')
const mochila = ref<Record<string, number>>(mochilaSalva ? JSON.parse(mochilaSalva) : {})
// o sabonete saiu da loja (gato não toma banho): quem tinha ganha a mesma quantidade de areia
if (mochila.value.sabonete) {
  mochila.value.areia = (mochila.value.areia ?? 0) + mochila.value.sabonete
  delete mochila.value.sabonete
}
watch(mochila, (agora) => localStorage.setItem('mochila', JSON.stringify(agora)), { deep: true })

// comprar: paga e guarda na mochila (depois a pessoa escolhe pra quem dar)
function comprar(item: ItemLoja) {
  if (moedas.value < item.preco) {
    return
  }
  moedas.value -= item.preco
  tocar('comprar')
  mochila.value[item.id] = (mochila.value[item.id] ?? 0) + 1
}

// dar: tira um da mochila e o bicho aberto ganha o efeito (o remédio cura)
function dar(item: ItemLoja) {
  const bicho = bichoAtual.value
  const quantos = mochila.value[item.id] ?? 0
  if (bicho === null || quantos === 0) {
    return
  }
  mochila.value[item.id] = quantos - 1
  tocar('dar')
  for (const [chave, quanto] of Object.entries(item.efeito) as [keyof Status, number][]) {
    bicho.status[chave] = limitar(bicho.status[chave] + quanto)
  }
  if (item.cura) {
    bicho.doente = false
    bicho.segundosNoVermelho = 0
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

// a tela de criar manda o que a pessoa escolheu; aqui o bicho nasce... como ovo
function adotar(novo: { nome: string; especie: Especie; cor: CorGato }) {
  const id = proximoId
  bichos.value.unshift(
    completar({
      id,
      nome: novo.nome,
      especie: novo.especie,
      cor: novo.cor,
      status: { fome: 80, higiene: 80, felicidade: 80, energia: 80 },
      chocou: false,
      ovoDesde: Date.now(),
      idade: 0,
      adotadoEm: Date.now(),
    }),
  )
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

// ============ o relógio do jogo (1 batida por segundo) ============
function batida() {
  agora.value = new Date()
  for (const bicho of bichos.value) {
    // o ovo choca sozinho depois de um tempinho
    if (!bicho.chocou) {
      if (Date.now() - bicho.ovoDesde >= OVO_CHOCA_EM) chocar(bicho)
      continue
    }
    bicho.idade += ritmoDaIdade.value

    if (bicho.luzApagada) {
      // dormindo: a energia sobe e as outras barras não caem
      dormirUmPouco(bicho.status, ritmoDasBarras.value)
      // energia cheia: a luz acende e ele acorda sozinho (de dia ou de noite)
      if (bicho.status.energia >= 100) {
        bicho.luzApagada = false
        if (bicho.id === idAberto.value) tocar('acenderLuz')
      }
    } else {
      passarTempoAberto(bicho.status, ritmoDasBarras.value)
    }

    // doente: a felicidade cai em dobro
    if (bicho.doente) {
      bicho.status.felicidade = limitar(bicho.status.felicidade - (100 / (5 * 3600)) * ritmoDasBarras.value)
    }

    // tempo no vermelho: se passar do limite, adoece
    const noVermelho = Object.values(bicho.status).some((valor) => valor < VERMELHO_DOENTE)
    bicho.segundosNoVermelho = noVermelho ? bicho.segundosNoVermelho + ritmoDasBarras.value : 0
    if (bicho.segundosNoVermelho >= TEMPO_PRA_ADOECER) bicho.doente = true
  }
  // anota a hora: se a pessoa fechar o jogo agora, é daqui que conta o tempo fechado
  localStorage.setItem('ultimaVisita', String(Date.now()))
}

let relogio = 0
onMounted(() => {
  relogio = setInterval(batida, 1000)
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
    <!-- o bônus do dia aparece uns segundos, em cima, sem tapar os botões -->
    <p v-if="ganhouBonus" class="bonus" role="status">
      <IconePixel nome="moeda" />
      Bônus do dia: <span class="numero">+{{ BONUS_DO_DIA }}</span> moedas!
    </p>

    <Tamagochi
      v-if="tela === 'pet' && bichoAtual !== null"
      :bicho="bichoAtual"
      :moedas="moedas"
      :itens-na-mochila="itensNaMochila"
      :noite="noite"
      :doente="bichoAtual.doente"
      :demo="demo"
      :periodo="periodo"
      @alimentou="quandoAlimentar"
      @limpou-caixinha="quandoLimparCaixinha"
      @brincou="quandoBrincar"
      @apagou-luz="quandoApagarLuz"
      @acendeu-luz="quandoAcenderLuz"
      @soltou="quandoSoltou"
      @voltou="irParaLista"
      @abriu-loja="lojaAberta = true"
      @abriu-mochila="mochilaAberta = true"
      @tocou-ovo="quandoTocarNoOvo"
      @carinho="quandoCarinho"
      @jogou="quandoJogou"
      @trocou-demo="demo = $event"
      @trocou-periodo="periodo = $event"
    />

    <ListaPets v-else-if="tela === 'lista'" :bichos="bichos" @abriu="abrir" @adotar="tela = 'criar'" />

    <CriarPet v-else :pode-voltar="bichos.length > 0" @adotou="adotar" @voltou="irParaLista" />

    <!-- fica fora da corrente v-if / v-else-if / v-else das telas: ela abre POR CIMA da tela do pet -->
    <LojaModal
      v-if="lojaAberta && bichoAtual !== null"
      :moedas="moedas"
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
.bonus {
  position: fixed;
  left: 50%;
  top: var(--space-4);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  padding: var(--space-2) var(--space-4);
  font-weight: 600;
  white-space: nowrap;
  color: var(--text);
  background: var(--surface);
  border: 2px solid var(--primary);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.25);
  transform: translateX(-50%);
}

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
