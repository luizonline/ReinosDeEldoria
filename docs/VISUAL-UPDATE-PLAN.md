# Grande Atualização Visual — Reinos de Eldoria

**Direção aprovada:** realistic / top-down / complete  
**Branch de trabalho:** `update/realistic-topdown-complete`  
**Base preservada:** `main`

## Objetivo
Evoluir o protótipo para um MMORPG 2D de fantasia medieval com apresentação visual mais realista, mantendo câmera superior, leitura clara do combate e compatibilidade com as mecânicas atuais.

## Princípios de implementação
- Não substituir nem reescrever sistemas funcionais sem necessidade.
- Preservar movimento por clique, combate, classes, atributos, inventário, missões, drops e progressão existentes.
- Separar renderização, animações, efeitos e interface para facilitar manutenção.
- Carregar recursos com fallback: a ausência de um sprite não pode impedir o jogo de iniciar.
- Otimizar cenários estáticos em camadas pré-renderizadas e manter animações apenas nos elementos dinâmicos.
- Respeitar `prefers-reduced-motion` e oferecer desempenho aceitável em computadores modestos.
- Não alterar o projeto MultiAfiliados.

## Fases

### Fase 0 — Auditoria e segurança
- Mapear ciclo de jogo, entradas, colisões, câmera, HUD e carregamento de assets.
- Registrar os comportamentos que não podem regredir.
- Trabalhar somente nesta branch até validação.

### Fase 1 — Fundação visual
- Definir paleta, escala, profundidade, sombras e iluminação.
- Organizar o renderizador em camadas: terreno, objetos, atores, efeitos e interface.
- Melhorar terreno, caminhos, água, vegetação, construções e pontos de interesse.

### Fase 2 — Personagens e animações
- Preparar spritesheets consistentes por classe e direção.
- Implementar estados idle, walk, run, attack, cast, hit e death quando houver arte correspondente.
- Adicionar interpolação, antecipação/recuperação de ataques e efeitos de equipamento.
- Preservar fallback visual para recursos ausentes.

### Fase 3 — Criaturas e combate
- Criar identidade visual por tipo de criatura.
- Animar deslocamento, ataque, dano, morte e respawn.
- Melhorar barras de vida, indicadores de alvo, projéteis, impacto e habilidades.

### Fase 4 — Interface completa
- Refinar HUD, barras, retrato/classe, inventário, equipamento, atributos, missões, chat e minimapa.
- Padronizar tipografia, ícones, estados de foco, hover, seleção e feedback.
- Manter a interface responsiva.

### Fase 5 — Polimento e validação
- Verificar carregamento de todos os recursos.
- Testar movimento, colisões, combate, classes, drops, inventário, missões, progressão e salvamento.
- Medir desempenho e corrigir vazamentos/loops de animação.
- Comparar a experiência com a branch principal antes de qualquer publicação.

## Critérios de aceite
- O jogo inicia sem erros mesmo se um recurso visual falhar.
- Movimento por clique e câmera top-down permanecem funcionais.
- Todas as classes continuam selecionáveis e jogáveis.
- Monstros, combate, drops, inventário e missões mantêm seu comportamento.
- Interface legível em desktop e telas menores.
- Nenhuma alteração no MultiAfiliados.
- A branch principal só recebe a atualização após aprovação explícita.

## Estado inicial da auditoria
- Cliente atual: Canvas 2D em `client/src/game.js`.
- Interface: `client/index.html` e `client/style.css`.
- Recursos atuais: SVGs em `client/assets/classes` e `client/assets/sprites`.
- A implementação atual mistura renderização, lógica de jogo e interface; a separação será incremental para reduzir risco.
- Os sprites de classe existentes são grandes SVGs; é necessário validar suas dimensões e organização de quadros antes de tratá-los como spritesheets finais.


## Prévia Cloudflare Pages
- Projeto conectado ao repositório `luizonline/ReinosDeEldoria`.
- Branch de produção: `main`.
- Pré-visualizações automáticas: todas as branches não principais.
- A branch `update/realistic-topdown-complete` deve publicar uma URL própria de preview; validar o status e a URL em Workers & Pages → projeto → Deployments.
- Não mesclar o PR nem alterar `main` antes da aprovação visual.
