# Tamagochi

Um bichinho virtual com cara de portátil retrô: pixel art, telinha de LCD e bipes. Você adota um ovo, ele choca, cresce e precisa de cuidado.

**No ar:** https://tamagochi.isabellaviana.com

## O que tem

- **5 bichos em pixel art:** gato, cachorro, coelho, capivara e tartaruga, cada um com 5 cores e várias caras (feliz, triste, bravo, dormindo, doente...).
- **Ciclo de vida:** ovo → filhote → jovem → adulto. O tamanho no visor muda com a fase.
- **Status que caem com o tempo:** fome, higiene, felicidade e energia, em horas, inclusive com o jogo fechado.
- **Cuidados de dono:** alimentar, brincar, apagar a luz e a higiene de cada espécie (caixinha, banho, piscininha da capivara, água da tartaruga).
- **Dia e noite** pela hora real, com a luz apagada como estado: o bicho dorme e acorda sozinho quando descansa.
- **Doença:** barra no vermelho por tempo demais deixa o bicho doente; a cura é o remédio da loja.
- **Dois minijogos** dentro do visor: *Pra que lado?* e *Chuva de petiscos* (por vidas, com recorde e pausa).
- **Lojinha e mochila:** moedas, categorias e o efeito de cada item à vista antes de comprar.
- **Diário** com fase, idade e contadores, e um **modo demonstração** que acelera o tempo.
- Tema claro e escuro, sons em onda quadrada (com botão de mudo) e layout pensado para celular.

## Como foi feito

- **Vue 3 + TypeScript + Vite**, com pnpm.
- **Pixel art em código:** cada bicho é uma grade de 45 × 49 montada com formas simples (elipses, triângulos) e contorno de 1 pixel; o rosto é desenhado pixel por pixel e compartilhado entre as espécies. Tudo vira `<rect>` em SVG com `shape-rendering: crispEdges`, sem imagem nenhuma.
- **Sons** gerados na hora com a Web Audio API.
- **Salvamento** no `localStorage`, com migração dos saves das versões anteriores.

## Rodar

```bash
pnpm install
pnpm dev
```
