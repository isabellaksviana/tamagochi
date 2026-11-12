// os ícones do jogo em pixel art, no mesmo traço do gato (contorno marrom de 1 pixel).
// Cada letra é um quadradinho; "." é vazio. T = a cor do texto (pros ícones de interface,
// como seta e X, que precisam aparecer nos dois temas).
export const CORES_DO_ICONE: Record<string, string> = {
  K: '#5B3A36', // contorno
  h: '#FFFFFF', // brilho
  A: '#F6A96B', // laranja (tigela, sachê)
  R: '#B9784F', // ração
  B: '#7CC6F0', // azul (gota, peixe)
  P: '#FF8FB0', // rosa (coração, bolinha, almofada)
  Y: '#F6D365', // amarelo (raio, lua, sol, lâmpada)
  C: '#E8B878', // biscoito
  d: '#8A5A3A', // gotas de chocolate
  L: '#C9B6F2', // lilás (mochila, novelo, caixinha, caminha)
  l: '#A58FE0', // lilás escuro
  a: '#EBD9B0', // areia
  W: '#FFF8F0', // branquinho
  g: '#A99AA6', // cinza
  O: '#C49F7B', // madeira
}

export const ICONES = {
  // ---------- status ----------
  tigela: ['...KKKKK...', '..KRRRRRK..', '.KRRRRRRRK.', 'KKKKKKKKKKK', 'KAhAAAAAAAK', '.KAAAAAAAK.', '..KAAAAAK..', '...KKKKK...'],
  gota: ['....K....', '...KBK...', '..KBBBK..', '.KBBBBBK.', '.KhBBBBK.', 'KBhBBBBBK', 'KBBBBBBBK', '.KBBBBBK.', '..KKKKK..'],
  coracao: ['.KK...KK.', 'KhPK.KPPK', 'KPPPKPPPK', 'KPPPPPPPK', '.KPPPPPK.', '..KPPPK..', '...KPK...', '....K....'],
  raio: ['...KKKK', '..KYYK.', '.KYYK..', 'KYYYKKK', 'KKKYYYK', '..KYYK.', '.KYYK..', '.KKK...'],

  // ---------- ações ----------
  caixinha: ['...........', '.KKKKKKKKK.', '.KaaaaaaaK.', 'KKKKKKKKKKK', 'KLLLLLLLLLK', 'KLhLLLLLLLK', '.KLLLLLLLK.', '.KKKKKKKKK.'],
  novelo: ['..KKKKK..', '.KLLlLLK.', 'KLLLlLLLK', 'KlLLLlLLK', 'KLlLLLlLK', 'KLLlLLLlK', '.KLLlLLK.', '..KKKKK.K', '.......KK'],
  lampada: ['..KKK..', '.KYYYK.', 'KYhYYYK', 'KYYYYYK', 'KYYYYYK', '.KYYYK.', '..KYK..', '.KKKKK.', '.KgggK.', '..KKK..'],

  // ---------- topo ----------
  biscoito: ['..KKKKK..', '.KCCCCCK.', 'KCdCCCCCK', 'KCCCCdCCK', 'KCCdCCCCK', 'KCCCCCdCK', '.KCdCCCK.', '..KKKKK..'],
  mochila: ['..KKKKK..', '.KLLLLLK.', 'KLhLLLLLK', 'KLLLLLLLK', 'KKKKKKKKK', 'KLLLKLLLK', 'KLLLLLLLK', 'KLKKKKKLK', 'KLKlllKLK', '.KKKKKKK.'],
  sol: ['....Y....', '.Y.....Y.', '...KKK...', '..KhYYK..', 'Y.KYYYK.Y', '..KYYYK..', '...KKK...', '.Y.....Y.', '....Y....'],
  lua: ['...KKK...', '..KYYK...', '.KYYK....', 'KYYK.....', 'KYYK.....', 'KYYYK..KK', '.KYYYKKYK', '..KYYYYK.', '...KKKK..'],
  porta: ['KKKKKKK', 'KOOOOOK', 'KOKKKOK', 'KOOOOOK', 'KOOOOYK', 'KOOOOOK', 'KOKKKOK', 'KOOOOOK', 'KKKKKKK'],

  // ---------- interface (na cor do texto) ----------
  seta: ['...T...', '..TT...', '.TTTTTT', 'TTTTTTT', '.TTTTTT', '..TT...', '...T...'],
  fechar: ['TT...TT', 'TTT.TTT', '.TTTTT.', '..TTT..', '.TTTTT.', 'TTT.TTT', 'TT...TT'],
  mais: ['..TTT..', '..TTT..', 'TTTTTTT', 'TTTTTTT', 'TTTTTTT', '..TTT..', '..TTT..'],
  certo: ['......TT', '.....TTT', 'TT..TTT.', 'TTTTTT..', '.TTTT...', '..TT....'],

  // ---------- itens da loja ----------
  sache: ['.K.K.K.K.', 'KAAAAAAAK', 'KAhAAAAAK', 'KAAAAAAAK', 'KAWWWWWAK', 'KAWBBBWAK', 'KAWWWWWAK', 'KAAAAAAAK', 'KAAAAAAAK', '.KKKKKKK.'],
  peixe: ['...KKKK....', '.KKBBBBK.KK', 'KBhBBBBBKBK', 'KBKBBBBBBBK', 'KBBBBBBBKBK', '.KKBBBBK.KK', '...KKKK....'],
  bolinha: ['..KKKKK..', '.KPPPPPK.', 'KPhPPPPPK', 'KPPPPPPPK', 'KWWWWWWWK', 'KPPPPPPPK', 'KPPPPPPPK', '.KPPPPPK.', '..KKKKK..'],
  areia: ['..KKKKK..', '..KaaaK..', '.KKKKKKK.', 'KLLLLLLLK', 'KLhLLLLLK', 'KLWWWWWLK', 'KLWaaaWLK', 'KLWWWWWLK', 'KLLLLLLLK', '.KKKKKKK.'],
  caminha: ['............', '.KKKKKKKKKK.', 'KLLLLLLLLLLK', 'KLKPPPPPPKLK', 'KLKPPPPPPKLK', 'KLLKKKKKKLLK', '.KKKKKKKKKK.'],
} satisfies Record<string, string[]>

export type NomeIcone = keyof typeof ICONES
