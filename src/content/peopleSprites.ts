/** Original NPC atlas. Explicit alpha-derived rectangles; rows are character types, not directions. */
export const peopleAtlas = {
  url: 'assets/people-walk.png', width: 1254, height: 1254,
  canvasWidth: 256, canvasHeight: 320,
  rows: ['pura', 'woman', 'elder', 'guard'],
  frames: [
    [
      { x: 106, y: 9, width: 196, height: 297 },
      { x: 412, y: 9, width: 194, height: 297 },
      { x: 708, y: 9, width: 193, height: 298 },
      { x: 1022, y: 9, width: 197, height: 297 },
    ],
    [
      { x: 103, y: 317, width: 176, height: 303 },
      { x: 403, y: 317, width: 187, height: 304 },
      { x: 709, y: 317, width: 190, height: 302 },
      { x: 1025, y: 317, width: 189, height: 306 },
    ],
    [
      { x: 80, y: 625, width: 189, height: 311 },
      { x: 377, y: 625, width: 213, height: 311 },
      { x: 704, y: 627, width: 182, height: 309 },
      { x: 997, y: 626, width: 212, height: 311 },
    ],
    [
      { x: 100, y: 935, width: 161, height: 300 },
      { x: 414, y: 928, width: 165, height: 309 },
      { x: 726, y: 930, width: 154, height: 308 },
      { x: 1045, y: 929, width: 160, height: 309 },
    ],
  ],
} as const;
