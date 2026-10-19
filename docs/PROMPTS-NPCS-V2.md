# NPCs direcionais v2

Criados em 18/10/2026 com a ferramenta integrada de geração de imagens, usando a folha original de Gideão v2 como referência de estilo. Os quatro PNGs preservam os pixels e o alpha fornecidos pela ferramenta; nenhuma figura foi redesenhada ou sintetizada por código. O original `people-walk.png` permanece disponível.

A tentativa inicial de uma folha 8×8 omitiu uma linha de direção. Uma segunda tentativa também não cumpriu a contagem. Esses rascunhos foram rejeitados e não foram colocados em `public/`. A entrega aceita usa quatro folhas independentes 4×4, uma por personagem.

## Arquivos verificados

| Personagem | Arquivo | Dimensões reais | Quadros |
| --- | --- | --- | --- |
| pura | `public/assets/people-pura-walk-v2.png` | 1254×1254 RGBA | 16 |
| woman | `public/assets/people-woman-walk-v2.png` | 1254×1254 RGBA | 16 |
| elder | `public/assets/people-elder-walk-v2.png` | 1254×1254 RGBA | 16 |
| guard | `public/assets/people-guard-walk-v2.png` | 1254×1254 RGBA | 16 |

Cada folha foi inspecionada visualmente: linha 0 frente, linha 1 direita, linha 2 costas, linha 3 esquerda. São 64 quadros no total. A análise do alpha encontrou exatamente 16 componentes de personagem com mais de 10 mil pixels por folha, no limiar 90/255. Os pequenos resíduos vermelhos do preview têm alpha máximo de 2/255 (Purá, ancião e guarda) ou 6/255 (mulher), abaixo do `alphaTest=.35` usado pelo jogo.

O pedido citava 1024×1024, mas a ferramenta retornou 1254×1254. A grade gerada é aproximada: cortar em dezesseis retângulos matematicamente iguais cortaria alguns pés. Por isso `src/content/peopleSpritesV2.ts` contém os limites explícitos do maior componente de alpha de cada figura. A estética foi gerada para combinar com o herói; isso não certifica uma grade pixel a pixel desenhada manualmente nem uma paleta estritamente indexada.

## Integração

`peopleAtlasV2.characters[kind].frames[direction][frame]` fornece os recortes, com as direções na ordem frente/direita/costas/esquerda. `anchorX` é relativo ao recorte e foi estimado pelo centro dos pés no trecho inferior, ignorando a haste fina do cajado/lança. `baseline` é a linha de chão relativa ao recorte. `placePeopleFrame` normaliza a escala por personagem e coloca o chão de todos os quadros em (128,157) no canvas 256×160. Não redimensionar cada quadro independentemente para preencher o canvas.

Carregar os quatro arquivos em paralelo, limpar resíduos isolados no limiar indicado e guardar a direção real. Não espelhar novamente a folha esquerda. As texturas normalizadas podem usar `userData.spriteAspect=256/160`, `userData.visibleHeight=152/160` e `userData.baselineRatio=3/160`. Mantêm-se quatro quadros de caminhada, sem alegar oito ou ações adicionais.

## Prompts finais integrais

A imagem `public/assets/gideao-walk-v2.png` foi fornecida como referência de estilo em cada chamada; `transparent_background=true`. Cada bloco abaixo registra exatamente o texto utilizado, inclusive as dimensões pedidas que diferiram da saída.

### pura

