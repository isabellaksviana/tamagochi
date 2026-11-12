import { onUnmounted, ref } from 'vue'

// "deu certo!" da loja (comprou) e da mochila (deu pro bicho).
// O botão vira "Comprado!"/"Dado!" por um instante; o AVISO fica na janela
// até a próxima compra (ou até fechar), pra dar tempo de ler o que mudou.
export function useConfirmacao(duracao = 2000) {
  // qual item acabou de ser confirmado (o botão dele muda de cara)
  const idConfirmado = ref<string | null>(null)
  // o texto do aviso; não some sozinho
  const mensagem = ref('')
  let relogio = 0

  function confirmar(id: string, texto: string) {
    idConfirmado.value = id
    mensagem.value = texto
    // se confirmar de novo antes de o botão voltar, o prazo recomeça
    clearTimeout(relogio)
    relogio = setTimeout(() => {
      idConfirmado.value = null
    }, duracao)
  }

  // o componente saiu da tela: desliga o relógio (o mesmo cuidado do relógio do jogo)
  onUnmounted(() => {
    clearTimeout(relogio)
  })

  return { idConfirmado, mensagem, confirmar }
}
