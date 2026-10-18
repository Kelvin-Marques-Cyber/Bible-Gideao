import * as THREE from 'three';
export type CameraContext = 'exploration' | 'dialogue' | 'important' | 'title';
export interface WorldFocus { x:number; y?:number; z:number; }
export interface CameraPose {target?:THREE.Vector3;offset?:THREE.Vector3;zoom?:number;cinematic?:boolean;}
export function explorationHalfHeight(width:number,height:number):number {
  const aspect=Math.max(.35,width/Math.max(1,height));
  // Landscape keeps characters ~60–90 CSS px tall; portrait preserves a usable walking corridor.
  return aspect<.9?Math.min(10.8,6.8/aspect*.8):aspect>2.05?6.35:aspect>1.55?6.8:7.15;
}
export function projectedCharacterPixels(height:number,halfHeight:number,zoom=1,characterHeight=1.85):number {return height/Math.max(1,halfHeight*2)*zoom*characterHeight;}
export function focusViewDepth(camera:THREE.Camera,point:THREE.Vector3):number {camera.updateMatrixWorld();return Math.max(.1,-point.clone().applyMatrix4(camera.matrixWorldInverse).z);}
export function focusDepthBand(camera:THREE.Camera,primary:THREE.Vector3,secondary?:THREE.Vector3):{focus:number;sharpDepth:number}{
  const a=focusViewDepth(camera,primary),b=secondary&&secondary.distanceTo(primary)<6?focusViewDepth(camera,secondary):a;
  return {focus:(a+b)/2,sharpDepth:Math.max(3.8,Math.abs(a-b)/2+1.6)};
}
/** Orthographic framing, not camera distance, determines sprite readability. */
export class CameraRig {
  readonly target:THREE.Vector3;readonly offset:THREE.Vector3;readonly focusPoint=new THREE.Vector3();
  private context:CameraContext='exploration';private contextFocus:WorldFocus|null=null;
  private desired=new THREE.Vector3();private look=new THREE.Vector3();private halfHeight=6.8;private width=960;private height=540;
  constructor(readonly camera:THREE.OrthographicCamera,options:{target?:THREE.Vector3;offset?:THREE.Vector3}={}){this.target=options.target??new THREE.Vector3();this.offset=options.offset??new THREE.Vector3(13.5,18,22);}
  resize(width:number,height:number){this.width=Math.max(1,width);this.height=Math.max(1,height);this.halfHeight=explorationHalfHeight(width,height);const aspect=this.width/this.height;Object.assign(this.camera,{top:this.halfHeight,bottom:-this.halfHeight,left:-this.halfHeight*aspect,right:this.halfHeight*aspect});this.camera.updateProjectionMatrix();}
  setContext(context:CameraContext,focus?:WorldFocus|null){this.context=context;this.contextFocus=focus??null;}
  snap(position:WorldFocus){this.target.set(position.x,position.y??0,position.z);this.camera.position.copy(this.target).add(this.offset);this.look.copy(this.target).y+=.48;this.camera.lookAt(this.look);this.focusPoint.set(position.x,(position.y??0)+.95,position.z);this.camera.updateMatrixWorld();}
  update(dt:number,player:THREE.Vector3,pose:CameraPose={}){
    const delta=THREE.MathUtils.clamp(Number.isFinite(dt)?dt:0,0,.15),cinematic=!!pose.cinematic;
    this.desired.copy(pose.target??player);this.focusPoint.copy(player).y+=.95;
    const focus=this.contextFocus;
    if(!cinematic&&focus&&Math.hypot(focus.x-player.x,focus.z-player.z)<5.5){this.desired.lerp(new THREE.Vector3(focus.x,focus.y??0,focus.z),this.context==='dialogue'?.4:.23);this.focusPoint.lerp(new THREE.Vector3(focus.x,(focus.y??0)+.9,focus.z),.35);}
    if(cinematic&&pose.target)this.focusPoint.copy(pose.target).y+=.9;
    this.target.lerp(this.desired,1-Math.exp(-delta*(cinematic?2.8:this.context==='dialogue'?4.5:5.8)));
    this.camera.position.copy(this.target).add(pose.offset??this.offset);this.look.copy(this.target).y+=.48;this.camera.lookAt(this.look);
    const contextual=cinematic?1:this.context==='dialogue'?1.2:this.context==='important'?1.12:this.context==='title'?.93:1;
    const zoom=THREE.MathUtils.clamp((pose.zoom??1)*contextual,.78,1.38);this.camera.zoom=THREE.MathUtils.lerp(this.camera.zoom,zoom,1-Math.exp(-delta*4.2));this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld();
  }
  getDebugInfo(){return {context:this.context,halfHeight:this.halfHeight,visibleWidth:this.halfHeight*2*this.width/this.height/this.camera.zoom,visibleHeight:this.halfHeight*2/this.camera.zoom,heroPixels:projectedCharacterPixels(this.height,this.halfHeight,this.camera.zoom),zoom:this.camera.zoom,focusDepth:focusViewDepth(this.camera,this.focusPoint)};}
}
