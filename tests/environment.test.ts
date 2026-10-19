import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildHouse } from '../src/engine/environment/architecture';
import { buildComposedPath,ofraGroundHeight } from '../src/engine/environment/terrain';
import type { EnvironmentContext } from '../src/engine/environment/context';
import { moveWithCollisions } from '../src/engine/movement';

function context():EnvironmentContext {
  const material=new THREE.MeshStandardMaterial();
  return {root:new THREE.Group(),materials:{stone:material,adobe:material,wood:material,roof:material,rock:material,earth:material,leaf:material,contact:material,color:()=>material},obstacles:[],wind:[],interiors:[],groundHeight:ofraGroundHeight};
}

describe('authored Ofra environment',()=>{
  it('keeps curved street surfaces facing the camera instead of culling them from above',()=>{
    const ctx=context(),path=buildComposedPath(ctx,[{x:0,z:12},{x:1,z:3},{x:-3,z:-2},{x:0,z:-14}],2,ctx.materials.earth);
    const normals=path.geometry.attributes.normal,positions=path.geometry.attributes.position;
    for(let i=0;i<normals.count;i++){
      expect(normals.getY(i)).toBeGreaterThan(.95);
      expect(positions.getY(i)-ofraGroundHeight(positions.getX(i),positions.getZ(i))).toBeCloseTo(.008,5);
    }
  });
  it('preserves the real Joás doorway through the detailed facade and solid adjacent walls',()=>{
    const ctx=context();buildHouse(ctx,{x:-5.9,z:-3,width:4.3,depth:3.5,height:2.8,enterable:true});
    const door=moveWithCollisions({x:-5.7,z:1},0,-4,ctx.obstacles),wall=moveWithCollisions({x:-7.3,z:1},0,-4,ctx.obstacles);
    expect(door.z).toBeCloseTo(-3);expect(wall.z).toBeGreaterThan(-.9);expect(ctx.interiors).toHaveLength(1);
  });
  it('keeps village thresholds and agricultural terraces within a walkable height range',()=>{
    expect(Math.abs(ofraGroundHeight(-5.7,-1.25))).toBeLessThan(.04);
    for(let x=-17;x<=17;x++)for(let z=-17;z<=17;z++){
      expect(Math.abs(ofraGroundHeight(x+.3,z)-ofraGroundHeight(x,z))).toBeLessThan(.09);
      expect(Math.abs(ofraGroundHeight(x,z+.3)-ofraGroundHeight(x,z))).toBeLessThan(.09);
    }
  });
});
