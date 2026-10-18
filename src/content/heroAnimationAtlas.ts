/** Original generated pixel-art production sheets. Runtime crops remove isolated alpha spill. */
export const heroAnimationAtlas = {
 walk:{url:'assets/gideao-walk-v2.png',columns:8,rows:4,directions:['front','right','back','left'] as const,referenceHeight:248},
 actions:{url:'assets/gideao-actions-v2.png',columns:4,rows:9,states:['idle','talk','interact','ready','attack','guard','hurt','victory','exhausted'] as const,referenceHeight:208},
 canvasWidth:256,canvasHeight:160,visibleHeight:152,
} as const;
