import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CameraRig, focusDepthBand } from './CameraRig';
import { AdaptiveResolution, REGION_PROFILES, resolveRenderBudget, type RenderBudget, type RenderEnvironment, type RenderQuality, type VisualRegion } from './profiles';
import { DioramaGradeShader, ProtectedDepthFragment } from './shaders';
export interface PipelineOptions {region:VisualRegion;quality:RenderQuality;software:boolean;width:number;height:number;devicePixelRatio?:number;}
export class Hd2dPipeline {
  readonly composer:EffectComposer;readonly bloom:UnrealBloomPass;readonly bokeh:BokehPass;readonly grade:ShaderPass;
  private readonly hdrSupported:boolean;private readonly renderPass:RenderPass;private readonly outputPass:OutputPass;
  private warming:Promise<void>|null=null;private disposed=false;private preparationMs=0;
  private region:VisualRegion;private quality:RenderQuality;private environment:RenderEnvironment;private budget:RenderBudget;private adaptive:AdaptiveResolution;
  private readonly points=new THREE.Vector4(.5,.5,.5,.5);private readonly projected=new THREE.Vector3();private width:number;private height:number;
  constructor(readonly renderer:THREE.WebGLRenderer,readonly scene:THREE.Scene,readonly camera:THREE.OrthographicCamera,options:PipelineOptions){
    renderer.info.autoReset=false;this.region=options.region;this.quality=options.quality;this.width=options.width;this.height=options.height;
    this.environment={width:options.width,height:options.height,software:options.software,devicePixelRatio:options.devicePixelRatio??globalThis.devicePixelRatio??1};this.budget=resolveRenderBudget(options.quality,this.environment);this.adaptive=new AdaptiveResolution(this.budget);
    this.hdrSupported=renderer.extensions.has('EXT_color_buffer_float');
    const target=new THREE.WebGLRenderTarget(1,1,{type:this.hdrSupported?THREE.HalfFloatType:THREE.UnsignedByteType,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});target.texture.generateMipmaps=false;
    this.composer=new EffectComposer(renderer,target);this.renderPass=new RenderPass(scene,camera);this.composer.addPass(this.renderPass);
    this.bloom=new UnrealBloomPass(new THREE.Vector2(256,144),.16,.32,2.35);this.composer.addPass(this.bloom);
    this.bokeh=new BokehPass(scene,camera,{focus:30,aperture:.00035,maxblur:.0015});this.bokeh.materialBokeh.defines.PERSPECTIVE_CAMERA=0;this.bokeh.materialBokeh.fragmentShader=ProtectedDepthFragment;
    this.dof.protectedPoints={value:this.points};this.dof.sharpDepth={value:3.8};this.bokeh.materialBokeh.needsUpdate=true;this.composer.addPass(this.bokeh);
    this.grade=new ShaderPass(DioramaGradeShader);this.grade.uniforms.texel.value=new THREE.Vector2();this.grade.uniforms.focalPoints.value=this.points;this.grade.uniforms.shadowTint.value=new THREE.Vector3(1,1,1);this.grade.uniforms.highlightTint.value=new THREE.Vector3(1,1,1);this.composer.addPass(this.grade);
    this.outputPass=new OutputPass();this.composer.addPass(this.outputPass);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.setRegion(options.region);this.resize(options.width,options.height);
  }
  private get dof(){return this.bokeh.uniforms as Record<string,THREE.IUniform>;}
  setRegion(region:VisualRegion){this.region=region;const p=REGION_PROFILES[region];this.renderer.toneMappingExposure=p.exposure;this.grade.uniforms.saturation.value=p.saturation;this.grade.uniforms.contrast.value=p.contrast;this.grade.uniforms.shadowTint.value.set(...p.shadows);this.grade.uniforms.highlightTint.value.set(...p.highlights);this.bloom.strength=p.bloom;this.configureEffects();}
  setQuality(quality:RenderQuality){this.quality=quality;this.budget=resolveRenderBudget(quality,this.environment);this.adaptive.reset(this.budget);this.applyResolution();this.configureEffects();}
  private configureEffects(){
    const depth=this.hdrSupported&&this.budget.depthOfField==='depth';this.bokeh.enabled=depth;this.bloom.enabled=this.hdrSupported&&this.quality==='high'&&!this.environment.software;
    this.grade.uniforms.blurPixels.value=depth?0:.85;this.grade.uniforms.economicBloom.value=this.bloom.enabled||!this.hdrSupported?0:REGION_PROFILES[this.region].bloom*.6;
    this.renderer.shadowMap.enabled=!this.environment.software;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  }
  resize(width:number,height:number){this.width=Math.max(1,width);this.height=Math.max(1,height);this.environment={...this.environment,width:this.width,height:this.height};this.budget=resolveRenderBudget(this.quality,this.environment);this.adaptive.reset(this.budget);this.applyResolution();this.configureEffects();}
  private applyResolution(){
    const ratio=this.adaptive.pixelRatio;this.renderer.setPixelRatio(ratio);this.renderer.setSize(this.width,this.height,false);this.composer.setPixelRatio(ratio);this.composer.setSize(this.width,this.height);
    this.bloom.setSize(Math.max(1,Math.round(this.width*ratio*this.budget.bloomScale)),Math.max(1,Math.round(this.height*ratio*this.budget.bloomScale)));
    this.grade.uniforms.texel.value.set(1/(this.width*ratio),1/(this.height*ratio));this.grade.uniforms.aspect.value=this.width/this.height;
    this.dof.aspect.value=this.width/this.height;this.dof.maxblur.value=2.1/(this.width*ratio);
  }
  updateFocus(point:THREE.Vector3,secondary?:THREE.Vector3){
    const band=focusDepthBand(this.camera,point,secondary);this.dof.focus.value=band.focus;this.dof.sharpDepth.value=band.sharpDepth;this.projected.copy(point).project(this.camera);this.points.set((this.projected.x+1)/2,(this.projected.y+1)/2,0,0);
    this.projected.copy(secondary??point).project(this.camera);this.points.z=(this.projected.x+1)/2;this.points.w=(this.projected.y+1)/2;
  }
  adapt(fps:number):boolean{if(!this.adaptive.sample(fps))return false;this.applyResolution();return true;}
  /** Start after the region exists. KHR_parallel_shader_compile lets save loading and UI tasks run. */
  prepare():Promise<void>{
    if(this.warming)return this.warming;const start=performance.now();
    this.warming=new Promise<void>(resolve=>setTimeout(resolve,0)).then(()=>{
      if(this.disposed)return;
      const previous=this.renderer.getRenderTarget();this.renderer.setRenderTarget(this.composer.readBuffer);
      const compilation=this.renderer.compileAsync(this.scene,this.camera);this.renderer.setRenderTarget(previous);
      return compilation.then(()=>undefined);
    }).catch(()=>undefined).finally(()=>{this.preparationMs=performance.now()-start;this.warming=null;});
    return this.warming;
  }
  render(dt?:number){if(this.disposed)return;this.renderer.info.reset();if(this.warming){this.renderer.setRenderTarget(null);this.renderer.clear();return;}this.composer.render(dt);}
  restore(){this.renderer.resetState();this.composer.reset();this.bokeh.setSize(1,1);this.bloom.setSize(1,1);this.resize(this.width,this.height);}
  getDebugInfo(){return{quality:this.quality,pixelRatio:this.adaptive.pixelRatio,depthOfField:this.bokeh.enabled?'protected-depth':'economic-focal-band',postprocessing:true,preparing:!!this.warming,preparationMs:this.preparationMs,hdr:this.hdrSupported,bloom:this.bloom.enabled?'hdr':this.hdrSupported?'economic-hdr':'source-glow',focusDepth:this.dof.focus.value,profile:this.region,width:this.width,height:this.height};}
  dispose(){this.disposed=true;this.renderPass.dispose();this.bloom.dispose();this.bokeh.dispose();this.grade.dispose();this.outputPass.dispose();this.composer.dispose();}
}
// Re-export makes one rendering import sufficient for World while preserving independent modules.
export {CameraRig};
