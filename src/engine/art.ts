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
    ctx.fillStyle = '#929165'; ctx.fillRect(0, 0, 512, 512);
    for(let i=0;i<100;i++){const x=rnd()*512,y=rnd()*512,r=12+rnd()*80,g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,['#beb08088','#69774f88','#ad9a6d77','#78815288'][i%4]);g.addColorStop(1,'#8b875900');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
    for (let i = 0; i < 25000; i++) { ctx.fillStyle = ['#514a302f', '#dbc9952b', '#4e634238', '#e1d5a22b','#91a1682f'][Math.floor(rnd() * 5)]; const r = 1 + rnd() * 4; ctx.fillRect(rnd() * 512, rnd() * 512, r, r); }
    for(let i=0;i<1300;i++){const x=rnd()*512,y=rnd()*512;ctx.fillStyle='#68734e80';ctx.fillRect(x,y,1,4);ctx.fillStyle='#a8ac7488';ctx.fillRect(x+1,y,1,2);}
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(7, 7); texture.magFilter = THREE.NearestFilter;
  return texture;
}

export function adobeTexture() {
  const rnd=random(18),texture=canvasTexture(256,256,ctx=>{
    ctx.fillStyle='#bca582';ctx.fillRect(0,0,256,256);
    for(let i=0;i<9500;i++){const v=rnd();ctx.fillStyle=v<.3?'#66543819':v<.7?'#e4d2aa1c':'#f6e4bf22';ctx.fillRect(rnd()*256,rnd()*256,1+rnd()*4,1+rnd()*3);}
    for(let i=0;i<60;i++){const x=rnd()*256,y=rnd()*256;ctx.strokeStyle='#6e5b3d26';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+2,y+5);ctx.lineTo(x-1,y+10);ctx.lineTo(x+3,y+16);ctx.stroke();}
    for(let y=0;y<256;y+=42){ctx.fillStyle='#66583c19';ctx.fillRect(0,y,256,1);for(let x=0;x<256;x+=76)ctx.fillRect(x+(y%84?38:0),y,1,42);}
    for(let i=0;i<90;i++){ctx.fillStyle='#6a583c1c';ctx.fillRect(rnd()*256,210+rnd()*46,2+rnd()*9,2+rnd()*7);}
  });texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.magFilter=THREE.NearestFilter;return texture;
}

export function woodTexture() {
  const rnd=random(19),texture=canvasTexture(128,256,ctx=>{
    ctx.fillStyle='#897050';ctx.fillRect(0,0,128,256);
    for(let x=0;x<128;x+=16){ctx.fillStyle=x%32?'#5f493333':'#b2936544';ctx.fillRect(x,0,15,256);ctx.fillStyle='#382e273d';ctx.fillRect(x,0,1,256);}
    for(let i=0;i<300;i++){ctx.fillStyle=i%2?'#372c2626':'#d8b67d28';ctx.fillRect(rnd()*128,rnd()*256,1,4+rnd()*45);}
    for(let i=0;i<8;i++){ctx.strokeStyle='#3c2e2766';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(rnd()*128,rnd()*256,2,7,0,0,Math.PI*2);ctx.stroke();}
  });texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.magFilter=THREE.NearestFilter;return texture;
}

export function foliageTexture() {
  const rnd=random(77),texture=canvasTexture(128,128,ctx=>{
    ctx.fillStyle='#9ca67e';ctx.fillRect(0,0,128,128);
    for(let i=0;i<1100;i++){const x=rnd()*128,y=rnd()*128,w=2+Math.floor(rnd()*5),h=1+Math.floor(rnd()*3);ctx.fillStyle=['#556a46','#738455','#a9b07d','#d1c992','#8c9b66'][Math.floor(rnd()*5)];ctx.fillRect(x,y,w,h);if(i%3===0){ctx.fillStyle='#d6d09b88';ctx.fillRect(x,y,w-1,1);}}
  });texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.magFilter=THREE.NearestFilter;return texture;
}

export function roofTexture() {
  const rnd=random(44),texture=canvasTexture(256,256,ctx=>{
    ctx.fillStyle='#a38e69';ctx.fillRect(0,0,256,256);
    for(let i=0;i<1500;i++){ctx.fillStyle=i%3?'#e1cb9630':'#68513730';ctx.fillRect(rnd()*256,rnd()*256,1+rnd()*2,3+rnd()*16);}
    for(let y=0;y<256;y+=24){ctx.fillStyle='#d2bc8726';ctx.fillRect(0,y,256,2);ctx.fillStyle='#705f4326';ctx.fillRect(0,y+2,256,1);}
  });texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(2,2);texture.magFilter=THREE.NearestFilter;return texture;
}

export function pathTexture() {
  const rnd=random(41),texture=canvasTexture(128,256,ctx=>{
    for(let y=0;y<256;y+=2)for(let x=0;x<128;x+=2){const edge=Math.min(x,127-x),a=Math.min(1,Math.max(0,(edge-2+rnd()*8)/18)),shade=Math.floor(137+rnd()*20);ctx.fillStyle=`rgba(${shade+18},${shade},${shade-29},${a})`;ctx.fillRect(x,y,2,2);}
    for(let i=0;i<650;i++){ctx.fillStyle=i%2?'#3d39202c':'#e6d5a238';ctx.fillRect(12+rnd()*104,rnd()*256,1+rnd()*3,1+rnd()*2);}
  });texture.wrapT=THREE.RepeatWrapping;texture.magFilter=THREE.NearestFilter;return texture;
}

export function hazeTexture() {
  return canvasTexture(256,128,ctx=>{const g=ctx.createRadialGradient(128,64,3,128,64,124);g.addColorStop(0,'#dfd8b840');g.addColorStop(.5,'#dfd8b820');g.addColorStop(1,'#dfd8b800');ctx.fillStyle=g;ctx.fillRect(0,0,256,128);});
}

export function limestoneTexture() {
  const rnd=random(59),texture=canvasTexture(256,256,ctx=>{
    ctx.fillStyle='#a79f86';ctx.fillRect(0,0,256,256);
    for(let i=0;i<14000;i++){ctx.fillStyle=['#514d3820','#e3dcc42b','#80775b29','#c5b99229'][i%4];const r=1+rnd()*5;ctx.fillRect(rnd()*256,rnd()*256,r,r*.6);}
    for(let i=0;i<32;i++){const x=rnd()*256,y=rnd()*256;ctx.strokeStyle='#514c3933';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+8,y+3);ctx.lineTo(x+10,y+12);ctx.lineTo(x+18,y+15);ctx.stroke();}
  });texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.magFilter=THREE.NearestFilter;return texture;
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
