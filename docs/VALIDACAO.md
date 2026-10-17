# Registro de validação

Data: **17 de outubro de 2026**. Este arquivo registra evidências executadas durante a implementação. A existência de código, teste ou workflow não deve ser confundida com aprovação do comportamento.

## Resultados registrados

| Verificação | Resultado observado | Evidência e limite |
| --- | --- | --- |
| Sistemas, movimento e persistência | **40 testes passaram**, em 3 arquivos | `bun run test`: 24 em `tests/systems.test.ts`, 9 em `tests/save.test.ts` e 7 em `tests/movement.test.ts`. Vitest 3.2.7; execução local concluída com código 0. |
| Tipagem do conteúdo | **Passou** | Verificação TypeScript isolada de `src/content/campaign.ts` e `src/content/sprites.ts`, com modo estrito e sem emissão. Não substitui a tipagem da aplicação completa. |
| Transparência do retrato e atlas | **Confirmada** | PNGs RGBA; canal alfa com valores transparentes e opacos. Retrato 971 × 1619; atlas 1254 × 1254. |
| Inspeção da arte | **Realizada** | Um retrato e 16 quadros em quatro direções. Recortes explícitos compensam a grade gerada sem espaçamento matematicamente uniforme. A integração visual final precisa ser observada no navegador. |
| Conferência do roteiro | **Realizada** | Juízes 6–8 consultados em ARC; ordem dos eventos, dez servos, Joás, números do exército, Purá, sonho, ação das tochas e advertência do éfode conferidos. Ver `BIBLIA.md`. |
| Tipagem completa | **Pendente de registro** | Registrar o resultado final de `bun run typecheck` após a integração. |
| Build de produção | **Pendente de registro** | Registrar o resultado final de `bun run build`. |
| E2E em navegador | **Pendente de registro** | Execução e correções de integração sob responsabilidade da etapa final. Não foram declaradas aprovadas neste registro. |
| Campanha completa pelo navegador | **Pendente de registro** | Exige percorrer os quatro atos com controles e chegar ao epílogo. |
| Persistência real após recarregar | **Pendente de registro** | Os testes unitários usam IndexedDB simulado. |
| Toque e interface horizontal | **Pendente de registro** | Distinguir emulação de viewport de uso em aparelho físico. |
| Offline em produção | **Pendente de registro** | Exige build servido, worker instalado, primeiro carregamento completo e segunda visita sem rede. |
| Ausência de erros críticos de console | **Pendente de registro** | Inspecionar o console durante o fluxo completo. |
| Publicação dos commits | **Pendente de confirmação** | Confirmar os hashes efetivamente presentes em `origin/main`. |
| Deploy público | **Pendente de execução/confirmação** | Workflow manual configurado não equivale a site publicado. |

## O que os 40 testes verificam

Os testes existentes exercitam deslocamento e colisões, cálculo e comportamento de combate, ordem dos turnos, técnicas, recursos, derrota e recompensas, progressão, equipamentos, inventário, comércio e missões. Também verificam serialização, rejeição de dados inválidos, IndexedDB, espelho local e recuperação do registro anterior.

Esses resultados validam a lógica exercitada por cada teste. Não atestam aparência, qualidade da animação, conforto dos controles, balanceamento para todos os jogadores nem compatibilidade física de aparelhos.

## Roteiro de verificação da integração

1. Iniciar uma partida, observar a introdução e caminhar por Ofra com colisões.
2. Interagir no lagar e no celeiro; visitar comércio, comprar e equipar uma peça; verificar os atributos.
3. Enfrentar a patrulha por turnos, utilizar defesa e provisões e confirmar experiência, itens e evolução.
4. Salvar, recarregar e retomar posição, equipamentos, inventário e objetivo.
5. Percorrer o altar noturno, acompanhar dez servos, Joás e os sinais sem quebra-cabeças.
6. Acompanhar 32.000 → 10.000 → 300, preparar o grupo e incluir Purá no momento correto.
7. Aproximar-se de sentinelas, verificar sua percepção e usar cobertura para alcançar a conversa do sonho.
8. Acompanhar os três grupos, as trombetas, os cântaros, as tochas e a confusão no acampamento.
9. Vencer o confronto final e chegar ao epílogo com a advertência do éfode.
10. Repetir os fluxos essenciais em viewport horizontal com eventos de toque.
11. Servir o build, confirmar o controle pelo Service Worker e recarregar sem rede depois do carregamento inicial.
12. Inspecionar console, arquivos ausentes, estados travados e alteração indevida de progresso após derrota.

## Avaliações ainda necessárias em aparelhos físicos

Não foram medidos FPS sustentados, consumo de bateria, aquecimento e memória em celulares modestos. As metas são **30 FPS estáveis** em aparelhos compatíveis modestos e até **60 FPS** nos mais potentes, sujeitas a validação. Os números do menu e de uma execução automatizada pertencem somente ao ambiente em que foram obtidos.

Ainda é necessário verificar Android e iOS reais, instalação e retomada no Safari, interrupção por chamada ou bloqueio de tela, áreas seguras de diferentes aparelhos, perdas de contexto WebGL e recuperação após pressão de memória.

## Atualização deste registro

Ao concluir uma verificação pendente, substitua sua linha por resultado, comando ou procedimento, ambiente e limite observado. Acrescente os nomes dos cenários E2E, resultados, caminho das capturas e hashes de publicação. Mantenha as pendências que não tenham evidência executada.
