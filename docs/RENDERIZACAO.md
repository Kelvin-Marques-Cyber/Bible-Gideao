# Câmera, luz e renderização HD-2D

Os módulos em `src/engine/rendering/` separam enquadramento, iluminação, efeitos, orçamento gráfico e recuperação de contexto. A composição dos cenários continua em módulos de ambiente; os efeitos não substituem a produção dos objetos.

## Enquadramento e legibilidade

`CameraRig` aproxima a projeção ortográfica, preservando o eixo dos controles. A distância até a câmera não controla o tamanho dos objetos nessa projeção: o campo visível e o zoom controlam.

A calibração de exploração usa meia-altura de 6,35–7,15 unidades em paisagem, com ajuste próprio em retrato. Um personagem de 1,85 unidade ocupa aproximadamente 73 pixels CSS em 960 × 540, frente a aproximadamente 50 na projeção anterior de meia-altura 10. São dimensões calculadas da projeção, não uma medição de desempenho.

Conversas recebem zoom gradual de 1,2× e podem enquadrar o ponto médio entre Gideão e o interlocutor. Momentos importantes usam 1,12×. Uma pose explícita de cinemática conserva sua composição, sem acumular o zoom do diálogo. O palco de combate controla sua câmera separadamente.

A desobstrução integrada fica em `World.ts`: a lista `foliageOccluders` identifica as copas de folhas instanciadas. Uma aproximação pela direção da câmera e pela distância lateral ao personagem reduz gradualmente sua opacidade, ajustando também o corte alfa e a escrita de profundidade. Cada copa possui material próprio, enquanto a textura de folhas é compartilhada. Edificações e a cena inteira não são candidatos automáticos. O módulo separado `ForegroundFader` não participa dessa integração atual.

## Luz, materiais e profundidade

`profiles.ts` define luz, névoa, exposição e correção de cor para Ofra, Colina do Altar, Harode e Midiã. O contraste e a saturação variam pouco; as diferenças principais vêm das fontes de luz e dos materiais.

A luz principal ilumina também o lado visível dos sprites. Sombras direcionais acompanham o personagem com a posição alinhada aos texels, reduzindo a oscilação. Usam mapas de 2048 no preset alto e 1024 no econômico, quando há renderização por hardware. Sombras de contato suaves compartilham uma textura radial. Essa oclusão local **não é SSAO ou GTAO**.

`markLightSource()` reserva intensidade HDR para chamas e brilhos de fontes luminosas; a chamada é idempotente mesmo quando materiais são compartilhados. O limiar de bloom é 2,35. Materiais comuns não devem receber esse tratamento. A implementação usa esse contrato de materiais, e não um passe de máscara por objeto.

A profundidade de campo de desktop usa profundidade da câmera, nove amostras e uma faixa nítida larga. Gideão e um interlocutor próximo têm áreas protegidas; a distância euclidiana até a câmera não substitui a profundidade no espaço de visão. O desfoque máximo é limitado em pixels.

Em telas menores, no preset econômico ou em renderizadores por software, um passe mais barato mantém correção de cor, proteção dos personagens, uma aproximação suave de diorama por faixa focal e brilho HDR econômico. A aproximação não representa profundidade física completa. Sem suporte a render targets HDR, o pipeline usa alvos de 8 bits e os brilhos dos próprios objetos.

Não há pixelização global, SSR, ray tracing, névoa volumétrica por ray marching ou raios de luz de tela implementados nestes módulos.

## Orçamento e ciclo de vida

A resolução varia gradualmente, com histerese. O renderizador por software começa em 0,72× no preset econômico ou 0,85× no alto e tem limite inferior de 0,65×, em vez da antiga grade de 0,4×. Hardware e telas com maior densidade têm limites próprios. A identidade visual continua presente no preset econômico; ele não ignora todo o pós-processamento.

`prepare()` permite compilar os programas da cena de forma assíncrona quando a extensão do navegador permite. O início é adiado para evitar trabalho de uma instância já destruída pelo StrictMode. Enquanto a preparação ocorre, o pipeline não força a renderização completa da cena. `preparing` e `preparationMs` ficam disponíveis nas informações de diagnóstico. Isso precisa ser medido no navegador; não garante um tempo máximo de inicialização.

`observeWebGLContext()` cancela o comportamento padrão de perda de contexto e notifica perda e recuperação. A integração deve suspender a atualização da cena e a fila de combate enquanto o contexto está perdido; depois, recriar os alvos com `pipeline.restore()` e retomar a linha do tempo preservada. Observadores e recursos são descartados na destruição da cena.

As métricas de chamadas de desenho e triângulos somam a cena e **todos os passes do quadro**, com `renderer.info.autoReset = false` e um reset explícito por quadro. Capturas antigas que registravam apenas o último passe não são diretamente comparáveis.

## Verificação e limites

Os testes cobrem dimensões de projeção, conversa e retorno à exploração, prioridade das poses cinematográficas, foco de atores próximos, histerese da resolução, paletas e sombras, materiais HDR compartilhados, desobstrução e eventos de contexto.

Capturas comparativas devem registrar versão do código, posição do jogador, região, viewport, densidade, preset e renderizador. Uma avaliação de desempenho precisa de amostras do navegador e identificação do dispositivo. **30 e 60 FPS são metas; estes módulos não constituem evidência de que essas metas foram atingidas em celulares físicos.**
