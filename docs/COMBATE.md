# Combate tático: descobrir, quebrar e usar ímpeto

O combate utiliza fraquezas de armas, escudos, Quebra e Ímpeto para tornar a escolha do momento tão importante quanto o dano. Essas mecânicas se integram a vigor, moral, proteção, equipamentos, apoio entre aliados e suprimentos. O protagonista continua sendo um homem com recursos e limites humanos.

## Referências de comportamento

A pesquisa utilizou páginas oficiais da Nintendo e da Square Enix. A [apresentação portuguesa de OCTOPATH TRAVELER](https://www.nintendo.com/pt-pt/Jogos/Jogos-para-a-Nintendo-Switch/OCTOPATH-TRAVELER-1275922.html) descreve as seguintes relações de combate:

- Fraquezas começam ocultas e podem ser descobertas por ataques ou técnicas de observação.
- Atingir uma fraqueza retira pontos de escudo; zerá-los abre uma janela de vulnerabilidade e cancela ações.
- Os pontos acumulados permitem decidir entre pressão imediata e uma ofensiva posterior.
- Ataques físicos reforçados produzem múltiplos golpes; outras habilidades podem ganhar potência ou duração.

A [explicação oficial de OCTOPATH TRAVELER II pela Nintendo](https://www.nintendo.com/jp/topics/article/a35f3cfd-ee44-48ba-a80c-da8c4d3eeab4) também apresenta a redução de defesa durante a quebra e o uso dos pontos para ataque ou recuperação. O artigo contém capturas de combate nas seções de Break e Boost. A [página de sistemas da Square Enix](https://www.jp.square-enix.com/octopathtraveler2/system/) confirma a combinação de exploração de fraquezas e fortalecimento de ações.

Essas fontes orientam a legibilidade e as decisões táticas. Regras numéricas, personagens, texto, interface, efeitos e arte de Bible — Gideão são implementações próprias. Nenhuma captura ou recurso comercial foi incorporado ao jogo.

## Regras implementadas

| Sistema | Regra |
| --- | --- |
| Armas | Espada, lança, arco e cajado. A opção precisa estar equipada no ator ou disponível no inventário. A escolha do comando, por si só, não gasta o turno. |
| Fraquezas | Começam como `?`. Um acerto eficaz revela a arma correspondente. Observação revela fraquezas e abre uma vulnerabilidade adicional. A prévia respeita o conhecimento já descoberto. |
| Escudos | Cada acerto em uma fraqueza remove um escudo. Outros golpes ainda causam dano à vida, mas não retiram escudos. |
| Quebra | Ao chegar a zero escudos, um inimigo ainda vivo perde suas ações até o fim da rodada seguinte e recebe o dobro de dano. Depois recupera sua quantidade original de escudos. |
| Ímpeto | Cada aliado começa com 1 ponto. O limite é 5; podem ser gastos até 3 em uma ação. Quem gastou ímpeto não recebe o ponto da rodada seguinte. |
| Ataque básico | Executa 1 golpe, mais 1 por ponto de ímpeto gasto. Cada golpe verifica vida, fraqueza e escudos separadamente. Recupera vigor. |
| Técnicas | Ímpeto aumenta a força das técnicas ofensivas e prolonga efeitos de apoio. Ataque rápido mantém dois golpes; seu reforço aumenta a força de cada um. |
| Defesa | Reduz dano em 60%, recupera 5 de vigor e dá prioridade na próxima rodada. Não consome ímpeto. |
| Suprimentos | Recuperam vida ou vigor do aliado escolhido, consumindo um item real do inventário. Não usam ímpeto. |
| Moral e formação | Comando, cobertura, observação e exposição alteram o confronto. São esforço, coordenação e postura humana. |

Os custos, a força das armas e a eficácia do alvo aparecem na preparação do comando. A confirmação executa a ação planejada. Os controles ficam bloqueados enquanto os acontecimentos daquele turno são apresentados.

### Arquétipos inimigos

Os quatro arquétipos têm silhuetas, armas, intenções e padrões diferentes. Os valores abaixo pertencem à adaptação do RPG; não são atributos atribuídos a pessoas bíblicas.

| Unidade | Escudos | Fraquezas | Comportamento |
| --- | --- | --- | --- |
| Saqueador | 2 | Espada, arco | Agressão direta com lâmina. |
| Lanceiro | 3 | Lança, cajado | Alterna preparação da guarda e investida pesada. |
| Arqueiro | 2 | Espada, cajado | Procura o aliado mais ferido. |
| Líder da patrulha | 5 | Lança, arco | Reorganiza aliados e aumenta a pressão quando está ferido. |

O líder da patrulha é ficcional. O encontro final complementa a retirada inimiga; a causa da vitória de Juízes 7 continua sendo a ação do Senhor.

## Leitura da interface e da arena

A arena tridimensional dispõe inimigos à esquerda e aliados à direita, voltados uns para os outros. O cenário permanece uma cena renderizada, com solo, profundidade, luz e efeitos. Os sprites originais distinguem lâmina, lança, arco e escudo do capitão; os quadros de antecipação, ataque e recuperação acompanham os movimentos.

No alto, **Agora** e **Próxima** mostram a ordem das rodadas. As indicações sobre os inimigos reúnem nome, vida, escudos, fraquezas e intenção. O painel de comando apresenta o ator, os comandos, as técnicas, as armas disponíveis, os pontos de ímpeto, a prévia e a confirmação. O grupo mantém vida, vigor e estados visíveis. O controle de velocidade altera o ritmo da apresentação; as regras do resultado permanecem as mesmas.

Durante uma ação, cada golpe recebe seu próprio impacto, número e atualização de escudos e vida. A Quebra tem uma indicação própria. A fila inclui a resposta dos inimigos e a recuperação da postura. A tela de resultado aparece depois da apresentação dos acontecimentos, evitando que uma vitória esconda os golpes que a causaram.

## Exemplo de decisão

Um inimigo com três escudos tem fraqueza a arco já conhecida. Um aliado com dois pontos de ímpeto pode reforçar o ataque básico para três golpes: se o inimigo sobreviver, o terceiro acerto zera os escudos e produz a Quebra. O outro aliado pode aproveitar a abertura ou recuperar o grupo. A decisão também tem custo futuro: o personagem que usou ímpeto não recebe seu ponto na rodada seguinte.

A prévia sempre indica a quantidade de golpes e a força da arma selecionada. A perda de escudos é exibida somente quando a fraqueza pertinente é conhecida. Um inimigo derrotado encerra a sequência de golpes contra ele; golpes restantes não geram dano artificial em outro alvo.

## Estado, eventos e salvamento

O domínio fica em `src/game/battle.ts`; os contratos estão em `src/game/types.ts`. `getAvailableWeapons`, `getActionPreview` e `getTurnTimeline` alimentam a interface. `applyBattleAction` recebe ação, alvo, item e opções de arma/ímpeto e devolve um novo estado, sem alterar a entrada.

A batalha usa `combatVersion: 2`. Sua fila de `BattleEvent` registra impactos em ordem, incluindo o número do golpe, vida e escudos após o impacto, fraquezas reveladas, ímpeto e duração da Quebra. A engine apresenta essa fila e informa os momentos de impacto à interface. O resultado do domínio permanece a fonte do estado salvo.

O salvamento preserva armas, recursos, fraquezas descobertas, escudos, rodada, ordem dos turnos e Quebra. Partidas antigas sem esses campos passam por migração na desserialização; itens, atributos, progresso e recompensas existentes são preservados. Dados inválidos da versão atual são rejeitados e seguem a recuperação por cópia anterior.

## Verificação

Os testes de domínio exercitam as regras. `tests/e2e/combat.spec.ts` utiliza partidas criadas pelas funções reais do domínio, serializadas pelo sistema de salvamento e carregadas no navegador. A partir daí, observa e usa os mesmos controles de arma, técnica, ímpeto e confirmação que o jogador.

Os cenários cobrem descoberta, três impactos antes da Quebra, bloqueio dos comandos durante a fila, persistência após recarregar, controles de toque e retorno à exploração. A execução e as capturas finais devem ser registradas em [VALIDACAO.md](VALIDACAO.md); a presença desses testes não substitui sua execução.
