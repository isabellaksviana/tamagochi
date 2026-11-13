// os "bips" do jogo, como num portátil antigo: ondas quadradas geradas pelo navegador
// (Web Audio API), sem nenhum arquivo de som.

export type Som =
  | 'cuidar'
  | 'comer'
  | 'comprar'
  | 'dar'
  | 'carinho'
  | 'ovo'
  | 'chocou'
  | 'apagarLuz'
  | 'acenderLuz'
  | 'acertou'
  | 'errou'
  | 'fimDoJogo'
  | 'clique'
  | 'rodada'
  | 'pegou'
  | 'pulo'
  | 'explosao'
  | 'alerta'

// cada som é uma sequência de notas: [frequência em Hz, duração em segundos]
const MUSICAS: Record<Som, [number, number][]> = {
  clique: [[880, 0.04]],
  cuidar: [[660, 0.07], [880, 0.09]],
  comer: [[523, 0.06], [659, 0.06], [784, 0.1]],
  comprar: [[988, 0.07], [1319, 0.14]], // a "moedinha"
  dar: [[784, 0.07], [988, 0.07], [1175, 0.12]],
  carinho: [[1047, 0.05], [1319, 0.08]],
  ovo: [[440, 0.05]],
  chocou: [[523, 0.08], [659, 0.08], [784, 0.08], [1047, 0.2]],
  apagarLuz: [[784, 0.1], [523, 0.1], [392, 0.18]],
  acenderLuz: [[392, 0.08], [523, 0.08], [784, 0.12]],
  acertou: [[880, 0.07], [1175, 0.12]],
  errou: [[330, 0.1], [262, 0.18]],
  fimDoJogo: [[523, 0.1], [659, 0.1], [784, 0.1], [659, 0.1], [1047, 0.25]],
  rodada: [[659, 0.05], [659, 0.05]],
  pegou: [[1319, 0.04], [1568, 0.06]],
  pulo: [[523, 0.03], [784, 0.04]],
  explosao: [[196, 0.04], [147, 0.07]],
  // o chefão chegou!
  alerta: [[440, 0.1], [330, 0.1], [440, 0.1], [330, 0.15]],
}

// a musiquinha de fundo do minijogo (em loop); 0 = pausa
const MUSICA_DO_JOGO: [number, number][] = [
  [523, 0.15], [659, 0.15], [784, 0.15], [659, 0.15],
  [587, 0.15], [698, 0.15], [880, 0.15], [698, 0.15],
  [523, 0.15], [659, 0.15], [784, 0.15], [1047, 0.15],
  [988, 0.15], [784, 0.15], [587, 0.3], [0, 0.15],
]

// ligado/desligado fica salvo; começa ligado
let ligado = localStorage.getItem('som') !== 'desligado'
let contexto: AudioContext | null = null

export function somLigado() {
  return ligado
}

export function ligarSom(liga: boolean) {
  ligado = liga
  localStorage.setItem('som', liga ? 'ligado' : 'desligado')
  // desligou no meio do minijogo: a música para na hora
  if (!liga) pararMusica()
}

// toca uma sequência de notas a partir de agora; devolve quanto tempo ela dura
function tocarNotas(notas: [number, number][], volumeMaximo: number, guardar?: OscillatorNode[]) {
  contexto ??= new AudioContext()
  let inicio = contexto.currentTime
  for (const [frequencia, duracao] of notas) {
    if (frequencia > 0) {
      const oscilador = contexto.createOscillator()
      const volume = contexto.createGain()
      oscilador.type = 'square'
      oscilador.frequency.value = frequencia
      // some no fim de cada nota (sem "estalo")
      volume.gain.setValueAtTime(volumeMaximo, inicio)
      volume.gain.exponentialRampToValueAtTime(0.001, inicio + duracao)
      oscilador.connect(volume).connect(contexto.destination)
      oscilador.start(inicio)
      oscilador.stop(inicio + duracao)
      guardar?.push(oscilador)
    }
    inicio += duracao
  }
  return notas.reduce((total, [, duracao]) => total + duracao, 0)
}

export function tocar(som: Som) {
  if (!ligado) return
  try {
    // o navegador só deixa tocar depois de um clique; o contexto nasce no primeiro som
    tocarNotas(MUSICAS[som], 0.06)
  } catch {
    // sem áudio no navegador: o jogo segue mudo
  }
}

// ============ música de fundo do minijogo ============
let relogioDaMusica = 0
let musicaTocando = false
// as notas já agendadas da volta atual (pra calar na hora quando a música para)
let notasDaMusica: OscillatorNode[] = []

function voltaDaMusica() {
  if (!musicaTocando || !ligado) return
  try {
    // mais baixinha que os bips, pra eles aparecerem por cima
    notasDaMusica = []
    const duracao = tocarNotas(MUSICA_DO_JOGO, 0.025, notasDaMusica)
    relogioDaMusica = setTimeout(voltaDaMusica, duracao * 1000)
  } catch {
    musicaTocando = false
  }
}

export function comecarMusica() {
  if (musicaTocando) return
  musicaTocando = true
  voltaDaMusica()
}

export function pararMusica() {
  musicaTocando = false
  clearTimeout(relogioDaMusica)
  for (const nota of notasDaMusica) {
    try {
      nota.stop()
    } catch {
      // essa nota já tinha terminado
    }
  }
  notasDaMusica = []
}
