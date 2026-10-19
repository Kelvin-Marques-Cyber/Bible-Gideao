import * as THREE from 'three';
import { random } from '../art';
import { addBox, addCylinder, branch, cloth, irregularBox, stoneBlock, type EnvironmentContext } from './context';

export interface HouseOptions {x:number;z:number;width?:number;depth?:number;height?:number;barn?:boolean;enterable?:boolean;}

export function buildJar(ctx:EnvironmentContext,x:number,z:number,scale=.4,parent:THREE.Object3D=ctx.root,y=0){
  const material=ctx.surface?.('terracotta','#ddd0b8')??ctx.materials.color('#ac7855'),points=[new THREE.Vector2(.12,0),new THREE.Vector2(.24,.06),new THREE.Vector2(.34,.3),new THREE.Vector2(.32,.55),new THREE.Vector2(.19,.73),new THREE.Vector2(.15,.82),new THREE.Vector2(.2,.86)];
  const geometry=new THREE.LatheGeometry(points,12);geometry.scale(scale*1.8,scale*1.8,scale*1.8);const jar=new THREE.Mesh(geometry,material);jar.position.set(x,y,z);jar.castShadow=true;jar.receiveShadow=true;parent.add(jar);
  const lip=new THREE.Mesh(new THREE.TorusGeometry(scale*.35,scale*.045,4,12),ctx.materials.color('#c39468'));lip.rotation.x=Math.PI/2;lip.position.set(x,y+scale*1.55,z);parent.add(lip);
  const inside=new THREE.Mesh(new THREE.CircleGeometry(scale*.27,12),ctx.materials.color('#453a2a'));inside.rotation.x=-Math.PI/2;inside.position.set(x,y+scale*1.47,z);parent.add(inside);
  if(scale>.3)for(const side of[-1,1]){const handle=new THREE.Mesh(new THREE.TorusGeometry(scale*.2,scale*.04,4,10,Math.PI*1.4),material);handle.position.set(x+side*scale*.51,y+scale*.95,z);handle.rotation.z=side*Math.PI*.8;parent.add(handle);}
  return jar;
}

export function buildBasket(ctx:EnvironmentContext,x:number,z:number,scale=.4,parent:THREE.Object3D=ctx.root,y=0){
  const wicker=ctx.materials.color('#a38d61');addCylinder(parent,x,y+scale*.45,z,scale*.8,scale*.66,scale*.9,wicker,10);
  for(let i=0;i<4;i++){const rim=new THREE.Mesh(new THREE.TorusGeometry(scale*(.67+i*.045),scale*.027,3,12),ctx.materials.color(i%2?'#806f4c':'#c6ad76'));rim.rotation.x=Math.PI/2;rim.position.set(x,y+.08*scale+i*scale*.22,z);parent.add(rim);}
  const top=new THREE.Mesh(new THREE.CircleGeometry(scale*.72,12),ctx.materials.color('#6b5a3e'));top.rotation.x=-Math.PI/2;top.position.set(x,y+scale*.91,z);parent.add(top);
  for(let i=0;i<9;i++){const a=i/9*Math.PI*2;addBox(parent,x+Math.cos(a)*scale*.73,y+scale*.48,z+Math.sin(a)*scale*.73,.025,scale*.9,.025,ctx.materials.color('#c6ad76'));}
}

