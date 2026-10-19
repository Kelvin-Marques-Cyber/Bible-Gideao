import * as THREE from 'three';
import { ofraMaterialsV2,type AuthoredMaterialId } from '../../content/materialsV2';

export type EnvironmentTextures=Record<AuthoredMaterialId,THREE.CanvasTexture>;

/** Each original albedo tile becomes one shared texture; atlas seams never reach the geometry. */
export function loadEnvironmentTextures(base:string,anisotropy:number):Promise<EnvironmentTextures>{
  return new Promise((resolve,reject)=>{
    const source=new Image();source.onerror=()=>reject(new Error('Environment material atlas unavailable'));
    source.onload=()=>{
      const textures={} as EnvironmentTextures;
      for(const [name,crop] of Object.entries(ofraMaterialsV2.crops)){
        const canvas=document.createElement('canvas');canvas.width=crop.width;canvas.height=crop.height;
        const ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;ctx.drawImage(source,crop.x,crop.y,crop.width,crop.height,0,0,crop.width,crop.height);
        const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.MirroredRepeatWrapping;texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.anisotropy=anisotropy;texture.name=`Ofra original ${name}`;textures[name as AuthoredMaterialId]=texture;
      }
      resolve(textures);
    };source.src=`${base}${ofraMaterialsV2.url}`;
  });
}

/** Soft, irregular street edges retain actual authored sand grain in the center. */
export function createWornPathTexture(sand:THREE.Texture){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=512;const ctx=canvas.getContext('2d')!;ctx.drawImage(sand.image,0,0,256,512);
  ctx.globalCompositeOperation='destination-in';const mask=ctx.createLinearGradient(0,0,256,0);mask.addColorStop(0,'#0000');mask.addColorStop(.13,'#000e');mask.addColorStop(.25,'#000');mask.addColorStop(.75,'#000');mask.addColorStop(.87,'#000e');mask.addColorStop(1,'#0000');ctx.fillStyle=mask;ctx.fillRect(0,0,256,512);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapT=THREE.MirroredRepeatWrapping;texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;return texture;
}

/** Keep the authored grain, while reserving strong ground contrast for the paths and fields. */
export function createCalmGroundTexture(dirt:THREE.Texture){
  const canvas=document.createElement('canvas');canvas.width=414;canvas.height=414;const ctx=canvas.getContext('2d')!;ctx.filter='saturate(0.48) contrast(0.65)';ctx.drawImage(dirt.image,0,0,414,414);ctx.filter='none';ctx.fillStyle='#b7a68a20';ctx.fillRect(0,0,414,414);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.MirroredRepeatWrapping;texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.anisotropy=dirt.anisotropy;texture.name='Ofra quiet clay soil';return texture;
}
