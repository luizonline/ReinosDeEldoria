# Reinos de Eldoria — Protótipo visual 0.3

RPG medieval 2D top-down para navegador, com movimento por clique, interface de MMORPG e efeitos visuais demonstrativos.

## Publicação
- Repositório: `luizonline/ReinosDeEldoria`
- Cloudflare Pages: configure a branch `main`, sem comando de build e diretório de saída `client`.
- O cliente estático é publicado automaticamente a cada atualização na branch principal.

## Controles
- Clique no terreno para caminhar.
- Clique no Guardião para conversar.
- Clique no Slime Verde para visualizar um efeito mágico demonstrativo.
- Pressione H ou use o botão de ajuda para ver as instruções.

## Recursos nesta versão
- Interface de RPG com painéis de personagem, atributos, missão, chat e atalhos.
- Mapa top-down com estrada, rio, casas, árvores e detalhes de cenário.
- Spritesheets SVG originais do aventureiro e do Slime.
- Animação de caminhada do aventureiro e animação de idle do Slime.
- Efeito visual arcano com partículas.

## Limitações atuais
Ainda não há multiplayer conectado, persistência, contas, inventário funcional, combate com dano, progressão ou missões concluíveis. O servidor em `server/` permanece apenas como esqueleto inicial; não está operacional para jogadores.

## Próximos marcos
1. Sincronização multiplayer em servidor autoritativo.
2. Criação e persistência de personagens.
3. Combate real, atributos, vida, mana e IA básica de monstros.
4. Inventário, equipamentos, drops, missões e NPCs.
