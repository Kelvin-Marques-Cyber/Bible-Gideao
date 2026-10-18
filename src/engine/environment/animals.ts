import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { random } from '../art';

export interface SheepModel {root:THREE.Group;update:(time:number,moving:boolean,dx:number,dz:number)=>void;}
/** Small fat-tailed sheep with dark muzzle and articulated legs; no enlarged placeholder billboard. */
export function createSheep():SheepModel {
  const root=new THREE.Group(),rnd=random(72),woolParts:THREE.BufferGeometry[]=[];
  const wool=new THREE.SphereGeometry(.4,10,7);wool.scale(1.25,.8,.8);wool.translate(0,.51,0);woolParts.push(wool);
  for(let i=0;i<20;i++){const a=i/20*Math.PI*2,part=new THREE.IcosahedronGeometry(.135+rnd()*.04,1);part.scale(1,.85,1);part.translate(Math.cos(a)*.37,.51+Math.sin(a*2)*.11,Math.sin(a)*.26);woolParts.push(part);}
  const tail=new THREE.SphereGeometry(.14,7,5);tail.scale(1.2,.9,.8);tail.translate(-.53,.45,0);woolParts.push(tail);
  const body=new THREE.Mesh(mergeGeometries(woolParts.map(g=>g.index?g.toNonIndexed():g),false)!,new THREE.MeshStandardMaterial({color:'#bcb8a0',roughness:1}));body.castShadow=true;body.receiveShadow=true;root.add(body);woolParts.forEach(g=>g.dispose());
  const skinParts:THREE.BufferGeometry[]=[];const head=new THREE.SphereGeometry(.16,8,6);head.scale(1.1,1.25,.72);head.translate(.5,.52,0);skinParts.push(head);for(const side of[-1,1]){const ear=new THREE.SphereGeometry(.1,6,4);ear.scale(1,.33,.45);ear.rotateZ(side*.4);ear.translate(.45,.68,side*.16);skinParts.push(ear);}const face=new THREE.Mesh(mergeGeometries(skinParts.map(g=>g.index?g.toNonIndexed():g),false)!,new THREE.MeshStandardMaterial({color:'#5d5545',roughness:1}));face.castShadow=true;root.add(face);skinParts.forEach(g=>g.dispose());
  const legs=new THREE.InstancedMesh(new THREE.CylinderGeometry(.025,.031,.28,5),new THREE.MeshStandardMaterial({color:'#645b47',roughness:1}),4),dummy=new THREE.Object3D();legs.castShadow=true;root.add(legs);
  const eyes=new THREE.InstancedMesh(new THREE.SphereGeometry(.018,5,4),new THREE.MeshBasicMaterial({color:'#1b201d'}),2);for(let i=0;i<2;i++){dummy.position.set(.6,.58,(i?1:-1)*.11);dummy.scale.setScalar(1);dummy.rotation.set(0,0,0);dummy.updateMatrix();eyes.setMatrixAt(i,dummy.matrix);}root.add(eyes);
  return {root,update:(time,moving,dx,dz)=>{if(moving)root.rotation.y=Math.atan2(-dz,dx);root.position.y=moving?Math.abs(Math.sin(time*5))*.015:0;for(let i=0;i<4;i++){const phase=time*6+(i===0||i===3?0:Math.PI);dummy.position.set(i<2?-.29:.29,.2,(i%2?1:-1)*.21);dummy.rotation.set(0,0,moving?Math.sin(phase)*.3:0);dummy.updateMatrix();legs.setMatrixAt(i,dummy.matrix);}legs.instanceMatrix.needsUpdate=true;}};
}
