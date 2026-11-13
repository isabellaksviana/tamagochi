import { onMounted, onUnmounted, ref } from 'vue'
import { comecarMusica, pararMusica } from '../som'

export type Etapa = 'inicio' | 'jogando' | 'fim'

// O "esqueleto" dos jogos que rodam dentro do visor: o laço de quadros (umas 60 vezes por segundo),
// a pausa (botão, tecla P/Esc e automática ao sair da aba), os controles (setas na tela,
// teclado e toque nos lados da telinha) e o aviso pra tela de que a partida começou ou acabou.
// Cada jogo só escreve o seu "passo": o que acontece em um quadro.
export function useJogoNoVisor(opcoes: {
  // um quadro do jogo; "segundos" é quanto tempo passou desde o anterior
  passo: (segundos: number) => void
  // avisa a tela (o visor fica em pé e o bicho de sempre sai de cena)
  avisarJogando: (ligado: boolean) => void
}) {
  const etapa = ref<Etapa>('inicio')
  const pausado = ref(false)
  // pra onde o bicho está indo: -1 esquerda, 0 parado, 1 direita (não precisa ser reativo).
  // direcaoY é pra quem anda pra cima e pra baixo também (a nave): -1 sobe, 1 desce
  const controle = { direcao: 0, direcaoY: 0 }
  let quadro = 0
  let ultimoQuadro = 0

  function laco(agora: number) {
    // no máximo 0,05 s por quadro: se o celular engasgar, o jogo não dá um "pulo" gigante
    const segundos = Math.min(0.05, (agora - ultimoQuadro) / 1000)
    ultimoQuadro = agora
    opcoes.passo(segundos)
    if (etapa.value === 'jogando' && !pausado.value) quadro = requestAnimationFrame(laco)
  }

  function comecar() {
    etapa.value = 'jogando'
    pausado.value = false
    controle.direcao = 0
    controle.direcaoY = 0
    opcoes.avisarJogando(true)
    comecarMusica()
    ultimoQuadro = performance.now()
    quadro = requestAnimationFrame(laco)
    // no celular, sobe a tela pra o visor em pé e os controles aparecerem inteiros
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function terminar() {
    cancelAnimationFrame(quadro)
    pararMusica()
    controle.direcao = 0
    controle.direcaoY = 0
    etapa.value = 'fim'
    opcoes.avisarJogando(false)
  }

  function pausar() {
    if (etapa.value !== 'jogando' || pausado.value) return
    pausado.value = true
    cancelAnimationFrame(quadro)
    pararMusica()
    controle.direcao = 0
    controle.direcaoY = 0
  }

  function continuar() {
    if (etapa.value !== 'jogando' || !pausado.value) return
    pausado.value = false
    ultimoQuadro = performance.now()
    comecarMusica()
    quadro = requestAnimationFrame(laco)
  }

  // sair no meio (pela pausa): a partida acaba sem prêmio e o jogo volta pro começo
  function sair() {
    cancelAnimationFrame(quadro)
    pararMusica()
    controle.direcao = 0
    controle.direcaoY = 0
    pausado.value = false
    etapa.value = 'inicio'
    opcoes.avisarJogando(false)
  }

  function alternarPausa() {
    if (pausado.value) continuar()
    else pausar()
  }

  // ============ controles ============
  function andar(direcao: number) {
    if (pausado.value) return
    controle.direcao = direcao
  }

  function andarVertical(direcao: number) {
    if (pausado.value) return
    controle.direcaoY = direcao
  }

  // tocar/clicar na metade esquerda ou direita da telinha
  function tocarNaTela(evento: PointerEvent) {
    if (pausado.value) return
    const caixa = (evento.currentTarget as HTMLElement).getBoundingClientRect()
    andar(evento.clientX < caixa.left + caixa.width / 2 ? -1 : 1)
  }

  function teclaApertada(evento: KeyboardEvent) {
    if (etapa.value !== 'jogando') return
    if (evento.key === 'p' || evento.key === 'P' || evento.key === 'Escape') {
      evento.preventDefault()
      return alternarPausa()
    }
    if (evento.key === 'ArrowLeft') andar(-1)
    if (evento.key === 'ArrowRight') andar(1)
    // setas de cima e de baixo: só fazem efeito em quem anda na vertical; não rolam a página no jogo
    if (evento.key === 'ArrowUp' || evento.key === 'ArrowDown') {
      evento.preventDefault()
      andarVertical(evento.key === 'ArrowUp' ? -1 : 1)
    }
  }

  function teclaSolta(evento: KeyboardEvent) {
    if (evento.key === 'ArrowLeft' && controle.direcao === -1) andar(0)
    if (evento.key === 'ArrowRight' && controle.direcao === 1) andar(0)
    if (evento.key === 'ArrowUp' && controle.direcaoY === -1) andarVertical(0)
    if (evento.key === 'ArrowDown' && controle.direcaoY === 1) andarVertical(0)
  }

  function quandoSumir() {
    if (document.hidden) pausar()
  }

  onMounted(() => {
    window.addEventListener('keydown', teclaApertada)
    window.addEventListener('keyup', teclaSolta)
    document.addEventListener('visibilitychange', quandoSumir)
  })
  onUnmounted(() => {
    cancelAnimationFrame(quadro)
    pararMusica()
    opcoes.avisarJogando(false)
    window.removeEventListener('keydown', teclaApertada)
    window.removeEventListener('keyup', teclaSolta)
    document.removeEventListener('visibilitychange', quandoSumir)
  })

  return { etapa, pausado, controle, comecar, terminar, sair, pausar, continuar, alternarPausa, andar, andarVertical, tocarNaTela }
}
