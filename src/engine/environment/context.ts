import * as THREE from 'three';
import type { Obstacle } from '../movement';

export interface EnvironmentWind {object:THREE.Object3D;base:number;phase:number;strength:number;}
export interface InteriorCutaway {x:number;z:number;width:number;depth:number;cutaway:THREE.Group;}
export interface EnvironmentMaterials {
  stone:THREE.MeshStandardMaterial;adobe:THREE.MeshStandardMaterial;wood:THREE.MeshStandardMaterial;
  roof:THREE.MeshStandardMaterial;rock:THREE.MeshStandardMaterial;earth:THREE.MeshStandardMaterial;
  leaf:THREE.MeshStandardMaterial;contact:THREE.Material;
  color:(color:THREE.ColorRepresentation)=>THREE.MeshStandardMaterial;
}
export interface EnvironmentContext {
  root:THREE.Group;materials:EnvironmentMaterials;obstacles:Obstacle[];wind:EnvironmentWind[];interiors:InteriorCutaway[];
  groundHeight:(x:number,z:number)=>number;
  occluders?:{mesh:THREE.InstancedMesh;center:THREE.Vector3;radius:number}[];
  sprigTexture?:THREE.Texture;
}

export function addBox(parent:THREE.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,material:THREE.Material){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
export function addCylinder(parent:THREE.Object3D,x:number,y:number,z:number,top:number,bottom:number,h:number,material:THREE.Material,segments=8){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(top,bottom,h,segments),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
export function irregularBox(w:number,h:number,d:number,seed:number,roughness=.035){const geometry=new THREE.BoxGeometry(w,h,d),position=geometry.attributes.position;for(let i=0;i<position.count;i++){const x=position.getX(i),y=position.getY(i),z=position.getZ(i),noise=Math.sin(Math.sign(x)*19.1+Math.sign(y)*31.4+Math.sign(z)*11.7+seed*7.3);position.setXYZ(i,x+noise*roughness,y+Math.cos(noise*11+seed)*roughness,z+Math.sin(noise*7+seed)*roughness);}geometry.computeVertexNormals();return geometry;}
export function stoneBlock(parent:THREE.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,material:THREE.Material,seed=0){const mesh=new THREE.Mesh(irregularBox(w,h,d,seed,.025),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
export function branch(parent:THREE.Object3D,points:THREE.Vector3[],radius:number,material:THREE.Material,segments=9){const curve=new THREE.CatmullRomCurve3(points),mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,segments,radius,5,false),material);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
export function cloth(parent:THREE.Object3D,width:number,depth:number,material:THREE.Material,seed=0){const geometry=new THREE.PlaneGeometry(width,depth,12,7),positions=geometry.attributes.position;for(let i=0;i<positions.count;i++){const x=positions.getX(i),y=positions.getY(i);positions.setZ(i,Math.sin((x/width+.5)*Math.PI)*-.16+Math.sin(y*9+seed)*.025);}geometry.computeVertexNormals();const mesh=new THREE.Mesh(geometry,material);mesh.rotation.x=-Math.PI/2;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
