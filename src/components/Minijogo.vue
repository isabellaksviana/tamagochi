<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import IconePixel from './IconePixel.vue'
import { comecarMusica, pararMusica, tocar } from '../som'
import type { Expressao } from './bicho/cores'

// "Pra que lado?", o clássico do tamagochi: você chuta um lado, o gato olha pra um lado.
// Acertou, ganha 1 biscoito. São 5 rodadas.
const props = defineProps<{
  nome: string
  energia: number
}>()

const emit = defineEmits<{
  // a cara que o visor mostra (olhando pra um lado), ou null pra voltar ao normal
  olhou: [expressao: Expressao | null]
  terminou: [acertos: number]
}>()

const RODADAS = 5
type Etapa = 'inicio' | 'escolher' | 'revelar' | 'fim'
const etapa = ref<Etapa>('inicio')
const rodada = ref(1)
const acertos = ref(0)
const acertou = ref(false)
let relogio = 0

function comecar() {
  etapa.value = 'escolher'
  rodada.value = 1
  acertos.value = 0
  emit('olhou', 'neutro')
  // a musiquinha de fundo toca enquanto o jogo durar
  comecarMusica()
}

function chutar(lado: 'esquerda' | 'direita') {
  const sorteado = Math.random() < 0.5 ? 'esquerda' : 'direita'
  acertou.value = lado === sorteado
  if (acertou.value) acertos.value++
  tocar(acertou.value ? 'acertou' : 'errou')
  emit('olhou', sorteado === 'esquerda' ? 'olhandoEsquerda' : 'olhandoDireita')
  etapa.value = 'revelar'

  clearTimeout(relogio)
  relogio = setTimeout(() => {
    if (rodada.value === RODADAS) {
      pararMusica()
      etapa.value = 'fim'
      emit('olhou', acertos.value >= 3 ? 'feliz' : 'triste')
      emit('terminou', acertos.value)
      relogio = setTimeout(() => emit('olhou', null), 2500)
      return
    }
    rodada.value++
    etapa.value = 'escolher'
    tocar('rodada')
    emit('olhou', 'neutro')
  }, 1300)
}

// saiu da aba no meio do jogo: o visor volta ao normal
onUnmounted(() => {
  clearTimeout(relogio)
  pararMusica()
  emit('olhou', null)
})
</script>

<template>
  <section class="jogo" aria-live="polite">
    <h2>Pra que lado?</h2>

    <template v-if="etapa === 'inicio'">
      <p>Adivinhe pra que lado {{ props.nome }} vai olhar. São {{ RODADAS }} rodadas, e cada acerto vale 1 biscoito.</p>
      <p v-if="props.energia < 20" class="aviso">Cansado demais pra brincar. Apague a luz um pouquinho.</p>
      <button class="button button-primary grande" type="button" :disabled="props.energia < 20" @click="comecar">
        <IconePixel nome="controle" />
        Jogar
      </button>
    </template>

    <template v-else-if="etapa === 'escolher' || etapa === 'revelar'">
      <p class="placar">
        Rodada <span class="numero">{{ rodada }}/{{ RODADAS }}</span> · Acertos <span class="numero">{{ acertos }}</span>
      </p>
      <p v-if="etapa === 'revelar'" class="resultado" :class="{ certo: acertou }">{{ acertou ? 'Acertou!' : 'Errou!' }}</p>
      <p v-else class="resultado">Pra que lado?</p>
      <div class="lados">
        <button class="button lado" type="button" :disabled="etapa === 'revelar'" aria-label="Esquerda" @click="chutar('esquerda')">
          <IconePixel nome="seta" :escala="4" />
        </button>
        <button class="button lado" type="button" :disabled="etapa === 'revelar'" aria-label="Direita" @click="chutar('direita')">
          <IconePixel nome="setaDireita" :escala="4" />
        </button>
      </div>
    </template>

    <template v-else>
      <p class="resultado certo">
        <span class="numero">{{ acertos }} de {{ RODADAS }}</span>!
        {{ acertos >= 3 ? `${props.nome} adorou brincar.` : 'Fica pra próxima.' }}
      </p>
      <p class="ganho">
        <IconePixel nome="biscoito" />
        <span class="numero">+{{ acertos }}</span> biscoitos
      </p>
      <button class="button button-primary grande" type="button" :disabled="props.energia < 20" @click="comecar">Jogar de novo</button>
    </template>
  </section>
</template>

<style scoped>
.jogo {
  display: grid;
  justify-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  text-align: center;
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 16px;
}

h2 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--primary);
}

p {
  margin: 0;
  color: var(--text-muted);
}

.aviso {
  color: var(--danger-text);
  font-weight: 600;
}

.placar {
  font-weight: 600;
}

.resultado {
  min-height: 1.5em;
  font-family: var(--font-pixel);
  font-size: 1.2rem;
  color: var(--text);
}

.resultado.certo {
  color: var(--primary);
}

.lados {
  display: flex;
  gap: var(--space-4);
}

.lado {
  width: 5.5rem;
  height: 4rem;
  user-select: none;
  -webkit-user-select: none;
}

.grande {
  min-width: 10rem;
}

.ganho {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: 600;
  color: var(--text);
}
</style>