```text
Use case: style-transfer. Create a NEW original transparent pixel-art NPC walking sprite sheet for a biblical JRPG, matching the supplied Gideon sheet's compact adult chibi style, dark brown outlines, hard pixel clusters and understated cel shading. Reference is STYLE ONLY; do not draw Gideon.

EXACT GRID: square 1024×1024 RGBA PNG with 4 columns and 4 rows, EXACTLY SIXTEEN complete full-body sprites. One sprite centered in each equally sized cell. All sprites same body scale, heads aligned, feet at 236 of every 256px cell. At least 12px clear transparent gutter around each silhouette, including weapon tips. Do not crop any feet or weapon. No ground, shadow, text, labels, numbers, grid, checkerboard or scene. All background truly alpha=0; clean contours without stray particles or red/green halos.

EXACT DIRECTIONS, top to bottom:
ROW 0: four FRONT facing walk frames; show the face.
ROW 1: four RIGHT facing profile walk frames; face and nose point RIGHT.
ROW 2: four BACK facing walk frames; show back of head, shoulders and clothing, NO FACE.
ROW 3: four LEFT facing profile walk frames; face and nose point LEFT.
Four frames of each row: contact, passing, opposite contact, passing, a coherent subtle walk loop. Repeat the same person and same clothing through all 16. Genuine front/back views and profiles, not repeated three-quarter front poses. Slight elevated orthographic JRPG field view, compact adult 3.5-head proportions, readable at 60px tall. Simple palette and hard-edged pixels, not smooth detailed painting or 3D. Neutral softly warm light from upper left. Ancient Levant natural linen/leather/clay colors, no European medieval/fantasy ornaments, no magic.

SUBJECT: PURÁ, a young adult olive-skinned Levantine man with short curly dark hair and a short dark beard. Muted teal knee-length linen tunic, beige woven belt, small plain brown shoulder bag, plain strapped sandals. Carries one plain slender wooden walking staff. Staff stays inside cell. Calm determined face. No sword, no cape, no helmet. Cream undershirt only subtle. This is an original companion character, distinct from Gideon.
```

### woman

```text
Use case: style-transfer. Create a NEW original transparent pixel-art NPC walking sprite sheet for a biblical JRPG, matching the supplied Gideon sheet's compact adult chibi style, dark brown outlines, hard pixel clusters and understated cel shading. Reference is STYLE ONLY; do not draw Gideon.

EXACT GRID: square 1024×1024 RGBA PNG with 4 columns and 4 rows, EXACTLY SIXTEEN complete full-body sprites. One sprite centered in each equally sized cell. All sprites same body scale, heads aligned, feet at 236 of every 256px cell. At least 12px clear transparent gutter around each silhouette, including weapon tips. Do not crop any feet or weapon. No ground, shadow, text, labels, numbers, grid, checkerboard or scene. All background truly alpha=0; clean contours without stray particles or red/green halos.

EXACT DIRECTIONS, top to bottom:
ROW 0: four FRONT facing walk frames; show the face.
ROW 1: four RIGHT facing profile walk frames; face and nose point RIGHT.
ROW 2: four BACK facing walk frames; show back of head, shoulders and clothing, NO FACE.
ROW 3: four LEFT facing profile walk frames; face and nose point LEFT.
Four frames of each row: contact, passing, opposite contact, passing, a coherent subtle walk loop. Repeat the same person and same clothing through all 16. Genuine front/back views and profiles, not repeated three-quarter front poses. Slight elevated orthographic JRPG field view, compact adult 3.5-head proportions, readable at 60px tall. Simple palette and hard-edged pixels, not smooth detailed painting or 3D. Neutral softly warm light from upper left. Ancient Levant natural linen/leather/clay colors, no European medieval/fantasy ornaments, no magic.

SUBJECT: An adult olive-skinned Levantine WOMAN with rust-red/ochre ankle-length linen dress, cream woven headscarf covering the hair, plain rope belt and plain sandals. Empty hands. Warm calm face. The scarf has a plain drape down her upper back, no long train. A practical village woman, compact adult proportions matching the Gideon style. NO STAFF, no bag, no armor.
```

### elder

