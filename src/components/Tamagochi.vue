<script setup lang="ts">
import { computed, type Component } from 'vue'
import { PhBowlFood, PhCookie, PhDrop, PhHandWaving, PhHeart, PhLightning, PhStorefront, PhYarn } from '@phosphor-icons/vue'
import DesenhoBicho from './DesenhoBicho.vue'
import BotaoTema from './BotaoTema.vue'
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
      <button class="button" type="button" disabled title="Em breve">
        <PhStorefront weight="duotone" aria-hidden="true" />
        Loja
      </button>
      <div class="direita">
        <span class="contador" :aria-label="`${biscoitos} biscoitos`">
          <PhCookie weight="duotone" aria-hidden="true" class="icone-biscoito" />
          {{ biscoitos }}
        </span>
        <BotaoTema />
      </div>
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
        <span class="circulo"><PhBowlFood weight="duotone" :size="30" aria-hidden="true" /></span>
        Alimentar
      </button>
      <button class="acao" type="button" @click="brincar" :disabled="bicho.status.energia === 0">
        <span class="circulo"><PhYarn weight="duotone" :size="30" aria-hidden="true" /></span>
        Brincar
      </button>
      <button class="acao soltar" type="button" @click="excluir">
        <span class="circulo"><PhHandWaving weight="duotone" :size="30" aria-hidden="true" /></span>
        Soltar
      </button>
    </div>
  </section>
</template>

<style scoped>
.tela {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 26.25rem;
  margin: 0 auto;
}

.topo {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.direita {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* não é botão, só mostra quantos biscoitos tem: mesma altura, borda e canto do botão */
.contador {
  display: inline-flex;
  align-items: center;
  gap: 0.4375rem;
  min-height: 2.6875rem;
  padding: 0 var(--space-3);
  font-weight: 600;
  font-size: var(--font-size-sm);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.contador svg {
  width: 1rem;
  height: 1rem;
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
  background: radial-gradient(closest-side, var(--primary-soft) 0 92%, transparent 93%);
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
  background: var(--surface-strong);
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
  --cor: var(--danger-text) !important;
}

.acoes {
  display: flex;
  justify-content: space-around;
}

/* botões redondos do jogo, com a legenda embaixo (não são o Button do DS, de propósito) */
.acao {
  display: grid;
  justify-items: center;
  gap: var(--space-2);
  padding: var(--space-1);
  font: inherit;
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  background: none;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
}

.circulo {
  display: grid;
  place-items: center;
  width: 3.875rem;
  height: 3.875rem;
  color: var(--on-primary);
  background: var(--primary);
  border-radius: 50%;
}

.acao:hover:not(:disabled) .circulo {
  filter: brightness(1.08);
}

.acao:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.acao:disabled {
  cursor: not-allowed;
  opacity: 45%;
}

.soltar .circulo {
  color: var(--text-muted);
  background: transparent;
  border: 1px solid var(--border);
}

.acao.soltar:hover .circulo {
  background: var(--surface);
}
</style>
