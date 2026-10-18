# Auditoria visual — Ofra e combate

Data: 18 de outubro de 2026. Referência anterior preservada no commit `8477b22`; as capturas antigas em `docs/screenshots/` incluem renderização por software. Elas não representam o desempenho de um celular físico.

## Referências realmente consultadas

Foram inspecionadas no navegador as capturas oficiais de [exploração junto à água](https://assets.topics.apps-jp.nintendo.com/image/2023/02/08074655491174/1280/18.jpg), [combate e Quebra](https://assets.topics.apps-jp.nintendo.com/image/2023/02/08065628962445/1280/07.jpg), [arquitetura interior](https://www.jp.square-enix.com/octopathtraveler2/assets/img/about/img03.jpg) e [acampamento noturno](https://www.jp.square-enix.com/octopathtraveler2/assets/img/about/img13.jpg). Suas páginas de origem são [Nintendo](https://www.nintendo.com/jp/topics/article/a35f3cfd-ee44-48ba-a80c-da8c4d3eeab4) e [Square Enix](https://www.jp.square-enix.com/octopathtraveler2/about/). As imagens comerciais servem à análise e não integram os recursos do jogo.

A leitura visual destaca áreas de descanso entre grupos de detalhes, materiais que continuam legíveis sem brilho, personagens nítidos na faixa de interação e planos distantes com atmosfera. Na cena noturna, pequenos focos quentes orientam o olhar; a vegetação preserva silhuetas de ramos e folhas. A arquitetura interior foi usada para observar proporções, massas secundárias e iluminação, sem transferir sua linguagem cultural para o Levante antigo.

## Diagnóstico da versão anterior

| Componente | Causa observada | Critério para a reconstrução |
| --- | --- | --- |
| `World.ts`, terreno | A praça e quase toda a vila cabem no enquadramento. O círculo de grandes rochas domina o primeiro plano. | Aproximar a escala de leitura; criar percursos enquadrados por afloramentos descontínuos, sem revelar uma borda circular. |
| `World.ts`, arquitetura | Caixas repetidas, telhados perfeitamente planos e faixas de pedra regulares. Paredes sem espessura visual e poucos volumes secundários. | Casas assimétricas com vigas, peitoris, acessos, reboco gasto, pedra exposta e conjuntos domésticos compostos. |
| `World.ts`, vegetação | Troncos retos e copas arredondadas. Grama espalhada uniformemente; trigo em retângulos rígidos. | Oliveiras com troncos e ramos visíveis; folhas recortadas, bordas agrícolas e vegetação agrupada por contexto. |
| `art.ts` | Ruído de pontos e linhas serve como acabamento de quase todos os materiais. Alterar a cor não muda sua natureza visual. | Materiais originais pintados, compartilhados e aplicados em escala coerente; procedimentos ficam como suporte, não acabamento único. |
| `sprites.ts`, `peopleSprites.ts`, `enemySprites.ts` | Grandes ilustrações recortadas mantêm a identidade, mas não equivalem a sprites desenhados numa grade pequena. Movimento reutiliza poucas poses. | Produzir quadros de pixel art com proporções consistentes e ações distintas, registrar os limites da produção e manter pés/baselines estáveis. |
| Câmera e renderização | Projeção ortográfica distante; alterar apenas o deslocamento da câmera não aproxima a imagem. DPR 0,4 reduz detalhes antes de ampliar a tela inteira. | Recalibrar campo visível e escala em conjunto; preservar resolução suficiente para materiais e sprites em todos os presets. |
| Pós-processamento | Desfoque e vinheta podem esconder as mesmas áreas que o jogador precisa ler. O caminho leve desativa todos os efeitos. | Faixa de foco útil, contraste regional moderado, brilho concentrado nas luzes e versão econômica que conserve profundidade. |
| `styles.css` | Painel permanente de objetivo, mapa e retratos grandes competem com Ofra. | Objetivo recolhível, mapa discreto, recursos compactos e dicas retiradas depois do aprendizado. |
| `BattleStage.ts`, `battle.css` | Na captura mobile inicial, os três inimigos e seus alvos se sobrepõem; o painel de ação cobre os escudos. | Espaçamento de formação verificável por toque e controles abaixo da faixa ocupada pelos personagens. |

## Comparação controlada

O baseline foi preservado em uma cópia separada do código anterior. As comparações usam partidas válidas, sem diálogo nem menu, nas posições `(0, 6)` e `(-5, 1)`, com viewports de 1440 × 900 e 844 × 390. A posição do personagem, região, estágio e condições de iluminação são mantidos; a mudança de câmera faz parte da intervenção e será registrada. Metadados de renderização acompanham as capturas.

Este documento registra critérios e evidências. A presença de sombras, bloom, texturas ou testes aprovados não certifica qualidade artística. A conclusão depende da inspeção das capturas finais e dos fluxos jogáveis preservados.
