import {afterEach,describe,expect,it,vi} from 'vitest';
import {CharacterAnimator} from '../src/engine/characters/CharacterAnimator';

afterEach(()=>vi.unstubAllGlobals());
describe('character performance and motion lifecycle',()=>{
 it('starts and stops locomotion while retaining the requested direction',()=>{
  const animation=new CharacterAnimator();
  animation.setContext('walk',{direction:3});expect(animation.update(.05,1).context).toBe('start');
  const walking=animation.update(.12,1);expect(walking.context).toBe('walk');expect(walking.direction).toBe(3);
  animation.setContext('idle');expect(animation.update(.05,0).context).toBe('stop');expect(animation.update(.2,0).context).toBe('idle');
 });
 it('finishes one physical action before accepting ordinary locomotion',()=>{
  const animation=new CharacterAnimator();animation.setContext('attack');animation.setContext('walk');
  expect(animation.update(.3,1).context).toBe('attack');expect(animation.update(.4,1).context).toBe('walk');
 });
 it('lets dialogue completion explicitly release a looping gesture',()=>{
  const animation=new CharacterAnimator();animation.setContext('talk');animation.setContext('walk');expect(animation.update(10,1).context).toBe('talk');
  animation.setContext('idle',{force:true});expect(animation.update(0,0).context).toBe('idle');
 });
 it('does no canvas extraction after its world is destroyed during image loading',async()=>{
  const createElement=vi.fn();vi.stubGlobal('document',{createElement});
  vi.stubGlobal('Image',class{onload:(()=>void)|null=null;set src(_value:string){queueMicrotask(()=>this.onload?.());}});
  const animation=new CharacterAnimator(),loading=animation.load();animation.dispose();await loading;
  expect(createElement).not.toHaveBeenCalled();expect(animation.getWalkFrames()).toHaveLength(0);
 });
 it('does not start image loading after disposal',async()=>{
  const Image=vi.fn();vi.stubGlobal('Image',Image);const animation=new CharacterAnimator();animation.dispose();await animation.load();expect(Image).not.toHaveBeenCalled();
 });
});
