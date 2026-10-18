import { describe,expect,it } from 'vitest';
import * as THREE from 'three';
import { CameraRig,explorationHalfHeight,focusDepthBand,focusViewDepth,projectedCharacterPixels } from '../src/engine/rendering/CameraRig';
import { AdaptiveResolution,REGION_PROFILES,resolveRenderBudget } from '../src/engine/rendering/profiles';
import { createLighting,markLightSource } from '../src/engine/rendering/lighting';
import { observeWebGLContext } from '../src/engine/rendering/context';

describe('enquadramento HD-2D',()=>{
  it('torna Gideão materialmente mais legível sem depender da distância ortográfica',()=>{
    const height=540,half=explorationHalfHeight(960,height),before=projectedCharacterPixels(height,10),after=projectedCharacterPixels(height,half);
    expect(after/before).toBeGreaterThan(1.4);expect(after).toBeGreaterThan(70);expect(after).toBeLessThan(90);
    const mobile=projectedCharacterPixels(390,explorationHalfHeight(844,390));expect(mobile).toBeGreaterThan(55);
  });
  it('mantém área utilizável no retrato e proporção correta na paisagem',()=>{
    const camera=new THREE.OrthographicCamera(),rig=new CameraRig(camera);rig.resize(390,844);
    expect(camera.right-camera.left).toBeGreaterThan(9);expect(camera.right-camera.left).toBeLessThan(12);
    rig.resize(1280,720);expect((camera.right-camera.left)/(camera.top-camera.bottom)).toBeCloseTo(1280/720);
  });
  it('aproxima conversa suavemente e retorna à exploração sem modificar o eixo dos controles',()=>{
    const camera=new THREE.OrthographicCamera(),target=new THREE.Vector3(),offset=new THREE.Vector3(13.5,18,22),rig=new CameraRig(camera,{target,offset});rig.resize(960,540);rig.snap({x:0,z:0});
    rig.setContext('dialogue',{x:2,z:0});for(let i=0;i<120;i++)rig.update(1/60,new THREE.Vector3());
    expect(camera.zoom).toBeCloseTo(1.2,2);expect(target.x).toBeGreaterThan(.7);expect(target.x).toBeLessThan(.9);expect(offset.toArray()).toEqual([13.5,18,22]);
    rig.setContext('exploration');for(let i=0;i<120;i++)rig.update(1/60,new THREE.Vector3());expect(camera.zoom).toBeCloseTo(1,2);expect(target.x).toBeLessThan(.01);
  });
  it('preserva composição explícita de cinemática durante diálogos',()=>{
    const camera=new THREE.OrthographicCamera(),rig=new CameraRig(camera);rig.resize(960,540);rig.setContext('dialogue',{x:2,z:0});
    for(let i=0;i<120;i++)rig.update(1/60,new THREE.Vector3(),{target:new THREE.Vector3(-5,0,-4),zoom:.9,cinematic:true});
    expect(camera.zoom).toBeCloseTo(.9,2);expect(rig.target.x).toBeCloseTo(-5,1);expect(rig.target.z).toBeCloseTo(-4,1);
  });
  it('foca pela profundidade no espaço da câmera e mantém atores próximos dentro da faixa nítida',()=>{
    const camera=new THREE.OrthographicCamera(-10,10,10,-10,.1,180);camera.position.set(13.5,18,22);camera.lookAt(0,.5,0);camera.updateMatrixWorld();
    const p=new THREE.Vector3(4,.9,0),direction=new THREE.Vector3();camera.getWorldDirection(direction);
    expect(focusViewDepth(camera,p)).toBeCloseTo(p.clone().sub(camera.position).dot(direction),6);
    expect(Math.abs(focusViewDepth(camera,p)-camera.position.distanceTo(p))).toBeGreaterThan(.1);
    const nearby=new THREE.Vector3(2,1,-2),band=focusDepthBand(camera,p,nearby);
    expect(Math.abs(focusViewDepth(camera,p)-band.focus)).toBeLessThan(band.sharpDepth);
    expect(Math.abs(focusViewDepth(camera,nearby)-band.focus)).toBeLessThan(band.sharpDepth);
    expect(focusDepthBand(camera,p,new THREE.Vector3(50,0,-50)).focus).toBeCloseTo(focusViewDepth(camera,p));
  });
});
describe('orçamento visual e luz',()=>{
  it('preserva efeitos econômicos e resolução legível no celular e no renderizador por software',()=>{
    for(const software of [false,true])for(const quality of ['high','low'] as const){const b=resolveRenderBudget(quality,{width:844,height:390,devicePixelRatio:3,software});expect(b.pixelRatio).toBeGreaterThanOrEqual(.65);expect(b.depthOfField).toBe('economic');expect(b.shadowSize).toBeGreaterThanOrEqual(1024);}
    expect(resolveRenderBudget('high',{width:1280,height:720,devicePixelRatio:2,software:false}).depthOfField).toBe('depth');
  });
  it('reduz resolução com histerese sem oscilar a cada amostra nem atingir a grade antiga de 0.4x',()=>{
    const budget=resolveRenderBudget('high',{width:1280,height:720,devicePixelRatio:2,software:true}),adaptive=new AdaptiveResolution(budget),initial=adaptive.pixelRatio;
    expect(adaptive.sample(20)).toBe(false);expect(adaptive.pixelRatio).toBe(initial);expect(adaptive.sample(20)).toBe(true);expect(adaptive.pixelRatio).toBeLessThan(initial);
    for(let i=0;i<30;i++)adaptive.sample(10);expect(adaptive.pixelRatio).toBe(.65);
    for(let i=0;i<5;i++)adaptive.sample(60);expect(adaptive.pixelRatio).toBeGreaterThan(.65);expect(adaptive.pixelRatio).toBeLessThanOrEqual(initial);expect(adaptive.sample(Number.NaN)).toBe(false);
  });
  it('usa paletas regionais distintas e sombras direcionais também no preset econômico',()=>{
    const scene=new THREE.Scene(),parent=new THREE.Group();scene.add(parent);const rig=createLighting(scene,parent,'ofra','low',false);
    const billboardNormal=new THREE.Vector3(13.5,18,22).normalize(),keyDirection=rig.sun.position.clone().sub(rig.sun.target.position).normalize();expect(billboardNormal.dot(keyDirection)).toBeGreaterThan(.3);
    expect(rig.sun.castShadow).toBe(true);expect(rig.sun.shadow.mapSize.x).toBe(1024);expect(scene.fog).toBeInstanceOf(THREE.Fog);expect((scene.fog as THREE.Fog).near).toBeGreaterThan(30);
    rig.update(new THREE.Vector3(5,0,6));expect(rig.sun.target.position.x).toBeCloseTo(5,1);expect(rig.sun.target.position.z).toBeCloseTo(6,1);
    expect(REGION_PROFILES.ofra.sun).not.toBe(REGION_PROFILES.midian.sun);expect(REGION_PROFILES.ofra.highlights).not.toEqual(REGION_PROFILES.harode.highlights);
    rig.dispose();expect(parent.children).toHaveLength(0);
  });
  it('reserva valores HDR às fontes luminosas para o bloom seletivo',()=>{
    const ordinary=new THREE.MeshBasicMaterial({color:'#e5d6b0'}),light=new THREE.MeshBasicMaterial({color:'#ffd181'});markLightSource(light);
    expect(light.color.r).toBeGreaterThan(2.35);expect(ordinary.color.r).toBeLessThan(1);expect(light.toneMapped).toBe(false);expect(light.userData.lightSource).toBe(true);const once=light.color.clone();markLightSource(light);expect(light.color).toEqual(once);
  });
});
it('interrompe perda de contexto, notifica recuperação e remove observadores ao destruir a cena',()=>{
  const canvas=new EventTarget() as HTMLCanvasElement,states:string[]=[];const dispose=observeWebGLContext(canvas,{onChange:s=>states.push(s)}),lost=new Event('webglcontextlost',{cancelable:true});
  canvas.dispatchEvent(lost);expect(lost.defaultPrevented).toBe(true);canvas.dispatchEvent(new Event('webglcontextrestored'));expect(states).toEqual(['lost','restored']);dispose();canvas.dispatchEvent(new Event('webglcontextrestored'));expect(states).toHaveLength(2);
});

it('torna apenas a copa em primeiro plano translúcida e preserva materiais compartilhados',async()=>{
  const {ForegroundFader}=await import('../src/engine/rendering/ForegroundFader');
  const camera=new THREE.PerspectiveCamera();camera.position.set(0,5,10);camera.lookAt(0,1,0);
  const shared=new THREE.MeshBasicMaterial({color:'#82925c'}),canopy=new THREE.Mesh(new THREE.SphereGeometry(1.4,6,4),shared),other=new THREE.Mesh(new THREE.SphereGeometry(1,6,4),shared);canopy.position.set(0,3,5);other.position.set(7,3,5);
  const fader=new ForegroundFader();fader.setCandidates([canopy]);for(let i=0;i<90;i++)fader.update(camera,new THREE.Vector3(),1/60);
  expect((canopy.material as THREE.Material).opacity).toBeLessThan(.3);expect(shared.opacity).toBe(1);expect(other.material).toBe(shared);
  for(let i=0;i<90;i++)fader.update(camera,new THREE.Vector3(10,0,0),1/60);expect((canopy.material as THREE.Material).opacity).toBeGreaterThan(.98);
  fader.dispose();expect(canopy.material).toBe(shared);
});
