import * as THREE from 'three';
import { addBox,branch,type EnvironmentContext } from './context';
import { buildBasket,buildJar } from './architecture';

/** Woven travelling shelter with catenary cloth, a timber ridge and tension ropes. */
export function buildTent(ctx:EnvironmentContext,x:number,z:number,scale=1,enemy=false){
  const group=new THREE.Group();group.position.set(x,ctx.groundHeight(x,z),z);group.scale.setScalar(scale);group.name=enemy?'Midianite woven travelling tent':'Israelite linen camp shelter';ctx.root.add(group);
  const cloth=ctx.surface?.('linen',enemy?'#b8aa96':'#eee5ce')??ctx.materials.color(enemy?'#a08c73':'#bdb394');cloth.side=THREE.DoubleSide;
  const detailed=scale>.75,uSegments=detailed?8:4,vSegments=detailed?10:4,roof=new THREE.BufferGeometry(),vertices:number[]=[],uvs:number[]=[],indices:number[]=[];
  for(const side of[-1,1]){
    const start=vertices.length/3;
    for(let u=0;u<=uSegments;u++)for(let v=0;v<=vSegments;v++){
      const t=u/uSegments,depth=v/vSegments,xx=side*1.3*(1-t),zz=(depth-.5)*2.4,yy=t*2-Math.sin(t*Math.PI)*.12+Math.sin(depth*Math.PI)*.045;
      vertices.push(xx,yy,zz);uvs.push(depth*1.2,t);
      if(u<uSegments&&v<vSegments){const i=start+u*(vSegments+1)+v;indices.push(i,i+vSegments+1,i+1,i+1,i+vSegments+1,i+vSegments+2);}
    }
  }
  roof.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));roof.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));roof.setIndex(indices);roof.computeVertexNormals();const cover=new THREE.Mesh(roof,cloth);cover.castShadow=true;cover.receiveShadow=true;group.add(cover);
  const back=new THREE.BufferGeometry();back.setAttribute('position',new THREE.Float32BufferAttribute([-1.3,0,-1.2,0,2,-1.2,1.3,0,-1.2],3));back.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,.5,1,1,0],2));back.computeVertexNormals();const rear=new THREE.Mesh(back,cloth);rear.castShadow=true;rear.receiveShadow=true;group.add(rear);
  for(const side of[-1,1]){
    const flap=new THREE.BufferGeometry();flap.setAttribute('position',new THREE.Float32BufferAttribute([side*1.3,0,1.2,side*.48,.03,1.26,side*.19,1.73,1.22,0,2,1.2],3));flap.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,.65,0,.9,.87,1,1],2));flap.setIndex([0,1,2,0,2,3]);flap.computeVertexNormals();const mesh=new THREE.Mesh(flap,cloth);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
  }
  const thread=ctx.materials.color('#bdaf8c'),wood=ctx.materials.wood;
  for(const zz of[-1.2,1.2]){
    branch(group,[new THREE.Vector3(-1.28,.02,zz),new THREE.Vector3(0,2.02,zz),new THREE.Vector3(1.28,.02,zz)],.035,wood,2);
    const stakeZ=Math.sign(zz)*2.28;branch(group,[new THREE.Vector3(0,2.02,zz),new THREE.Vector3(.05,.8,zz+Math.sign(zz)*.65),new THREE.Vector3(.08,.06,stakeZ)],.009,thread,4);const peg=addBox(group,.08,.07,stakeZ,.055,.23,.055,wood);peg.rotation.x=Math.sign(zz)*.25;
  }
  branch(group,[new THREE.Vector3(0,2.01,-1.4),new THREE.Vector3(0,2.04,0),new THREE.Vector3(0,2.01,1.4)],.042,wood,3);
  // Visible seams and restrained hems read as fabric construction, not a solid pyramid.
  if(detailed)for(const side of[-1,1])for(const t of[.32,.67])branch(group,[new THREE.Vector3(side*1.3*(1-t),t*2-.1,-1.2),new THREE.Vector3(side*1.3*(1-t),t*2-.055,0),new THREE.Vector3(side*1.3*(1-t),t*2-.1,1.2)],.006,thread,5);
  const bedding=addBox(group,.05,.035,-.2,.95,.045,1.25,ctx.surface?.('linen','#aea187')??thread);bedding.receiveShadow=true;
  if(scale>.8){buildJar(ctx,1.35,.7,.3,group);buildBasket(ctx,-1.45,.5,.34,group);
    const leather=ctx.surface?.('leather','#ddc7a8')??ctx.materials.color('#806346'),skin=new THREE.Mesh(new THREE.SphereGeometry(.18,7,5),leather);skin.scale.set(.75,1.2,.55);skin.position.set(1.37,.48,.73);skin.castShadow=true;group.add(skin);branch(group,[new THREE.Vector3(1.3,.55,.72),new THREE.Vector3(1.36,.88,.73),new THREE.Vector3(1.46,.57,.73)],.012,thread,5);
  }
  ctx.obstacles.push({x,z:z-.1,width:2.4*scale,depth:1.9*scale});return group;
}
