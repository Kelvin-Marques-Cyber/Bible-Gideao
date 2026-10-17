# Original art provenance

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
