import {afterEach,describe,expect,it,vi} from 'vitest';
import * as THREE from 'three';
import {BattleStage} from '../src/engine/battle/BattleStage';
import type {AuthoredMaterialId} from '../src/content/materialsV2';

afterEach(()=>vi.unstubAllGlobals());
function canvasEnvironment(){
  const gradient={addColorStop:()=>{}};
  const context=new Proxy({},{get:(_target,key)=>key==='createRadialGradient'||key==='createLinearGradient'?()=>gradient:()=>{}});
  vi.stubGlobal('document',{createElement:()=>({width:0,height:0,getContext:()=>context})});
  vi.stubGlobal('window',{matchMedia:()=>({matches:true})});
}
function frames(directional=false){const texture=new THREE.Texture();texture.userData={directionalPeople:directional,spriteAspect:1.6,visibleHeight:.95,baselineRatio:3/160};return Array.from({length:4},()=>Array.from({length:4},()=>texture));}
function atlas():Record<AuthoredMaterialId,THREE.Texture>{const result={} as Record<AuthoredMaterialId,THREE.Texture>;for(const id of ['limestone','adobe','wood','dirt','sand','linen','leather','terracotta','water'] as AuthoredMaterialId[])result[id]=new THREE.DataTexture(new Uint8Array(16),2,2);return result;}

describe('battle environment loading during a resumed encounter',()=>{
  it.each([true,false])('updates late materials in place without losing impacts or directional NPCs (software %s)',async software=>{
    canvasEnvironment();const placeholder=new THREE.Texture(),heroFrames=frames(),enemyFrames=frames();let puraFrames=frames();
    const textures={stone:placeholder,adobe:placeholder,wood:placeholder,leaves:placeholder,rock:placeholder,sprig:placeholder,glow:placeholder,haze:placeholder,surfaces:{} as Partial<Record<AuthoredMaterialId,THREE.Texture>>};
    const stage=new BattleStage({scene:new THREE.Scene(),camera:new THREE.OrthographicCamera(-10,10,6,-6,.1,100),region:'midian',software,quality:'low',textures,frames:kind=>kind==='pura'?puraFrames:kind==='gideao'?heroFrames:enemyFrames},{units:[{id:'gideon',name:'Gideão',side:'ally',hp:90,maxHp:90},{id:'pura',name:'Purá',side:'ally',hp:70,maxHp:70},{id:'enemy-0',name:'Saqueador',side:'enemy',hp:80,maxHp:80}]});
    const before=stage.getDebugInfo();expect(before.authoredMaterialsReady).toBe(false);
    const impacts:number[]=[],playing=stage.animate([{id:1,actorId:'gideon',targetId:'enemy-0',action:'attack',kind:'hit',amount:25,hpAfter:55}],1,event=>impacts.push(event.id));
    await Promise.resolve();stage.update(.12);const pending=stage.getDebugInfo();expect(pending.animating).toBe(true);
    const surfaces=atlas(),borrowedDisposal=vi.spyOn(surfaces.linen,'dispose');Object.assign(textures.surfaces,surfaces);stage.refreshEnvironmentTextures(textures);
    const loaded=stage.getDebugInfo();expect(loaded.arenaInstance).toBe(before.arenaInstance);expect(loaded.currentEvent).toBe(pending.currentEvent);expect(loaded.eventsPlayed).toBe(0);expect(impacts).toEqual([]);
    expect(loaded.authoredMaterialsReady).toBe(true);expect(loaded.authoredMaterialCount).toBeGreaterThan(0);expect(loaded.environmentMaterials.mappedBySurface.linen).toBeGreaterThan(0);expect(loaded.environmentMaterials.authoredGround).toBe(true);expect(loaded.environmentMaterials.pendingBindings).toBe(0);
    puraFrames=frames(true);stage.update(.01);const pura=stage.getDebugInfo().units.find(unit=>unit.id==='pura');expect(pura?.directionalSprite).toBe(true);expect(pura?.mirrored).toBe(false);
    stage.update(1.2);await playing;expect(impacts).toEqual([1]);expect(stage.getDebugInfo().eventsPlayed).toBe(1);expect(stage.getDebugInfo().units.find(unit=>unit.id==='enemy-0')?.hp).toBe(55);
    const derived=new Set<THREE.Texture>();stage.root.traverse(object=>{if(object instanceof THREE.Mesh&&!Array.isArray(object.material)&&'map'in object.material){const map=object.material.map as THREE.Texture|null;if(map?.name.startsWith('Authored battle'))derived.add(map);}});
    const disposals=[...derived].map(texture=>vi.spyOn(texture,'dispose'));stage.refreshEnvironmentTextures(textures);expect(stage.getDebugInfo().environmentMaterials.refreshes).toBe(1);disposals.forEach(dispose=>expect(dispose).not.toHaveBeenCalled());
    textures.surfaces.dirt=new THREE.DataTexture(new Uint8Array(16),2,2);stage.refreshEnvironmentTextures(textures);disposals.forEach(dispose=>expect(dispose).toHaveBeenCalledTimes(1));expect(stage.getDebugInfo().arenaInstance).toBe(before.arenaInstance);expect(stage.getDebugInfo().eventsPlayed).toBe(1);
    stage.dispose();expect(borrowedDisposal).not.toHaveBeenCalled();disposals.forEach(dispose=>expect(dispose).toHaveBeenCalledTimes(1));
  });
});
