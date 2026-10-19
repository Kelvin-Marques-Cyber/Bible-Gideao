import * as THREE from 'three';
import { groundTexture, random } from '../art';
import { addBox, irregularBox, stoneBlock, type EnvironmentContext } from './context';
import { createCalmGroundTexture } from './materials';

const smooth=(a:number,b:number,value:number)=>{const t=THREE.MathUtils.clamp((value-a)/(b-a),0,1);return t*t*(3-2*t);};
function terrace(x:number,z:number,cx:number,cz:number,rx:number,rz:number,height:number){const d=Math.max(Math.abs(x-cx)/rx,Math.abs(z-cz)/rz);return height*(1-smooth(.72,1.15,d));}
/** Shallow agricultural terraces remain traversable; the town and doorways stay near grade. */
export function ofraGroundHeight(x:number,z:number){return .018*Math.sin(x*.42)*Math.cos(z*.31)+terrace(x,z,-7,9,3.7,2.5,.17)+terrace(x,z,8,11.5,3.5,2.3,.13)+terrace(x,z,-11,-14,4,2.8,.2);}

export function buildOfraLandscape(ctx:EnvironmentContext){
  const texture=groundTexture();texture.repeat.set(6,6);texture.anisotropy=4;texture.magFilter=THREE.LinearFilter;const geometry=new THREE.PlaneGeometry(100,100,84,84),position=geometry.attributes.position,colors=new Float32Array(position.count*3);
  for(let i=0;i<position.count;i++){const x=position.getX(i),z=-position.getY(i),distance=Math.max(Math.abs(x),Math.abs(z)),hills=smooth(18,36,distance)*(Math.sin(x*.12+1)*Math.cos(z*.11)*1.3+Math.sin(x*.08-z*.06)*1.8+.6);position.setZ(i,ofraGroundHeight(x,z)+hills);const moisture=Math.sin(x*.2+z*.04)*Math.cos(z*.23),color=new THREE.Color().setHSL(.15+moisture*.014,.14,.77+moisture*.065);colors[i*3]=color.r;colors[i*3+1]=color.g;colors[i*3+2]=color.b;}
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.computeVertexNormals();const material=ctx.surface?.('dirt','#f3eee2')??new THREE.MeshStandardMaterial({color:'#dfd4b2',roughness:1});
  if(!material.map){material.map=texture;ctx.ownTexture?.(texture);}else{texture.dispose();if(!material.userData.tileRepeat){material.map=material.map.clone();material.map.needsUpdate=true;ctx.ownTexture?.(material.map);}}
  if(!material.userData.calmSoil){material.map=createCalmGroundTexture(material.map);ctx.ownTexture?.(material.map);material.userData.calmSoil=true;}
  material.vertexColors=true;material.userData.tileRepeat=8;material.map.repeat.set(8,8);const terrain=new THREE.Mesh(geometry,material);terrain.rotation.x=-Math.PI/2;terrain.position.y=-.005;terrain.receiveShadow=true;terrain.name='Ofra agricultural terraces';ctx.root.add(terrain);
  const rnd=random(110),ridgeColors=['#a4aa96','#8e998a','#bac0a9'];
  for(let layer=0;layer<3;layer++){
    const vertices:number[]=[],indices:number[]=[],n=44,z=-29-layer*12;
    for(let i=0;i<n;i++){const x=-65+i*130/(n-1),h=3+Math.sin(i*.38+layer)*2.2+Math.sin(i*.83)*.8+layer*1.5;vertices.push(x,-1,z+Math.sin(i*.4)*2,x,h,z-3-Math.sin(i*.3)*2);if(i<n-1){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();const m=ctx.materials.color(ridgeColors[layer]);m.side=THREE.DoubleSide;const ridge=new THREE.Mesh(g,m);ctx.root.add(ridge);
  }
  // Sparse outcrops suggest the land's edges without a circular wall across the foreground.
  for(const patch of[{x:-18,z:-5,rx:2,rz:6,count:8},{x:18,z:-8,rx:2,rz:7,count:10},{x:-12,z:-19,rx:7,rz:1.8,count:9},{x:12,z:18,rx:2,rz:1.6,count:4},{x:-18,z:13,rx:2,rz:3,count:4}]){
    for(let i=0;i<patch.count;i++){const x=patch.x+(rnd()-.5)*patch.rx*2,z=patch.z+(rnd()-.5)*patch.rz*2,size=.45+rnd()*.9,rock=new THREE.Mesh(new THREE.DodecahedronGeometry(size,1),ctx.materials.rock);rock.position.set(x,ofraGroundHeight(x,z)+size*.16,z);rock.scale.set(1.3,.48,.8);rock.rotation.set(.1,rnd()*Math.PI,.05);rock.castShadow=true;rock.receiveShadow=true;ctx.root.add(rock);}
  }
  // Low retaining stones follow actual field edges, with weathered gaps for foot traffic.
  for(const edge of[{x:-7,z:6.6,length:5.6},{x:8,z:9.7,length:4.7},{x:-11,z:-12.1,length:4.2}])for(let i=0;i<Math.floor(edge.length/.5);i++){if(i===3)continue;stoneBlock(ctx.root,edge.x-edge.length/2+i*.51,ofraGroundHeight(edge.x,edge.z)+.065,edge.z,.46,.17,.28,ctx.materials.rock,210+i);}
  // A few flattened limestone chips identify heavily used street edges.
  for(let i=0;i<75;i++){const side=i%2?-1:1,z=-15+rnd()*29,x=side*(1.6+rnd()*.65),stone=new THREE.Mesh(irregularBox(.12+rnd()*.15,.035,.09+rnd()*.13,i,.015),ctx.materials.rock);stone.position.set(x,ofraGroundHeight(x,z)+.015,z);stone.rotation.y=rnd()*Math.PI;stone.receiveShadow=true;ctx.root.add(stone);}
  return terrain;
}

export function buildComposedPath(ctx:EnvironmentContext,points:{x:number;z:number}[],width:number,material:THREE.Material){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p.x,0,p.z))),segments=Math.max(36,points.length*16),vertices:number[]=[],uvs:number[]=[],indices:number[]=[];
  for(let i=0;i<=segments;i++){const t=i/segments,p=curve.getPoint(t),tangent=curve.getTangent(t),normal=new THREE.Vector3(-tangent.z,0,tangent.x),variation=1+Math.sin(t*17)*.055+Math.sin(t*47)*.028;
    for(const side of[-1,1]){const x=p.x+normal.x*width*.5*variation*side,z=p.z+normal.z*width*.5*variation*side;vertices.push(x,ctx.groundHeight(x,z)+.008,z);uvs.push(side<0?0:1,t*curve.getLength()*.3);}
    if(i<segments){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();const mesh=new THREE.Mesh(geometry,material);mesh.receiveShadow=true;ctx.root.add(mesh);return mesh;
}

/** Worn local limestone paving marks the village's shared space around the well. */
export function buildVillagePaving(ctx:EnvironmentContext){
  const rnd=random(319),positions:{x:number;z:number;w:number;d:number;angle:number}[]=[];
  for(let row=0;row<10;row++)for(let col=0;col<18;col++){
    const x=-5.3+col*.59+(row%2)*.24+(rnd()-.5)*.08,z=-1.8+row*.49+(rnd()-.5)*.07;
    const radius=Math.pow((x+.25)/5,2)+Math.pow((z-.25)/2.5,2);
    // The ragged outer courses blend into the street; keep the well and house thresholds clear.
    if(radius>1||(radius>.68&&rnd()<.23)||Math.hypot(x+2.7,z+1)<.99||(x<-3.5&&z<-.75))continue;
    positions.push({x,z,w:.49+rnd()*.09,d:.37+rnd()*.07,angle:(rnd()-.5)*.12});
  }
  const geometry=irregularBox(1,.035,1,519,.018),material=ctx.surface?.('sand','#d9d2bc')??ctx.materials.rock.clone();material.roughness=1;
  const pavers=new THREE.InstancedMesh(geometry,material,positions.length),dummy=new THREE.Object3D();pavers.name='Worn limestone village square';pavers.receiveShadow=true;
  positions.forEach((p,i)=>{dummy.position.set(p.x,ctx.groundHeight(p.x,p.z)+.019,p.z);dummy.rotation.y=p.angle;dummy.scale.set(p.w,.55+rnd()*.4,p.d);dummy.updateMatrix();pavers.setMatrixAt(i,dummy.matrix);pavers.setColorAt(i,new THREE.Color().setHSL(.12+rnd()*.02,.1,.71+rnd()*.17));});ctx.root.add(pavers);return pavers;
}

export function buildGrainSack(ctx:EnvironmentContext,x:number,z:number){const group=new THREE.Group();group.position.set(x,ctx.groundHeight(x,z),z);ctx.root.add(group);const points=[new THREE.Vector2(.17,0),new THREE.Vector2(.29,.08),new THREE.Vector2(.31,.33),new THREE.Vector2(.23,.53),new THREE.Vector2(.09,.64),new THREE.Vector2(.13,.7)];const body=new THREE.Mesh(new THREE.LatheGeometry(points,10),ctx.materials.color('#baa67b'));body.castShadow=true;body.receiveShadow=true;group.add(body);const tie=new THREE.Mesh(new THREE.TorusGeometry(.1,.018,4,10),ctx.materials.color('#736647'));tie.rotation.x=Math.PI/2;tie.position.y=.61;group.add(tie);for(let i=0;i<4;i++)addBox(group,-.01,.08+i*.12,.299,.014,.06,.01,ctx.materials.color('#d4c399'));return group;}
