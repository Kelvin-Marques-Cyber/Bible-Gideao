import * as THREE from 'three';
import { heroAnimationAtlas } from '../../content/heroAnimationAtlas';

export type CharacterContext='idle'|'walk'|'start'|'stop'|'talk'|'interact'|'ready'|'attack'|'guard'|'hurt'|'victory'|'exhausted';
type Direction=0|1|2|3;
type ContextOptions={direction?:Direction;duration?:number;force?:boolean};
type Atlas={url:string;columns:number;rows:number;referenceHeight:number};
const LOOPING=new Set<CharacterContext>(['idle','walk','talk','ready','guard','exhausted']);
const DEFAULT_DURATION:Partial<Record<CharacterContext,number>>={start:.14,stop:.16,interact:.85,attack:.65,hurt:.55,victory:1.7};

/** Owns its textures; callers may share frame references until this controller is disposed. */
export class CharacterAnimator {
 private walk:THREE.Texture[][]=[];
 private actions=new Map<CharacterContext,THREE.Texture[]>();
 private context:CharacterContext='idle';
 private direction:Direction=0;
 private elapsed=0;
 private duration=Infinity;
 private disposed=false;
 private time=0;
 private loading:Promise<void>|null=null;
 constructor(private readonly options:{walkAtlas?:Atlas;actionAtlas?:Atlas}={}){}

 load():Promise<void>{
  if(this.disposed)return Promise.resolve();
  if(this.loading)return this.loading;
  this.loading=Promise.all([this.loadAtlas(this.options.walkAtlas??heroAnimationAtlas.walk),this.loadAtlas(this.options.actionAtlas??heroAnimationAtlas.actions)]).then(([walk,actions])=>{
   if(this.disposed){[...walk,...actions].flat().forEach(texture=>texture.dispose());return;}
   this.walk=walk;heroAnimationAtlas.actions.states.forEach((state,row)=>this.actions.set(state,actions[row]??[]));
  });return this.loading;
 }

