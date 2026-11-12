<script setup lang="ts">
import { computed, type Component } from 'vue'
import { PhBowlFood, PhCookie, PhDrop, PhHandWaving, PhHeart, PhLightning, PhStorefront, PhYarn } from '@phosphor-icons/vue'
import DesenhoBicho from './DesenhoBicho.vue'
import type { Expressao } from './bicho/cores'
import type { Bicho, Status } from '../tipos'

const props = defineProps<{
  bicho: Bicho
  biscoitos: number
}>()

const emit = defineEmits<{
  comeu: []
  brincou: []
  soltou: []
}>()

// as 4 barras, na ordem em que aparecem
const BARRAS: { chave: keyof Status; rotulo: string; icone: Component; cor: string }[] = [
  { chave: 'fome', rotulo: 'Fome', icone: PhBowlFood, cor: '#f6a96b' },
  { chave: 'higiene', rotulo: 'Higiene', icone: PhDrop, cor: '#7cc6f0' },
  { chave: 'felicidade', rotulo: 'Felicidade', icone: PhHeart, cor: '#ff8fb0' },
  { chave: 'energia', rotulo: 'Energia', icone: PhLightning, cor: '#f6d365' },
]

// abaixo disso, a barra fica vermelha e a cara do bicho muda
const LIMITE_BAIXO = 30

// a cara que cada status faz quando está baixo
const CARA_QUANDO_BAIXO: Record<keyof Status, Expressao> = {
  fome: 'bravo',
  higiene: 'neutro',
  felicidade: 'triste',
  energia: 'dormindo',
}

// a carinha segue o pior status; se nenhum estiver baixo, ele fica feliz
const expressao = computed<Expressao>(() => {
  const status = props.bicho.status
  const chaves = BARRAS.map((barra) => barra.chave)
  const pior = chaves.reduce((a, b) => (status[a] <= status[b] ? a : b))
  if (status[pior] < LIMITE_BAIXO) {
    return CARA_QUANDO_BAIXO[pior]
  }
  return 'feliz'
})

// o bichinho não mexe nos status: só avisa o que aconteceu
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
  <section class="tela">
    <header class="topo">
      <!-- a loja ainda não existe: fica desligada até a parte dos biscoitos -->
      <button class="pilula" type="button" disabled title="Em breve">
        <PhStorefront weight="duotone" :size="22" class="icone-loja" />
        Loja
      </button>
      <span class="pilula" :aria-label="`${biscoitos} biscoitos`">
        <PhCookie weight="duotone" :size="22" class="icone-biscoito" />
        {{ biscoitos }}
      </span>
    </header>

    <h1 class="nome">{{ bicho.nome }}</h1>

    <div class="palco">
      <DesenhoBicho class="desenho" :especie="bicho.especie" :cor="bicho.cor" :expressao="expressao" />
    </div>

    <ul class="barras">
      <li
        v-for="barra in BARRAS"
        :key="barra.chave"
        :class="{ baixa: bicho.status[barra.chave] < LIMITE_BAIXO }"
        :style="{ '--cor': barra.cor }"
      >
        <span class="rotulo">
          <component :is="barra.icone" weight="duotone" :size="20" />
          {{ barra.rotulo }}
        </span>
        <div
          class="trilho"
          role="meter"
          :aria-label="barra.rotulo"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="bicho.status[barra.chave]"
        >
          <div class="preenchido" :style="{ width: `${bicho.status[barra.chave]}%` }" />
        </div>
      </li>
    </ul>

    <div class="acoes">
      <button class="acao" type="button" @click="alimentar" :disabled="bicho.status.fome === 100">
        <span class="circulo"><PhBowlFood weight="duotone" :size="30" /></span>
        Alimentar
      </button>
      <button class="acao" type="button" @click="brincar" :disabled="bicho.status.energia === 0">
        <span class="circulo"><PhYarn weight="duotone" :size="30" /></span>
        Brincar
      </button>
      <button class="acao soltar" type="button" @click="excluir">
        <span class="circulo"><PhHandWaving weight="duotone" :size="30" /></span>
        Soltar
      </button>
    </div>
  </section>
</template>

<style scoped>
.tela {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.topo {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pilula {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font: inherit;
  font-weight: 700;
  color: var(--cor-texto-tela);
  background: var(--cor-fundo-afundado);
  border: 1px solid var(--cor-borda);
  border-radius: 999px;
}

button.pilula:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.icone-loja {
  color: var(--cor-primaria);
}

.icone-biscoito {
  color: #d9a15b;
}

.nome {
  margin: 0;
  text-align: center;
  font-size: 1.5rem;
}

/* o círculo de luz atrás do bicho */
.palco {
  display: grid;
  place-items: center;
  width: min(300px, 80vw);
  aspect-ratio: 1;
  margin: 0 auto;
  background: radial-gradient(closest-side, var(--cor-brilho) 0 92%, transparent 93%);
}

.desenho {
  width: min(240px, 70vw);
}

.barras {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.barras li {
  display: grid;
  grid-template-columns: 120px 1fr;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.rotulo {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* o ícone usa a cor da barra (o Phosphor pinta com a cor do texto) */
.rotulo svg {
  color: var(--cor);
}

.trilho {
  height: 12px;
  overflow: hidden;
  background: var(--cor-trilho);
  border-radius: 999px;
}

.preenchido {
  height: 100%;
  background: var(--cor);
  border-radius: inherit;
  transition: width 0.3s;
}

/* status baixo: barra e ícone ficam vermelhos (o !important vence a cor que vem no style) */
.baixa {
  --cor: #e5484d !important;
}

.acoes {
  display: flex;
  justify-content: space-around;
}

.acao {
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 4px;
  font: inherit;
  font-weight: 600;
  color: var(--cor-texto-suave);
  background: none;
  border: none;
  border-radius: 12px;
  cursor: pointer;
}

.circulo {
  display: grid;
  place-items: center;
  width: 62px;
  height: 62px;
  color: var(--cor-texto);
  background: var(--cor-primaria);
  border-radius: 50%;
}

.acao:hover:not(:disabled) .circulo {
  background: var(--cor-secundaria);
}

.acao:focus-visible {
  outline: 2px solid var(--cor-primaria);
  outline-offset: 2px;
}

.acao:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.soltar .circulo {
  color: var(--cor-texto-suave);
  background: transparent;
  border: 1px solid var(--cor-borda);
}

.acao.soltar:hover .circulo {
  background: var(--cor-fundo-afundado);
}
</style>
