# Registro de validação

Data: **17 de outubro de 2026**. Este arquivo registra evidências executadas durante a implementação. A existência de código, teste ou workflow não deve ser confundida com aprovação do comportamento.

## Diagnóstico da publicação — 17/10/2026

- Commit `e4a66b7b49c1bad85a53313e8edf2e78c2a25e75`: workflow de deploy passou a disparar automaticamente por push em `main`, mantendo a opção manual.
- Validação no mesmo commit: [run 39071148217](https://github.com/Kelvin-Marques-Cyber/Bible-Gideao/actions/runs/39071148217) falhou antes da inicialização das etapas.
- Publicação: [run 39071148250](https://github.com/Kelvin-Marques-Cyber/Bible-Gideao/actions/runs/39071148250) falhou sem passos iniciados, sem runner atribuído e sem logs disponíveis; a reexecução (tentativa 2) também falhou.
- Na execução de validação anterior ([run 39070502531](https://github.com/Kelvin-Marques-Cyber/Bible-Gideao/actions/runs/39070502531)), a API relatou 0 ms de tempo faturável, nenhuma etapa e runner vazio. O download dos logs retornou `BlobNotFound`. As anotações dos checks confirmaram uma restrição de conta impedindo o início dos workflows personalizados. A publicação gerenciada do Pages por branch funcionou.
- **Status histórico:** os workflows personalizados não iniciaram. A validação integrada foi executada localmente e a publicação gerenciada por branch foi confirmada. A tabela abaixo registra a validação final e a atualização da demo.
- **Publicação alternativa:** compilar e validar localmente, enviar somente `dist/` à branch `gh-pages` e acompanhar a publicação gerenciada do GitHub Pages. Essa origem está configurada com HTTPS, e a publicação anterior `c37d05b` foi confirmada pela API; os workflows personalizados permanecem manuais.

## Resultados registrados

| Verificação | Resultado observado | Evidência e limite |
| --- | --- | --- |
| Sistemas, movimento e persistência | **40 testes passaram**, em 3 arquivos | `bun run test`: 24 em `tests/systems.test.ts`, 9 em `tests/save.test.ts` e 7 em `tests/movement.test.ts`. Vitest 3.2.7; execução local concluída com código 0. |
| Tipagem do conteúdo | **Passou** | Verificação TypeScript isolada de `src/content/campaign.ts` e `src/content/sprites.ts`, com modo estrito e sem emissão. Não substitui a tipagem da aplicação completa. |
| Transparência do retrato e atlas | **Confirmada** | PNGs RGBA; canal alfa com valores transparentes e opacos. Retrato 971 × 1619; atlas 1254 × 1254. |
| Inspeção da arte | **Realizada** | Um retrato e 16 quadros em quatro direções. Recortes explícitos compensam a grade gerada sem espaçamento matematicamente uniforme. Renderização observada em screenshots reais durante os dois testes; evidências em `docs/screenshots/`. |
| Conferência do roteiro | **Realizada** | Juízes 6–8 consultados em ARC; ordem dos eventos, dez servos, Joás, números do exército, Purá, sonho, ação das tochas e advertência do éfode conferidos. Ver `BIBLIA.md`. |
| Tipagem completa | **Passou** | `bun run typecheck`, código 0, após integração dos sistemas e dos novos recursos visuais. |
| Build de produção | **Passou** | `bun run build`, código 0. Vite 7.3.7; cache de produção inclui fontes, ícones e todos os recursos visuais. |
| E2E em navegador | **2 cenários passaram** | Chromium com renderização por software, em duas execuções: jornada completa (5,1 min) e toque/offline (1,3 min). Playwright 1.64.1; ambos com código 0. |
| Campanha completa pelo navegador | **Passou** | 14 objetivos percorridos por movimento real de teclado, comércio, equipamento, combates, quatro regiões e epílogo; sem teletransporte ou mutação de progresso pelo teste. |
| Persistência real após recarregar | **Passou no teste mobile/offline** | Armazenamento real do Chromium, salvamento e recarregamento sem rede. A jornada final também foi recarregada: estágio 14, equipamento preservado e vitória visual restaurada. |
| Toque e interface horizontal | **Passou em emulação** | Viewport 844 × 390, eventos reais de toque emulados via CDP e deslocamento verificado; menus sem transbordamento horizontal. Não equivale a teste físico. |
| Offline em produção | **Passou no Chromium** | Teste E2E: cache completo instalado, rede desativada, recarregamento e retomada do cenário 3D e posição preservada. |
| Erros de console e execução | **Nenhum nos dois cenários aprovados** | Listeners para `pageerror` e console de tipo `error`; listas vazias ao concluir as execuções. |
| Publicação dos commits | **Confirmada até `46c9813`** | Fonte integrada aos três commits remotos de publicação, sem sobrescrita, e correção de retomada/offline enviada a `origin/main`. A versão servida informa seu commit em `version.json`. |
| Origem de publicação no Pages | **Configurada e confirmada por API** | `build_type: workflow`, HTTPS habilitado. Nenhum deploy foi iniciado por essa configuração. |
| Deploy público | **Pendente de execução/confirmação** | Publicação local compilada por `scripts/deploy-pages.mjs` disponível; Actions mantido manual conforme a alteração remota `17cf655`. Confirmar o endereço após a publicação de `gh-pages`. |

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
