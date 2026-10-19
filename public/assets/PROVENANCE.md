# Original art provenance

## Ofra materials and foliage v2

The original `ofra-materials-v2.png` atlas and `olive-sprig-v2.png` foliage were produced with the built-in ImageGen tool on 2026-10-18. Their exact prompts, dimensions, transparency inspection, crop rules and production limits are preserved in [PROMPTS-MATERIALS-V2.md](PROMPTS-MATERIALS-V2.md). The nine-material atlas is 1254 × 1254 RGB; the foliage is 1774 × 887 RGBA. No commercial image or third-party texture was supplied. Runtime packaging does not certify manual pixel drawing or perfect seamless tiling.

## enemies-battle.png

- Built-in ImageGen generation with `people-walk.png` as original style reference and `transparent_background: true`.
- PNG: 1254 × 1254, RGBA, transparent and opaque alpha verified. Four unnamed human archetypes: raider, spearman, archer and unit captain.
- Sixteen battle poses, facing right: idle, anticipation, attack and recovery per archetype. No commercial game character or screenshot was supplied to the image model.
- Explicit source bounds and foot pivots are recorded in `src/content/enemySprites.ts`; extended weapons require a wide transparent runtime canvas. Clothing and equipment are artistic ancient Levantine reconstruction.

Exact generation prompt:

```text
Use case: historical-scene. Asset type: ORIGINAL ENEMY BATTLE SPRITE SHEET for a mobile HD-2D biblical RPG. Use attached original atlas only as reference for crisp handcrafted pixel clusters, warm shading, ancient linen/leather textures and serious four-heads-tall JRPG proportions. Create exactly16 separate full-body human sprites on genuinely transparent square canvas arranged FOUR COLUMNS by FOUR ROWS. Every figure facing RIGHT in a three-quarter side profile to confront heroes on right side of battlefield. The four ROWS are distinct ancient Near Eastern human enemies with clearly different weapon silhouettes; no fantasy monsters. Each row has FOUR consecutive poses: column1 alert IDLE ready stance, column2 ANTICIPATION drawn-back weapon, column3 controlled ATTACK extension to right within own cell, column4 RECOVERY low defensive stance. Keep face/costume/weapon/scale identical across each row. ROW1 RAIDER: wiry adult darkhaired bearded man, sand headwrap, dusty ochre short tunic, brown belt and sandals, short bronze curved blade, no armor and no shield; mobile skirmisher silhouette. ROW2 SPEARMAN: taller bearded man, simple rounded bronze cap, sand linen tunic with mutedburgundy sash, brown leather shoulder protection, long wood spear held upright beside body in idle and tilted diagonally right in attack; compact pose so no neighboring cell overlap. ROW3 ARCHER: lean man with dark curlyhair, mutedolive tunic, cream hood down, leather quiver visibly on back, simple wooden recurved bow held to right; anticipates then releases single arrow to the right, NO detached arrows outside figurecell. ROW4 UNIT CAPTAIN: stockier experienced middleaged man, short dark beard, plain bronzehelmet, mutedburgundy tunic with layered leatherarmor, round weathered woodshield on left arm and bronzeshortsword right hand; firm commanding posture. All warmoliveskin, human expressive faces. These are artistic ancientLevantine reconstructions, not Romans or medievalknights: NO plumed helmets, metalplate suits, heraldry, crosses, magical effects. Rich deliberate visible squarepixelclusters, intricate clothfolds, leatherstitching, bronzeedgeglints, legiblesilhouettes. Not smooth illustration and not blurred. Equaluniformcells, all feet alignedon samebaseline perrow, sameheightandscale, ampletransparentgaps, entiretyofweaponandbodyinsideeachcell. Characterheightabout82%cell. NO text, letters, icons, numbers, shadows, ground, platforms, backgrounds, frames, gridlines, logos, watermark or extrafigures.
```

## people-walk.png

