import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { animalTexture, characterTexture, glowTexture, groundTexture, random, stoneTexture } from './art';
import { canSeePlayer, moveWithCollisions, type Obstacle } from './movement';
import { gideaoAtlas } from '../content/sprites';

export type Region = 'ofra' | 'altar' | 'harode' | 'midian';
export interface NearbyInteraction { id: string; label: string; name: string; kind: 'npc' | 'object' | 'battle' | 'exit'; distance: number; x: number; z: number; }
export interface WorldCallbacks {
  onNearby?: (interactions: NearbyInteraction[]) => void;
  onPosition?: (position: { x: number; z: number }) => void;
  onInteract?: (id: string) => void;
  onEncounter?: (id: string) => void;
  onStats?: (stats: { fps: number; quality: 'high' | 'low'; drawCalls: number; triangles: number }) => void;
  onDetection?: (amount: number) => void;
}
export interface BattleUnit { id: string; name: string; side: 'ally' | 'enemy'; hp: number; maxHp: number; }
export type BattleVisual = { units: BattleUnit[]; status?: string };
type InteractionDefinition = Omit<NearbyInteraction, 'distance'>;
export const REGION_INTERACTIONS: Record<Region, InteractionDefinition[]> = {
  ofra: [
    { id: 'lagar', name: 'O lagar de Gideão', label: 'Examinar o lagar', kind: 'object', x: 0, z: 4 },
    { id: 'joas', name: 'Joás', label: 'Conversar', kind: 'npc', x: -5, z: 1 },
    { id: 'comerciante', name: 'Mercador de Ofra', label: 'Ver mercadorias', kind: 'npc', x: 6, z: 3 },
    { id: 'celeiro', name: 'O trigo escondido', label: 'Inspecionar o celeiro', kind: 'object', x: -8, z: -5 },
    { id: 'patrulha', name: 'Patrulha midianita', label: 'Enfrentar patrulha', kind: 'battle', x: 11, z: -9 },
    { id: 'caminho-altar', name: 'Trilha do altar', label: 'Seguir a trilha', kind: 'exit', x: 0, z: -14 },
    { id: 'graos-1', name: 'Saco de grãos', label: 'Recolher os grãos', kind: 'object', x: -10, z: 7 },
    { id: 'graos-2', name: 'Saco de grãos', label: 'Recolher os grãos', kind: 'object', x: 7, z: 8 },
    { id: 'graos-3', name: 'Saco de grãos', label: 'Recolher os grãos', kind: 'object', x: -11, z: -9 },
  ],
  altar: [
    { id: 'servos', name: 'Servos de Joás', label: 'Reunir os servos', kind: 'npc', x: 0, z: 6 },
    { id: 'altar-baal', name: 'Altar de Baal', label: 'Derrubar o altar', kind: 'object', x: 0, z: -5 },
    { id: 'poste', name: 'Poste-ídolo', label: 'Cortar o poste', kind: 'object', x: 4, z: -5 },
    { id: 'joas', name: 'Joás', label: 'Conversar com Joás', kind: 'npc', x: -6, z: 5 },
    { id: 'la', name: 'A lã na eira', label: 'Observar a lã', kind: 'object', x: -5, z: -8 },
    { id: 'caminho-harode', name: 'Caminho de Harode', label: 'Seguir para Harode', kind: 'exit', x: 0, z: -14 },
  ],
  harode: [
    { id: 'comandante', name: 'O acampamento de Israel', label: 'Reunir os homens', kind: 'npc', x: 0, z: 4 },
    { id: 'armeiro', name: 'Armeiro israelita', label: 'Inspecionar equipamentos', kind: 'npc', x: -6, z: 2 },
    { id: 'fonte', name: 'Fonte de Harode', label: 'Aproximar-se das águas', kind: 'object', x: 7, z: -4 },
    { id: 'pura', name: 'Purá', label: 'Conversar com Purá', kind: 'npc', x: 3, z: -8 },
    { id: 'mirante', name: 'Mirante do vale', label: 'Observar o vale', kind: 'object', x: 8, z: -11 },
    { id: 'caminho-midian', name: 'Trilha de reconhecimento', label: 'Descer ao vale', kind: 'exit', x: 0, z: -14 },
  ],
  midian: [
    { id: 'pura', name: 'Purá', label: 'Conversar em voz baixa', kind: 'npc', x: 0, z: 7 },
    { id: 'sonho', name: 'A tenda dos soldados', label: 'Ouvir a conversa', kind: 'object', x: -5, z: -4 },
    { id: 'companhia', name: 'As três companhias', label: 'Distribuir os equipamentos', kind: 'object', x: -7, z: 5 },
    { id: 'sinal', name: 'O alto da colina', label: 'Dar o sinal', kind: 'object', x: 0, z: -10 },
    { id: 'unidade', name: 'Unidade em retirada', label: 'Proteger os companheiros', kind: 'battle', x: 9, z: -7 },
    { id: 'epilogo', name: 'Caminho de volta', label: 'Contemplar o amanhecer', kind: 'exit', x: 0, z: 9 },
  ],
};

interface Actor { id: string; kind: string; group: THREE.Group; body: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>; frames: THREE.Texture[][]; base: THREE.Vector3; route: THREE.Vector3[]; waypoint: number; speed: number; phase: number; direction: number; guard: boolean; }
interface Flame { light?: THREE.PointLight; mesh: THREE.Mesh; glow: THREE.Sprite; phase: number; base: number; }
interface WindObject { object: THREE.Object3D; base: number; phase: number; strength: number; }
interface Attack { actor: THREE.Object3D; start: THREE.Vector3; end: THREE.Vector3; progress: number; target?: THREE.Mesh; }

