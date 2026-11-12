# Reinos de Eldoria — Protótipo 0.1

RPG medieval 2D top-down para navegador. O cliente inicial pode ser publicado em hospedagem estática.

## Executar / publicar
- A página inicial está em `client/index.html`.
- Para Cloudflare Pages, configure o repositório GitHub `luizonline/ReinosDeEldoria`, branch `main`, diretório de saída `client`.
- Não é necessário comando de build para este protótipo.

## Controles
Clique no terreno para caminhar. Clique no Guardião ou no Slime para interagir.

## Estado atual
Esta versão é um protótipo jogável local no navegador. Ainda não há multiplayer conectado, persistência, contas, inventário real ou combate. O esqueleto do servidor em `server/` é independente e não deve ser confundido com um servidor multiplayer operacional.

## Próximos marcos
1. Servidor Colyseus autoritativo e sincronização de jogadores.
2. Criação e persistência de personagens.
3. Combate, monstros, drops, itens e missões.
