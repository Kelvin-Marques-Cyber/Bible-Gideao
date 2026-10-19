# Materiais autorais de Ofra

O pacote v2 acrescenta nove superfícies originais e folhagem recortada à arquitetura e ao terreno tridimensionais. Ele complementa os volumes, caminhos, objetos e ramos construídos pelos módulos de ambiente. A procedência e os prompts exatos estão em [`PROMPTS-MATERIALS-V2.md`](../public/assets/PROMPTS-MATERIALS-V2.md).

## Atlas e escala

`ofra-materials-v2.png` mede 1254 × 1254. Sua grade é de 3 × 3, com células de 418 pixels. Cada recorte útil mede 414 × 414, com margem interna de dois pixels. O manifesto de execução é `src/content/materialsV2.ts`; o JSON ao lado do PNG permite inspecionar os mesmos valores sem executar o jogo.

| Identificador | Linha e coluna, iniciando em 1 | Superfície |
| --- | --- | --- |
| `limestone` | 1, 1 | Calcário irregular e argamassa terrosa |
| `adobe` | 1, 2 | Reboco de barro claro, gasto e estratificado |
| `wood` | 1, 3 | Madeira envelhecida, com veio vertical |
| `dirt` | 2, 1 | Terra compactada, poeira e pequenos seixos |
| `sand` | 2, 2 | Solo arenoso claro com grãos variados |
| `linen` | 2, 3 | Linho cru, trama fina e desgaste discreto |
| `leather` | 3, 1 | Couro castanho com poros e pequenas marcas |
| `terracotta` | 3, 2 | Cerâmica sem esmalte em argila avermelhada |
| `water` | 3, 3 | Ondulações suaves em verde e azul contidos |

O carregador `src/engine/environment/materials.ts` recorta cada superfície uma vez e compartilha as nove texturas resultantes. A repetição é espelhada em cada recorte, em vez de repetir a folha inteira. A cor usa espaço sRGB; ampliação preserva bordas por amostragem próxima e a redução usa mipmaps. Os materiais ficam sujeitos às luzes da cena.

A escala UV deve acompanhar o objeto: blocos de pedra têm tamanho reconhecível, o veio segue vigas, e a trama de tecido permanece menor que as tábuas. Variação de volumes, orientação e desgaste ajuda a controlar padrões visíveis. Repetição espelhada reduz emendas, mas não garante continuidade perfeita. Água é um recurso disponível no atlas; sua presença no arquivo não certifica uma simulação física ou uso em todos os poços.

## Oliveiras

`olive-sprig-v2.png` mede 1774 × 887, em RGBA real, com proporção 2:1. A imagem contém um ramo com folhas estreitas em tons verdes e prateados; os espaços entre as folhas são transparentes. O manifesto propõe corte alfa de 0,38. A imagem inteira serve a planos de folhagem instanciados ao redor dos ramos tridimensionais, com orientação e escala variadas.

O alfa recortado evita desenhar retângulos opacos sobre as árvores. Preservar a proporção 2:1 evita folhas comprimidas. Redução de tamanho, distância da câmera e o filtro escolhido ainda podem perder folhas finas; esse comportamento deve ser conferido nas capturas de desktop e celular.

## Direção e limites

As [referências oficiais de composição](AUDITORIA-HD2D.md) orientam leitura de planos, proporções, luz e densidade de detalhes. Os materiais representam uma interpretação artística do Levante antigo. Nenhuma textura ou captura comercial foi incorporada à produção.

A ferramenta entregou superfícies detalhadas de aparência pintada, em resoluções maiores que uma grade tradicional de pixels. Não há certificação de desenho manual, paleta restrita ou resolução nativa exata. A filtragem de execução preserva nitidez; ela não transforma uma ilustração em pixel art desenhada manualmente. A revisão artística final precisa observar a cena iluminada e os personagens juntos.

Os PNGs e os limites alfa foram inspecionados. Os recortes foram verificados contra as dimensões reais. Este documento não afirma desempenho em celulares físicos, aprovação de todos os testes ou publicação da versão com estes materiais; essas evidências pertencem à validação da versão entregue.
