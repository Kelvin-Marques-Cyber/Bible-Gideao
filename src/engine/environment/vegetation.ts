import * as THREE from 'three';
import { canvasTexture, random } from '../art';
import { addCylinder, branch, type EnvironmentContext } from './context';

let fallbackSprig:THREE.CanvasTexture|undefined;
export function createOliveSprigTexture(){
  if(fallbackSprig)return fallbackSprig;
  fallbackSprig=canvasTexture(256,128,ctx=>{
    ctx.strokeStyle='#786f49';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(23,103);ctx.bezierCurveTo(70,80,145,62,232,25);ctx.stroke();
    const colors=['#697d52','#94a574','#bac29a','#7d9363','#c9caa4'];
    for(let i=0;i<17;i++){const x=33+i*11.1,y=100-i*4.3,side=i%2?1:-1,angle=-.65+side*.85;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=colors[i%5];ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(7,-6,24,-5,30,0);ctx.bezierCurveTo(20,5,5,5,0,0);ctx.fill();ctx.strokeStyle='#d3d3a770';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(3,0);ctx.lineTo(26,0);ctx.stroke();ctx.restore();}
  });fallbackSprig.magFilter=THREE.LinearFilter;fallbackSprig.minFilter=THREE.LinearMipmapLinearFilter;return fallbackSprig;
}

/** Twisted olive wood with visible forks and cutout leaf sprigs, never spherical crowns. */
export function buildOliveTree(ctx:EnvironmentContext,x:number,z:number,scale=1,leafTexture?:THREE.Texture){
  const rnd=random(Math.round((x+36)*(z+42))),tree=new THREE.Group(),wood=ctx.materials.wood;tree.position.set(x,ctx.groundHeight(x,z),z);tree.scale.setScalar(scale);tree.name='Twisted Mediterranean olive';ctx.root.add(tree);
  const main=[new THREE.Vector3(0,0,0),new THREE.Vector3(-.12,.45,.04),new THREE.Vector3(.08,.95,-.06),new THREE.Vector3(.22,1.42,.05),new THREE.Vector3(.1,1.9,.04)];
  branch(tree,main,.16,wood,13);branch(tree,main.map((p,i)=>p.clone().add(new THREE.Vector3(.15*Math.cos(i*1.6),0,.11*Math.sin(i*1.8)))),.105,wood,13);
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2;branch(tree,[new THREE.Vector3(Math.cos(a)*.48,.02,Math.sin(a)*.48),new THREE.Vector3(Math.cos(a)*.24,.13,Math.sin(a)*.24),new THREE.Vector3(.02,.58,0)],.07,wood,5);}
  const crown=new THREE.Group();tree.add(crown);const endpoints:THREE.Vector3[]=[];
  for(let i=0;i<10;i++){
    const a=i/10*Math.PI*2+rnd()*.35,r=1.1+rnd()*.65,height=2.05+rnd()*.95,end=new THREE.Vector3(Math.cos(a)*r,height,Math.sin(a)*r*.75);
    const fork=new THREE.Vector3(.1,1.25+rnd()*.5,0),middle=end.clone().multiplyScalar(.6);middle.y=1.8+rnd()*.3;branch(tree,[fork,middle,end],.045+rnd()*.018,wood,8);endpoints.push(end);
    for(let j=0;j<2;j++){const tip=end.clone().add(new THREE.Vector3((rnd()-.5)*.65,.15+rnd()*.4,(rnd()-.5)*.55));branch(tree,[middle,end.clone().lerp(tip,.6),tip],.018,wood,5);endpoints.push(tip);}
  }
  const map=leafTexture??ctx.sprigTexture??createOliveSprigTexture(),material=new THREE.MeshStandardMaterial({map,color:'#e1e7c9',side:THREE.DoubleSide,alphaTest:.38,transparent:true,depthWrite:true,roughness:1});
  const count=endpoints.length*3,leaves=new THREE.InstancedMesh(new THREE.PlaneGeometry(.86,.43),material,count),dummy=new THREE.Object3D();
  for(let i=0;i<count;i++){const center=endpoints[Math.floor(i/3)];dummy.position.copy(center).add(new THREE.Vector3((rnd()-.5)*.65,(rnd()-.5)*.4,(rnd()-.5)*.6));dummy.rotation.set(-.45+rnd()*.8,rnd()*Math.PI*2,(rnd()-.5)*.9);dummy.scale.setScalar(.8+rnd()*.65);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);leaves.setColorAt(i,new THREE.Color().setHSL(.19+rnd()*.025,.16,.67+rnd()*.16));}
  leaves.castShadow=true;leaves.receiveShadow=true;crown.add(leaves);ctx.wind.push({object:crown,base:0,phase:x+z*.7,strength:.012});ctx.occluders?.push({mesh:leaves,center:new THREE.Vector3(x,2.2*scale,z),radius:1.55*scale});ctx.obstacles.push({x,z,width:.45*scale,depth:.45*scale});
  const knot=new THREE.Mesh(new THREE.TorusGeometry(.105,.026,4,11),ctx.materials.color('#6f6651'));knot.position.set(-.08,.73,.15);knot.scale.y=1.5;tree.add(knot);return tree;
}

