import { describe, expect, it } from 'vitest';
import { canSeePlayer, moveWithCollisions } from '../src/engine/movement';

describe('world movement and visibility', () => {
  const wall = [{ x: 0, z: 0, width: 2, depth: 6 }];
  it('walks the requested distance in clear terrain independently of diagonal axes', () => {
    const result=moveWithCollisions({x:0,z:0},3,-4,[]);expect(result.x).toBeCloseTo(3);expect(result.z).toBeCloseTo(-4);
  });
  it('sweeps a long movement so a large delta cannot tunnel through a wall', () => {
    const result=moveWithCollisions({x:-3,z:0},8,0,wall);
    expect(result.x).toBeLessThanOrEqual(-1.29);expect(result.x).toBeGreaterThan(-1.5);
  });
  it('continues along an unblocked axis while touching a wall', () => {
    const result=moveWithCollisions({x:-1.31,z:0},2,2,wall);
    expect(result.x).toBeLessThan(-1.29);expect(result.z).toBeCloseTo(2);
  });
  it('keeps the character radius inside the terrain at every edge', () => {
    const result=moveWithCollisions({x:17,z:-17},20,-20,[]);
    expect(result.x).toBeLessThanOrEqual(17.71);expect(result.z).toBeGreaterThanOrEqual(-17.71);
  });
  it('admits a real doorway while neighboring wall segments remain solid', () => {
    const doorway=[{x:-1.4,z:0,width:1.8,depth:.25},{x:1.4,z:0,width:1.8,depth:.25}];
    expect(moveWithCollisions({x:0,z:2},0,-4,doorway).z).toBeCloseTo(-2);
    expect(moveWithCollisions({x:1,z:2},0,-4,doorway).z).toBeGreaterThan(.4);
  });
  it('only perceives players inside a guard facing cone and range', () => {
    const guard={x:0,z:0,angle:0};
    expect(canSeePlayer(guard,{x:0,z:4},[])).toBe(true);
    expect(canSeePlayer(guard,{x:0,z:-3},[])).toBe(false);
    expect(canSeePlayer(guard,{x:4,z:0},[])).toBe(false);
    expect(canSeePlayer(guard,{x:0,z:7},[])).toBe(false);
  });
  it('breaks line of sight with solid cover but preserves a clear flank', () => {
    const guard={x:0,z:0,angle:0},cover=[{x:0,z:2,width:1.5,depth:1}];
    expect(canSeePlayer(guard,{x:0,z:4},cover)).toBe(false);
    expect(canSeePlayer({...guard,angle:.5},{x:3,z:4},cover)).toBe(true);
  });
});
