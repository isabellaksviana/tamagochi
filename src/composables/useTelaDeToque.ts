import { onMounted, onUnmounted, ref } from 'vue'

// O aparelho é de toque (celular, tablet)? Aí os jogos usam tela cheia e o dedo;
// no computador (mouse e teclado), o jogo fica na página e usa o teclado.
// "pointer: coarse" = o jeito principal de apontar é impreciso (um dedo), não um mouse.
export function useTelaDeToque() {
  const consulta = window.matchMedia('(pointer: coarse)')
  const toque = ref(consulta.matches)
  const mudou = (evento: MediaQueryListEvent) => (toque.value = evento.matches)

  onMounted(() => consulta.addEventListener('change', mudou))
  onUnmounted(() => consulta.removeEventListener('change', mudou))

  return toque
}
