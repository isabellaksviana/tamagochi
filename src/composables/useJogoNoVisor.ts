import { onMounted, onUnmounted, ref } from 'vue'
import { comecarMusica, pararMusica } from '../som'

export type Etapa = 'inicio' | 'jogando' | 'fim'

// O "esqueleto" dos jogos que rodam dentro do visor: o laço de quadros (umas 60 vezes por segundo),
// a pausa (botão, tecla P/Esc e automática ao sair da aba), o "sair" com confirmação e os controles:
// - no computador: o teclado (setas);
// - no celular: o dedo (o bicho/nave vai atrás de onde o dedo está na telinha).
// Cada jogo só escreve o seu "passo": o que acontece em um quadro.
export function useJogoNoVisor(opcoes: {
  // um quadro do jogo; "segundos" é quanto tempo passou desde o anterior
  passo: (segundos: number) => void
  // avisa a tela (o visor fica em pé, ou em tela cheia no celular)
  avisarJogando: (ligado: boolean) => void
}) {
  const etapa = ref<Etapa>('inicio')
  const pausado = ref(false)
  // o aviso de pausa já abre na pergunta "Sair mesmo?" (quando tocou no X)
  const confirmandoSaida = ref(false)
  // pra onde ir: as setas do teclado (-1, 0, 1 em cada eixo) e o dedo (em pixels da telinha; null = sem dedo)
  const controle = { direcao: 0, direcaoY: 0, dedo: null as { x: number; y: number } | null }
  let quadro = 0
  let ultimoQuadro = 0

  function laco(agora: number) {
    // no máximo 0,05 s por quadro: se o celular engasgar, o jogo não dá um "pulo" gigante
    const segundos = Math.min(0.05, (agora - ultimoQuadro) / 1000)
    ultimoQuadro = agora
    opcoes.passo(segundos)
    if (etapa.value === 'jogando' && !pausado.value) quadro = requestAnimationFrame(laco)
  }

  function soltarControles() {
    controle.direcao = 0
    controle.direcaoY = 0
    controle.dedo = null
  }

  function comecar() {
    etapa.value = 'jogando'
    pausado.value = false
    confirmandoSaida.value = false
    soltarControles()
    opcoes.avisarJogando(true)
    comecarMusica()
    ultimoQuadro = performance.now()
    quadro = requestAnimationFrame(laco)
  }

  function terminar() {
    cancelAnimationFrame(quadro)
    pararMusica()
    soltarControles()
    pausado.value = false
    etapa.value = 'fim'
    opcoes.avisarJogando(false)
  }

  // sair no meio (pela pausa, depois de confirmar): acaba sem prêmio e volta pro começo
  function sair() {
    cancelAnimationFrame(quadro)
    pararMusica()
    soltarControles()
    pausado.value = false
    confirmandoSaida.value = false
    etapa.value = 'inicio'
    opcoes.avisarJogando(false)
  }

  function pausar() {
    if (etapa.value !== 'jogando' || pausado.value) return
    pausado.value = true
    cancelAnimationFrame(quadro)
    pararMusica()
    soltarControles()
  }

  function continuar() {
    if (etapa.value !== 'jogando' || !pausado.value) return
    pausado.value = false
    confirmandoSaida.value = false
    ultimoQuadro = performance.now()
    comecarMusica()
    quadro = requestAnimationFrame(laco)
  }

  function alternarPausa() {
    if (pausado.value) continuar()
    else pausar()
  }

  // o X: pausa e já pergunta se quer sair mesmo
  function pedirSaida() {
    pausar()
    confirmandoSaida.value = true
  }

  // ============ o dedo (ou o mouse, segurando o botão) na telinha ============
  function posicaoDoDedo(evento: PointerEvent) {
    const caixa = (evento.currentTarget as HTMLElement).getBoundingClientRect()
    return { x: evento.clientX - caixa.left, y: evento.clientY - caixa.top }
  }

  function dedoDesceu(evento: PointerEvent) {
    if (pausado.value) return
    controle.dedo = posicaoDoDedo(evento)
    // "captura" o dedo: ele continua sendo seguido mesmo se escorregar pra fora da telinha
    try {
      ;(evento.currentTarget as HTMLElement).setPointerCapture(evento.pointerId)
    } catch {
      // o toque já tinha acabado: sem problema, só não captura
    }
  }

  function dedoMexeu(evento: PointerEvent) {
    if (controle.dedo && !pausado.value) controle.dedo = posicaoDoDedo(evento)
  }

  function dedoSubiu() {
    controle.dedo = null
  }

  // ============ o teclado ============
  function teclaApertada(evento: KeyboardEvent) {
    if (etapa.value !== 'jogando') return
    if (evento.key === 'p' || evento.key === 'P' || evento.key === 'Escape') {
      evento.preventDefault()
      return alternarPausa()
    }
    if (pausado.value) return
    const setas: Record<string, () => void> = {
      ArrowLeft: () => (controle.direcao = -1),
      ArrowRight: () => (controle.direcao = 1),
      ArrowUp: () => (controle.direcaoY = -1),
      ArrowDown: () => (controle.direcaoY = 1),
    }
    if (setas[evento.key]) {
      // no jogo, as setas não rolam a página
      evento.preventDefault()
      setas[evento.key]!()
    }
  }

  function teclaSolta(evento: KeyboardEvent) {
    if (evento.key === 'ArrowLeft' && controle.direcao === -1) controle.direcao = 0
    if (evento.key === 'ArrowRight' && controle.direcao === 1) controle.direcao = 0
    if (evento.key === 'ArrowUp' && controle.direcaoY === -1) controle.direcaoY = 0
    if (evento.key === 'ArrowDown' && controle.direcaoY === 1) controle.direcaoY = 0
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

  return {
    etapa,
    pausado,
    confirmandoSaida,
    controle,
    comecar,
    terminar,
    sair,
    pausar,
    continuar,
    alternarPausa,
    pedirSaida,
    dedoDesceu,
    dedoMexeu,
    dedoSubiu,
  }
}

// pra onde andar, de -1 a 1, até um alvo: perto do alvo vai devagarinho (e para), longe vai com tudo
export function rumoAo(alvo: number, atual: number, folga = 30) {
  const distancia = alvo - atual
  if (Math.abs(distancia) < 3) return 0
  return Math.sign(distancia) * Math.min(1, Math.abs(distancia) / folga)
}
