# Bible — Gideão: referências e critérios de adaptação

A campanha acompanha Juízes 6–8 em quatro atos. O roteiro utiliza **paráfrases autorais em português contemporâneo**, conferidas na **Almeida Revista e Corrigida, edição de 2009 (ARC)**. As falas não pretendem reproduzir literalmente a tradução. A edição consultada pertence à Sociedade Bíblica do Brasil; seu texto integral não foi incorporado ao jogo.

As referências podem ser abertas no menu do jogo. O arquivo `src/content/campaign.ts` relaciona cada objetivo à passagem e registra sua adaptação. O mesmo arquivo mantém os acontecimentos e os diálogos separados dos sistemas, permitindo outras campanhas.

## Acontecimentos preservados

| Ato | Passagem | Acontecimento |
| --- | --- | --- |
| I — O homem no lagar | [Juízes 6:1–24](https://www.biblegateway.com/passage/?search=Ju%C3%ADzes%206&version=ARC) | Opressão, clamor, palavra do profeta, Gideão no lagar, chamado, oferta consumida e altar da paz. |
| II — A noite dos altares | [Juízes 6:25–32](https://www.bible.com/pt/bible/compare/JDG.6.25-32) | Dez servos, altar de Baal derrubado, poste cortado, novo altar e oferta; reação dos moradores e intervenção de Joás. |
| II — O orvalho e a lã | [Juízes 6:33–40](https://www.bible.com/pt/bible/212/JDG.6.33-40.ARC) | Convocação das tribos e os dois sinais, narrados sem prova de habilidade para o jogador. |
| III — Os trezentos | [Juízes 7:1–8](https://www.bible.com/pt/bible/212/JDG.7.1-7.ARC) | 32.000 reunidos; 22.000 retornam; 10.000 permanecem; finalmente 300. |
| III — O reconhecimento | [Juízes 7:9–15](https://www.bible.com/pt/bible/212/JDG.7.8-15.ARC) | Gideão e Purá, sonho do pão de cevada, interpretação e adoração. |
| IV — A noite das tochas | [Juízes 7:16–25](https://www.biblegateway.com/passage/?search=Ju%C3%ADzes%207&version=ARC) | Três companhias, trombetas, cântaros, tochas, posição ao redor do acampamento, confusão causada pelo Senhor e participação das tribos. |
| Epílogo | [Juízes 8](https://www.biblegateway.com/passage/?search=Ju%C3%ADzes%208&version=ARC) | Perseguição, conflitos, recusa da realeza, desvio associado ao éfode e idolatria posterior. |

## Reconstrução artística

Ofra e os outros espaços são interpretações visuais compactas. Distâncias, aparência dos edifícios, vestimentas, relevo, rotinas, comércio, animais, ferramentas e movimentação de multidões não pretendem reconstruir um sítio arqueológico comprovado. Figuras visíveis representam contingentes maiores; a ausência de milhares de modelos não altera os números do relato.

A moradora do celeiro, o mercador, o armeiro, os defensores locais, as patrulhas e o capitão da unidade final são **personagens ficcionais de apoio**. As missões de proteção do trigo, os equipamentos com atributos, as recompensas, os níveis e os confrontos táticos secundários são convenções do RPG. Nenhum desses confrontos substitui um acontecimento bíblico central.

Purá é uma pessoa mencionada no texto. Sua função de companheiro no reconhecimento respeita Juízes 7. Suas técnicas de apoio no sistema de combate e as falas de orientação são adaptações. Os demais soldados aliados não recebem identidades bíblicas inventadas.

A rota furtiva, as coberturas, a percepção das sentinelas e as tentativas repetidas são mecânicas. O sonho é ouvido e explicado no roteiro; não se torna uma charada. A seleção junto às águas é um acontecimento narrativo, sem escolha de soldados pelo jogador e sem afirmar que o modo de beber demonstrava superioridade espiritual ou militar.

O final jogável contra uma unidade em retirada acontece **após a dispersão do acampamento**. Ele permite utilizar os recursos do RPG, mas a causa da vitória permanece aquela atribuída ao Senhor em Juízes 7:22. O capitão é ficcional, humano e sem poderes sobrenaturais.

## Orientação narrativa

O Senhor é o libertador. Gideão age com medo, recebe confirmação e depende da promessa. A ação do Espírito do Senhor é reconhecida no roteiro; não se torna mana, recurso quantificável ou habilidade mágica. Vigor, moral e liderança representam capacidades humanas no combate.

O jogo não oferece controle sobre Deus. As falas identificadas como “Senhor · paráfrase” são uma apresentação adaptada das palavras registradas na passagem, sem diálogo ramificado para modificar a revelação. A presença do Anjo no chamado não é um combate nem um desafio.

O epílogo mantém a tensão de Juízes 8: a recusa da realeza não apaga as escolhas posteriores. O éfode é apresentado como armadilha para Gideão e sua casa. O roteiro também recorda conflitos e vingança, sem converter cada atitude do protagonista em exemplo aprovado.

## Arte original

`public/assets/gideao.png` é uma ilustração original com transparência, gerada com a ferramenta integrada ImageGen. Não contém arte extraída de um jogo comercial. Sua finalidade é servir de referência visual, retrato e textura de personagem; a movimentação e a câmera pertencem à engine, não à imagem.

Prompt usado (ferramenta integrada, fundo transparente):

> Original playable character sprite for an HD-2D mobile biblical RPG. One full-body Gideon, humble ancient Israelite farmer turned leader, adult in his thirties, dark olive skin, dark curly hair, short beard, concerned and determined. Ochre linen tunic, leather belt, dark teal mantle, sandals, simple bronze short sword sheathed at hip and cloth satchel. Handcrafted 16-bit pixel-art aesthetic, warm ochre and muted teal, readable shading and silhouette. Neutral ready pose, slight three-quarter view, front-left, feet visible. Isolated genuine transparency. No platform, ground, shadow, environment, text, duplicate, UI or watermark.

A arte é uma reconstrução; a Bíblia não descreve a aparência física de Gideão nesses detalhes. O prompt acima resume a especificação de produção; a geração retornada foi inspecionada e preservada com seu canal de transparência.

`public/assets/gideao-walk.png` acrescenta dezesseis quadros originais em quatro direções, gerados a partir da mesma aparência para animação dentro do mundo 3D. O arquivo `src/content/sprites.ts` fornece os recortes de cada quadro, pois o espaçamento devolvido pela ferramenta não é matematicamente uniforme.

`public/assets/people-walk.png` contém outros dezesseis quadros para Purá, uma moradora ficcional, Joás e um guarda midianita sem identidade bíblica inventada. As imagens não são retratos historicamente comprovados. Os recortes ficam em `src/content/peopleSprites.ts`. `public/assets/limestone-wall.png` é uma textura original aplicada a superfícies tridimensionais; não substitui o cenário por uma imagem plana. `public/assets/PROVENANCE.md` registra todos os prompts integrais e a origem das imagens.
