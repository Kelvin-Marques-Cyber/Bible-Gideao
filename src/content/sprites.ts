/** Original ImageGen atlas. Explicit source rectangles avoid depending on generated grid spacing. */
export const gideaoAtlas = {
  url: 'assets/gideao-walk.png', width: 1254, height: 1254,
  canvasWidth: 256, canvasHeight: 320,
  rows: ['front', 'left', 'back', 'right'],
  frames: [
    [
      { x: 107, y: 9, width: 193, height: 296 },
      { x: 406, y: 9, width: 195, height: 296 },
      { x: 687, y: 9, width: 191, height: 296 },
      { x: 980, y: 9, width: 193, height: 296 },
    ],
    [
      { x: 98, y: 311, width: 194, height: 293 },
      { x: 380, y: 311, width: 221, height: 296 },
      { x: 686, y: 311, width: 205, height: 293 },
      { x: 969, y: 311, width: 222, height: 296 },
    ],
    [
      { x: 102, y: 616, width: 168, height: 293 },
      { x: 366, y: 616, width: 204, height: 295 },
      { x: 679, y: 615, width: 167, height: 294 },
      { x: 958, y: 620, width: 196, height: 291 },
    ],
    [
      { x: 65, y: 913, width: 209, height: 296 },
      { x: 363, y: 913, width: 230, height: 296 },
      { x: 656, y: 916, width: 204, height: 293 },
      { x: 950, y: 915, width: 238, height: 294 },
    ],
  ],
} as const;