/** Vegetation is placed in designed drifts along paths and terraces, with clear foot traffic. */
export function buildUnderstory(ctx:EnvironmentContext){
  const rnd=random(912),positions:THREE.Vector3[]=[];
  const patches=[{x:-10,z:7,rx:3,rz:2},{x:8,z:9,rx:3.7,rz:2.2},{x:-13,z:-3,rx:2,rz:4},{x:12,z:-6,rx:2.5,rz:5},{x:-5,z:-12,rx:3.8,rz:2.2},{x:5,z:-9,rx:2.3,rz:1.8},{x:-14,z:11,rx:3,rz:2}];
  for(const patch of patches)for(let i=0;i<100;i++){const a=rnd()*Math.PI*2,r=Math.sqrt(rnd()),x=patch.x+Math.cos(a)*r*patch.rx,z=patch.z+Math.sin(a)*r*patch.rz;if(ctx.obstacles.some(o=>Math.abs(x-o.x)<o.width/2+.4&&Math.abs(z-o.z)<o.depth/2+.4))continue;positions.push(new THREE.Vector3(x,ctx.groundHeight(x,z),z));}
  const blades:number[]=[];for(let i=0;i<4;i++){const angle=i*Math.PI/4,xx=Math.cos(angle)*.09,zz=Math.sin(angle)*.09;blades.push(-xx,0,-zz,xx,0,zz,xx*.45,.3,zz*.45);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(blades,3));geometry.computeVertexNormals();const material=ctx.materials.color('#788452');material.side=THREE.DoubleSide;const grass=new THREE.InstancedMesh(geometry,material,positions.length),dummy=new THREE.Object3D();
  positions.forEach((p,i)=>{dummy.position.copy(p);dummy.rotation.y=rnd()*Math.PI;dummy.scale.setScalar(.55+rnd()*.8);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);grass.setColorAt(i,new THREE.Color().setHSL(.18+rnd()*.03,.22,.42+rnd()*.2));});grass.receiveShadow=true;ctx.root.add(grass);
  const flowers=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.035,0),ctx.materials.color('#d6d2ad'),80);for(let i=0;i<80;i++){const p=positions[(i*7)%positions.length];dummy.position.copy(p).add(new THREE.Vector3(.1,.22,.1));dummy.scale.setScalar(.7+rnd()*.4);dummy.updateMatrix();flowers.setMatrixAt(i,dummy.matrix);}ctx.root.add(flowers);
  // Low shrubs are many narrow leaves on visible stems, rather than isolated geometric balls.
  const shrubMap=ctx.sprigTexture??createOliveSprigTexture(),shrubMat=new THREE.MeshStandardMaterial({map:shrubMap,color:'#aab68a',alphaTest:.4,side:THREE.DoubleSide,roughness:1});const shrubs=new THREE.InstancedMesh(new THREE.PlaneGeometry(.43,.23),shrubMat,patches.length*16);
  for(let i=0;i<patches.length*16;i++){const p=patches[Math.floor(i/16)],a=rnd()*Math.PI*2,r=rnd()*.9;dummy.position.set(p.x+Math.cos(a)*r,ctx.groundHeight(p.x,p.z)+.12+rnd()*.32,p.z+Math.sin(a)*r);dummy.rotation.set((rnd()-.5)*.8,a,(rnd()-.5)*.5);dummy.scale.setScalar(.8+rnd()*.6);dummy.updateMatrix();shrubs.setMatrixAt(i,dummy.matrix);}shrubs.castShadow=true;ctx.root.add(shrubs);
}

export function buildCropField(ctx:EnvironmentContext,x:number,z:number,width:number,depth:number,burnt=false){
  const rnd=random(Math.round((x+31)*(z+27))),count=Math.floor(width*depth*20),stalks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.012,.016,.72,3),ctx.materials.color(burnt?'#7f7548':'#bea259'),count),ears=new THREE.InstancedMesh(new THREE.ConeGeometry(.06,.23,4),ctx.materials.color(burnt?'#8c7e4b':'#dfc17d'),count),dummy=new THREE.Object3D();
  for(let i=0;i<count;i++){const row=i%Math.max(1,Math.floor(width/.23)),xx=x-width/2+row*.23+(rnd()-.5)*.12,zz=z+(rnd()-.5)*depth,border=Math.min((xx-(x-width/2))/width,((x+width/2)-xx)/width),thin=rnd()<.05||border<.06&&rnd()<.35,h=(burnt?.25:.74)+rnd()*.3;dummy.position.set(xx,ctx.groundHeight(xx,zz)+h*.4,zz);dummy.rotation.set((rnd()-.5)*.1,rnd()*Math.PI,(burnt?.6:0)+(rnd()-.5)*.15);dummy.scale.set(1,thin?.05:h,1);dummy.updateMatrix();stalks.setMatrixAt(i,dummy.matrix);dummy.position.y=ctx.groundHeight(xx,zz)+h*.8;dummy.updateMatrix();ears.setMatrixAt(i,dummy.matrix);}
  stalks.receiveShadow=true;ears.receiveShadow=true;ctx.root.add(stalks,ears);
  for(let i=0;i<Math.ceil(width/1.7);i++){const xx=x-width/2+i*1.7;addCylinder(ctx.root,xx,ctx.groundHeight(xx,z-depth/2-.2)+.25,z-depth/2-.2,.022,.04,.5,ctx.materials.wood,5);}
  return {stalks,ears};
}
