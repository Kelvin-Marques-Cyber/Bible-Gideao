import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { adobeTexture, animalTexture, characterTexture, foliageTexture, glowTexture, groundTexture, hazeTexture, limestoneTexture, pathTexture, random, roofTexture, stoneTexture, woodTexture } from './art';
import { canSeePlayer, moveWithCollisions, type Obstacle } from './movement';
import { gideaoAtlas } from '../content/sprites';
import { peopleAtlas } from '../content/peopleSprites';
import { enemiesBattleAtlas } from '../content/enemySprites';
import { BattleStage, type BattleLayout, type StageState, type StageUnit } from './battle/BattleStage';
import type { BattleEvent } from '../game/types';
import { CameraRig,Hd2dPipeline,createLighting,createContactShadowTexture,observeWebGLContext,markLightSource,type LightingRig,type CameraContext,type WorldFocus } from './rendering';
import { buildHouse,buildJar,buildMarket,buildWell,buildWinepress } from './environment/architecture';
import { buildOliveTree,buildUnderstory,buildCropField,createOliveSprigTexture } from './environment/vegetation';
import { buildOfraLandscape,buildComposedPath,buildGrainSack,buildVillagePaving,ofraGroundHeight } from './environment/terrain';
import { createSheep, type SheepModel } from './environment/animals';
import { buildTent } from './environment/tents';
import type { EnvironmentContext } from './environment/context';
import { createCalmGroundTexture,createWornPathTexture,loadEnvironmentTextures } from './environment/materials';
import { oliveSprigV2,type AuthoredMaterialId } from '../content/materialsV2';
import { CharacterAnimator,type CharacterContext } from './characters/CharacterAnimator';
import { loadPeopleFrames } from './characters/PeopleSprites';
import { peopleAtlasV2,type PeopleKindV2 } from '../content/peopleSpritesV2';
export type { BattleLayout } from './battle/BattleStage';