function plasterPanel(parent:THREE.Object3D,w:number,h:number,depth:number,seed:number,material:THREE.Material){const mesh=new THREE.Mesh(irregularBox(w,h,depth,seed,.035),material);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function masonryCourse(ctx:EnvironmentContext,parent:THREE.Object3D,x:number,z:number,length:number,h:number,alongX:boolean,seed:number){
  const rnd=random(seed),count=Math.ceil(length/.58),width=length/count;
  for(let course=0;course<Math.ceil(h/.25);course++)for(let i=0;i<count;i++){const offset=course%2?width*.2:0,xx=alongX?x-length/2+width*(i+.5)+offset:x,zz=alongX?z:z-length/2+width*(i+.5)+offset;stoneBlock(parent,xx,.14+course*.24,zz,alongX?width-.035:.24,.21+rnd()*.035,alongX?.24:width-.035,ctx.materials.stone,seed+i*3+course*11);}
}

/** Levantine stone/adobe dwelling. Doorways and colliders share the same footprint. */
export function buildHouse(ctx:EnvironmentContext,options:HouseOptions){
  const {x,z,width:w=4,depth:d=3.6,height:h=2.7,barn=false,enterable=false}=options,rnd=random(Math.round((x+30)*(z+30))),house=new THREE.Group(),cutaway=new THREE.Group(),m=ctx.materials;
  house.position.set(x,0,z);house.name=barn?'Ofra grain store':'Stone and plaster dwelling';house.add(cutaway);ctx.root.add(house);
  const foundation=new THREE.Mesh(irregularBox(w+.25,enterable?.08:.18,d+.25,x+z,enterable?.008:.055),m.rock);foundation.position.y=enterable?-.02:.045;foundation.receiveShadow=true;house.add(foundation);
  const left=plasterPanel(house,.24,h,d,x+1,barn?m.stone:m.adobe);left.position.set(-w/2,h/2,0);
  const right=plasterPanel(enterable?cutaway:house,.24,h+.04,d,x+2,barn?m.stone:m.adobe);right.position.set(w/2,h/2,0);
  const back=plasterPanel(house,w,h,.25,x+3,barn?m.stone:m.adobe);back.position.set(0,h/2,-d/2);
  const opening=1.3,doorX=.2,lw=w/2+doorX-opening/2,rw=w/2-doorX-opening/2,front=enterable?cutaway:house;
  const frontLeft=plasterPanel(front,lw,h,.27,z+4,barn?m.stone:m.adobe);frontLeft.position.set(-w/2+lw/2,h/2,d/2);
  const frontRight=plasterPanel(front,rw,h-.06,.27,z+5,barn?m.stone:m.adobe);frontRight.position.set(w/2-rw/2,h/2,d/2);
  const lintel=plasterPanel(front,opening,h-1.85,.28,z+6,m.adobe);lintel.position.set(doorX,1.85+(h-1.85)/2,d/2);
  if(!enterable)addBox(house,doorX,.88,d/2-.1,1.06,1.76,.06,m.color('#332d24'));
  masonryCourse(ctx,house,-w/2-.03,0,d,.86,false,31+x);masonryCourse(ctx,enterable?cutaway:house,w/2+.03,0,d,.64,false,51+x);masonryCourse(ctx,front,-w/2+lw/2,d/2+.06,lw,.74,true,71+x);masonryCourse(ctx,front,w/2-rw/2,d/2+.06,rw,.48,true,91+x);
  // Broken plaster reveals local stone patches instead of a perfectly uniform base stripe.
  for(let i=0;i<9;i++){const side=i%2?-1:1,px=side*(w/2-.22-rnd()*.25),py=.9+rnd()*.7;stoneBlock(front,px,py,d/2+.145,.25+rnd()*.2,.13+rnd()*.1,.05,m.stone,110+i);}
  const roof=plasterPanel(enterable?cutaway:house,w+.35,.19,d+.35,81+x,m.roof);roof.position.set(0,h+.03,0);
  // Uneven parapet, exposed joists and reed mat edges give the flat roof a structure.
  for(let side=0;side<3;side++){const alongX=side===2,length=alongX?w:d,count=Math.ceil(length/.65);for(let i=0;i<count;i++){const px=alongX?-w/2+(i+.5)*length/count:side===0?-w/2:w/2,pz=alongX?-d/2:-d/2+(i+.5)*length/count;stoneBlock(enterable?cutaway:house,px,h+.22+(rnd()-.5)*.05,pz,alongX?length/count+.025:.18,.3+rnd()*.07,alongX?.18:length/count+.025,m.adobe,130+i+side*21);}}
  for(let i=0;i<7;i++){const px=-w/2+.3+i*(w-.6)/6;addBox(enterable?cutaway:house,px,h-.12,0,.11,.15,d+.55,m.wood);}
  for(let i=0;i<15;i++)addBox(enterable?cutaway:house,-w/2+.2+i*(w-.4)/15,h+.145,0,.026,.022,d-.15,m.color('#a18b5c'));
  // Rough stone jambs, timber lintel and threshold steps frame the usable entrance.
  for(const side of[-1,1])for(let i=0;i<5;i++)stoneBlock(front,doorX+side*.69,.2+i*.32,d/2+.12,.22,.28,.34,m.stone,170+i*side);
  addBox(front,doorX,1.84,d/2+.1,1.68,.2,.4,m.wood);addBox(front,doorX,1.94,d/2+.12,1.78,.055,.43,m.color('#c1a879'));
  for(let i=0;i<3;i++)stoneBlock(house,doorX,enterable?.01:.03+i*.035,d/2+.73-i*.25,1.48-i*.14,enterable?.025:.09,.31,m.rock,200+i);
  for(const sx of[-w*.31,w*.31]){
    const winY=1.82+(rnd()-.5)*.1;addBox(front,sx,winY,d/2+.15,.48,.61,.05,m.color('#34372d'));stoneBlock(front,sx,winY-.35,d/2+.2,.72,.12,.4,m.stone,250+sx);
    for(const edge of[-1,1])addBox(front,sx+edge*.27,winY,d/2+.2,.055,.72,.12,m.wood);addBox(front,sx,winY+.34,d/2+.2,.62,.07,.13,m.wood);
    for(const bar of[-.1,.1])addBox(front,sx+bar,winY,d/2+.21,.028,.6,.04,m.wood);
    const shutter=addBox(front,sx-.39,winY,d/2+.22,.2,.62,.045,m.wood);shutter.rotation.y=-.32;
  }
  // A raised storage mass on the back roof breaks the repeated rectangular silhouette.
  if(!barn&&rnd()>.32){const mass=plasterPanel(enterable?cutaway:house,w*.37,.53,d*.45,315+x,m.adobe);mass.position.set(-w*.19,h+.3,-d*.2);addBox(enterable?cutaway:house,-w*.19,h+.6,-d*.2,w*.4,.1,d*.48,m.roof);}
  if(!barn){
    const awningMat=ctx.surface?.('linen','#d3c0a0')??m.color('#b49a6e');awningMat.side=THREE.DoubleSide;const awning=cloth(house,1.75,1.06,awningMat,x);awning.position.set(.2,2.02,d/2+.64);awning.rotation.z=.025;
    for(const px of[-.74,1.14]){const post=addCylinder(house,px,.93,d/2+1.1,.035,.055,1.86,m.wood,5);post.rotation.z=px*.025;}
    buildJar(ctx,-w/2+.1,d/2+.45,.37,house);buildJar(ctx,w/2+.3,d/2-.3,.27,house);buildBasket(ctx,w/2-.4,d/2+.55,.36,house);
    const hangingCloth=cloth(house,.74,.9,ctx.surface?.('linen','#b4a899')??m.color('#998675'),2);hangingCloth.rotation.set(0,.02,.03);hangingCloth.position.set(-w*.32,h-.24,d/2+.3);ctx.wind.push({object:hangingCloth,base:.03,phase:x,strength:.025});
  }else{
    for(let i=0;i<5;i++){addBox(front,doorX-.45+i*.21,.87,d/2+.06,.18,1.64,.08,m.wood);}
    const brace=addBox(front,.2,.92,d/2+.13,1.05,.07,.06,m.wood);brace.rotation.z=.65;
    for(let i=0;i<4;i++)buildBasket(ctx,-w/2+.45+i*.55,d/2+.5,.29,house);
  }
  if(enterable){
    ctx.obstacles.push({x:x-w/2,z,width:.25,depth:d},{x:x+w/2,z,width:.25,depth:d},{x,z:z-d/2,width:w,depth:.25},{x:x-w/2+lw/2,z:z+d/2,width:lw,depth:.25},{x:x+w/2-rw/2,z:z+d/2,width:rw,depth:.25});
    addBox(house,-1,.19,-.5,1.1,.3,1.8,m.wood);addBox(house,-1,.36,-.5,1,.08,1.65,m.color('#a99d7b'));addBox(house,-1,.45,-1.08,.75,.13,.34,m.color('#cdc2a0'));addBox(house,.9,.52,-.6,1.05,.09,.8,m.wood);for(const dx of[-.4,.4])for(const dz of[-.25,.25])addBox(house,.9+dx,.25,-.6+dz,.065,.5,.065,m.wood);buildJar(ctx,.9,-.6,.18,house,.57);buildBasket(ctx,1.2,.6,.35,house);const rug=addBox(house,0,.075,.4,1.3,.025,.9,m.color('#907150'));rug.rotation.y=.08;
    ctx.interiors.push({x,z,width:w,depth:d,cutaway});
  }else ctx.obstacles.push({x,z,width:w+.14,depth:d+.14});
  return house;
}

export function buildWell(ctx:EnvironmentContext,x:number,z:number){const group=new THREE.Group();group.position.set(x,0,z);ctx.root.add(group);for(let course=0;course<3;course++)for(let i=0;i<12;i++){const a=(i+(course%2)*.5)/12*Math.PI*2,stone=stoneBlock(group,Math.cos(a)*.7,.12+course*.21,Math.sin(a)*.7,.36,.19,.3,ctx.materials.stone,course*31+i);stone.rotation.y=-a;}
  const waterMaterial=ctx.surface?.('water','#c5d4ce')??new THREE.MeshStandardMaterial({color:'#577775'});waterMaterial.metalness=.18;waterMaterial.roughness=.23;waterMaterial.transparent=true;waterMaterial.opacity=.85;const water=new THREE.Mesh(new THREE.CircleGeometry(.55,32),waterMaterial);water.rotation.x=-Math.PI/2;water.position.y=.13;group.add(water);
  for(const sx of[-.85,.85])branch(group,[new THREE.Vector3(sx,0,0),new THREE.Vector3(sx-.03,1.1,.04),new THREE.Vector3(sx+.02,2.26,0)],.065,ctx.materials.wood,4);addBox(group,0,2.22,0,2,.16,.18,ctx.materials.wood);
  const pulley=new THREE.Mesh(new THREE.TorusGeometry(.2,.045,5,16),ctx.materials.wood);pulley.position.set(0,2.08,.01);group.add(pulley);addCylinder(group,0,1.4,0,.013,.013,1.2,ctx.materials.color('#b5a17b'),4);buildBasket(ctx,0,0,.22,group,.69);buildJar(ctx,-1.05,.25,.3,group);return group;}

export function buildWinepress(ctx:EnvironmentContext,x:number,z:number){const group=new THREE.Group();group.position.set(x,0,z);ctx.root.add(group);const shape=new THREE.Shape();shape.moveTo(-1.5,-1);shape.lineTo(-.7,-1.45);shape.lineTo(.9,-1.35);shape.lineTo(1.6,-.65);shape.lineTo(1.55,.8);shape.lineTo(.7,1.3);shape.lineTo(-1.15,1.15);shape.closePath();const floor=new THREE.Mesh(new THREE.ShapeGeometry(shape),ctx.materials.rock);floor.rotation.x=-Math.PI/2;floor.position.y=.025;floor.receiveShadow=true;group.add(floor);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const stone=stoneBlock(group,Math.cos(a)*1.5,.13,Math.sin(a)*1.18,.43,.24,.33,ctx.materials.stone,301+i);stone.rotation.y=-a;}
  const catchment=new THREE.Mesh(new THREE.RingGeometry(.31,.58,15),ctx.materials.stone);catchment.rotation.x=-Math.PI/2;catchment.position.set(-1.65,.045,.95);group.add(catchment);const base=new THREE.Mesh(new THREE.CircleGeometry(.32,16),ctx.materials.color('#66583c'));base.rotation.x=-Math.PI/2;base.position.set(-1.65,.032,.95);group.add(base);
  for(let i=0;i<22;i++){const stalk=addBox(group,-.75+i%6*.25,.08,-.25+Math.floor(i/6)*.18,.025,.025,.45,ctx.materials.color('#d4bd7c'));stalk.rotation.y=i*.71;}
  const fork=branch(group,[new THREE.Vector3(1.5,.1,.8),new THREE.Vector3(1.35,1.4,.65)],.025,ctx.materials.wood,2);for(const dx of[-.12,0,.12])branch(group,[new THREE.Vector3(1.35,1.4,.65),new THREE.Vector3(1.35+dx,1.65,.65)],.013,ctx.materials.wood,2);fork.rotation.z=.06;buildBasket(ctx,1.8,.1,.3,group);return group;}

