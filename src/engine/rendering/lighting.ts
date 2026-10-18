import * as THREE from 'three';
import { REGION_PROFILES, type RenderQuality, type VisualRegion } from './profiles';
/** Shared soft contact texture. Cache it for a region; caller owns and disposes it. */
export function createContactShadowTexture():THREE.CanvasTexture {
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const ctx=canvas.getContext('2d')!;
  const gradient=ctx.createRadialGradient(64,64,5,64,64,62);gradient.addColorStop(0,'rgba(0,0,0,.72)');gradient.addColorStop(.35,'rgba(0,0,0,.46)');gradient.addColorStop(.7,'rgba(0,0,0,.15)');gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
  const texture=new THREE.CanvasTexture(canvas);texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;return texture;
}
export interface LightingRig {sun:THREE.DirectionalLight;ambient:THREE.HemisphereLight;fill:THREE.DirectionalLight;update:(center:THREE.Vector3)=>void;setQuality:(quality:RenderQuality)=>void;dispose:()=>void;}
export function createLighting(scene:THREE.Scene,parent:THREE.Object3D,region:VisualRegion,quality:RenderQuality='high',software=false):LightingRig {
  const p=REGION_PROFILES[region];scene.background=new THREE.Color(p.sky);scene.fog=new THREE.Fog(p.fog,p.fogNear,p.fogFar);
  const ambient=new THREE.HemisphereLight(p.skyLight,p.groundLight,p.ambientIntensity),sun=new THREE.DirectionalLight(p.sun,p.sunIntensity),fill=new THREE.DirectionalLight(p.fill,p.fillIntensity);
  sun.position.set(-13,18,17);sun.castShadow=!software;sun.shadow.bias=-.0003;sun.shadow.normalBias=.025;sun.shadow.radius=2;sun.shadow.blurSamples=6;
  Object.assign(sun.shadow.camera,{left:-21,right:21,top:21,bottom:-21,near:.5,far:95});fill.position.set(12,7,16);parent.add(ambient,sun,sun.target,fill);
  const setQuality=(q:RenderQuality)=>{const size=q==='high'?2048:1024;if(sun.shadow.mapSize.x!==size){sun.shadow.map?.dispose();sun.shadow.map=null;}sun.shadow.mapSize.set(size,size);sun.castShadow=!software;};setQuality(quality);
  return {sun,ambient,fill,setQuality,update:center=>{const texel=42/sun.shadow.mapSize.x;const x=Math.round(center.x/texel)*texel,z=Math.round(center.z/texel)*texel;sun.position.set(x-13,18,z+17);sun.target.position.set(x,0,z);sun.target.updateMatrixWorld();},dispose:()=>{sun.shadow.map?.dispose();ambient.removeFromParent();sun.removeFromParent();sun.target.removeFromParent();fill.removeFromParent();}};
}
/** Emissive-only HDR convention: ordinary stone/cloth stays below the bloom threshold. */
export function markLightSource(material:THREE.Material,intensity=3.8):void {
  if(material.userData.lightSource)return;
  if(material instanceof THREE.MeshStandardMaterial){material.emissive.copy(material.color);material.emissiveIntensity=intensity;}
  else if(material instanceof THREE.MeshBasicMaterial||material instanceof THREE.SpriteMaterial)material.color.multiplyScalar(intensity);
  material.toneMapped=false;material.userData.lightSource=true;material.needsUpdate=true;
}
