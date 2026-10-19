# Ofra — materiais e folhagem v2

Produção: 18 de outubro de 2026, pela ferramenta ImageGen integrada. Nenhuma imagem de jogo comercial ou textura de terceiros foi fornecida à geração. Os PNGs originais foram copiados sem edição de pixels. Os recursos anteriores permanecem preservados.

## Entregas verificadas

| Arquivo | Dimensão real | Formato | Uso |
| --- | --- | --- | --- |
| `ofra-materials-v2.png` | 1254 × 1254 | RGB opaco | Nove materiais, em três linhas e três colunas |
| `olive-sprig-v2.png` | 1774 × 887 | RGBA | Ramalhete de oliveira com transparência real |

O atlas foi inspecionado visualmente. Cada célula mede 418 × 418; os recortes de 414 × 414 retiram dois pixels de margem para evitar vazamento da célula vizinha. Os arquivos JSON ao lado dos PNGs e `src/content/materialsV2.ts` registram os recortes. A folhagem possui valores alfa de zero a um; seu limite com alfa acima de 10% mede 1732 × 813, com origem em (25, 46). Ela usa a imagem inteira, em proporção 2:1.

O pedido de pixel art e repetição independente é parte da direção artística abaixo. A geração produziu texturas detalhadas de aparência pintada; não certifica uma grade de pixels nativa nem desenho manual. A continuidade exata entre bordas também não está certificada. A execução recorta cada material em uma textura compartilhada, com repetição espelhada para reduzir emendas. A inspeção da cena, em escala final, continua necessária para avaliar repetição, brilho e coesão.

## Prompt exato — atlas de materiais

```text
Use case: historical-scene. Asset type: ORIGINAL MATERIAL ATLAS for actual 3D meshes in a richly crafted HD-2D biblical RPG set in the ancient Levant. Create ONE square texture sheet divided into an EXACT regular 3 by 3 grid of NINE equal square material tiles, filling the whole image. No borders or gaps between the cells. Each cell is a flat orthographic full-bleed albedo surface texture that can repeat independently, with neutral diffuse lighting, no perspective or object silhouettes. The precise row-major order is essential. ROW1 LEFT: weathered pale limestone masonry, irregular handcut cream and taupe stones with worn earthen mortar and subtle ochre specks. ROW1 CENTER: sunbaked adobe plaster, warm pale clay and limestone dust, layered rough trowel strokes, finely chipped areas revealing sand, restrained natural hairline cracks. ROW1 RIGHT: aged olivewood or cedar timber, muted honeybrown vertical grain, weathered pores, fine splits and slight irregular board joins, no nails or metal. ROW2 LEFT: compacted clay walking earth, softly varied warm brown and ochre, fine dust and small pebbles, subtle erosion patches, no footprints or objects. ROW2 CENTER: sandy Mediterranean soil, pale sandy taupe with clay and tiny grit, organic natural variation, sparse muted olive moss flecks, no grass blades or objects. ROW2 RIGHT: unbleached woven linen fabric, ivory and flax natural fibers, visible fine cross weave and subtle wear, flat fabric with no deep folded shadows. ROW3 LEFT: worn darkbrown leather, fine pebbled grain, subtle wrinkles, warm edges and small scuffs, no stitching that makes a specific object. ROW3 CENTER: unglazed terracotta clay, muted burnt sienna and dusty orange, fine pottery pores and faint horizontal wheel marks, flat seamless ceramic surface, no pots or objects. ROW3 RIGHT: gently rippled wellspring water, muted desaturated bluegreen and clear pale teal caustic threads, subtle transparent-depth suggestion, seamless small ripples, no stones or bank. Style across all nine: artisanal hand-painted pixel texture language with deliberate tiny visible pixel clusters and nuanced subdued earthy palette, clear material structure, premium detailed diorama RPG environment quality, no global pixelation filter, no photoreal noise, no smooth gradients replacing detail. Edges of each material should continue naturally for independent tiling. NO text, labels, numbers, gridlines, UI, watermarks, scene, building, characters, tools, cutout objects, or cast shadows. Texture sheet only, exactly3equalcolumns and3equalrows.
```

## Prompt exato — ramalhete de oliveira

```text
Use case: historical-scene. Asset type: transparent foliage-card texture for instanced 3D olive-tree canopies in a refined HD-2D ancient Levant RPG. Create ONE short natural olive sprig, broad horizontal composition on a genuinely transparent 2:1 canvas. A thin gently curved brown-gray twig branches into three delicate smaller twigs, bearing approximately18 to24 narrow lance-shaped olive leaves. Olive leaves must be botanically readable: slim pointed lanceolate blades, muted Mediterranean sage and olive-green upper sides with pale silver-green undersides, tiny central veins, varied angles, tasteful small clear spaces between leaves. Arrange one loose airy sprig with organic asymmetry, fuller near center and tapering at ends; no dense solid blob or spherical canopy. Entire sprig fits inside image with a small clear transparent margin, no clipped leaves. Style: authentic artisanal pixel-art foliage with deliberate crisp square pixel clusters and fine painterly leaf highlights, restrained silver sage, deep olive, warmgray and brown palette, neutral diffuse material lighting, legible at a small game scale. It will be repeated on small 3D cards around twisted branches, so do not create a complete tree or scene. No olives/fruits, no ground, no pot, no scenery, no roots, no separate extra sprigs, no cast shadow or ambient glow, no gray/checkerboard/white background, no border, no text, no labels, no watermark. Genuine transparent empty pixels around and between all leaves. Landscape2:1 material image approximately1024×512.
```

## Aplicação e autoria

Pedra, reboco, madeira, terra compactada, solo arenoso, linho, couro, terracota e água foram concebidos para a ambientação original do projeto. São reconstruções artísticas; não representam comprovação arqueológica de Ofra. A folhagem serve a planos recortados sobre ramos tridimensionais. Os arquivos não são fundos estáticos ou capturas de exploração.

As referências comerciais consultadas para composição, escala e legibilidade estão documentadas em `docs/AUDITORIA-HD2D.md`; suas imagens não integram os recursos do jogo. Estes recursos originais seguem a licença do projeto, conforme `LICENSE`.
