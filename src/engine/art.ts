import * as THREE from 'three';

export function random(seed: number) {
  let value = seed;
  return () => { value = Math.imul(1664525, value) + 1013904223 | 0; return (value >>> 0) / 4294967296; };
}

export function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  draw(canvas.getContext('2d')!);
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function stoneTexture() {
  const rnd = random(91);
  const texture = canvasTexture(256, 256, ctx => {
    ctx.fillStyle = '#8d7a5d'; ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 32) for (let x = -32; x < 256; x += 64) {
      const sx = x + (y / 32 % 2) * 32, v = Math.floor(140 + rnd() * 46);
      ctx.fillStyle = `rgb(${v + 24},${v + 8},${v - 21})`; ctx.fillRect(sx + 2, y + 2, 60, 28);
      ctx.fillStyle = '#ffffff13'; ctx.fillRect(sx + 3, y + 2, 58, 3);
      ctx.fillStyle = '#342d2228'; ctx.fillRect(sx + 3, y + 27, 59, 3);
      for (let n = 0; n < 14; n++) { ctx.fillStyle = rnd() > .5 ? '#fff2d116' : '#44351f17'; ctx.fillRect(sx + rnd() * 60, y + rnd() * 28, 2, 2); }
    }
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(1.5, 1); texture.magFilter = THREE.NearestFilter;
  return texture;
}

export function groundTexture() {
  const rnd = random(52);
  const texture = canvasTexture(512, 512, ctx => {
    ctx.fillStyle = '#a49a62'; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 30000; i++) { ctx.fillStyle = ['#655d3722', '#e5cd871e', '#7c7a4133', '#f1e2ae22'][Math.floor(rnd() * 4)]; const r = 1 + rnd() * 5; ctx.fillRect(rnd() * 512, rnd() * 512, r, r); }
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(7, 7); texture.magFilter = THREE.NearestFilter;
  return texture;
}

export function glowTexture() {
  return canvasTexture(128, 128, ctx => { const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, '#fffbd9ff'); g.addColorStop(.14, '#ffcc75b0'); g.addColorStop(.4, '#ffad3e22'); g.addColorStop(1, '#ffb13b00'); ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128); });
}

export function characterTexture(kind: string, direction: number, frame: number): THREE.CanvasTexture {
  const hero = kind === 'gideao', enemy = kind === 'guard', woman = kind === 'woman';
  const robe = hero ? '#c8b993' : enemy ? '#694d49' : woman ? '#987d81' : kind === 'pura' ? '#728d8c' : '#b5a17a';
  const light = hero ? '#e2d3a5' : enemy ? '#88706a' : woman ? '#b99c9c' : kind === 'pura' ? '#8faaaa' : '#d0bd94';
  const dark = hero ? '#817555' : enemy ? '#443940' : woman ? '#655561' : kind === 'pura' ? '#3b5c64' : '#887b58';
  const skin = '#b28156', skinLight = '#c49a6c', hair = '#342d29';
  const step = frame === 1 ? -2 : frame === 3 ? 2 : 0;
  const back = direction === 2;
  return canvasTexture(48, 64, ctx => {
    const rect = (color: string, x: number, y: number, w: number, h: number) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
    // Pixel clusters remain deliberate and readable at handheld scale.
    rect('#302821', 17 + step, 55, 6, 5); rect('#302821', 26 - step, 55, 6, 5);
    rect('#594a36', 17 + step, 51, 5, 6); rect('#594a36', 26 - step, 51, 5, 6);
    rect(dark, 13, 29, 22, 24); rect(robe, 15, 26, 18, 27);
    rect(light, 18, 27, 5, 23); rect(dark, 28, 31, 4, 22);
    rect(light, 14, 47, 17, 4); rect(robe, 11, 48, 24, 4);
    rect('#493e2c', 14, 36, 20, 3); rect('#bca165', 24, 36, 3, 3);
    rect(dark, 10, 29 + step / 2, 6, 15); rect(light, 10, 29 + step / 2, 4, 8); rect(skin, 10, 40 + step / 2, 4, 6);
    rect(dark, 32, 29 - step / 2, 6, 14); rect(robe, 33, 29 - step / 2, 4, 8); rect(skin, 33, 40 - step / 2, 4, 5);
    rect(hair, 16, 8, 17, 18); rect(skin, 17, 13, 15, 14); rect(skinLight, 19, 13, 11, 10);
    if (!back) { rect(hair, 16, 9, 17, 7); rect(hair, 16, 14, 4, 8); rect(hair, 29, 15, 4, 8); rect(hair, 19, 23, 12, 5); rect('#282726', 21, 18, 2, 2); rect('#282726', 28, 18, 2, 2); rect('#e4b67f', 24, 20, 3, 3); rect('#845739', 23, 25, 5, 1); }
    else { rect(hair, 17, 10, 15, 16); rect('#4e4031', 20, 10, 9, 13); }
    if (hero) { rect('#96784c', 14, 7, 19, 4); rect('#d6c59e', 15, 9, 18, 3); rect('#5c543c', 30, 12, 4, 18); rect('#d0bd8a', 31, 13, 2, 18); rect('#6e5840', 29, 30, 2, 17); rect('#9a9e91', 31, 40, 2, 12); }
    if (enemy) { rect('#827362', 14, 8, 20, 5); rect('#b9aa83', 16, 6, 15, 4); rect('#675c54', 17, 28, 16, 10); rect('#a39170', 19, 29, 2, 8); rect('#a39170', 25, 29, 2, 8); rect('#58432d', 38, 14, 2, 43); rect('#b3b9ad', 37, 8, 4, 9); }
    if (woman) { rect('#bca88f', 13, 7, 20, 5); rect('#9e8b7a', 12, 10, 6, 20); rect('#9e8b7a', 30, 10, 5, 20); }
    if (kind === 'pura') { rect('#a0ae9c', 14, 8, 20, 4); rect('#5e6962', 30, 11, 4, 20); }
    // Directional side profiles, never simply mirroring the same frame.
    if (direction === 1 || direction === 3) { rect(hair, direction === 1 ? 17 : 28, 16, 3, 8); rect(skinLight, direction === 1 ? 30 : 15, 18, 4, 5); }
  });
}

export function animalTexture(kind: 'sheep' | 'camel', frame: number) {
  const camel = kind === 'camel';
  return canvasTexture(64, 48, ctx => {
    const r = (c: string, x: number, y: number, w: number, h: number) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    const coat = camel ? '#b79461' : '#d5cdb3', shade = camel ? '#866746' : '#a29d89';
    r(shade, 14, 20, 32, 17); r(coat, 14, 17, 31, 16); r(coat, 10, 23, 40, 7);
    if (camel) { r(coat, 22, 12, 15, 9); r(coat, 42, 9, 6, 22); r(coat, 44, 6, 13, 7); r('#312a21', 51, 8, 2, 2); }
    else { r('#6c6250', 43, 21, 11, 11); r('#ede2c5', 42, 17, 8, 6); r('#302b25', 49, 23, 2, 2); }
    for (const x of [17, 24, 37, 43]) { const d = frame % 2 ? (x % 2 ? 2 : -2) : 0; r(shade, x + d, 32, 3, camel ? 13 : 9); r('#4f4434', x + d, camel ? 43 : 39, 4, 2); }
    r(shade, 8, 23, 5, 3);
  });
}