/** Imperative renderer: React owns UI and campaign state; this class owns the living 3D world. */
export class World {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.OrthographicCamera(-14, 14, 10, -10, .1, 180);
  readonly player = new THREE.Group();
  private root = new THREE.Group();
  private readonly callbacks: WorldCallbacks;
  private readonly container: HTMLElement;
  private readonly resizeObserver: ResizeObserver;
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private region: Region = 'ofra';
  private obstacles: Obstacle[] = [];
  private actors: Actor[] = [];
  private hero!: Actor;
  private flames: Flame[] = [];
  private wind: WindObject[] = [];
  private keys = new Set<string>();
  private input = new THREE.Vector2();
  private cameraTarget = new THREE.Vector3(0, 0, 3);
  private readonly cameraOffset = new THREE.Vector3(13.5, 18, 22);
  private time = 0;
  private lastTime = 0;
  private frame = 0;
  private raf = 0;
  private paused = false;
  private disposed = false;
  private quality: 'high' | 'low' = 'high';
  private qualityPinned = false;
  private softwareRenderer = false;
  private fps = 60;
  private sampleTime = 0;
  private sampleFrames = 0;
  private slowSamples = 0;
  private nearby: NearbyInteraction[] = [];
  private detection = 0;
  private encounterCooldown = 0;
  private cinematic: { kind: string; progress: number; duration: number } | null = null;
  private objective = 'lagar';
  private markers = new Map<string, THREE.Group>();
  private battle = new THREE.Group();
  private battleUnits = new Map<string, THREE.Object3D>();
  private battleActive = false;
  private attack: Attack | null = null;
  private particles!: THREE.Points;
  private dustPositions!: Float32Array;
  private dustLife = new Float32Array(96);
  private dustCursor = 0;
  private dust!: THREE.Points;
  private water?: THREE.Mesh<THREE.CircleGeometry, THREE.MeshStandardMaterial>;
  private sun!: THREE.DirectionalLight;
  private ambient!: THREE.HemisphereLight;
  private altarGroup?: THREE.Group;
  private interiors: {x:number;z:number;width:number;depth:number;cutaway:THREE.Group}[] = [];
  private victory = false;
  private readonly stone = new THREE.MeshStandardMaterial({ map: stoneTexture(), roughness: .96, color: '#d6c9a2' });
  private readonly adobe = new THREE.MeshStandardMaterial({ color: '#c4aa7d', roughness: 1 });
  private readonly timber = new THREE.MeshStandardMaterial({ color: '#685237', roughness: .95 });
  private readonly sand = new THREE.MeshStandardMaterial({ color: '#d3b67d', roughness: 1 });
  private readonly glow = glowTexture();
  private readonly contactShadowMaterial = new THREE.MeshBasicMaterial({color:'#242a21',transparent:true,opacity:.17,depthWrite:false});
  private readonly foliageMaterial = new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:1});
  private readonly textureCache = new Map<string, THREE.Texture[][]>();
  private readonly materialCache = new Map<string, THREE.MeshStandardMaterial>();
  private readonly onKeyDown = (event: KeyboardEvent) => { if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault(); this.keys.add(event.key.toLowerCase()); };
  private readonly onKeyUp = (event: KeyboardEvent) => this.keys.delete(event.key.toLowerCase());
  private readonly onBlur = () => { this.keys.clear(); this.input.set(0, 0); };

  constructor(container: HTMLElement, callbacks: WorldCallbacks = {}) {
    this.callbacks = callbacks; this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace; this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.16;
    this.renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;image-rendering:auto;';
    this.renderer.domElement.setAttribute('aria-label', 'Mundo tridimensional de Bible — Gideão');
    this.renderer.domElement.setAttribute('data-testid', 'world-canvas');
    container.appendChild(this.renderer.domElement);
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(800, 600), .28, .5, .95);
    this.composer.addPass(this.bloom); this.composer.addPass(new OutputPass());
    const gl=this.renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');
    this.softwareRenderer=!!debug&&/swiftshader|llvmpipe|software|softpipe/i.test(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL));
    this.scene.add(this.root, this.player, this.battle);
    this.hero = this.createActor('gideao', 'gideao', 0, 6, 0); this.player.add(this.hero.group);
    this.hero.group.position.set(0, 0, 0); this.player.position.set(0, 0, 6);
    this.loadHeroArtwork();
    this.setRegion('ofra');
    if(this.softwareRenderer||window.innerWidth<900)this.setQuality('low',true);
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(container); this.resize();
    window.addEventListener('keydown', this.onKeyDown); window.addEventListener('keyup', this.onKeyUp); window.addEventListener('blur', this.onBlur);
    this.raf = requestAnimationFrame(this.tick);
  }

  private material(color: THREE.ColorRepresentation, roughness = 1) { const key=`${new THREE.Color(color).getHexString()}:${roughness}`;let material=this.materialCache.get(key);if(!material){material=new THREE.MeshStandardMaterial({color,roughness});this.materialCache.set(key,material);}return material; }
  private box(x: number, y: number, z: number, width: number, height: number, depth: number, material: THREE.Material, parent: THREE.Object3D = this.root) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  private cylinder(x: number, y: number, z: number, top: number, bottom: number, height: number, mat: THREE.Material, segments = 8, parent: THREE.Object3D = this.root) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, segments), mat); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  private contactShadow(x:number,z:number,width:number,depth:number) { const mesh=new THREE.Mesh(new THREE.CircleGeometry(1,12),this.contactShadowMaterial);mesh.rotation.x=-Math.PI/2;mesh.position.set(x+.3,.017,z+.45);mesh.scale.set(width/2,depth/2,1);this.root.add(mesh); }

  private loadHeroArtwork() {
    const source = new Image();
    source.onload = () => {
      if(this.disposed)return;
      const rowMap=[0,3,2,1];
      const frames = rowMap.map(row=>gideaoAtlas.frames[row].map(crop=>{
        const canvas=document.createElement('canvas');canvas.width=256;canvas.height=320;
        const ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;ctx.drawImage(source,crop.x,crop.y,crop.width,crop.height,(256-crop.width)/2,320-crop.height-6,crop.width,crop.height);
        const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.LinearFilter;return texture;
      }));
      this.textureCache.set('gideao-atlas',frames);this.hero.frames=frames;this.hero.body.material.map=frames[0][0];this.hero.body.material.needsUpdate=true;this.hero.body.userData.artwork=frames[0][0];this.hero.body.userData.atlas=true;
      this.hero.body.geometry.dispose();this.hero.body.geometry=new THREE.PlaneGeometry(1.48,1.85);this.hero.body.position.y=.925;
    };
    source.src=`${import.meta.env.BASE_URL}${gideaoAtlas.url}`;
  }

  private resize() {
    const { width, height } = this.container.getBoundingClientRect(); if (!width || !height) return;
    this.renderer.setSize(width, height, false); this.composer.setSize(width, height);
    const halfHeight = width / height > 1.7 ? 9.5 : width / height < 1 ? 12 : 10;
    this.camera.top = halfHeight; this.camera.bottom = -halfHeight; this.camera.left = -halfHeight * width / height; this.camera.right = halfHeight * width / height; this.camera.updateProjectionMatrix();
  }

  setRegion(region: Region) {
    this.region = region; this.obstacles = []; this.actors = []; this.flames = []; this.wind = []; this.interiors=[]; this.markers.clear(); this.water = undefined; this.altarGroup = undefined;
    this.scene.remove(this.root); this.disposeGroup(this.root); this.root = new THREE.Group(); this.scene.add(this.root);
    this.victory = false; this.detection = 0; this.battleActive = false; this.battle.visible = false; this.encounterCooldown = 0;
    this.buildLighting(region); this.buildTerrain();
    if (region === 'ofra') this.buildOfra(); else if (region === 'altar') this.buildAltar(); else if (region === 'harode') this.buildHarode(); else this.buildMidian();
    this.buildParticles(); this.buildMarkers(); this.batchStaticMeshes();
    this.player.position.set(0, 0, region === 'midian' ? 9 : 6); this.player.visible = true;
    this.cameraTarget.copy(this.player.position); this.camera.position.copy(this.cameraTarget).add(this.cameraOffset); this.camera.lookAt(this.cameraTarget);
    this.notifyNearby(); this.callbacks.onPosition?.({ x: this.player.position.x, z: this.player.position.z });
  }

  private buildLighting(region: Region) {
    const day = region === 'ofra';
    this.scene.background = new THREE.Color(day ? '#b8b8a0' : region === 'harode' ? '#71808c' : '#182738');
    this.scene.fog = new THREE.FogExp2(day ? '#c4bb9a' : region === 'harode' ? '#879497' : '#1d3145', day ? .012 : .016);
    this.ambient = new THREE.HemisphereLight(day ? '#cdd9d3' : '#92add0', day ? '#7a684b' : '#263036', day ? .95 : .85); this.root.add(this.ambient);
    this.sun = new THREE.DirectionalLight(day ? '#ffe1a1' : region === 'harode' ? '#ffe5bf' : '#a4b9ec', day ? 2.9 : region === 'harode' ? 2.5 : 1.2);
    this.sun.position.set(-13, 19, -8); this.sun.castShadow = true; this.sun.shadow.mapSize.set(this.quality==='high'?1024:512, this.quality==='high'?1024:512);
    Object.assign(this.sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: .5, far: 85 }); this.sun.shadow.bias = -.0007; this.sun.shadow.normalBias = .035;
    this.root.add(this.sun, this.sun.target);
    const fill = new THREE.DirectionalLight(day ? '#ffc576' : '#c5d1ff', day ? .5 : .3); fill.position.set(10, 8, 12); this.root.add(fill);
    if (!day && region !== 'harode') {
      const positions = new Float32Array(420 * 3); const rnd = random(84);
      for (let i = 0; i < 420; i++) { positions[i * 3] = (rnd() - .5) * 150; positions[i * 3 + 1] = 16 + rnd() * 50; positions[i * 3 + 2] = -18 - rnd() * 65; }
      const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)); this.root.add(new THREE.Points(geometry, new THREE.PointsMaterial({ color: '#e2e7da', size: .085, sizeAttenuation: true, transparent: true, opacity: .75, depthWrite: false })));
    }
    const orb = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glow, color: day ? '#ffd396' : '#b8d3ee', opacity: day ? .8 : .5, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); orb.position.set(-20, 18, -35); orb.scale.set(22, 22, 1); this.root.add(orb);
  }

  private buildTerrain() {
    const terrain = new THREE.Mesh(new THREE.PlaneGeometry(110, 110, 1, 1), new THREE.MeshStandardMaterial({ map: groundTexture(), color: this.region === 'midian' ? '#a49575' : '#d9cc9c', roughness: 1 })); terrain.rotation.x = -Math.PI / 2; terrain.receiveShadow = true; terrain.position.y = -.025; this.root.add(terrain);
    this.box(0, -1.15, 0, 39, 2.2, 39, this.material('#7e7053'));
    const rnd = random(517);
    for (let i = 0; i < 30; i++) {
      const side = i % 3, x = side === 0 ? -27 - rnd() * 20 : side === 1 ? 25 + rnd() * 25 : (rnd() - .5) * 92, z = side === 2 ? -25 - rnd() * 26 : (rnd() - .6) * 90;
      const height = 6 + rnd() * 13;
      const mountain = new THREE.Mesh(new THREE.ConeGeometry(7 + rnd() * 9, height, 5 + Math.floor(rnd() * 3)), this.material(this.region === 'ofra' ? ['#777765','#84816b','#8c886d','#6c705f'][i%4] : ['#35464e','#3c4c55','#42535b','#354550'][i%4]));
      mountain.position.set(x, height / 2 - 2, z); mountain.rotation.y = rnd() * 6.28; mountain.receiveShadow = true; this.root.add(mountain);
    }
    // Irregular limestone ridge frames the walkable landscape without artificial maze walls.
    for (let i = 0; i < 75; i++) {
      const angle = i / 75 * Math.PI * 2, r = 19.5 + rnd() * 2.7;
      if (Math.abs(Math.sin(angle)) < .14) continue;
      this.rock(Math.cos(angle) * r, Math.sin(angle) * r, 1.2 + rnd() * 1.8, false);
    }
    this.path([{ x: 0, z: 16 }, { x: 1, z: 6 }, { x: -.5, z: 0 }, { x: 1, z: -7 }, { x: 0, z: -18 }], 2.6);
    this.path([{ x: -16, z: 1 }, { x: -6, z: 1 }, { x: 0, z: 2 }, { x: 7, z: 3 }, { x: 16, z: 4 }], 1.85);
    this.grass();
  }

  private path(points: { x: number; z: number }[], width: number) {
    const vertices: number[] = [], uvs: number[] = [], indices: number[] = [];
    for (let i = 0; i < points.length; i++) {
      const prev = points[Math.max(0, i - 1)], next = points[Math.min(points.length - 1, i + 1)]; const tangent = new THREE.Vector2(next.x - prev.x, next.z - prev.z).normalize();
      vertices.push(points[i].x - tangent.y * width / 2, .008, points[i].z + tangent.x * width / 2, points[i].x + tangent.y * width / 2, .008, points[i].z - tangent.x * width / 2); uvs.push(0, i, 1, i);
      if (i < points.length - 1) { const a = i * 2; indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(indices); g.computeVertexNormals(); const m = new THREE.Mesh(g, this.material('#a99267')); m.receiveShadow = true; this.root.add(m);
  }

  private rock(x: number, z: number, size: number, collision = true) {
    const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 0), this.material('#a69c7e')); mesh.position.set(x, size * .35, z); mesh.scale.set(1.1, .65, .9); mesh.rotation.set(.1, x * 2.5, .2); mesh.castShadow = true; mesh.receiveShadow = true; this.root.add(mesh);
    if (collision && size > .65) this.obstacles.push({ x, z, width: size * 1.45, depth: size * 1.35 }); return mesh;
  }

  private grass() {
    const rnd = random(73), count = 1800; const geometry = new THREE.ConeGeometry(.045, .28, 3); geometry.translate(0, .12, 0);
    const material = this.material(this.region === 'midian' ? '#8a895e' : '#7c854a'); const grass = new THREE.InstancedMesh(geometry, material, count); const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) { const x = (rnd() - .5) * 39, z = (rnd() - .5) * 39; dummy.position.set(x, -.01, z); dummy.scale.setScalar(.5 + rnd()); dummy.rotation.y = rnd() * Math.PI; if (Math.abs(x) < 1.8 || Math.abs(z - 2) < 1.2) dummy.scale.setScalar(.03); dummy.updateMatrix(); grass.setMatrixAt(i, dummy.matrix); const color = new THREE.Color().setHSL(.16 + rnd() * .03, .24, .3 + rnd() * .14); grass.setColorAt(i, color); }
    this.root.add(grass);
  }

  private house(x: number, z: number, width = 4, depth = 3.6, height = 2.7, barn = false, enterable = false) {
    this.contactShadow(x,z,width+1.4,depth+1.5);
    const house = new THREE.Group(); house.position.set(x, 0, z); this.root.add(house);
    const cutaway=new THREE.Group();house.add(cutaway);
    this.box(0, enterable?-.04:.2, 0, width + .3, enterable?.08:.4, depth + .3, this.stone, house);
    if(enterable){
      this.box(-width/2,height/2,0,.23,height,depth,this.stone,house);this.box(width/2,height/2,0,.23,height,depth,this.stone,cutaway);this.box(0,height/2,-depth/2,width,height,.23,this.stone,house);
      const opening=1.3,doorX=.2,leftWidth=width/2+doorX-opening/2,rightWidth=width/2-doorX-opening/2;
      this.box(-width/2+leftWidth/2,height/2,depth/2,leftWidth,height,.24,this.adobe,cutaway);this.box(width/2-rightWidth/2,height/2,depth/2,rightWidth,height,.24,this.adobe,cutaway);this.box(doorX,height-.3,depth/2,opening,.6,.24,this.adobe,cutaway);
      this.obstacles.push({x:x-width/2,z,width:.25,depth},{x:x+width/2,z,width:.25,depth},{x,z:z-depth/2,width,depth:.25},{x:x-width/2+leftWidth/2,z:z+depth/2,width:leftWidth,depth:.25},{x:x+width/2-rightWidth/2,z:z+depth/2,width:rightWidth,depth:.25});
      this.box(-1,.18,-.5,1.1,.35,1.8,this.timber,house);this.box(-1,.39,-.5,1,.12,1.65,this.material('#a89e75'),house);this.box(.9,.48,-.6,1.1,.12,.85,this.timber,house);this.box(.9,.22,-.6,.8,.45,.6,this.timber,house);this.jar(.9,-.6,.21,house);this.jar(1.2,.5,.35,house);
      this.interiors.push({x,z,width,depth,cutaway});
    }else{
      this.box(0, height / 2, 0, width, height, depth, barn ? this.stone : this.adobe, house);
      this.box(0, .66, 0, width + .07, 1.15, depth + .07, this.stone, house);
    }
    // Terrace, parapet, timber headers and a deeply shaded doorway.
    const roof = this.box(0, height + .1, 0, width + .25, .24, depth + .25, this.material('#b6a27a'), enterable?cutaway:house);
    this.box(-width / 2, height + .36, 0, .2, .5, depth + .2, this.adobe, enterable?cutaway:house); this.box(width / 2, height + .36, 0, .2, .5, depth + .2, this.adobe, enterable?cutaway:house); this.box(0, height + .36, -depth / 2, width, .5, .2, this.adobe, enterable?cutaway:house);
    if(!enterable)this.box(.2, .87, depth / 2 + .025, .95, 1.75, .1, this.material('#312a21'), house);
    this.box(.2, 1.78, depth / 2 + .1, 1.25, .23, .2, this.timber, house);
    this.box(.2, .07, depth / 2 + .45, 1.2, .18, .8, this.stone, house);
    for (const sx of [-width * .32, width * .3]) { this.box(sx, 1.85, depth / 2 + .03, .45, .58, .08, this.material('#433a2a'), house); this.box(sx, 1.85, depth / 2 + .08, .04, .58, .08, this.timber, house); }
    for (let i = 0; i < 7; i++) this.box(-width / 2 + .3 + i * width / 7, height - .17, depth / 2 + .12, .11, .15, .36, this.timber, house);
    this.jar(x - width / 2 - .4, z + depth / 2 - .2, .46); this.jar(x + width / 2 - .2, z + depth / 2 + .4, .35);
    if (!barn) { this.box(x + width / 2 + .6, .25, z, 1, .5, .8, this.timber); this.jar(x + width / 2 + .6, z - .2, .23); }
    if(!enterable)this.obstacles.push({ x, z, width: width + .14, depth: depth + .14 });
    roof.userData.house = true;
    return house;
  }

  private jar(x: number, z: number, scale = .4, parent: THREE.Object3D = this.root) {
    const mat = this.material('#ab704d'); this.cylinder(x, scale * .65, z, scale * .65, scale * .5, scale * 1.3, mat, 10, parent); this.cylinder(x, scale * 1.39, z, scale * .33, scale * .55, scale * .38, mat, 10, parent); this.cylinder(x, scale * 1.6, z, scale * .37, scale * .37, scale * .1, this.material('#513e2c'), 10, parent);
  }

  private tree(x: number, z: number, scale = 1, olive = true) {
    this.contactShadow(x+.4,z+.4,3.4*scale,2.8*scale);
    const tree = new THREE.Group(); tree.position.set(x, 0, z); tree.scale.setScalar(scale); this.root.add(tree);
    const trunk = this.cylinder(0, 1.1, 0, .11, .27, 2.2, this.timber, 6, tree); trunk.rotation.z = .12;
    for (let i = 0; i < 3; i++) { const branch = this.cylinder(Math.sin(i * 2) * .35, 1.7, Math.cos(i * 2) * .3, .04, .12, 1.4, this.timber, 5, tree); branch.rotation.z = Math.sin(i * 2) * .6; }
    const canopy = new THREE.Group(); tree.add(canopy); const rnd = random(Math.round((x + 30) * (z + 30))),leafGeometries:THREE.BufferGeometry[]=[];
    for (let i = 0; i < 8; i++) { const color = new THREE.Color(['#6f7b57','#7b865d','#8b9369','#64754f'][Math.floor(rnd()*4)]); const leaf = new THREE.IcosahedronGeometry(.8 + rnd() * .35, 1);const matrix=new THREE.Matrix4().compose(new THREE.Vector3((rnd() - .5) * 2.2, 2.4 + rnd() * .85, (rnd() - .5) * 1.9),new THREE.Quaternion(),new THREE.Vector3(1,.68,1));leaf.applyMatrix4(matrix);const colors=new Float32Array(leaf.attributes.position.count*3);for(let n=0;n<colors.length;n+=3){colors[n]=color.r;colors[n+1]=color.g;colors[n+2]=color.b;}leaf.setAttribute('color',new THREE.BufferAttribute(colors,3));leafGeometries.push(leaf); }
    const foliage=new THREE.Mesh(mergeGeometries(leafGeometries,false)!,this.foliageMaterial);foliage.castShadow=true;foliage.receiveShadow=true;canopy.add(foliage);leafGeometries.forEach(g=>g.dispose());
    this.wind.push({ object: canopy, base: 0, phase: x + z, strength: .025 }); this.obstacles.push({ x, z, width: .45 * scale, depth: .45 * scale });
  }

  private wheat(x: number, z: number, width: number, depth: number, burnt = false) {
    this.box(x, -.005, z, width + .3, .04, depth + .3, this.material(burnt ? '#6a6149' : '#9b8b46'));
    const rnd = random(Math.round((x + 30) * (z + 30))), count = Math.floor(width * depth * 17);
    const stalk = new THREE.InstancedMesh(new THREE.CylinderGeometry(.014, .018, .65, 3), this.material(burnt ? '#776c43' : '#c8ab55'), count);
    const heads = new THREE.InstancedMesh(new THREE.ConeGeometry(.07, .25, 4), this.material(burnt ? '#84764a' : '#e0c475'), count);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) { const xx = x + (rnd() - .5) * width, zz = z + (rnd() - .5) * depth, h = .65 + rnd() * .4; dummy.position.set(xx, h * .4, zz); dummy.rotation.set((rnd() - .5) * .12, rnd() * 6.28, (rnd() - .5) * .15); dummy.scale.set(1, h, 1); dummy.updateMatrix(); stalk.setMatrixAt(i, dummy.matrix); dummy.position.y = h * .8; dummy.updateMatrix(); heads.setMatrixAt(i, dummy.matrix); }
    stalk.receiveShadow = true; heads.receiveShadow = true; this.root.add(stalk, heads);
    this.wind.push({ object: heads, base: 0, phase: x, strength: .004 });
    for (const dz of [-depth / 2 - .2, depth / 2 + .2]) for (let i = 0; i < width / 1.3; i++) { this.box(x - width / 2 + i * 1.3, .25, z + dz, .07, .5, .07, this.timber); }
  }

  private market(x: number, z: number) {
    for (const sx of [-1.5, 1.5]) for (const sz of [-.75, .75]) this.box(x + sx, 1.3, z + sz, .1, 2.6, .1, this.timber);
    const cloth = this.box(x, 2.45, z, 3.3, .08, 2, this.material('#a67449')); cloth.rotation.z = .03;
    for (let i = 0; i < 7; i++) this.box(x - 1.5 + i * .46, 2.45, z, .24, .09, 2.02, this.material('#d1b37c'));
    this.box(x, .7, z + .25, 2.8, .18, .8, this.timber); for (const sx of [-1.15, 1.15]) this.box(x + sx, .35, z + .25, .1, .7, .6, this.timber);
    for (let i = 0; i < 7; i++) this.jar(x - 1.1 + i * .35, z + .2, .12 + i % 3 * .025);
    this.obstacles.push({ x, z, width: 2.7, depth: 1 });
  }

  private torch(x: number, z: number, y = 0, fire = false) {
    const flame = new THREE.Mesh(new THREE.ConeGeometry(fire ? .24 : .11, fire ? .75 : .38, 5), new THREE.MeshBasicMaterial({ color: '#ffce72', transparent: true, opacity: .95 }));
    flame.position.set(x, y + (fire ? .45 : 1.95), z); this.root.add(flame);
    if (!fire) this.cylinder(x, y + .82, z, .05, .07, 1.65, this.timber, 6);
    else { for (let i = 0; i < 5; i++) { const log = this.cylinder(x, .1 + y, z, .1, .12, 1.05, this.timber, 5); log.rotation.set(Math.PI / 2, 0, i * 1.2); } }
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glow, color: '#ffbd5b', transparent: true, opacity: .72, blending: THREE.AdditiveBlending, depthWrite: false })); glow.position.copy(flame.position); glow.scale.setScalar(fire ? 2.5 : 1.5); this.root.add(glow);
    let light: THREE.PointLight | undefined;
    if (this.flames.length < 3) { light = new THREE.PointLight('#ffb864', fire ? 8 : 5, fire ? 7 : 5, 2); light.position.copy(flame.position); this.root.add(light); }
    this.flames.push({ mesh: flame, glow, light, phase: x + z * 2, base: fire ? 8 : 5 });
  }

  private tent(x: number, z: number, scale = 1, enemy = false) {
    const tent = new THREE.Group(); tent.position.set(x, 0, z); tent.scale.setScalar(scale); this.root.add(tent);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute([-1.3,0,1.2, 0,2,1.2, 1.3,0,1.2, -1.3,0,-1.2, 0,2,-1.2, 1.3,0,-1.2],3)); geo.setIndex([0,3,1,1,3,4,1,4,2,2,4,5,3,5,4]); geo.computeVertexNormals();
    const canvas = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: enemy ? '#a08c73' : '#bdb394', side: THREE.DoubleSide, roughness: 1 })); canvas.castShadow = true; canvas.receiveShadow = true; tent.add(canvas);
    for (const zz of [-1.2,1.2]) this.cylinder(0,.95,zz,.04,.05,2.05,this.timber,5,tent);
    this.box(0,2,0,.09,.09,2.8,this.timber,tent);
    this.obstacles.push({ x, z: z - .1, width: 2.4 * scale, depth: 1.9 * scale });
    if (scale > .8) { this.jar(x + 1.35 * scale, z + .7, .3); this.box(x - 1.45 * scale, .25, z + .5, .65, .5, .6, this.timber); }
    return tent;
  }

  private createActor(id: string, kind: string, x: number, z: number, speed = .7, guard = false): Actor {
    let frames = this.textureCache.get(kind);
    if (!frames) { frames = Array.from({ length: 4 }, (_, d) => Array.from({ length: 4 }, (_, f) => kind === 'sheep' || kind === 'camel' ? animalTexture(kind, f) : characterTexture(kind, d, f))); this.textureCache.set(kind, frames); }
    const group = new THREE.Group(); group.position.set(x, 0, z);
    const animal = kind === 'sheep' || kind === 'camel';
    const material = new THREE.MeshStandardMaterial({ map: frames[0][0], transparent: true, alphaTest: .35, roughness: 1, metalness: 0, side: THREE.DoubleSide });
    const body = new THREE.Mesh(new THREE.PlaneGeometry(animal ? 1.35 : .95, animal ? 1 : 1.62), material); body.position.y = animal ? .48 : .81; body.castShadow = true; group.add(body);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(animal ? .5 : .33, 16), new THREE.MeshBasicMaterial({ color: '#1e241c', transparent: true, opacity: .25, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .018; shadow.scale.y = .55; group.add(shadow);
    const actor = { id, kind, group, body, frames, base: new THREE.Vector3(x,0,z), route: [new THREE.Vector3(x,0,z)], waypoint: 0, speed, phase: (x + z) * 2, direction: 0, guard };
    if (id !== 'gideao') { this.root.add(group); this.actors.push(actor); }
    return actor;
  }

  private npc(id: string, kind: string, x: number, z: number, route?: [number, number][], guard = false) {
    const actor = this.createActor(id, kind, x, z, guard ? .75 : .4, guard);
    if (route) actor.route = route.map(([rx,rz]) => new THREE.Vector3(rx,0,rz)); return actor;
  }

  private buildOfra() {
    this.house(-5.9,-3,4.3,3.5,2.8,false,true); this.house(5.7,-3.7,4.5,3.6,3); this.house(-13,6,3.5,3,2.4); this.house(11,7.6,3.5,3.4,2.65); this.house(-8,-8.5,4.7,3.2,2.8,true); this.house(9,-13.5,4,3,2.4);
    this.market(6,1.4); this.path([{x:-7,z:-5},{x:-3,z:-3},{x:0,z:1}],1.3);
    this.wheat(-6.7,9,5.5,3.7); this.wheat(7.2,11.5,5,3.2); this.wheat(-11.4,-14.2,5.2,3,true); this.wheat(12,-4,3,4.7,true);
    for (const [x,z,s] of [[-13,-2,1.2],[-11,11,.9],[11,2,1.1],[5,-10,1.05],[-5,-13,.9],[15,11,1.2],[-15,8,1.2],[14,-11,1]]) this.tree(x,z,s);
    // Sunken winepress, with an original stone threshing floor and a catchment basin.
    this.cylinder(0,.06,3.5,1.55,1.6,.16,this.stone,12); this.cylinder(0,.16,3.5,1.24,1.25,.08,this.material('#a69365'),12);
    for (let i = 0; i < 11; i++) { const a = i / 12 * Math.PI * 2; this.box(Math.cos(a) * 1.48,.24,3.5 + Math.sin(a) * 1.48,.46,.34,.34,this.stone).rotation.y = -a; }
    this.cylinder(-1.6,.05,4.8,.57,.65,.16,this.stone,12); this.cylinder(-1.6,.15,4.8,.4,.4,.06,this.material('#776749'),12);
    for (let i = 0; i < 14; i++) { const stalk = this.box(-.8 + i % 5 * .3,.22,3.2 + Math.floor(i/5)*.22,.04,.035,.6,this.material('#dbc581')); stalk.rotation.y = i * .55; }
    this.box(1.5,.8,4.4,.07,1.6,.07,this.timber).rotation.z=-.4;
    // Village well, wooden bucket and livestock pen.
    this.cylinder(-2.7,.35,-1,.75,.85,.7,this.stone,12); this.cylinder(-2.7,.72,-1,.55,.55,.03,this.material('#304848'),12);
    for (const sx of [-.75,.75]) this.box(-2.7+sx,1.2,-1,.1,2.4,.1,this.timber); this.box(-2.7,2.3,-1,1.8,.14,.18,this.timber);
    this.cylinder(-2.7,1.8,-1,.015,.015,.8,this.timber,4); this.jar(-3.8,-.7,.25);
    this.fence(-13,2,5,4); this.npc('ovelha-1','sheep',-12,2,[[-12,2],[-13,3],[-11,3]]); this.npc('ovelha-2','sheep',-14,1,[[-14,1],[-13,2],[-14,3]]);
    this.npc('joas','elder',-5,1); this.npc('comerciante','elder',6,3); this.npc('moradora','woman',-4,5,[[-4,5],[-4,1],[-7,1],[-7,4]]); this.npc('lavrador','villager',3,-2,[[3,-2],[2,3],[4,5],[6,5]]);
    this.npc('patrulha','guard',11,-9,[[9,-8],[12,-9],[12,-11],[9,-10]],true); this.npc('patrulha-2','guard',12,-10,[[11,-10],[13,-11],[13,-8]],true);
    this.torch(-6,0); this.torch(5,4); this.torch(1,-12);
    this.jar(-8.5,-5,.5); this.jar(-7.8,-5,.4); this.box(-7,-5.5,-5,.2,.2,.2,this.timber);
    this.cart(-10,-4); this.cart(12,5.5);
    for(const [x,z] of [[-10,7],[7,8],[-11,-9]]){const sack=new THREE.Mesh(new THREE.SphereGeometry(.29,7,5),this.material('#bba67b'));sack.scale.set(.9,1.4,.9);sack.position.set(x,.33,z);sack.castShadow=true;this.root.add(sack);this.cylinder(x,.69,z,.09,.15,.13,this.timber,6);}
  }

  private fence(x: number, z: number, width: number, depth: number) {
    for (const dz of [-depth/2,depth/2]) { for (let i=0;i<=width;i++) this.box(x-width/2+i,.45,z+dz,.08,.9,.08,this.timber); this.box(x,.4,z+dz,width,.07,.06,this.timber); this.box(x,.7,z+dz,width,.07,.06,this.timber); }
    for (const dx of [-width/2,width/2]) { this.box(x+dx,.4,z,.07,.07,depth,this.timber); this.box(x+dx,.7,z,.07,.07,depth,this.timber); }
  }

  private cart(x: number, z: number) {
    this.box(x,.65,z,1.8,.15,1.2,this.timber); this.box(x,.95,z-.58,1.8,.5,.07,this.timber); this.box(x,.95,z+.58,1.8,.5,.07,this.timber);
    for (const zz of [-.8,.8]) { const wheel = new THREE.Mesh(new THREE.TorusGeometry(.48,.055,5,12),this.timber); wheel.rotation.x = Math.PI/2; wheel.position.set(x,.5,z+zz); this.root.add(wheel); this.box(x,.5,z+zz,.9,.065,.065,this.timber); }
    this.box(x+1.4,.6,z,1.4,.07,.07,this.timber); this.jar(x-.3,z,.4);
  }

  private buildAltar() {
    this.house(-10,0,4,3.3,2.7); this.house(10,3,4,3.4,2.6); this.house(-9,9,4,3,2.8);
    for (const [x,z,s] of [[-12,-9,1.4],[10,-10,1.3],[-5,1,1],[8,10,1],[13,-3,1]]) this.tree(x,z,s);
    this.path([{x:0,z:3},{x:0,z:-5},{x:0,z:-14}],3); this.path([{x:-7,z:6},{x:-5,z:1},{x:-5,z:-8}],1.5);
    const altar = new THREE.Group(); this.altarGroup = altar; this.root.add(altar);
    this.box(0,.18,-6.5,5,.35,3.6,this.stone,altar); this.box(0,.48,-6.5,3.8,.4,2.8,this.stone,altar); this.box(0,1.1,-6.8,2.4,1.1,1.65,this.stone,altar); this.box(0,1.8,-6.8,2.8,.3,1.95,this.stone,altar);
    this.obstacles.push({x:0,z:-6.8,width:3,depth:2.3});
    this.box(4,1.8,-6.2,.35,3.6,.4,this.timber,altar); this.box(4,2.8,-6.2,1.5,.26,.3,this.timber,altar); this.obstacles.push({x:4,z:-6.2,width:.6,depth:.6});
    for (const x of [-2.2,2.2]) this.torch(x,-5.5); this.torch(-7,4); this.torch(0,8); this.torch(-4,-9);
    this.cylinder(-5,.03,-8,1.7,1.7,.06,this.sand,20); this.box(-5,.1,-8,.9,.13,.65,this.material('#ded5b9'));
    this.npc('joas','elder',-6,5); this.npc('servos','pura',0,6); this.npc('servo-2','villager',1,6.5); this.npc('servo-3','villager',-.8,7.1);
    for(let i=4;i<=10;i++)this.npc(`servo-${i}`,'villager',-1.4+(i%4)*.85,7.7+Math.floor((i-4)/4)*.9);
    this.npc('sentinela','guard',7,-2,[[7,-2],[8,-6],[7,-10],[6,-4]],true);
    this.cart(8,6); this.jar(-8,1,.5); this.jar(-8.8,1.2,.4);
  }

  private buildHarode() {
    for (const [x,z,s] of [[-8,5,1.2],[-10,-1,1.1],[-6,-6,1.2],[5,4,1],[11,2,1],[-11,-10,1]]) this.tent(x,z,s);
    this.market(-6,.4); this.path([{x:0,z:2},{x:6,z:0},{x:7,z:-4},{x:8,z:-11}],1.5);
    const water = new THREE.Mesh(new THREE.CircleGeometry(2.6,32),new THREE.MeshStandardMaterial({color:'#659795',roughness:.2,metalness:.25,transparent:true,opacity:.9})); water.rotation.x=-Math.PI/2; water.position.set(8,.04,-5.7); water.scale.set(1,1.7,1); this.root.add(water); this.water=water;
    for (let i=0;i<17;i++) {const a=i/17*6.28;this.rock(8+Math.cos(a)*2.6,-5.7+Math.sin(a)*4,.35+i%3*.15,false);}
    this.obstacles.push({x:8.8,z:-6.5,width:2.4,depth:4});
    for (const [x,z,s] of [[13,-9,1.3],[-14,2,1.1],[12,8,1.2],[-6,-13,1.2]]) this.tree(x,z,s);
    this.npc('comandante','elder',0,4); this.npc('armeiro','villager',-6,2); this.npc('pura','pura',3,-8);
    for (let i=0;i<10;i++) {const x=-3+i%4*1.5,z=-2-Math.floor(i/4)*2.3;this.npc(`israelita-${i}`,'villager',x,z,[[x,z],[x+.4,z+.7],[x-.3,z+.5]]);}
    this.torch(-2,1,0,true); this.torch(-8,-4,0,true); this.torch(6,3,0,true);
    this.cart(-5,8); this.cart(10,6);
    for(let i=0;i<9;i++)this.jar(-8+i*.38,-4,.2);
    this.distantCamp(0,-34,20);
  }

  private buildMidian() {
    this.path([{x:0,z:12},{x:-3,z:7},{x:-7,z:3},{x:-7,z:-4},{x:-2,z:-10},{x:0,z:-15}],1.5);
    for (const [x,z,s] of [[-10,-5,1.3],[0,-5,1.1],[6,-1,1.2],[10,-11,1.2],[-13,4,1],[-5,-11,1.1],[13,6,1],[-11,-12,1]]) this.tent(x,z,s,true);
    this.distantCamp(0,-24,55); this.distantCamp(-25,-4,25); this.distantCamp(27,-8,25);
    for (const [x,z,s] of [[-4,2,1],[3,5,1.4],[-6,-1,1.1],[4,-10,1],[-10,8,1.3],[11,-5,1]]) this.rock(x,z,s);
    for (const [x,z] of [[-8,-2],[3,-4],[10,3],[-11,-9],[9,-10],[-2,-13]]) this.torch(x,z,0,true);
    this.npc('pura','pura',0,7);
    this.npc('soldado-sonho','guard',-5.7,-5); this.npc('soldado-ouvinte','guard',-4.3,-5.2);
    this.npc('guarda-1','guard',2,1,[[2,1],[5,1],[5,-7],[2,-7]],true); this.npc('guarda-2','guard',-4,-7,[[-4,-7],[-8,-7],[-8,-1],[-4,-1]],true);
    this.npc('unidade','guard',9,-7,[[9,-7],[10,-7],[10,-8]],false);
    this.npc('camelo-1','camel',12,3,[[12,3],[13,2],[12,1]]); this.npc('camelo-2','camel',-13,-2,[[-13,-2],[-12,-3],[-13,-4]]);
    for(let i=0;i<6;i++){this.jar(-7+i%3*.5,4.1+Math.floor(i/3)*.5,.25);this.box(-8+i*.25,.25,5.5,.08,.5,.08,this.timber);}
    for (let i=0;i<15;i++) this.npc(`companhia-${i}`,'villager',-10+i%5*1.05,9+Math.floor(i/5)*1.1);
  }

  private distantCamp(x: number, z: number, count: number) {
    const rnd=random(count+21);
    for(let i=0;i<count;i++) {const xx=x+(rnd()-.5)*35,zz=z+(rnd()-.5)*14;const scale=.55+rnd()*.4;const t=new THREE.Mesh(new THREE.ConeGeometry(1.25*scale,1.7*scale,4),this.material(i%3===0?'#736957':'#a5987d'));t.rotation.y=Math.PI/4;t.position.set(xx,.85*scale,zz);t.castShadow=false;t.receiveShadow=true;this.root.add(t);if(i%3===0){const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:this.glow,color:'#ffc167',transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false}));glow.position.set(xx+1.2,.45,zz);glow.scale.setScalar(1.2);this.root.add(glow);}}
  }

  private buildMarkers() {
    for (const point of REGION_INTERACTIONS[this.region]) {
      const marker=new THREE.Group();marker.position.set(point.x,2.1,point.z);
      const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.14,0),new THREE.MeshBasicMaterial({color:'#eedaa0'}));gem.rotation.z=Math.PI/4;marker.add(gem);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.24,.015,4,20),new THREE.MeshBasicMaterial({color:'#e8c374',transparent:true,opacity:.7}));ring.rotation.x=Math.PI/2;ring.position.y=-1.98;marker.add(ring);
      this.root.add(marker);this.markers.set(point.id,marker);
    }
  }

  private buildParticles() {
    const rnd=random(12),positions=new Float32Array(150*3);
    for(let i=0;i<150;i++){positions[i*3]=(rnd()-.5)*48;positions[i*3+1]=.4+rnd()*8;positions[i*3+2]=(rnd()-.5)*48;}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));this.particles=new THREE.Points(geometry,new THREE.PointsMaterial({color:this.region==='ofra'?'#ffe5ac':'#e2c69c',size:.045,transparent:true,opacity:.4,depthWrite:false}));this.root.add(this.particles);
    this.dustPositions=new Float32Array(96*3);this.dustPositions.fill(-100);const dustGeometry=new THREE.BufferGeometry();dustGeometry.setAttribute('position',new THREE.BufferAttribute(this.dustPositions,3));this.dust=new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:'#d9c493',size:.105,transparent:true,opacity:.27,depthWrite:false}));this.root.add(this.dust);this.dustLife.fill(0);
  }

  private batchStaticMeshes() {
    this.root.updateMatrixWorld(true);
    const animated=new Set<THREE.Object3D>([...this.actors.map(a=>a.group),...this.wind.map(w=>w.object),...this.flames.map(f=>f.mesh),...this.markers.values(),...this.interiors.map(i=>i.cutaway)]);
    if(this.altarGroup)animated.add(this.altarGroup);if(this.water)animated.add(this.water);
    const groups=new Map<string,{meshes:THREE.Mesh[];material:THREE.Material;cast:boolean;receive:boolean}>();
    this.root.traverse(object=>{
      if(!(object instanceof THREE.Mesh)||object instanceof THREE.InstancedMesh||Array.isArray(object.material))return;
      let ancestor:THREE.Object3D|null=object;while(ancestor&&ancestor!==this.root){if(animated.has(ancestor))return;ancestor=ancestor.parent;}
      const key=`${object.material.uuid}:${object.castShadow}:${object.receiveShadow}`;let group=groups.get(key);if(!group){group={meshes:[],material:object.material,cast:object.castShadow,receive:object.receiveShadow};groups.set(key,group);}group.meshes.push(object);
    });
    for(const group of groups.values()){
      if(group.meshes.length<2)continue;
      const geometries=group.meshes.map(mesh=>mesh.geometry.clone().applyMatrix4(mesh.matrixWorld));const merged=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());if(!merged)continue;
      const mesh=new THREE.Mesh(merged,group.material);mesh.castShadow=group.cast;mesh.receiveShadow=group.receive;mesh.name='Static world batch';this.root.add(mesh);
      for(const original of group.meshes){original.removeFromParent();original.geometry.dispose();}
    }
  }

  private notifyNearby() {
    if(this.battleActive){if(this.nearby.length){this.nearby=[];this.callbacks.onNearby?.([]);}return;}
    const p=this.player.position;const points=REGION_INTERACTIONS[this.region].map(point=>({...point,distance:Math.hypot(p.x-point.x,p.z-point.z)})).filter(point=>point.distance<2.5).sort((a,b)=>a.distance-b.distance);
    this.nearby=points;this.callbacks.onNearby?.(points);
  }

  setInput(x: number,z: number) { this.input.set(x,z); if(this.input.length()>1)this.input.normalize(); }
  setPaused(paused: boolean) { this.paused=paused;if(paused){this.input.set(0,0);this.keys.clear();} }
  setPosition(x: number,z: number) { this.player.position.set(THREE.MathUtils.clamp(x,-17.5,17.5),0,THREE.MathUtils.clamp(z,-17.5,17.5));this.cameraTarget.copy(this.player.position);this.notifyNearby();this.callbacks.onPosition?.({x:this.player.position.x,z:this.player.position.z}); }
  getPosition() { return {x:this.player.position.x,z:this.player.position.z}; }
  getDebugInfo() { return {region:this.region,position:this.getPosition(),fps:this.fps,nearby:this.nearby.map(p=>p.id),obstacles:this.obstacles.map(o=>({...o})),quality:this.quality,battle:this.battleActive}; }
  interact() { if(this.nearby[0])this.callbacks.onInteract?.(this.nearby[0].id); }
  setObjective(id: string) { this.objective=id; }

  setQuality(quality: 'high'|'low', automatic=false) {
    this.quality=quality;if(!automatic)this.qualityPinned=true;this.renderer.setPixelRatio(quality==='high'?Math.min(window.devicePixelRatio||1,1.35):this.softwareRenderer?.6:.85);this.renderer.shadowMap.enabled=!this.softwareRenderer;this.sun.shadow.mapSize.set(quality==='high'?1024:512,quality==='high'?1024:512);this.sun.shadow.map?.dispose();this.sun.shadow.map=null;this.bloom.enabled=quality==='high';this.resize();
  }

  setBattle(state: boolean | BattleVisual | null) {
    this.battleActive=!!state;this.battle.visible=!!state;this.input.set(0,0);this.keys.clear();
    if(!state){this.player.visible=true;this.notifyNearby();return;}
    this.player.visible=false;
    const units=typeof state==='boolean'?[{id:'gideao',name:'Gideão',side:'ally' as const,hp:100,maxHp:100},{id:'pura',name:'Purá',side:'ally' as const,hp:100,maxHp:100},{id:'enemy-0',name:'Saqueador',side:'enemy' as const,hp:100,maxHp:100},{id:'enemy-1',name:'Lanceiro',side:'enemy' as const,hp:100,maxHp:100}]:state.units;
    if(this.battleUnits.size&&units.every(unit=>this.battleUnits.has(unit.id))){for(const unit of units){const actor=this.battleUnits.get(unit.id)!;actor.visible=unit.hp>0;}return;}
    this.disposeGroup(this.battle);this.battle.clear();this.battleUnits.clear();
    const center=this.player.position.clone();let allies=0,enemies=0;
    for(const unit of units){const ally=unit.side==='ally',index=ally?allies++:enemies++,isGideon=unit.id==='gideao'||unit.id==='gideon';const actor=this.createActor(`battle-${unit.id}`,ally?(isGideon?'gideao':unit.id==='pura'?'pura':'villager'):'guard',0,0,0);this.actors=this.actors.filter(a=>a!==actor);this.root.remove(actor.group);this.battle.add(actor.group);actor.group.position.set(center.x+(ally?-3.0:2.8)+(index%2)*.45,0,center.z+(index-1)*1.8);actor.body.quaternion.copy(this.camera.quaternion);if(isGideon&&this.hero.body.userData.artwork){actor.body.material.map=this.hero.body.userData.artwork;actor.body.scale.set(1.2,1.2,1);actor.body.position.y=.98;}this.battleUnits.set(unit.id,actor.group);actor.group.userData.body=actor.body;actor.group.visible=unit.hp>0;}
    this.cameraTarget.copy(center);this.callbacks.onNearby?.([]);this.nearby=[];
  }

  animateAttack(actorId: string,targetId: string) {
    const actor=this.battleUnits.get(actorId)||[...this.battleUnits.values()][0],target=this.battleUnits.get(targetId)||[...this.battleUnits.values()].at(-1);if(!actor||!target)return;
    this.attack={actor,start:actor.position.clone(),end:actor.position.clone().lerp(target.position,.65),progress:0,target:target.userData.body};
  }

  playCinematic(kind='intro',duration=5) {
    if(kind==='army'&&this.region==='harode'&&this.player.position.distanceTo(new THREE.Vector3(7,0,-4))<3)kind='water';
    this.cinematic={kind,progress:0,duration};
    if(kind.includes('altar')&&this.altarGroup&&!this.altarGroup.userData.falling){this.altarGroup.userData.falling=true;for(let i=0;i<9;i++)this.rock(Math.sin(i*2.2)*1.7,-6+Math.cos(i*1.6),.25+i%3*.09,false);const post=this.cylinder(4,.2,-5.5,.15,.18,3.2,this.timber,6);post.rotation.z=Math.PI/2-.1;this.box(1.2,.5,-7.7,1.2,.8,1,this.stone);for(const actor of this.actors.filter(a=>a.id.startsWith('servo'))){actor.route=[actor.group.position.clone(),new THREE.Vector3(actor.group.position.x*.4,0,-3.8)];actor.speed=.7;}}
    if(kind==='army'||kind==='water'){const soldiers=this.actors.filter(a=>a.id.startsWith('israelita-'));const departing=kind==='water'?soldiers.slice(3):soldiers.slice(6);for(const soldier of departing){soldier.route=[soldier.group.position.clone(),new THREE.Vector3(-3,0,17)];soldier.speed=1.25;soldier.group.userData.departing=true;}}
    if(['signal','sinal','victory','torches','tochas','finale','trumpets'].some(s=>kind.includes(s))&&!this.victory){this.victory=true;this.bloom.strength=.65;for(let i=0;i<35;i++){const a=i/35*6.28;this.torch(Math.cos(a)*15,Math.sin(a)*15);}this.sun.color.set('#ffbf78');this.sun.intensity=2.3;for(const actor of this.actors.filter(a=>a.kind==='guard')){actor.route=[actor.group.position.clone(),new THREE.Vector3(actor.group.position.x<0?-18:18,0,-16)];actor.speed=2.1;actor.guard=false;}}
  }

  private animateActor(actor: Actor,dt: number,moving: boolean,dx=0,dz=0) {
    actor.body.quaternion.copy(this.camera.quaternion);
    const frame=moving?Math.floor(this.time*7+actor.phase)%4:0;
    if(Math.abs(dx)+Math.abs(dz)>.01)actor.direction=Math.abs(dx)>Math.abs(dz)?dx>0?1:3:dz>0?0:2;
    if(actor.body.userData.artwork&&!actor.body.userData.atlas){actor.body.scale.x=(actor.direction===3?-1:1)*(moving?1+Math.sin(this.time*13)*.015:1);actor.body.rotation.z+=moving?Math.sin(this.time*12)*.025:Math.sin(this.time*1.8)*.008;}
    else actor.body.material.map=actor.frames[actor.direction][frame];
    actor.body.position.y=(actor.kind==='sheep'||actor.kind==='camel'?.48:actor.body.userData.atlas?.925:actor.body.userData.artwork?.96:.81)+(moving?Math.abs(Math.sin(this.time*9+actor.phase))*.035:Math.sin(this.time*2+actor.phase)*.009);
    if(dt<0)return;
  }

  private updateMovement(dt: number) {
    const x=this.input.x+(this.keys.has('d')||this.keys.has('arrowright')?1:0)-(this.keys.has('a')||this.keys.has('arrowleft')?1:0),z=this.input.y+(this.keys.has('s')||this.keys.has('arrowdown')?1:0)-(this.keys.has('w')||this.keys.has('arrowup')?1:0);
    const vector=new THREE.Vector2(x,z);if(vector.length()>1)vector.normalize();
    const moving=vector.lengthSq()>.01;
    // The screen right and screen up vectors follow the fixed three-quarter camera.
    const right=new THREE.Vector3(this.cameraOffset.z,0,-this.cameraOffset.x).normalize(),down=new THREE.Vector3(this.cameraOffset.x,0,this.cameraOffset.z).normalize();
    const direction=right.multiplyScalar(vector.x).add(down.multiplyScalar(vector.y));const speed=this.region==='midian'?2.35:3.25;
    if(moving){const next=moveWithCollisions(this.player.position,direction.x*dt*speed,direction.z*dt*speed,this.obstacles);this.player.position.x=next.x;this.player.position.z=next.z;if(this.frame%5===0){const i=this.dustCursor++%96;this.dustPositions[i*3]=next.x+(Math.random()-.5)*.3;this.dustPositions[i*3+1]=.04;this.dustPositions[i*3+2]=next.z;this.dustLife[i]=1;}}
    this.animateActor(this.hero,dt,moving,direction.x,direction.z);
  }

  private updateActors(dt: number) {
    for(const actor of this.actors){let dx=0,dz=0,moving=false;
      if(actor.group.userData.departing&&actor.group.position.z>16){actor.group.visible=false;continue;}
      if(actor.route.length>1&&!this.battleActive){const goal=actor.route[actor.waypoint],delta=goal.clone().sub(actor.group.position);if(delta.length()<.15){actor.waypoint=(actor.waypoint+1)%actor.route.length;}else {delta.normalize();dx=delta.x;dz=delta.z;actor.group.position.addScaledVector(delta,dt*actor.speed);moving=true;}}
      this.animateActor(actor,dt,moving,dx,dz);
      if(this.region==='midian'&&actor.guard&&!this.paused&&!this.battleActive&&!this.cinematic&&canSeePlayer({x:actor.group.position.x,z:actor.group.position.z,angle:Math.atan2(dx||.1,dz||1)},this.player.position,this.obstacles)){this.detection=Math.min(1,this.detection+dt*.65);}
    }
    if(this.region==='midian'){this.detection=Math.max(0,this.detection-dt*.16);this.callbacks.onDetection?.(this.detection);if(this.detection>=.97&&this.encounterCooldown<=0){this.detection=0;this.encounterCooldown=18;this.callbacks.onEncounter?.('unidade');}}
    this.encounterCooldown=Math.max(0,this.encounterCooldown-dt);
  }

  private updateCamera(dt: number) {
    let target=this.player.position.clone(),offset=this.cameraOffset.clone(),zoom=1;
    if(this.cinematic){const scene=this.cinematic;scene.progress+=dt;const t=Math.min(1,scene.progress/scene.duration),ease=t*t*(3-2*t);
      if(scene.kind==='intro'){target.lerp(new THREE.Vector3(-2,0,-4),(1-ease));offset.multiplyScalar(1.45-.45*ease);target.x+=Math.sin(t*Math.PI)*3;zoom=.88+.12*ease;}
      else if(this.victory){target.set(0,0,-5);offset.multiplyScalar(1.2);target.x=Math.sin(t*3)*2;zoom=.88;}
      else if(scene.kind==='army'){target.set(0,0,-3);offset.multiplyScalar(1.35-.15*ease);offset.x+=Math.sin(t*Math.PI)*8;zoom=.86;}
      else if(scene.kind==='water'){target.set(7,0,-4);offset.set(11,13,17);target.x+=Math.sin(t*Math.PI);zoom=1.06;}
      else if(scene.kind==='recon'){target.set(3-ease*5,0,-3-ease*4);offset.set(10,12,16);zoom=1.12;}
      else if(scene.kind==='dream'){target.set(-5,0,-4);offset.set(9,11,14);zoom=1.24;}
      else if(scene.kind==='distribution'){target.set(-7,0,6);offset.x-=Math.sin(t*Math.PI)*6;offset.multiplyScalar(.85);zoom=1.05;}
      else if(scene.kind==='ending'){target.set(0,0,4-ease*9);offset.multiplyScalar(1+ease*.5);zoom=1-.2*ease;this.sun.intensity=THREE.MathUtils.lerp(this.sun.intensity,2.2,dt*.4);this.sun.color.lerp(new THREE.Color('#e8bf84'),dt*.3);}
      else {const point=REGION_INTERACTIONS[this.region].find(p=>scene.kind.includes(p.id));if(point)target.set(point.x,0,point.z);offset.x+=Math.sin(t*Math.PI)*3;zoom=1.08;}
      if(t>=1)this.cinematic=null;
    }
    this.cameraTarget.lerp(target,1-Math.exp(-dt*(this.cinematic?2:5)));this.camera.position.copy(this.cameraTarget).add(offset);this.camera.lookAt(this.cameraTarget.clone().add(new THREE.Vector3(0,.45,0)));this.camera.zoom=THREE.MathUtils.lerp(this.camera.zoom,zoom,1-Math.exp(-dt*3));this.camera.updateProjectionMatrix();
  }

  private updateEffects(dt: number) {
    for(const flame of this.flames){const pulse=1+Math.sin(this.time*13+flame.phase)*.12+Math.sin(this.time*21+flame.phase)*.06;flame.mesh.scale.set(1,pulse,1);flame.glow.material.opacity=.57+pulse*.12;if(flame.light)flame.light.intensity=flame.base*pulse;}
    for(const item of this.wind)item.object.rotation.z=item.base+Math.sin(this.time*1.4+item.phase)*item.strength;
    for(const interior of this.interiors){const p=this.player.position;interior.cutaway.visible=!(Math.abs(p.x-interior.x)<interior.width/2+.15&&p.z>interior.z-interior.depth/2&&p.z<interior.z+interior.depth/2+.65);}
    for(const [id,marker] of this.markers){marker.children[0].rotation.y=this.time*.8;marker.position.y=2.1+Math.sin(this.time*2+marker.position.x)*.08;const active=id===this.objective;marker.visible=active||this.player.position.distanceTo(new THREE.Vector3(marker.position.x,0,marker.position.z))<5;marker.scale.setScalar(active?1.15:.7);}
    this.particles.rotation.y=Math.sin(this.time*.02)*.04;this.particles.position.x=Math.sin(this.time*.05)*.5;
    if(this.water){this.water.material.color.setHSL(.48,.2,.4+Math.sin(this.time*.8)*.015);this.water.position.y=.04+Math.sin(this.time*1.3)*.008;}
    for(let i=0;i<96;i++)if(this.dustLife[i]>0){this.dustLife[i]-=dt;this.dustPositions[i*3]+=(Math.sin(i)*.04+.1)*dt;this.dustPositions[i*3+1]+=.22*dt;if(this.dustLife[i]<=0)this.dustPositions[i*3+1]=-100;}this.dust.geometry.attributes.position.needsUpdate=true;
    if(this.altarGroup?.userData.falling){this.altarGroup.rotation.z=THREE.MathUtils.lerp(this.altarGroup.rotation.z,.13,dt*2);this.altarGroup.position.y=THREE.MathUtils.lerp(this.altarGroup.position.y,-.75,dt*2);}
    if(this.attack){const a=this.attack;a.progress+=dt*2.3;const t=Math.min(1,a.progress),curve=Math.sin(t*Math.PI);a.actor.position.copy(a.start).lerp(a.end,curve);if(a.target){a.target.material instanceof THREE.MeshStandardMaterial&&(a.target.material.emissive.set(curve>.9?'#a03b27':'#000000'));}if(t>=1){a.actor.position.copy(a.start);this.attack=null;}}
    for(const unit of this.battleUnits.values()){const body=unit.userData.body as THREE.Mesh|undefined;if(body)body.quaternion.copy(this.camera.quaternion);}
  }

  private tick = (now: number) => {
    if(this.disposed)return;const actualDt=this.lastTime?(now-this.lastTime)/1000:1/60,dt=Math.min(.05,actualDt);this.lastTime=now;this.time+=dt;this.frame++;
    if(!this.paused&&!this.battleActive&&!this.cinematic)this.updateMovement(dt);else this.animateActor(this.hero,dt,false);
    this.updateActors(this.paused?0:dt);this.updateCamera(dt);this.updateEffects(dt);
    if(this.frame%10===0){this.notifyNearby();if(!this.paused)this.callbacks.onPosition?.(this.getPosition());}
    if(this.quality==='high')this.composer.render();else this.renderer.render(this.scene,this.camera);
    this.sampleFrames++;this.sampleTime+=actualDt;
    if(this.sampleTime>2){this.fps=Math.round(this.sampleFrames/this.sampleTime);this.callbacks.onStats?.({fps:this.fps,quality:this.quality,drawCalls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles});if(this.fps<27)this.slowSamples++;else this.slowSamples=Math.max(0,this.slowSamples-1);if(this.slowSamples>=3&&!this.qualityPinned&&this.quality==='high')this.setQuality('low',true);this.sampleFrames=0;this.sampleTime=0;}
    this.raf=requestAnimationFrame(this.tick);
  };

  private disposeGroup(group: THREE.Object3D) {
    const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();group.traverse(child=>{if(child instanceof THREE.Mesh||child instanceof THREE.Points){geometries.add(child.geometry);const mats=Array.isArray(child.material)?child.material:[child.material];mats.forEach(m=>{if(![this.stone,this.adobe,this.timber,this.sand].includes(m as THREE.MeshStandardMaterial))materials.add(m);});}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
  }

  dispose() {
    this.disposed=true;cancelAnimationFrame(this.raf);this.resizeObserver.disconnect();window.removeEventListener('keydown',this.onKeyDown);window.removeEventListener('keyup',this.onKeyUp);window.removeEventListener('blur',this.onBlur);this.disposeGroup(this.root);this.disposeGroup(this.player);this.disposeGroup(this.battle);this.textureCache.forEach(directions=>directions.flat().forEach(t=>t.dispose()));this.stone.map?.dispose();this.glow.dispose();[this.stone,this.adobe,this.timber,this.sand].forEach(m=>m.dispose());this.materialCache.forEach(m=>m.dispose());this.contactShadowMaterial.dispose();this.foliageMaterial.dispose();this.composer.dispose();this.renderer.dispose();this.renderer.domElement.remove();
  }
}