```text
Use case: style-transfer. Create a NEW original transparent pixel-art NPC walking sprite sheet for a biblical JRPG, matching the supplied Gideon sheet's compact adult chibi style, dark brown outlines, hard pixel clusters and understated cel shading. Reference is STYLE ONLY; do not draw Gideon.

EXACT GRID: square 1024×1024 RGBA PNG with 4 columns and 4 rows, EXACTLY SIXTEEN complete full-body sprites. One sprite centered in each equally sized cell. All sprites same body scale, heads aligned, feet at 236 of every 256px cell. At least 12px clear transparent gutter around each silhouette, including weapon tips. Do not crop any feet or weapon. No ground, shadow, text, labels, numbers, grid, checkerboard or scene. All background truly alpha=0; clean contours without stray particles or red/green halos.

EXACT DIRECTIONS, top to bottom:
ROW 0: four FRONT facing walk frames; show the face.
ROW 1: four RIGHT facing profile walk frames; face and nose point RIGHT.
ROW 2: four BACK facing walk frames; show back of head, shoulders and clothing, NO FACE.
ROW 3: four LEFT facing profile walk frames; face and nose point LEFT.
Four frames of each row: contact, passing, opposite contact, passing, a coherent subtle walk loop. Repeat the same person and same clothing through all 16. Genuine front/back views and profiles, not repeated three-quarter front poses. Slight elevated orthographic JRPG field view, compact adult 3.5-head proportions, readable at 60px tall. Simple palette and hard-edged pixels, not smooth detailed painting or 3D. Neutral softly warm light from upper left. Ancient Levant natural linen/leather/clay colors, no European medieval/fantasy ornaments, no magic.

SUBJECT: An elderly olive-skinned Levantine MAN with visible gray hair and full short gray beard, cream linen robe, ochre-brown mantle/scarf over shoulders, simple woven belt and plain sandals. Empty hands. Age visible without hunched monster proportions. Back view has gray back of head and broad plain ochre mantle, no face or beard on the back. Left profile faces LEFT. Compact adult proportion matching the Gideon style. No staff, no helmet, no fantasy.
```

### guard

```text
Use case: style-transfer. Create a NEW original transparent pixel-art NPC walking sprite sheet for a biblical JRPG, matching the supplied Gideon sheet's compact adult chibi style, dark brown outlines, hard pixel clusters and understated cel shading. Reference is STYLE ONLY; do not draw Gideon.

EXACT GRID: square 1024×1024 RGBA PNG with 4 columns and 4 rows, EXACTLY SIXTEEN complete full-body sprites. One sprite centered in each equally sized cell. All sprites same body scale, heads aligned, feet at 236 of every 256px cell. At least 12px clear transparent gutter around each silhouette, including weapon tips. Do not crop any feet or weapon. No ground, shadow, text, labels, numbers, grid, checkerboard or scene. All background truly alpha=0; clean contours without stray particles or red/green halos.

EXACT DIRECTIONS, top to bottom:
ROW 0: four FRONT facing walk frames; show the face.
ROW 1: four RIGHT facing profile walk frames; face and nose point RIGHT.
ROW 2: four BACK facing walk frames; show back of head, shoulders and clothing, NO FACE.
ROW 3: four LEFT facing profile walk frames; face and nose point LEFT.
Four frames of each row: contact, passing, opposite contact, passing, a coherent subtle walk loop. Repeat the same person and same clothing through all 16. Genuine front/back views and profiles, not repeated three-quarter front poses. Slight elevated orthographic JRPG field view, compact adult 3.5-head proportions, readable at 60px tall. Simple palette and hard-edged pixels, not smooth detailed painting or 3D. Neutral softly warm light from upper left. Ancient Levant natural linen/leather/clay colors, no European medieval/fantasy ornaments, no magic.

SUBJECT: An adult olive-skinned Midianite GUARD, short dark beard, plain natural linen knee-length tunic, simple brown leather protection, plain low domed bronze cap helmet without plume, plain brown strapped sandals. Holds a plain long wooden spear with a small bronze point, entire tip visible inside every cell. No shield, no sword, no Roman legion armor, no medieval plate, no decorations. Compact adult chibi proportion matching Gideon. True rear view with back of helmet and leather, no face; left profile must face LEFT.
```

## Integridade dos arquivos

- `assets/people-pura-walk-v2.png`: SHA-256 `68da852ccee1463f9d3a6c5b21c26cb5ee9783a7d64f861a344605b123a5c0fa`.
- `assets/people-woman-walk-v2.png`: SHA-256 `1826a344fc4ee6e1f47c6cfb5602ad172b39c0c198cb5c5cef73f6eddc91aa15`.
- `assets/people-elder-walk-v2.png`: SHA-256 `7815a53c42a9ac0b198ed7ae866775cf4a9fdee25247628ba8eb9110e92a3ad7`.
- `assets/people-guard-walk-v2.png`: SHA-256 `10ccb0fab3d7bca0a82850f2d5da914a1836c4cc1e18a06f27ffb0cd67752bca`.