export type Region = 'ofra' | 'altar' | 'harode' | 'midian';
export interface NearbyInteraction { id: string; label: string; name: string; kind: 'npc' | 'object' | 'battle' | 'exit'; distance: number; x: number; z: number; }
export interface WorldCallbacks {
  onNearby?: (interactions: NearbyInteraction[]) => void;
  onPosition?: (position: { x: number; z: number }) => void;
  onInteract?: (id: string) => void;
  onEncounter?: (id: string) => void;
  onStats?: (stats: { fps: number; quality: 'high' | 'low'; drawCalls: number; triangles: number }) => void;
  onDetection?: (amount: number) => void;
  onBattleLayout?: (layout:BattleLayout)=>void;
  onContextChange?:(state:'lost'|'restored')=>void;
  onContextState?:(state:'lost'|'restoring'|'ready')=>void;
}
export type BattleUnit = StageUnit;
export type BattleVisual = StageState;
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
  private bokeh: BokehPass;
  private pipeline:Hd2dPipeline;
  private cameraRig:CameraRig;
  private lightingRig?:LightingRig;
  private contextLost=false;
  private contextCleanup:()=>void=()=>{};
  private heroAnimator=new CharacterAnimator();
  private heroAnimationReady=false;
  private readonly peopleV2Ready=new Set<PeopleKindV2>();
  private foliageOccluders:{mesh:THREE.InstancedMesh;center:THREE.Vector3;radius:number}[]=[];
  private sprigTexture:THREE.Texture=createOliveSprigTexture();
  private authoredTextures:Partial<Record<AuthoredMaterialId,THREE.Texture>>={};
  private readonly ownedEnvironmentTextures=new Set<THREE.Texture>();
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
  private reportedNearby: NearbyInteraction[] = [];
  private detection = 0;
  private encounterCooldown = 0;
  private cinematic: { kind: string; progress: number; duration: number } | null = null;
  private objective = 'lagar';
  private markers = new Map<string, THREE.Group>();
  private battleStage:BattleStage|null=null;
  private explorationSnapshot:{position:THREE.Vector3;quaternion:THREE.Quaternion;zoom:number;target:THREE.Vector3;background:THREE.Scene['background'];fog:THREE.Scene['fog'];cinematic:World['cinematic']}|null=null;
  private battleActive = false;
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
  private restoredStage = -1;
  private readonly stone = new THREE.MeshStandardMaterial({ map: stoneTexture(), roughness: .96, color: '#d6c9a2' });
  private readonly adobe = new THREE.MeshStandardMaterial({ map:adobeTexture(),color: '#e4d7ba', roughness: 1 });
  private readonly timber = new THREE.MeshStandardMaterial({ map:woodTexture(),color: '#b4a38b', roughness: .95 });
  private readonly sand = new THREE.MeshStandardMaterial({ color: '#d3b67d', roughness: 1 });
  private readonly roofMaterial = new THREE.MeshStandardMaterial({map:roofTexture(),color:'#dfcda6',roughness:1});
  private readonly rockMaterial = new THREE.MeshStandardMaterial({map:limestoneTexture(),color:'#e0d7bd',roughness:1});
  private readonly pathMaterial = new THREE.MeshStandardMaterial({map:pathTexture(),color:'#e2d3ac',roughness:1,transparent:true,depthWrite:false});
  private readonly glow = glowTexture();
  private readonly haze = hazeTexture();
  private readonly contactShadowMaterial = new THREE.MeshBasicMaterial({color:'#242a21',transparent:true,opacity:.17,depthWrite:false});
  private readonly foliageMaterial = new THREE.MeshStandardMaterial({map:foliageTexture(),color:'#ffffff',vertexColors:true,roughness:1});
  private readonly textureCache = new Map<string, THREE.Texture[][]>();
  private readonly materialCache = new Map<string, THREE.MeshStandardMaterial>();
  private readonly softwareMaterials = new Map<THREE.MeshStandardMaterial, THREE.MeshLambertMaterial>();
  private readonly onKeyDown = (event: KeyboardEvent) => { if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault(); this.keys.add(event.key.toLowerCase()); };
  private readonly onKeyUp = (event: KeyboardEvent) => this.keys.delete(event.key.toLowerCase());
  private readonly onBlur = () => { this.keys.clear(); this.input.set(0, 0); };

  constructor(container: HTMLElement, callbacks: WorldCallbacks = {},initialRegion:Region='ofra') {
    this.callbacks = callbacks; this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace; this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.16;
    this.renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;image-rendering:auto;';
    this.renderer.domElement.setAttribute('aria-label', 'Mundo tridimensional de Bible — Gideão');
    this.renderer.domElement.setAttribute('data-testid', 'world-canvas');
    container.appendChild(this.renderer.domElement);
    const gl=this.renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');
    this.softwareRenderer=!!debug&&/swiftshader|llvmpipe|software|softpipe/i.test(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL));
    this.cameraRig=new CameraRig(this.camera,{target:this.cameraTarget,offset:this.cameraOffset});
    const rect=container.getBoundingClientRect();
    this.pipeline=new Hd2dPipeline(this.renderer,this.scene,this.camera,{region:initialRegion,quality:this.quality,software:this.softwareRenderer,width:rect.width||960,height:rect.height||540});
    this.composer=this.pipeline.composer;this.bloom=this.pipeline.bloom;this.bokeh=this.pipeline.bokeh;
    this.contactShadowMaterial.map=createContactShadowTexture();this.contactShadowMaterial.opacity=.28;this.contactShadowMaterial.needsUpdate=true;
    this.contextCleanup=observeWebGLContext(this.renderer.domElement,{onLost:()=>{this.contextLost=true;this.keys.clear();this.input.set(0,0);this.callbacks.onContextState?.('lost');},onRestored:()=>{this.contextLost=true;this.callbacks.onContextState?.('restoring');this.pipeline.restore();void this.pipeline.prepare().finally(()=>{if(this.disposed)return;this.contextLost=false;this.lastTime=0;this.callbacks.onContextState?.('ready');});},onChange:state=>this.callbacks.onContextChange?.(state)});
    this.scene.add(this.root, this.player);
    this.hero = this.createActor('gideao', 'gideao', 0, 6, 0); this.player.add(this.hero.group);
    this.hero.group.position.set(0, 0, 0); this.player.position.set(0, 0, 6);
    for(const material of[this.stone,this.adobe,this.timber,this.roofMaterial,this.rockMaterial,this.pathMaterial,this.foliageMaterial])if(material.map)this.ownedEnvironmentTextures.add(material.map);
    this.loadHeroArtwork();this.loadPeopleArtwork();this.loadPeopleV2Artwork();this.loadArchitecturalArtwork();this.loadEnemyArtwork();this.loadHeroAnimations();
    this.setRegion(initialRegion);
    if(this.softwareRenderer||window.innerWidth<900)this.setQuality('low',true);
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(container); this.resize();
    window.addEventListener('keydown', this.onKeyDown); window.addEventListener('keyup', this.onKeyUp); window.addEventListener('blur', this.onBlur);
    void this.pipeline.prepare();
    this.raf = requestAnimationFrame(this.tick);
  }

  private material(color: THREE.ColorRepresentation, roughness = 1) { const key=`${new THREE.Color(color).getHexString()}:${roughness}`;let material=this.materialCache.get(key);if(!material){material=new THREE.MeshStandardMaterial({color,roughness});this.materialCache.set(key,material);}return material; }
  private groundHeight(x:number,z:number){return this.region==='ofra'?ofraGroundHeight(x,z):0;}
  private surfaceMaterial(id:AuthoredMaterialId,color:THREE.ColorRepresentation){const key=`surface:${id}:${new THREE.Color(color).getHexString()}`;let material=this.materialCache.get(key);if(!material){material=new THREE.MeshStandardMaterial({color,map:this.authoredTextures[id]??null,roughness:1});material.userData.surfaceId=id;this.materialCache.set(key,material);}return material;}
  private environmentContext():EnvironmentContext{return{root:this.root,materials:{stone:this.stone,adobe:this.adobe,wood:this.timber,roof:this.roofMaterial,rock:this.rockMaterial,earth:this.sand,leaf:this.foliageMaterial,contact:this.contactShadowMaterial,color:color=>this.material(color)},obstacles:this.obstacles,wind:this.wind,interiors:this.interiors,groundHeight:(x,z)=>this.groundHeight(x,z),occluders:this.foliageOccluders,sprigTexture:this.sprigTexture,surface:(id,color)=>this.surfaceMaterial(id,color),ownTexture:texture=>this.ownedEnvironmentTextures.add(texture)};}
  private box(x: number, y: number, z: number, width: number, height: number, depth: number, material: THREE.Material, parent: THREE.Object3D = this.root) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  private cylinder(x: number, y: number, z: number, top: number, bottom: number, height: number, mat: THREE.Material, segments = 8, parent: THREE.Object3D = this.root) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, segments), mat); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  private contactShadow(x:number,z:number,width:number,depth:number) { const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),this.contactShadowMaterial);mesh.rotation.x=-Math.PI/2;mesh.position.set(x+.3,this.groundHeight(x,z)+.017,z+.45);mesh.scale.set(width,depth,1);this.root.add(mesh); }

  private loadHeroArtwork() {
    const source = new Image();
    source.onload = () => {
      if(this.disposed||this.heroAnimationReady)return;
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

  private loadPeopleArtwork() {
    const source=new Image();source.onload=()=>{
      if(this.disposed)return;
      peopleAtlas.rows.forEach((kind,row)=>{
        if(this.peopleV2Ready.has(kind as PeopleKindV2))return;
        const frames=peopleAtlas.frames[row].map(crop=>{const canvas=document.createElement('canvas');canvas.width=256;canvas.height=320;const ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;ctx.drawImage(source,crop.x,crop.y,crop.width,crop.height,(256-crop.width)/2,320-crop.height-6,crop.width,crop.height);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.LinearFilter;return texture;});
        this.textureCache.set(`people-${kind}`,Array.from({length:4},()=>frames));
      });
      for(const actor of this.actors)this.applyPeopleArtwork(actor);
    };source.src=`${import.meta.env.BASE_URL}${peopleAtlas.url}`;
  }

  private loadPeopleV2Artwork(){
    for(const kind of Object.keys(peopleAtlasV2.characters) as PeopleKindV2[])void loadPeopleFrames(kind,()=>this.disposed).then(frames=>{
      if(this.disposed||!frames.length){frames.flat().forEach(t=>t.dispose());return;}
      const previous=this.textureCache.get(`people-${kind}`);this.textureCache.set(`people-${kind}`,frames);this.peopleV2Ready.add(kind);
      for(const actor of this.actors)if((actor.kind==='villager'?'pura':actor.kind)===kind)this.applyPeopleArtwork(actor);
      if(previous)new Set(previous.flat()).forEach(t=>t.dispose());
    }).catch(()=>{/* Existing sprites remain available when a new offline sheet is unavailable. */});
  }

  private loadHeroAnimations(){void this.heroAnimator.load().then(()=>{if(this.disposed)return;const frames=this.heroAnimator.getWalkFrames();if(!frames.length)return;this.hero.frames=frames;this.heroAnimationReady=true;this.hero.body.userData.animator=true;this.hero.body.userData.atlas=true;this.hero.body.userData.artwork=frames[0][0];this.hero.body.geometry.dispose();const aspect=frames[0][0].userData.spriteAspect??1.6;this.hero.body.geometry=new THREE.PlaneGeometry(1.85*aspect,1.85);this.hero.body.material.map=frames[0][0];this.hero.body.material.needsUpdate=true;}).catch(()=>{this.heroAnimationReady=false;});}

  private loadArchitecturalArtwork() {
    const anisotropy=this.softwareRenderer?1:Math.min(8,this.renderer.capabilities.getMaxAnisotropy());
    void loadEnvironmentTextures(import.meta.env.BASE_URL,anisotropy).then(textures=>{
      if(this.disposed){Object.values(textures).forEach(t=>t.dispose());return;}
      Object.assign(this.authoredTextures,textures);Object.values(textures).forEach(t=>this.ownedEnvironmentTextures.add(t));
      const assign=(material:THREE.MeshStandardMaterial,id:AuthoredMaterialId,tint?:string)=>{let texture:THREE.Texture=textures[id];if(material.userData.calmSoil){texture=createCalmGroundTexture(texture);this.ownedEnvironmentTextures.add(texture);}if(material.userData.tileRepeat){texture=texture.clone();texture.repeat.setScalar(material.userData.tileRepeat);texture.needsUpdate=true;this.ownedEnvironmentTextures.add(texture);}material.map=texture;if(tint)material.color.set(tint);material.bumpMap=texture;material.bumpScale=id==='limestone'?.045:id==='adobe'?.018:.012;material.needsUpdate=true;const software=this.softwareMaterials.get(material);if(software){software.map=texture;software.color.copy(material.color);software.needsUpdate=true;}};
      assign(this.stone,'limestone','#eee7d9');assign(this.adobe,'adobe','#f4eee2');assign(this.timber,'wood','#ded5bd');assign(this.roofMaterial,'sand','#eee2c6');assign(this.rockMaterial,'sand','#d3cfb7');
      for(const material of this.materialCache.values())if(material.userData.surfaceId)assign(material,material.userData.surfaceId);
      const path=createWornPathTexture(textures.sand);path.anisotropy=anisotropy;this.ownedEnvironmentTextures.add(path);this.pathMaterial.map=path;this.pathMaterial.color.set('#e7ddc4');this.pathMaterial.needsUpdate=true;const softwarePath=this.softwareMaterials.get(this.pathMaterial);if(softwarePath){softwarePath.map=path;softwarePath.color.copy(this.pathMaterial.color);softwarePath.needsUpdate=true;}
      this.battleStage?.refreshEnvironmentTextures(this.getBattleTextures());
    }).catch(()=>{/* Procedural fallbacks keep the world navigable if an offline asset is unavailable. */});
    new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}${oliveSprigV2.url}`,texture=>{
      if(this.disposed){texture.dispose();return;}const previous=this.sprigTexture;texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.anisotropy=anisotropy;texture.name='Original silver-green olive sprig';this.sprigTexture=texture;this.ownedEnvironmentTextures.add(texture);
      this.scene.traverse(object=>{if(!(object instanceof THREE.Mesh))return;for(const material of Array.isArray(object.material)?object.material:[object.material])if('map'in material&&material.map===previous){material.map=texture;material.needsUpdate=true;}});
      for(const [source,software]of this.softwareMaterials)if(source.map===previous){source.map=texture;software.map=texture;source.needsUpdate=true;software.needsUpdate=true;}
    });
  }

  private loadEnemyArtwork() {
    const source=new Image();source.onload=()=>{
      if(this.disposed)return;
      enemiesBattleAtlas.rows.forEach((archetype,row)=>{
        const frames=enemiesBattleAtlas.frames[row].map(crop=>{
          const canvas=document.createElement('canvas');canvas.width=enemiesBattleAtlas.canvasWidth;canvas.height=enemiesBattleAtlas.canvasHeight;const ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;
          ctx.drawImage(source,crop.x,crop.y,crop.width,crop.height,enemiesBattleAtlas.canvasAnchorX-crop.anchorX,canvas.height-crop.height-enemiesBattleAtlas.baseline,crop.width,crop.height);
          if(enemiesBattleAtlas.keepLargestComponent)this.keepLargestAlphaComponent(ctx,canvas.width,canvas.height);
          const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.LinearFilter;texture.userData.spriteAspect=canvas.width/canvas.height;texture.userData.visibleHeight=enemiesBattleAtlas.frames[row][0].height/canvas.height;texture.userData.baselineRatio=enemiesBattleAtlas.baseline/canvas.height;return texture;
        });
        this.textureCache.set(`battle-${archetype}`,Array.from({length:4},()=>frames));
      });
    };source.src=`${import.meta.env.BASE_URL}${enemiesBattleAtlas.url}`;
  }

  private keepLargestAlphaComponent(ctx:CanvasRenderingContext2D,width:number,height:number) {
    const pixels=ctx.getImageData(0,0,width,height),labels=new Int32Array(width*height),queue=new Int32Array(width*height);let label=0,largestLabel=0,largestSize=0;
    for(let index=0;index<labels.length;index++){
      if(labels[index]||pixels.data[index*4+3]<26)continue;
      label++;let first=0,last=1;queue[0]=index;labels[index]=label;
      while(first<last){const current=queue[first++],x=current%width,y=Math.floor(current/width);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(dx===0&&dy===0)continue;const nx=x+dx,ny=y+dy;if(nx<0||nx>=width||ny<0||ny>=height)continue;const next=ny*width+nx;if(!labels[next]&&pixels.data[next*4+3]>=26){labels[next]=label;queue[last++]=next;}}}
      if(last>largestSize){largestSize=last;largestLabel=label;}
    }
    for(let index=0;index<labels.length;index++)if(labels[index]!==largestLabel)pixels.data[index*4+3]=0;
    ctx.putImageData(pixels,0,0);
  }

  private applyPeopleArtwork(actor:Actor) {
    const kind=actor.kind==='villager'?'pura':actor.kind,frames=this.textureCache.get(`people-${kind}`);if(!frames)return;
    const directional=this.peopleV2Ready.has(kind as PeopleKindV2);actor.frames=frames;actor.body.geometry.dispose();actor.body.geometry=new THREE.PlaneGeometry(directional?1.85*(frames[0][0].userData.spriteAspect??1.6):1.48,1.85);actor.body.position.y=.925-1.85*(frames[0][0].userData.baselineRatio??0);actor.body.userData.directionalPeople=directional;actor.body.material.map=frames[0][0];actor.body.material.needsUpdate=true;actor.body.userData.peopleAtlas=true;
    if(actor.kind==='villager')actor.body.material.color.set(directional?'#e5e1cf':'#c4b996');
  }

  private resize() {
    const { width, height } = this.container.getBoundingClientRect(); if (!width || !height) return;
    this.pipeline.resize(width,height);
    if(this.battleStage)this.battleStage.resize(width,height);else this.cameraRig.resize(width,height);
  }

  setRegion(region: Region) {
    if(this.battleStage)this.setBattle(null);
    this.region = region; this.obstacles = []; this.actors = []; this.flames = []; this.wind = []; this.interiors=[];this.foliageOccluders=[]; this.markers.clear(); this.water = undefined; this.altarGroup = undefined;
    this.scene.remove(this.root); this.disposeGroup(this.root); this.root = new THREE.Group(); this.scene.add(this.root);
    this.victory = false; this.restoredStage = -1; this.bloom.strength=.28; this.detection = 0; this.battleActive = false; this.encounterCooldown = 0;
    this.buildLighting(region); this.buildTerrain();
    if (region === 'ofra') this.buildOfra(); else if (region === 'altar') this.buildAltar(); else if (region === 'harode') this.buildHarode(); else this.buildMidian();
    this.buildParticles(); this.buildMarkers(); this.batchStaticMeshes();this.applySoftwareLighting();
    this.player.position.set(0, this.groundHeight(0,6), region === 'midian' ? 9 : 6); this.player.visible = true;
    this.cameraRig.snap(this.player.position);
    this.notifyNearby(); this.callbacks.onPosition?.({ x: this.player.position.x, z: this.player.position.z });
  }

  private buildLighting(region: Region) {
    const day = region === 'ofra';
    this.lightingRig?.dispose();this.lightingRig=createLighting(this.scene,this.root,region,this.quality,this.softwareRenderer);this.sun=this.lightingRig.sun;this.ambient=this.lightingRig.ambient;
    this.pipeline.setRegion(region);
    if (!day && region !== 'harode') {
      const positions = new Float32Array(420 * 3); const rnd = random(84);
      for (let i = 0; i < 420; i++) { positions[i * 3] = (rnd() - .5) * 150; positions[i * 3 + 1] = 16 + rnd() * 50; positions[i * 3 + 2] = -18 - rnd() * 65; }
      const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)); this.root.add(new THREE.Points(geometry, new THREE.PointsMaterial({ color: '#e2e7da', size: .085, sizeAttenuation: true, transparent: true, opacity: .75, depthWrite: false })));
    }
    const orb = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glow, color: day ? '#ffd396' : '#b8d3ee', opacity: day ? .8 : .5, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); orb.position.set(-20, 18, -35); orb.scale.set(22, 22, 1); this.root.add(orb);
    for(let i=0;i<3;i++){const haze=new THREE.Sprite(new THREE.SpriteMaterial({map:this.haze,color:day?'#f1d8ab':'#8ea5b7',opacity:day?.18:.12,transparent:true,depthWrite:false}));haze.position.set(-10+i*12,.8+i*.3,-8-i*4);haze.scale.set(27,5,1);this.root.add(haze);}
  }

  private buildTerrain() {
    if(this.region==='ofra'){buildOfraLandscape(this.environmentContext());this.path([{x:0,z:16},{x:1,z:6},{x:-.5,z:0},{x:1,z:-7},{x:0,z:-18}],2.25);this.path([{x:-16,z:1},{x:-6,z:1},{x:0,z:2},{x:7,z:3},{x:16,z:4}],1.65);return;}
    const terrain = new THREE.Mesh(new THREE.PlaneGeometry(110, 110, 1, 1), new THREE.MeshStandardMaterial({ map: groundTexture(), color: this.region === 'midian' ? '#a49575' : '#d9cc9c', roughness: 1 })); terrain.rotation.x = -Math.PI / 2; terrain.receiveShadow = true; terrain.position.y = -.025; this.root.add(terrain);
    this.box(0, -1.15, 0, 39, 2.2, 39, this.material('#7e7053'));
    const rnd = random(517);
    for (let i = 0; i < 30; i++) {
      const side = i % 3, x = side === 0 ? -27 - rnd() * 20 : side === 1 ? 25 + rnd() * 25 : (rnd() - .5) * 92, z = side === 2 ? -25 - rnd() * 26 : (rnd() - .6) * 90;
      const height = 6 + rnd() * 13;
      const mountain = new THREE.Mesh(new THREE.ConeGeometry(7 + rnd() * 9, height, 5 + Math.floor(rnd() * 3)), this.material(['#35464e','#3c4c55','#42535b','#354550'][i%4]));
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
    if(this.region==='ofra'){buildComposedPath(this.environmentContext(),points,width,this.pathMaterial);return;}
    const vertices: number[] = [], uvs: number[] = [], indices: number[] = [];
    for (let i = 0; i < points.length; i++) {
      const prev = points[Math.max(0, i - 1)], next = points[Math.min(points.length - 1, i + 1)]; const tangent = new THREE.Vector2(next.x - prev.x, next.z - prev.z).normalize();
      vertices.push(points[i].x - tangent.y * width / 2, .008, points[i].z + tangent.x * width / 2, points[i].x + tangent.y * width / 2, .008, points[i].z - tangent.x * width / 2); uvs.push(0, i, 1, i);
      if (i < points.length - 1) { const a = i * 2; indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(indices); g.computeVertexNormals(); const m = new THREE.Mesh(g, this.pathMaterial); m.receiveShadow = true; this.root.add(m);
  }

  private rock(x: number, z: number, size: number, collision = true) {
    const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 1), this.rockMaterial); mesh.position.set(x, size * .35, z); mesh.scale.set(1.1, .65, .9); mesh.rotation.set(.1, x * 2.5, .2); mesh.castShadow = true; mesh.receiveShadow = true; this.root.add(mesh);
    if (collision && size > .65) this.obstacles.push({ x, z, width: size * 1.45, depth: size * 1.35 }); return mesh;
  }

  private grass() {
    const rnd = random(73), count = 1800;const blades:number[]=[];for(let i=0;i<3;i++){const a=i*Math.PI/3,xx=Math.cos(a)*.065,zz=Math.sin(a)*.065;blades.push(-xx,0,-zz,xx,0,zz,xx*.35,.26,zz*.35);}const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(blades,3));geometry.computeVertexNormals();
    const material = this.material(this.region === 'midian' ? '#8a895e' : '#7c854a');material.side=THREE.DoubleSide; const grass = new THREE.InstancedMesh(geometry, material, count); const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) { const x = (rnd() - .5) * 39, z = (rnd() - .5) * 39; dummy.position.set(x, -.01, z); dummy.scale.setScalar(.5 + rnd()); dummy.rotation.y = rnd() * Math.PI; if (Math.abs(x) < 1.8 || Math.abs(z - 2) < 1.2) dummy.scale.setScalar(.03); dummy.updateMatrix(); grass.setMatrixAt(i, dummy.matrix); const color = new THREE.Color().setHSL(.16 + rnd() * .03, .24, .3 + rnd() * .14); grass.setColorAt(i, color); }
    this.root.add(grass);
    const flowers=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.045,0),this.material('#e6d29b'),160);for(let i=0;i<160;i++){const x=(rnd()-.5)*32,z=(rnd()-.5)*32;dummy.position.set(x,.18,z);dummy.scale.set(1,.65,1);if(Math.abs(x)<2||Math.abs(z-2)<1.4)dummy.scale.setScalar(.01);dummy.updateMatrix();flowers.setMatrixAt(i,dummy.matrix);}this.root.add(flowers);
  }

  private house(x:number,z:number,width=4,depth=3.6,height=2.7,barn=false,enterable=false){
    this.contactShadow(x,z,width+1.3,depth+1.3);return buildHouse(this.environmentContext(),{x,z,width,depth,height,barn,enterable});
  }

  private jar(x:number,z:number,scale=.4,parent:THREE.Object3D=this.root){buildJar(this.environmentContext(),x,z,scale,parent,parent===this.root?this.groundHeight(x,z):0);}

  private tree(x:number,z:number,scale=1,_olive=true){this.contactShadow(x+.3,z+.3,3.5*scale,2.9*scale);buildOliveTree(this.environmentContext(),x,z,scale);}

  private wheat(x:number,z:number,width:number,depth:number,burnt=false){buildCropField(this.environmentContext(),x,z,width,depth,burnt);}

  private market(x:number,z:number){buildMarket(this.environmentContext(),x,z);}

  private torch(x: number, z: number, y = 0, fire = false) {
    const flame = new THREE.Mesh(new THREE.ConeGeometry(fire ? .24 : .11, fire ? .75 : .38, 5), new THREE.MeshBasicMaterial({ color: '#ffce72', transparent: true, opacity: .95 }));
    flame.position.set(x, y + (fire ? .45 : 1.95), z); this.root.add(flame);
    markLightSource(flame.material,3.8);
    if (!fire) this.cylinder(x, y + .82, z, .05, .07, 1.65, this.timber, 6);
    else { for (let i = 0; i < 5; i++) { const log = this.cylinder(x, .1 + y, z, .1, .12, 1.05, this.timber, 5); log.rotation.set(Math.PI / 2, 0, i * 1.2); } }
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glow, color: '#ffbd5b', transparent: true, opacity: .72, blending: THREE.AdditiveBlending, depthWrite: false })); glow.position.copy(flame.position); glow.scale.setScalar(fire ? 2.5 : 1.5); this.root.add(glow);
    markLightSource(glow.material,3.2);
    let light: THREE.PointLight | undefined;
    if (this.flames.length < 3) { light = new THREE.PointLight('#ffb864', fire ? 8 : 5, fire ? 7 : 5, 2); light.position.copy(flame.position); this.root.add(light); }
    this.flames.push({ mesh: flame, glow, light, phase: x + z * 2, base: fire ? 8 : 5 });
  }

  private tent(x:number,z:number,scale=1,enemy=false){return buildTent(this.environmentContext(),x,z,scale,enemy);}

  private createActor(id: string, kind: string, x: number, z: number, speed = .7, guard = false): Actor {
    let frames = this.textureCache.get(kind);
    if (!frames) { frames = Array.from({ length: 4 }, (_, d) => Array.from({ length: 4 }, (_, f) => kind === 'sheep' || kind === 'camel' ? animalTexture(kind, f) : characterTexture(kind, d, f))); this.textureCache.set(kind, frames); }
    const group = new THREE.Group(); group.position.set(x, this.groundHeight(x,z), z);
    const animal = kind === 'sheep' || kind === 'camel';
    const material = new THREE.MeshStandardMaterial({ map: frames[0][0], transparent: true, alphaTest: .35, roughness: 1, metalness: 0, side: THREE.DoubleSide });
    const body = new THREE.Mesh(new THREE.PlaneGeometry(animal ? 1.35 : .95, animal ? 1 : 1.62), material); body.position.y = animal ? .48 : .81; body.castShadow = true; group.add(body);
    if(kind==='sheep'&&this.region==='ofra'){const model=createSheep();group.add(model.root);group.userData.sheepModel=model;body.visible=false;model.update(0,false,0,0);}
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(animal ? 1.05 : .8,animal ? 1.05 : .8), new THREE.MeshBasicMaterial({ map:this.contactShadowMaterial.map,color: '#1e241c', transparent: true, opacity: .36, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .018; shadow.scale.y = .6; group.add(shadow);
    const actor = { id, kind, group, body, frames, base: new THREE.Vector3(x,0,z), route: [new THREE.Vector3(x,0,z)], waypoint: 0, speed, phase: (x + z) * 2, direction: 0, guard };
    if(id!=='gideao')this.applyPeopleArtwork(actor);
    if (id !== 'gideao') { this.root.add(group); this.actors.push(actor); }
    return actor;
  }

  private npc(id: string, kind: string, x: number, z: number, route?: [number, number][], guard = false) {
    const actor = this.createActor(id, kind, x, z, guard ? .75 : .4, guard);
    if (route) actor.route = route.map(([rx,rz]) => new THREE.Vector3(rx,0,rz)); return actor;
  }

  private buildOfra() {
    buildVillagePaving(this.environmentContext());
    this.house(-5.9,-3,4.3,3.5,2.8,false,true); this.house(5.7,-3.7,4.5,3.6,3); this.house(-13,6,3.5,3,2.4); this.house(11,7.6,3.5,3.4,2.65); this.house(-8,-8.5,4.7,3.2,2.8,true); this.house(9,-13.5,4,3,2.4);
    this.market(6,1.4); this.path([{x:-7,z:-5},{x:-3,z:-3},{x:0,z:1}],1.3);
    this.wheat(-6.7,9,5.5,3.7); this.wheat(7.2,11.5,5,3.2); this.wheat(-11.4,-14.2,5.2,3,true); this.wheat(12,-4,3,4.7,true);
    for (const [x,z,s] of [[-13,-2,1.2],[-11,11,.9],[11,2,1.1],[5,-10,1.05],[-5,-13,.9],[15,11,1.2],[-15,8,1.2],[14,-11,1]]) this.tree(x,z,s);
    buildWinepress(this.environmentContext(),0,3.5);buildWell(this.environmentContext(),-2.7,-1);
    this.fence(-13,2,5,4); this.npc('ovelha-1','sheep',-12,2,[[-12,2],[-13,3],[-11,3]]); this.npc('ovelha-2','sheep',-14,1,[[-14,1],[-13,2],[-14,3]]);
    this.npc('joas','elder',-5,1); this.npc('comerciante','elder',6,3); this.npc('moradora','woman',-4,5,[[-4,5],[-4,1],[-7,1],[-7,4]]); this.npc('lavrador','villager',3,-2,[[3,-2],[2,3],[4,5],[6,5]]);
    this.npc('patrulha','guard',11,-9,[[9,-8],[12,-9],[12,-11],[9,-10]],true); this.npc('patrulha-2','guard',12,-10,[[11,-10],[13,-11],[13,-8]],true);
    this.torch(-6,0); this.torch(5,4); this.torch(1,-12);
    this.jar(-8.5,-5,.5); this.jar(-7.8,-5,.4); this.box(-7,-5.5,-5,.2,.2,.2,this.timber);
    this.cart(-10,-4); this.cart(12,5.5);
    for(const [x,z] of [[-10,7],[7,8],[-11,-9]])buildGrainSack(this.environmentContext(),x,z);
    this.npc('moradora-celeiro','woman',-8.7,-4.9);
    buildUnderstory(this.environmentContext());
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
    const postStem=this.box(4,1.8,-6.2,.35,3.6,.4,this.timber,altar),postCrossbar=this.box(4,2.8,-6.2,1.5,.26,.3,this.timber,altar);altar.userData.post=[postStem,postCrossbar];this.obstacles.push({x:4,z:-6.2,width:.6,depth:.6});
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
      const geometries=group.meshes.map(mesh=>(mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone()).applyMatrix4(mesh.matrixWorld));const merged=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());if(!merged)continue;
      const mesh=new THREE.Mesh(merged,group.material);mesh.castShadow=group.cast;mesh.receiveShadow=group.receive;mesh.name='Static world batch';this.root.add(mesh);
      for(const original of group.meshes){original.removeFromParent();original.geometry.dispose();}
    }
  }

  private applySoftwareLighting() {
    if(!this.softwareRenderer)return;
    this.scene.traverse(object=>{
      if(!(object instanceof THREE.Mesh)||!(object.material instanceof THREE.MeshStandardMaterial))return;
      const source=object.material;let material=this.softwareMaterials.get(source);
      if(!material){material=new THREE.MeshLambertMaterial({color:source.color,map:source.map,transparent:source.transparent,opacity:source.opacity,alphaTest:source.alphaTest,side:source.side,vertexColors:source.vertexColors,depthWrite:source.depthWrite,flatShading:source.flatShading,emissive:source.emissive,emissiveIntensity:source.emissiveIntensity});this.softwareMaterials.set(source,material);}
      object.material=material;
    });
  }

  private notifyNearby() {
    if(this.battleActive){if(this.nearby.length){this.nearby=[];this.reportedNearby=[];this.callbacks.onNearby?.([]);}return;}
    const p=this.player.position;const points=REGION_INTERACTIONS[this.region].map(point=>({...point,distance:Math.hypot(p.x-point.x,p.z-point.z)})).filter(point=>point.distance<2.5).sort((a,b)=>a.distance-b.distance);
    const changed=points.map(p=>p.id).join('|')!==this.reportedNearby.map(p=>p.id).join('|')||Math.abs((points[0]?.distance??0)-(this.reportedNearby[0]?.distance??0))>.35;
    this.nearby=points;if(changed){this.reportedNearby=points;this.callbacks.onNearby?.(points);}
  }

  setInput(x: number,z: number) { this.input.set(x,z); if(this.input.length()>1)this.input.normalize(); }
  setCameraContext(context:CameraContext,focus?:WorldFocus|null){this.cameraRig.setContext(context,focus);}
  setCharacterContext(context:CharacterContext,duration?:number){this.heroAnimator.setContext(context,{duration,force:true});}
  setPaused(paused: boolean) { this.paused=paused;if(paused){this.input.set(0,0);this.keys.clear();} }
  setPosition(x: number,z: number) {const xx=THREE.MathUtils.clamp(x,-17.5,17.5),zz=THREE.MathUtils.clamp(z,-17.5,17.5);this.player.position.set(xx,this.groundHeight(xx,zz),zz);this.cameraRig.snap(this.player.position);this.notifyNearby();this.callbacks.onPosition?.({x:xx,z:zz}); }
  getPosition() { return {x:this.player.position.x,z:this.player.position.z}; }
  getNearby() { this.notifyNearby();return this.nearby; }
  getDebugInfo() { return {region:this.region,position:this.getPosition(),fps:this.fps,nearby:this.nearby.map(p=>p.id),obstacles:this.obstacles.map(o=>({...o})),quality:this.quality,battle:this.battleActive,battleStage:this.battleStage?.getDebugInfo()??null,narrativeVictory:this.victory,drawCalls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,software:this.softwareRenderer,pixelRatio:this.renderer.getPixelRatio(),depthOfField:this.bokeh.enabled,rendering:this.pipeline.getDebugInfo(),camera:this.cameraRig.getDebugInfo(),cameraPosition:this.camera.position.toArray(),cameraTarget:this.cameraTarget.toArray(),contextLost:this.contextLost,environmentArt:{materials:!!this.authoredTextures.dirt,olive:this.ownedEnvironmentTextures.has(this.sprigTexture)},peopleV2:[...this.peopleV2Ready],heroAnimation:{ready:this.heroAnimationReady,context:this.heroAnimator.getContext()},cinematic:this.cinematic?{...this.cinematic}:null}; }
  interact() { if(this.nearby[0])this.callbacks.onInteract?.(this.nearby[0].id); }
  setObjective(id: string) { this.objective=id; }

  setQuality(quality:'high'|'low',automatic=false){this.quality=quality;if(!automatic)this.qualityPinned=true;this.pipeline.setQuality(quality);this.lightingRig?.setQuality(quality);this.battleStage?.setQuality(quality);this.resize();}

  private getBattleTextures(){return{stone:this.stone.map,adobe:this.adobe.map,wood:this.timber.map,leaves:this.foliageMaterial.map,rock:this.rockMaterial.map,roof:this.roofMaterial.map,sprig:this.sprigTexture,surfaces:this.authoredTextures,shadow:this.contactShadowMaterial.map,glow:this.glow,haze:this.haze};}

  setBattle(state: boolean | BattleVisual | null) {
    this.input.set(0,0);this.keys.clear();
    if(!state){
      this.battleStage?.dispose();this.battleStage=null;this.battleActive=false;this.root.visible=true;this.player.visible=true;
      this.heroAnimator.setContext('idle',{force:true});
      const snapshot=this.explorationSnapshot;this.explorationSnapshot=null;
      this.resize();if(snapshot){this.camera.position.copy(snapshot.position);this.camera.quaternion.copy(snapshot.quaternion);this.camera.zoom=snapshot.zoom;this.cameraTarget.copy(snapshot.target);this.scene.background=snapshot.background;this.scene.fog=snapshot.fog;this.cinematic=snapshot.cinematic;this.camera.updateProjectionMatrix();}
      this.callbacks.onBattleLayout?.({units:[],animating:false,activeActorId:null});this.notifyNearby();return;
    }
    const visual:StageState=typeof state==='boolean'?{units:[{id:'gideon',name:'Gideão',side:'ally',hp:100,maxHp:100,weaponType:'sword'},{id:'pura',name:'Purá',side:'ally',hp:100,maxHp:100,weaponType:'spear'},{id:'enemy-0',name:'Saqueador',side:'enemy',hp:100,maxHp:100,archetype:'raider',weaponType:'sword'},{id:'enemy-1',name:'Lanceiro',side:'enemy',hp:100,maxHp:100,archetype:'spearman',weaponType:'spear'}]}:state;
    if(this.battleStage){this.battleStage.setState(visual);return;}
    this.explorationSnapshot={position:this.camera.position.clone(),quaternion:this.camera.quaternion.clone(),zoom:this.camera.zoom,target:this.cameraTarget.clone(),background:this.scene.background,fog:this.scene.fog,cinematic:this.cinematic?{...this.cinematic}:null};
    this.cinematic=null;this.battleActive=true;this.root.visible=false;this.player.visible=false;
    this.battleStage=new BattleStage({scene:this.scene,camera:this.camera,region:this.region,software:this.softwareRenderer,quality:this.quality,textures:this.getBattleTextures(),frames:kind=>kind==='gideao'?this.hero.frames:kind.startsWith('enemy-')?this.textureCache.get(`battle-${kind.slice(6)}`):this.textureCache.get(`people-${kind==='villager'?'pura':kind}`),heroActions:context=>this.heroAnimator.getActionFrames(context),onLayout:layout=>this.callbacks.onBattleLayout?.(layout)},visual);
    const rect=this.container.getBoundingClientRect();this.battleStage.resize(rect.width,rect.height);this.callbacks.onNearby?.([]);this.nearby=[];this.reportedNearby=[];
  }

  animateAttack(actorId: string,targetId: string) {
    void this.battleStage?.animate([{id:Date.now(),actorId,targetId,action:'attack',kind:'hit'}]);
  }

  animateBattleEvents(events:readonly BattleEvent[],speed=1,onEvent?:(event:BattleEvent)=>void):Promise<void> {
    if(this.battleStage)return this.battleStage.animate(events,speed,onEvent);
    events.forEach(event=>onEvent?.(event));return Promise.resolve();
  }

  getBattleLayout():BattleLayout { return this.battleStage?.getLayout()??{units:[],animating:false,activeActorId:null}; }

  playCinematic(kind='intro',duration=5) {
    if(this.battleActive)return;
    if(kind==='army'&&this.region==='harode'&&this.player.position.distanceTo(new THREE.Vector3(7,0,-4))<3)kind='water';
    this.cinematic={kind,progress:0,duration};
    if(kind.includes('altar'))this.applyDestroyedAltar(false);
    if(kind==='army'||kind==='water'){const soldiers=this.actors.filter(a=>a.id.startsWith('israelita-'));const departing=kind==='water'?soldiers.slice(3):soldiers.slice(6);for(const soldier of departing){soldier.route=[soldier.group.position.clone(),new THREE.Vector3(-3,0,17)];soldier.waypoint=0;soldier.speed=1.25;soldier.group.userData.departing=true;}}
    if(['signal','sinal','victory','torches','tochas','finale','trumpets'].some(s=>kind.includes(s)))this.applyNarrativeVictory(false);
  }

  /** Restore the saved campaign's world state without replaying camera, dialogue or audio. */
  restoreProgress(stage:number) {
    if(this.restoredStage===stage)return;
    this.restoredStage=stage;
    if(this.region==='altar'&&stage>=4)this.applyDestroyedAltar(true);
    if(this.region==='harode'&&stage>=7){
      const remaining=stage>=8?3:6;
      this.actors.filter(actor=>actor.id.startsWith('israelita-')).forEach((actor,index)=>{
        actor.group.visible=index<remaining;actor.group.userData.departing=index>=remaining;actor.waypoint=0;actor.speed=0;
        if(index<remaining){actor.group.position.copy(stage>=8?new THREE.Vector3(5.1+index*.45,0,-3.3-index*.8):actor.base);}
        actor.route=[actor.group.position.clone()];
      });
    }
    if(this.region==='midian'&&stage>=12)this.applyNarrativeVictory(true);
    if(this.region==='midian'&&stage>=14){
      this.sun.color.set('#e8bf84');this.sun.intensity=2.2;this.ambient.color.set('#cbd5d6');this.ambient.groundColor.set('#6e684c');this.ambient.intensity=1.2;
      this.scene.background=new THREE.Color('#7f8b90');if(this.scene.fog)this.scene.fog.color.set('#819296');
    }
  }

  private applyDestroyedAltar(instant:boolean) {
    const altar=this.altarGroup;if(!altar)return;
    if(!altar.userData.falling){
      altar.userData.falling=true;
      for(const post of (altar.userData.post??[]) as THREE.Object3D[])post.visible=false;
      for(let i=0;i<9;i++)this.rock(Math.sin(i*2.2)*1.7,-6+Math.cos(i*1.6),.25+i%3*.09,false);
      const post=this.cylinder(4,.2,-5.5,.15,.18,3.2,this.timber,6);post.rotation.z=Math.PI/2-.1;this.box(1.2,.5,-7.7,1.2,.8,1,this.stone);
      for(const actor of this.actors.filter(a=>a.id.startsWith('servo'))){actor.route=[actor.group.position.clone(),new THREE.Vector3(actor.group.position.x*.4,0,-3.8)];actor.waypoint=0;actor.speed=.7;}
      this.applySoftwareLighting();
    }
    if(instant){altar.rotation.z=.13;altar.position.y=-.75;}
  }

  private applyNarrativeVictory(instant:boolean) {
    if(!this.victory){
      this.victory=true;this.bloom.strength=.65;
      for(let i=0;i<35;i++){const angle=i/35*Math.PI*2;this.torch(Math.cos(angle)*15,Math.sin(angle)*15);}
      this.sun.color.set('#ffbf78');this.sun.intensity=2.3;this.applySoftwareLighting();
    }
    this.detection=0;this.callbacks.onDetection?.(0);
    for(const actor of this.actors.filter(a=>a.kind==='guard')){
      actor.guard=false;actor.waypoint=0;
      if(actor.id==='unidade'){actor.group.position.copy(actor.base);actor.route=[actor.base.clone()];continue;}
      const side=actor.base.x<0?-1:1;
      if(instant)actor.group.position.set(side*(13+Math.abs(actor.base.x)*.12),0,-13.5);
      actor.route=[actor.group.position.clone(),new THREE.Vector3(side*18,0,-16)];actor.speed=2.1;
    }
  }

  private animateActor(actor: Actor,dt: number,moving: boolean,dx=0,dz=0) {
    const sheep=actor.group.userData.sheepModel as SheepModel|undefined;if(sheep){sheep.update(this.time+actor.phase,moving,dx,dz);return;}
    actor.body.quaternion.copy(this.camera.quaternion);
    const frame=moving?THREE.MathUtils.euclideanModulo(Math.floor(this.time*7+actor.phase),4):0;
    if(Math.abs(dx)+Math.abs(dz)>.01)actor.direction=Math.abs(dx)>Math.abs(dz)?dx>0?1:3:dz>0?0:2;
    if(actor===this.hero&&this.heroAnimationReady){this.heroAnimator.setContext(moving?'walk':'idle',{direction:actor.direction as 0|1|2|3});const pose=this.heroAnimator.update(dt,moving?1:0);if(pose.texture)actor.body.material.map=pose.texture;actor.body.scale.x=pose.scaleX;actor.body.position.y=.925-1.85*(pose.texture?.userData.baselineRatio??0)+pose.footOffset;actor.body.rotation.z+=pose.rotation;return;}
    if(actor.body.userData.artwork&&!actor.body.userData.atlas){actor.body.scale.x=(actor.direction===3?-1:1)*(moving?1+Math.sin(this.time*13)*.015:1);actor.body.rotation.z+=moving?Math.sin(this.time*12)*.025:Math.sin(this.time*1.8)*.008;}
    else actor.body.material.map=actor.frames[actor.direction][frame];
    if(actor.body.userData.peopleAtlas)actor.body.scale.x=actor.body.userData.directionalPeople?1:actor.direction===3?-1:1;
    const baseHeight=actor.body.userData.directionalPeople?.925-1.85*(actor.frames[0][0].userData.baselineRatio??0):actor.kind==='sheep'||actor.kind==='camel' ? .48 : actor.body.userData.atlas||actor.body.userData.peopleAtlas ? .925 : actor.body.userData.artwork ? .96 : .81;
    actor.body.position.y=baseHeight+(moving?Math.abs(Math.sin(this.time*9+actor.phase))*.035:Math.sin(this.time*2+actor.phase)*.009);
    if(dt<0)return;
  }

  private updateMovement(dt: number) {
    const x=this.input.x+(this.keys.has('d')||this.keys.has('arrowright')?1:0)-(this.keys.has('a')||this.keys.has('arrowleft')?1:0),z=this.input.y+(this.keys.has('s')||this.keys.has('arrowdown')?1:0)-(this.keys.has('w')||this.keys.has('arrowup')?1:0);
    const vector=new THREE.Vector2(x,z);if(vector.length()>1)vector.normalize();
    const moving=vector.lengthSq()>.01;
    // The screen right and screen up vectors follow the fixed three-quarter camera.
    const right=new THREE.Vector3(this.cameraOffset.z,0,-this.cameraOffset.x).normalize(),down=new THREE.Vector3(this.cameraOffset.x,0,this.cameraOffset.z).normalize();
    const direction=right.multiplyScalar(vector.x).add(down.multiplyScalar(vector.y));const speed=this.region==='midian'?2.35:3.25;
    if(moving){const next=moveWithCollisions(this.player.position,direction.x*dt*speed,direction.z*dt*speed,this.obstacles);this.player.position.set(next.x,this.groundHeight(next.x,next.z),next.z);this.notifyNearby();this.callbacks.onPosition?.({x:next.x,z:next.z});if(this.frame%5===0){const i=this.dustCursor++%96;this.dustPositions[i*3]=next.x+(Math.random()-.5)*.3;this.dustPositions[i*3+1]=this.player.position.y+.04;this.dustPositions[i*3+2]=next.z;this.dustLife[i]=1;}}
    this.animateActor(this.hero,dt,moving,direction.x,direction.z);
  }

  private updateActors(dt: number) {
    for(const actor of this.actors){let dx=0,dz=0,moving=false;
      if(actor.group.userData.departing&&actor.group.position.z>16){actor.group.visible=false;continue;}
      if(actor.route.length>1&&!this.battleActive){const goal=actor.route[actor.waypoint],delta=goal.clone().sub(actor.group.position);if(delta.length()<.15){actor.waypoint=(actor.waypoint+1)%actor.route.length;}else {delta.normalize();dx=delta.x;dz=delta.z;actor.group.position.addScaledVector(delta,dt*actor.speed);moving=true;}}
      this.animateActor(actor,dt,moving,dx,dz);
      actor.group.position.y=this.groundHeight(actor.group.position.x,actor.group.position.z);
      if(this.region==='midian'&&!this.victory&&actor.guard&&!this.paused&&!this.battleActive&&!this.cinematic&&canSeePlayer({x:actor.group.position.x,z:actor.group.position.z,angle:Math.atan2(dx||.1,dz||1)},this.player.position,this.obstacles)){this.detection=Math.min(1,this.detection+dt*.65);}
    }
    if(this.region==='midian'){this.detection=this.victory?0:Math.max(0,this.detection-dt*.16);this.callbacks.onDetection?.(this.detection);if(!this.victory&&this.detection>=.97&&this.encounterCooldown<=0){this.detection=0;this.encounterCooldown=18;this.callbacks.onEncounter?.('unidade');}}
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
    this.cameraRig.update(dt,this.player.position,{target,offset,zoom,cinematic:!!this.cinematic});
    const nearbyActor=this.actors.find(actor=>actor.id===this.nearby[0]?.id&&actor.group.position.distanceTo(this.player.position)<4);
    this.pipeline.updateFocus(this.cameraRig.focusPoint,nearbyActor?.group.position.clone().add(new THREE.Vector3(0,.9,0)));
    this.lightingRig?.update(this.player.position);
  }

  private updateEffects(dt: number) {
    for(const flame of this.flames){const pulse=1+Math.sin(this.time*13+flame.phase)*.12+Math.sin(this.time*21+flame.phase)*.06;flame.mesh.scale.set(1,pulse,1);flame.glow.material.opacity=.57+pulse*.12;if(flame.light)flame.light.intensity=flame.base*pulse;}
    for(const item of this.wind)item.object.rotation.z=item.base+Math.sin(this.time*1.4+item.phase)*item.strength;
    const viewX=this.camera.position.x-this.player.position.x,viewZ=this.camera.position.z-this.player.position.z,viewLength=Math.hypot(viewX,viewZ)||1;
    for(const canopy of this.foliageOccluders){const dx=canopy.center.x-this.player.position.x,dz=canopy.center.z-this.player.position.z,along=(dx*viewX+dz*viewZ)/viewLength,across=Math.abs(dx*viewZ-dz*viewX)/viewLength,fade=along>.25&&along<8&&across<canopy.radius*.65;const materials=Array.isArray(canopy.mesh.material)?canopy.mesh.material:[canopy.mesh.material];for(const material of materials){material.opacity=THREE.MathUtils.lerp(material.opacity,fade?.22:1,1-Math.exp(-dt*6));material.alphaTest=material.opacity<.8?.08:.38;material.depthWrite=material.opacity>.94;}}
    for(const interior of this.interiors){const p=this.player.position;interior.cutaway.visible=!(Math.abs(p.x-interior.x)<interior.width/2+.15&&p.z>interior.z-interior.depth/2&&p.z<interior.z+interior.depth/2+.65);}
    for(const [id,marker] of this.markers){marker.children[0].rotation.y=this.time*.8;marker.position.y=2.1+Math.sin(this.time*2+marker.position.x)*.08;const active=id===this.objective;marker.visible=active||this.player.position.distanceTo(new THREE.Vector3(marker.position.x,0,marker.position.z))<5;marker.scale.setScalar(active?1.15:.7);}
    this.particles.rotation.y=Math.sin(this.time*.02)*.04;this.particles.position.x=Math.sin(this.time*.05)*.5;
    if(this.water){this.water.material.color.setHSL(.48,.2,.4+Math.sin(this.time*.8)*.015);this.water.position.y=.04+Math.sin(this.time*1.3)*.008;}
    for(let i=0;i<96;i++)if(this.dustLife[i]>0){this.dustLife[i]-=dt;this.dustPositions[i*3]+=(Math.sin(i)*.04+.1)*dt;this.dustPositions[i*3+1]+=.22*dt;if(this.dustLife[i]<=0)this.dustPositions[i*3+1]=-100;}this.dust.geometry.attributes.position.needsUpdate=true;
    if(this.altarGroup?.userData.falling){this.altarGroup.rotation.z=THREE.MathUtils.lerp(this.altarGroup.rotation.z,.13,dt*2);this.altarGroup.position.y=THREE.MathUtils.lerp(this.altarGroup.position.y,-.75,dt*2);}
  }

  private tick = (now: number) => {
    if(this.disposed)return;if(this.contextLost){this.lastTime=now;this.raf=requestAnimationFrame(this.tick);return;}const actualDt=this.lastTime?(now-this.lastTime)/1000:1/60,dt=Math.min(.25,actualDt);this.lastTime=now;this.time+=dt;this.frame++;
    if(this.battleStage){this.battleStage.update(actualDt);const focus=this.battleStage.getFocusPoints();this.pipeline.updateFocus(focus.primary,focus.secondary);}
    else{
      if(!this.paused&&!this.cinematic)this.updateMovement(dt);else this.animateActor(this.hero,dt,false);
      this.updateActors(this.paused&&!this.cinematic?0:dt);this.updateCamera(actualDt);this.updateEffects(dt);
      if(this.frame%10===0){this.notifyNearby();if(!this.paused)this.callbacks.onPosition?.(this.getPosition());}
    }
    this.sampleFrames++;this.sampleTime+=actualDt;
    const reportStats=this.sampleTime>2;
    // Changing canvas dimensions clears its drawing buffer, so adapt before drawing this frame.
    if(reportStats){this.fps=Math.round(this.sampleFrames/this.sampleTime);this.pipeline.adapt(this.fps);this.sampleFrames=0;this.sampleTime=0;}
    this.pipeline.render(actualDt);
    if(reportStats)this.callbacks.onStats?.({fps:this.fps,quality:this.quality,drawCalls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles});
    this.raf=requestAnimationFrame(this.tick);
  };

  private sharedMaterials(){const materials=new Set<THREE.Material>([this.stone,this.adobe,this.timber,this.sand,this.roofMaterial,this.rockMaterial,this.pathMaterial,this.contactShadowMaterial,this.foliageMaterial,...this.materialCache.values()]);for(const [source,software]of this.softwareMaterials)if(materials.has(source))materials.add(software);return materials;}
  private disposeGroup(group: THREE.Object3D) {
    const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),shared=this.sharedMaterials();
    const sharedTextures=new Set<THREE.Texture>([this.glow,this.haze,this.sprigTexture,...this.ownedEnvironmentTextures,...[...this.textureCache.values()].flat(2)]);
    if(this.contactShadowMaterial.map)sharedTextures.add(this.contactShadowMaterial.map);
    group.traverse(child=>{if(child instanceof THREE.Mesh||child instanceof THREE.Points){geometries.add(child.geometry);(Array.isArray(child.material)?child.material:[child.material]).forEach(material=>{if(!shared.has(material))materials.add(material);});}else if(child instanceof THREE.Sprite&&!shared.has(child.material))materials.add(child.material);});
    for(const [source,software]of this.softwareMaterials)if(materials.has(software)){materials.add(source);this.softwareMaterials.delete(source);}
    geometries.forEach(g=>g.dispose());materials.forEach(material=>{if('map'in material){const map=material.map as THREE.Texture|null;if(map&&!sharedTextures.has(map)&&!map.userData.spriteAspect)map.dispose();}material.dispose();});
  }

  dispose() {
    this.disposed=true;cancelAnimationFrame(this.raf);this.resizeObserver.disconnect();window.removeEventListener('keydown',this.onKeyDown);window.removeEventListener('keyup',this.onKeyUp);window.removeEventListener('blur',this.onBlur);this.contextCleanup();this.battleStage?.dispose();this.heroAnimator.dispose();this.lightingRig?.dispose();this.disposeGroup(this.root);this.disposeGroup(this.player);this.textureCache.forEach(directions=>directions.flat().forEach(t=>t.dispose()));this.glow.dispose();this.haze.dispose();this.sharedMaterials().forEach(m=>m.dispose());this.ownedEnvironmentTextures.forEach(texture=>texture.dispose());this.contactShadowMaterial.map?.dispose();this.pipeline.dispose();this.renderer.dispose();this.renderer.domElement.remove();
  }
}
