export type VisualRegion = 'ofra' | 'altar' | 'harode' | 'midian';
export type RenderQuality = 'high' | 'low';
export interface RegionProfile {
  sky: string; fog: string; fogNear: number; fogFar: number;
  sun: string; sunIntensity: number; skyLight: string; groundLight: string; ambientIntensity: number;
  fill: string; fillIntensity: number; exposure: number; saturation: number; contrast: number;
  shadows: [number, number, number]; highlights: [number, number, number]; bloom: number;
}
/** Restrained palettes: material colour and local light remain the main source of colour. */
export const REGION_PROFILES: Record<VisualRegion, RegionProfile> = {
  ofra: { sky:'#aebec0',fog:'#c8bba1',fogNear:38,fogFar:100,sun:'#ffd29a',sunIntensity:2.65,skyLight:'#c2d8e3',groundLight:'#82735a',ambientIntensity:.72,fill:'#d3e0e7',fillIntensity:.23,exposure:1.04,saturation:1.035,contrast:1.035,shadows:[.97,1.005,1.035],highlights:[1.025,1.005,.98],bloom:.15 },
  altar: { sky:'#172638',fog:'#25394b',fogNear:34,fogFar:86,sun:'#b8c8e8',sunIntensity:.92,skyLight:'#a0bdd5',groundLight:'#30373b',ambientIntensity:.68,fill:'#b3c5df',fillIntensity:.18,exposure:1.08,saturation:.97,contrast:1.035,shadows:[.96,1.01,1.055],highlights:[1.025,1.005,.975],bloom:.25 },
  harode: { sky:'#9baeb8',fog:'#aeb9b4',fogNear:39,fogFar:112,sun:'#ffe1ad',sunIntensity:2.15,skyLight:'#bfd8e1',groundLight:'#7d8068',ambientIntensity:.82,fill:'#d0dfeb',fillIntensity:.22,exposure:1.035,saturation:.985,contrast:1.025,shadows:[.97,1.01,1.035],highlights:[1.015,1.015,.99],bloom:.13 },
  midian: { sky:'#101d2b',fog:'#26374a',fogNear:34,fogFar:91,sun:'#adc4e7',sunIntensity:.8,skyLight:'#9eb6d4',groundLight:'#29313b',ambientIntensity:.68,fill:'#9eafcf',fillIntensity:.2,exposure:1.1,saturation:.99,contrast:1.045,shadows:[.955,1.005,1.06],highlights:[1.035,1.01,.965],bloom:.3 },
};
export interface RenderEnvironment { width: number; height: number; devicePixelRatio: number; software: boolean; }
export interface RenderBudget { pixelRatio: number; minimumPixelRatio: number; shadowSize: number; depthOfField: 'depth' | 'economic'; bloomScale: number; }
export function resolveRenderBudget(quality: RenderQuality, environment: RenderEnvironment): RenderBudget {
  const mobile=environment.width<950 || environment.height<500;
  const native=Math.max(.65,Number.isFinite(environment.devicePixelRatio)?environment.devicePixelRatio:1);
  const cap=environment.software?(quality==='high'?.85:.72):quality==='high'?(mobile?1.4:1.7):(mobile?1.1:1.2);
  return { pixelRatio:Math.min(native,cap),minimumPixelRatio:environment.software?.65:mobile?.85:.9,shadowSize:quality==='high'?2048:1024,depthOfField:quality==='high'&&!environment.software&&!mobile?'depth':'economic',bloomScale:quality==='high'&&!environment.software?.6:.35 };
}
/** Change resolution gradually, with hysteresis; never drop to the former 0.4x pixel grid. */
export class AdaptiveResolution {
  private slow=0; private fast=0; private ratio:number;
  constructor(private budget:RenderBudget){this.ratio=budget.pixelRatio;}
  get pixelRatio(){return this.ratio;}
  reset(budget:RenderBudget){this.budget=budget;this.ratio=budget.pixelRatio;this.slow=0;this.fast=0;}
  sample(fps:number):boolean {
    if(!Number.isFinite(fps)||fps<=0)return false;
    this.slow=fps<27?this.slow+1:0;this.fast=fps>52?this.fast+1:0;
    const before=this.ratio;
    if(this.slow>=2){this.ratio=Math.max(Math.min(this.budget.minimumPixelRatio,this.budget.pixelRatio),Math.round((this.ratio-.08)*100)/100);this.slow=0;}
    if(this.fast>=5){this.ratio=Math.min(this.budget.pixelRatio,Math.round((this.ratio+.04)*100)/100);this.fast=0;}
    return before!==this.ratio;
  }
}
