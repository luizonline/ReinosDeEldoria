# Spritesheets das classes — Reinos de Eldoria

O cliente já possui carregador de spritesheets por classe em `client/src/game.js`.

## Arquivos esperados

Coloque estes seis arquivos PNG com fundo transparente nesta pasta:

- `assassin.png`
- `mage.png`
- `priest.png`
- `longbowman.png`
- `cavalry.png`
- `soldier.png`

## Grade obrigatória

Cada arquivo deve ter 384 × 1024 px, com quadros de 64 × 64 px:

- 6 colunas (quadros 0–5).
- 16 linhas (4 ações × 4 direções).
- Linhas 0–3: idle — baixo, esquerda, direita, cima.
- Linhas 4–7: walk — baixo, esquerda, direita, cima.
- Linhas 8–11: run — baixo, esquerda, direita, cima.
- Linhas 12–15: attack — baixo, esquerda, direita, cima.

Use fundo transparente, personagem centralizado em todos os quadros, mesma escala e ponto de apoio dos pés. Não inclua nomes, legendas, bordas ou fundos. Preserve arma e silhueta da classe em todas as animações.

## Direção de arte

Pixel art medieval de RPG 2D top-down, detalhada e legível em tamanho pequeno, contorno consistente, paleta coesa e proporções iguais entre classes. Cada classe deve ter equipamento próprio: assassino com capuz e adagas; mago com manto e cajado; clérigo com vestes claras e símbolo de cura; arqueiro com arco e aljava; cavalaria com armadura e lança; soldado com espada e escudo.

Enquanto os PNGs finais não estiverem presentes, o jogo usa o personagem desenhado pelo fallback atual. Assim, arquivos ausentes não deixam a tela vazia.