export function buildMarket(ctx:EnvironmentContext,x:number,z:number){const group=new THREE.Group();group.position.set(x,ctx.groundHeight(x,z),z);ctx.root.add(group);const m=ctx.materials;
  for(const xx of[-1.5,1.5])for(const zz of[-.75,.75])branch(group,[new THREE.Vector3(xx,0,zz),new THREE.Vector3(xx-.03,1.25,zz+.025),new THREE.Vector3(xx+.04,2.52,zz)],.045,m.wood,4);
  for(const zz of[-.78,.78])addBox(group,0,2.47,zz,3.3,.1,.1,m.wood);const fabric=ctx.surface?.('linen','#d7c29d')??m.color('#b69b6c');fabric.side=THREE.DoubleSide;const canopy=cloth(group,3.35,1.95,fabric,7);canopy.position.y=2.49;canopy.rotation.z=.02;ctx.wind.push({object:canopy,base:.02,phase:x,strength:.008});
  for(let i=0;i<12;i++){const hem=addBox(group,-1.5+i*.27,2.35,.97,.25,.22+(i%3)*.025,.018,m.color(i%3?'#b99f72':'#d2be93'));hem.rotation.x=.08;}
  addBox(group,0,.74,.2,2.8,.13,.86,m.wood);for(const xx of[-1.18,1.18])for(const zz of[-.1,.5])addBox(group,xx,.35,zz,.075,.72,.075,m.wood);
  const tablecloth=cloth(group,1.2,.95,ctx.surface?.('linen','#c4b29e')??m.color('#a9907a'),4);tablecloth.position.set(-.65,.82,.25);tablecloth.rotation.z=.015;
  buildJar(ctx,-1,.15,.13,group,.83);buildJar(ctx,-.58,.18,.18,group,.83);buildJar(ctx,-.1,.25,.14,group,.83);buildBasket(ctx,.65,.15,.27,group,.83);buildBasket(ctx,1.1,.15,.2,group,.83);
  for(let i=0;i<6;i++){const bread=new THREE.Mesh(new THREE.SphereGeometry(.11,7,4),m.color('#c9ae77'));bread.scale.set(1.2,.35,.8);bread.position.set(.35+(i%3)*.19,.91,Math.floor(i/3)*.2);group.add(bread);}
  buildJar(ctx,-1.9,-.35,.35,group);buildBasket(ctx,1.9,-.4,.45,group);ctx.obstacles.push({x,z,width:2.7,depth:1});return group;}
