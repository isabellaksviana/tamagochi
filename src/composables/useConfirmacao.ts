import { onUnmounted, ref } from 'vue'

// "deu certo!" que aparece por um instante e some sozinho.
// Usado na loja (comprou) e na mochila (deu pro bicho).
export function useConfirmacao(duracao = 2000) {
  // qual item acabou de ser confirmado (o botão dele muda de cara)
  const idConfirmado = ref<string | null>(null)
  // o texto da faixa verde
  const mensagem = ref('')
  let relogio = 0

  function confirmar(id: string, texto: string) {
    idConfirmado.value = id
    mensagem.value = texto
    // se confirmar de novo antes de sumir, o prazo recomeça
    clearTimeout(relogio)
    relogio = setTimeout(() => {
      idConfirmado.value = null
      mensagem.value = ''
    }, duracao)
  }

  // o componente saiu da tela: desliga o relógio (o mesmo cuidado do relógio do jogo)
  onUnmounted(() => {
    clearTimeout(relogio)
  })

  return { idConfirmado, mensagem, confirmar }
}
