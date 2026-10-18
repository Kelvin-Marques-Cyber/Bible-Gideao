import * as THREE from 'three';
interface FadeEntry {root:THREE.Object3D;center:THREE.Vector3;radius:number;meshes:{mesh:THREE.Mesh;original:THREE.Material|THREE.Material[];clones:THREE.Material[];opacity:number[];alphaTest:number[];depthWrite:boolean[]}[];alpha:number;}
/** Only authored foreground canopies are candidates; never fade architecture or the whole scene. */
export class ForegroundFader {
  private entries:FadeEntry[]=[];private readonly head=new THREE.Vector3();private readonly segment=new THREE.Vector3();private readonly along=new THREE.Vector3();
  setCandidates(roots:THREE.Object3D[]){
    this.dispose();for(const root of roots){root.updateWorldMatrix(true,true);const sphere=new THREE.Box3().setFromObject(root).getBoundingSphere(new THREE.Sphere());if(sphere.isEmpty())continue;
      const meshes:FadeEntry['meshes']=[];root.traverse(object=>{if(!(object instanceof THREE.Mesh)||object instanceof THREE.InstancedMesh)return;const original=object.material,materials=Array.isArray(original)?original:[original],clones=materials.map(material=>{const clone=material.clone();clone.transparent=true;return clone;});object.material=Array.isArray(original)?clones:clones[0];meshes.push({mesh:object,original,clones,opacity:materials.map(m=>m.opacity),alphaTest:materials.map(m=>m.alphaTest),depthWrite:materials.map(m=>m.depthWrite)});});
      if(meshes.length)this.entries.push({root,center:sphere.center,radius:sphere.radius,meshes,alpha:1});
    }
  }
  update(camera:THREE.Camera,player:THREE.Vector3,dt:number){
    this.head.copy(player).y+=1;this.segment.copy(this.head).sub(camera.position);const lengthSq=this.segment.lengthSq();if(lengthSq<.1)return;
    const smoothing=1-Math.exp(-Math.min(.15,Math.max(0,dt))*7);
    for(const entry of this.entries){this.along.copy(entry.center).sub(camera.position);const t=this.along.dot(this.segment)/lengthSq;this.along.copy(camera.position).addScaledVector(this.segment,THREE.MathUtils.clamp(t,0,1));
      const obstructs=t>.06&&t<.97&&this.along.distanceTo(entry.center)<entry.radius+.3;entry.alpha=THREE.MathUtils.lerp(entry.alpha,obstructs?.26:1,smoothing);
      for(const record of entry.meshes)record.clones.forEach((material,index)=>{material.opacity=record.opacity[index]*entry.alpha;material.alphaTest=record.alphaTest[index]*entry.alpha;material.depthWrite=entry.alpha>.985?record.depthWrite[index]:false;});
    }
  }
  dispose(){for(const entry of this.entries)for(const record of entry.meshes){record.mesh.material=record.original;record.clones.forEach(m=>m.dispose());}this.entries=[];}
}
