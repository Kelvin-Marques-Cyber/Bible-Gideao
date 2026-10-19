/** Original authored albedo atlas; crop each tile to its own shared runtime texture. */
export const ofraMaterialsV2 = {
  url: 'assets/ofra-materials-v2.png', width: 1254, height: 1254,
  columns: 3, rows: 3, cellSize: 418, inset: 2,
  wrapping: 'mirrored-repeat',
  crops: {
    limestone: { x: 2, y: 2, width: 414, height: 414 },
    adobe: { x: 420, y: 2, width: 414, height: 414 },
    wood: { x: 838, y: 2, width: 414, height: 414 },
    dirt: { x: 2, y: 420, width: 414, height: 414 },
    sand: { x: 420, y: 420, width: 414, height: 414 },
    linen: { x: 838, y: 420, width: 414, height: 414 },
    leather: { x: 2, y: 838, width: 414, height: 414 },
    terracotta: { x: 420, y: 838, width: 414, height: 414 },
    water: { x: 838, y: 838, width: 414, height: 414 },
  },
} as const;

export type AuthoredMaterialId = keyof typeof ofraMaterialsV2.crops;

export const oliveSprigV2 = {
  url: 'assets/olive-sprig-v2.png',
  width: 1774, height: 887, aspect: 2,
  alphaTest: 0.38,
  // Use the full image as the card texture; spaces between lanceolate leaves are transparent.
} as const;