- Built-in ImageGen generation using the original `gideao-walk.png` as style reference, with `transparent_background: true`.
- PNG: 1254 × 1254, RGBA, with transparent and opaque pixels verified.
- Rows represent Purá, a fictional village woman, Joás and an unnamed Midianite guard. Each row contains four walking poses facing front in three-quarter view. Runtime mirrors supply opposite facing.
- Original source rectangles in `src/content/peopleSprites.ts` were measured from alpha bounds with two-pixel padding. No downloaded commercial game art was used.
- Costume and appearance are artistic reconstruction. The village woman and generic guard do not receive invented biblical identities.

Exact generation prompt:

```text
Use case: historical-scene. Asset type: original living NPC WALK SPRITE SHEET for an HD-2D biblical RPG, matching the original pixel-art style, visual richness, scale, ochre/teal palette and serious four-heads-tall proportions of the attached Gideon sprite atlas. This reference is only for art style and scale, not for copied faces. Create exactly SIXTEEN isolated full-body people on a genuinely transparent square image, arranged in exactly FOUR COLUMNS and FOUR ROWS, uniformly spaced, equal-size cells, identical character scale, feet at matching baseline in each row, NO clipping or overlap. Each ROW is a different ancient Levantine character, each COLUMN is a consecutive WALK frame: standing neutral; left foot forward with arms counter-swinging; passing pose; right foot forward. All face the viewer in slight three-quarter angle, grounded, natural, warm olive skin. ROW1 PURAH scout: young adult man, short dark curly hair, neatly trimmed beard, dark teal hooded mantle worn down, muted sage-green linen tunic, leather belt, small satchel, sandals, short sheathed blade, alert thoughtful face. ROW2 WOMAN VILLAGER: adult woman, muted rust-orange long linen dress, cream headwrap, olive skin, small woven belt pouch, sandals, kind hardworking face. ROW3 ELDER JOASH: elderly man with gray curly hair and full gray beard, cream and sand long robe, muted brown shoulder shawl, rope belt, sandals, dignified weathered face, NO staff so arms can animate freely. ROW4 MIDIANITE GUARD: adult male soldier, burgundy linen tunic, layered brown leather armor, plain bronze open-face helmet, dark short beard, sandals, holding a simple vertical wood spear in right hand with small bronze tip, no shield, serious face, not a monster. HANDCRAFTED CRISP PIXEL ART: deliberate visible square pixel clusters, intricate fabric fold highlights, leather seams, subtle bronze glints, no smooth vector shapes, no realism, no anti-aliased illustration. Designed for characters to remain rich and readable when shown small in a real 3D world. Each figure roughly60%cell width and85%cell height with transparent margins. NO ground, shadow, backdrop, floor, labels, grid lines, letters, text, icons, weapons floating separately, UI, watermark or additional figures.
```

## limestone-wall.png

- Built-in ImageGen generation with an opaque background, for surface material on 3D meshes.
- PNG: 1254 × 1254, RGB. The image depicts a continuous masonry surface, not a static environment or gameplay replacement.
- Intended for tiling. Exact seamlessness is not asserted; mirrored wrapping can soften repetition boundaries.

Exact generation prompt:

```text
Use case: historical-scene. Asset type: seamless tileable material texture for actual 3D mesh walls in an original high-quality HD-2D biblical RPG. Create ONE square full-bleed orthographic texture of ancient Levantine rough limestone masonry and pale earthen mortar. The texture covers the entire image edge to edge, with no outer wall outline, and must seamlessly tile on all four edges. Eight to ten irregular staggered stone courses, hand-cut warm cream limestone blocks of varied medium sizes, natural chipped edges, subtle hairline cracks, tiny ochre grit and worn clay mortar between stones, sparse muted olive aging deep in crevices. Physically readable stone relief, detailed but restrained. Style: exquisite richly hand-painted pixel-art material, deliberate crisp 2-to-4 pixel clusters at final image size, sophisticated desaturated honey, cream, taupe palette, gentle texture microvariation, elegant classic Japanese HD-2D RPG art direction entirely original. Perfect straight-on front surface view, flat neutral diffuse illumination appropriate as albedo texture, no perspective, no directional cast shadows, no AO that creates a broad gradient, no highlights baked from a sun, no vignette. The tiles must continue naturally beyond every edge. Do NOT depict a building, sky, landscape, window, door, character, floor, scene, frame or interface. No text, symbols, writing, logos or watermarks. A single continuous limestone wall texture only, square1024×1024.
```

