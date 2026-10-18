/** Original battle silhouettes. Source pixels are not a mathematically uniform grid. */
export const enemiesBattleAtlas = {
  url: 'assets/enemies-battle.png', width: 1254, height: 1254,
  canvasWidth: 640, canvasHeight: 352, canvasAnchorX: 320, baseline: 6,
  rows: ['raider', 'spearman', 'archer', 'captain'],
  poses: ['idle', 'anticipation', 'attack', 'recovery'],
  /** Preserve the largest connected alpha component when cropping neighboring rows. */
  keepLargestComponent: true,
  frames: [
    [
      { x: 56, y: 36, width: 202, height: 275, anchorX: 103 },
      { x: 347, y: 21, width: 252, height: 290, anchorX: 110 },
      { x: 629, y: 62, width: 341, height: 249, anchorX: 114 },
      { x: 1001, y: 67, width: 220, height: 247, anchorX: 103 },
    ],
    [
      { x: 55, y: 313, width: 188, height: 322, anchorX: 100 },
      { x: 340, y: 340, width: 291, height: 290, anchorX: 115 },
      { x: 619, y: 373, width: 413, height: 258, anchorX: 125 },
      { x: 1005, y: 386, width: 246, height: 249, anchorX: 100 },
    ],
    [
      { x: 62, y: 649, width: 196, height: 291, anchorX: 89 },
      { x: 337, y: 625, width: 249, height: 314, anchorX: 112 },
      { x: 665, y: 635, width: 259, height: 304, anchorX: 111 },
      { x: 1018, y: 670, width: 199, height: 268, anchorX: 100 },
    ],
    [
      { x: 39, y: 946, width: 213, height: 286, anchorX: 104 },
      { x: 345, y: 933, width: 231, height: 299, anchorX: 110 },
      { x: 635, y: 972, width: 353, height: 260, anchorX: 116 },
      { x: 1009, y: 977, width: 219, height: 255, anchorX: 100 },
    ],
  ],
} as const;