 private async loadAtlas(atlas:Atlas):Promise<THREE.Texture[][]>{
  const source=await new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error(`Não foi possível carregar ${atlas.url}`));image.src=`${import.meta.env.BASE_URL}${atlas.url}`;});
  if(this.disposed)return [];
  const rows:THREE.Texture[][]=[];
  for(let row=0;row<atlas.rows;row++){
   if(this.disposed){rows.flat().forEach(texture=>texture.dispose());return [];}
   const frames:THREE.Texture[]=[];
   for(let column=0;column<atlas.columns;column++){
    const x=Math.round(source.width*column/atlas.columns),y=Math.round(source.height*row/atlas.rows),w=Math.round(source.width*(column+1)/atlas.columns)-x,h=Math.round(source.height*(row+1)/atlas.rows)-y;
    const cell=document.createElement('canvas');cell.width=w;cell.height=h;const cellContext=cell.getContext('2d',{willReadFrequently:true})!;cellContext.drawImage(source,x,y,w,h,0,0,w,h);
    const box=this.isolateSprite(cellContext,w,h),canvas=document.createElement('canvas');canvas.width=heroAnimationAtlas.canvasWidth;canvas.height=heroAnimationAtlas.canvasHeight;const context=canvas.getContext('2d')!;context.imageSmoothingEnabled=false;
    // One scale per sheet preserves crouching, recoil and body proportions across poses.
    const scale=heroAnimationAtlas.visibleHeight/atlas.referenceHeight,dw=box.width*scale,dh=box.height*scale;
    context.drawImage(cell,box.x,box.y,box.width,box.height,canvas.width/2-(box.anchorX-box.x)*scale,canvas.height-3-dh,dw,dh);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.LinearFilter;texture.generateMipmaps=false;texture.userData.spriteAspect=canvas.width/canvas.height;texture.userData.visibleHeight=heroAnimationAtlas.visibleHeight/canvas.height;texture.userData.baselineRatio=3/canvas.height;texture.name=`Gideão ${row}:${column}`;frames.push(texture);
   }rows.push(frames);await new Promise<void>(resolve=>setTimeout(resolve,0));
  }return rows;
 }

 private isolateSprite(context:CanvasRenderingContext2D,width:number,height:number){
  const pixels=context.getImageData(0,0,width,height),labels=new Int32Array(width*height),queue=new Int32Array(width*height);let label=0,best=0,bestSize=0;
  for(let pixel=0;pixel<labels.length;pixel++){
   if(labels[pixel]||pixels.data[pixel*4+3]<28)continue;label++;let begin=0,end=1;queue[0]=pixel;labels[pixel]=label;
   while(begin<end){const index=queue[begin++],x=index%width,y=Math.floor(index/width);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if((!dx&&!dy)||nx<0||nx>=width||ny<0||ny>=height)continue;const next=ny*width+nx;if(!labels[next]&&pixels.data[next*4+3]>=28){labels[next]=label;queue[end++]=next;}}}
   if(end>bestSize){bestSize=end;best=label;}
  }
  let left=width,top=height,right=0,bottom=0;
  for(let pixel=0;pixel<labels.length;pixel++){if(labels[pixel]!==best){pixels.data[pixel*4+3]=0;continue;}const x=pixel%width,y=Math.floor(pixel/width);left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
  let weightedX=0,weight=0;const footBand=Math.max(5,Math.round((bottom-top)*.08));
  for(let y=Math.max(top,bottom-footBand);y<=bottom;y++)for(let x=left;x<=right;x++){const pixel=y*width+x;if(labels[pixel]===best){const alpha=pixels.data[pixel*4+3]/255;weightedX+=x*alpha;weight+=alpha;}}
  context.putImageData(pixels,0,0);return bestSize?{x:left,y:top,width:right-left+1,height:bottom-top+1,anchorX:weight?weightedX/weight:(left+right)/2}:{x:0,y:0,width,height,anchorX:width/2};
 }

 setContext(context:CharacterContext,options:ContextOptions={}){
  if(options.direction!==undefined)this.direction=options.direction;
  const locomotion=['walk','idle','start','stop'].includes(context),locked=!['walk','idle','start','stop'].includes(this.context)&&this.elapsed<this.duration;
  if(locomotion&&locked&&!options.force)return;
  if(!options.force&&((this.context==='start'&&context==='walk'||this.context==='stop'&&context==='idle')&&this.elapsed<this.duration))return;
  if(!options.force&&context==='walk'&&this.context==='idle')context='start';
  else if(!options.force&&context==='idle'&&this.context==='walk')context='stop';
  if(context===this.context&&!options.force)return;
  this.context=context;this.elapsed=0;this.duration=options.duration??DEFAULT_DURATION[context]??Infinity;
 }

 update(dt:number,speed=0){
  this.time+=dt;this.elapsed+=dt;
  if(this.elapsed>=this.duration){this.context=speed>.05?'walk':'idle';this.elapsed=0;this.duration=Infinity;}
  const action=this.actions.get(this.context),directionalIdle=this.context==='idle'&&(this.direction===0||this.direction===2),walking=['walk','start','stop'].includes(this.context)||directionalIdle;
  const frames=walking?this.walk[this.direction]:action??this.walk[this.direction];
  let frame=0;
  if(frames?.length){
   if(this.context==='walk')frame=Math.floor(this.elapsed*(5+Math.min(1,speed)*4))%frames.length;
   else if(directionalIdle)frame=0;
   else if(LOOPING.has(this.context))frame=Math.floor(this.elapsed*(this.context==='idle'?2.4:this.context==='talk'?4:3))%frames.length;
   else frame=Math.min(frames.length-1,Math.floor(this.elapsed/this.duration*frames.length));
  }
  return {texture:frames?.[frame]??null,frame,direction:this.direction,footOffset:0,scaleX:!walking&&(this.context==='idle'?this.direction===3:this.direction===1)?-1:1,rotation:this.context==='start'?-.035:this.context==='stop'?.025:0,context:this.context};
 }
 getWalkFrames(){return this.walk;}
 getActionFrames(context:CharacterContext){return this.actions.get(context)??[];}
 getContext(){return this.context;}
 dispose(){if(this.disposed)return;this.disposed=true;new Set([...this.walk.flat(),...[...this.actions.values()].flat()]).forEach(texture=>texture.dispose());this.walk=[];this.actions.clear();}
}