## gideao.png

- Generated for Bible — Gideão on 2026-10-17 using the built-in ImageGen tool, with `transparent_background: true`.
- Original output preserved in the workspace without image processing.
- PNG: 971 × 1619, RGBA, 1.3 MB. Alpha verified: transparent and opaque pixels present.
- Artistic interpretation, not a claim about Gideon's documented physical appearance.
- No commercial-game reference images or third-party character assets supplied.

Exact generation prompt:

```text
Use case: historical-scene. Asset type: original playable character sprite for an HD-2D mobile biblical RPG. Create ONE full-body Gideon as a humble ancient Israelite farmer turned leader, adult 30s, dark olive skin, dark curly hair, short beard, concerned determined expression. Authentic broad ochre linen tunic, simple leather waist belt, dark teal short mantle across one shoulder, leather sandals, simple bronze short sword sheathed at hip, small cloth satchel. Style: exquisite handcrafted 16-bit pixel art with readable blocky pixels, 48x80 sprite aesthetic enlarged crisply with nearest-neighbor edges, sophisticated warm ochre and muted teal palette, dramatic readable folds and rim light. Not chibi: appealing classic JRPG proportions about 4 heads tall, careful shading and crisp silhouette. Composition: single character standing centered full-body neutral ready pose with hands separated, slight three-quarter view facing front-left, feet visible, completely isolated on genuinely transparent background. Character fills 80% canvas height. No platform, no ground, no contact shadow, no environment, no text, no border, no duplicated body, no UI, no watermark. This is an original sprite that will animate in a live 3D environment, so clean silhouette and real transparency are essential.
```

## gideao-walk.png

- Built-in ImageGen edit, using `gideao.png` as identity and costume reference, with `transparent_background: true`.
- Original PNG: 1254 × 1254, RGBA. True transparency verified. Sixteen distinct full-body frames in four directions.
- Rows are front, left, back, right. Four walking poses per row.
- The generated spacing is visually regular but not pixel-exact. Runtime crop rectangles in `src/content/sprites.ts` were derived from the alpha bounds, with four-pixel padding. This packages original art for animation without changing the image.

Exact generation prompt:

```text
Use case: style-transfer. Input image: reference identity and costume only. Create a new production WALK SPRITE SHEET for a live HD-2D game, matching the dark curly hair, short beard, ochre linen tunic, teal mantle, belt, sandals, small satchel and sheathed sword of the referenced original Gideon. The output must be a square image in an exact regular FOUR COLUMN by FOUR ROW grid, exactly 16 separate full-body sprites, no other graphics. Each cell is identical size with the figure centered horizontally and its feet aligned to the same low baseline. Each figure occupies 60% of cell width and 85% of cell height, with transparent gutters and NO overlap. Rows are exact directions: row1 facing DOWN toward viewer, row2 facing LEFT, row3 facing UP away from viewer showing the back, row4 facing RIGHT. Columns are exact walking gait frames: col1 neutral feet, col2 left foot forward, col3 neutral feet, col4 right foot forward. Arms counter-swing, mantle moves subtly. All 16 frames same proportions and scale. Style is genuinely LOW RESOLUTION sprite pixel art at a 48x64 pixel logical character size, crisp square clusters and limited deliberate palette, richly shaded but NOT smooth illustration, NO anti-aliasing. Classic serious heroic JRPG proportions about four heads tall. Genuine transparent background throughout all empty pixels. NO ground, cast shadows, platforms, labels, cell lines, letters, text, numbers, UI or watermark. The fixed exact 4x4 uniform grid, four directions, full figures, consistent baselines and transparent empty spaces are the most important production requirements.
```
