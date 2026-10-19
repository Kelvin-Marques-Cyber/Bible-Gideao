import * as THREE from 'three';
import { peopleAtlasV2,placePeopleFrame,type PeopleKindV2 } from '../../content/peopleSpritesV2';

function isolateCharacter(context:CanvasRenderingContext2D,width:number,height:number){
  const pixels=context.getImageData(0,0,width,height),labels=new Int32Array(width*height),queue=new Int32Array(width*height);let label=0,best=0,bestSize=0;
  for(let pixel=0;pixel<labels.length;pixel++){
    if(labels[pixel]||pixels.data[pixel*4+3]<peopleAtlasV2.alphaThreshold)continue;label++;let begin=0,end=1;queue[0]=pixel;labels[pixel]=label;
    while(begin<end){const current=queue[begin++],x=current%width,y=Math.floor(current/width);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if((!dx&&!dy)||xx<0||xx>=width||yy<0||yy>=height)continue;const next=yy*width+xx;if(!labels[next]&&pixels.data[next*4+3]>=peopleAtlasV2.alphaThreshold){labels[next]=label;queue[end++]=next;}}}
    if(end>bestSize){bestSize=end;best=label;}
  }
  for(let pixel=0;pixel<labels.length;pixel++)if(labels[pixel]!==best)pixels.data[pixel*4+3]=0;context.putImageData(pixels,0,0);
}

/** Four genuine directions, constant per-person scale, and an explicit grounded foot anchor. */
export async function loadPeopleFrames(kind:PeopleKindV2,isDisposed:()=>boolean):Promise<THREE.Texture[][]>{
  const sheet=peopleAtlasV2.characters[kind],source=await new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error(`NPC atlas ${kind} unavailable`));image.src=`${import.meta.env.BASE_URL}${sheet.url}`;});
  const directions:THREE.Texture[][]=[];
  for(const row of sheet.frames){
    if(isDisposed()){directions.flat().forEach(t=>t.dispose());return [];}
    const frames:THREE.Texture[]=[];
    for(const crop of row){
      const canvas=document.createElement('canvas');canvas.width=peopleAtlasV2.canvasWidth;canvas.height=peopleAtlasV2.canvasHeight;const ctx=canvas.getContext('2d',{willReadFrequently:true})!,destination=placePeopleFrame(crop,sheet.referenceHeight);ctx.imageSmoothingEnabled=false;ctx.drawImage(source,crop.x,crop.y,crop.width,crop.height,destination.x,destination.y,destination.width,destination.height);isolateCharacter(ctx,canvas.width,canvas.height);
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.LinearFilter;texture.generateMipmaps=false;texture.userData.directionalPeople=true;texture.userData.spriteAspect=canvas.width/canvas.height;texture.userData.visibleHeight=peopleAtlasV2.visibleHeight/canvas.height;texture.userData.baselineRatio=peopleAtlasV2.baseline/canvas.height;texture.name=`${kind} directional frame`;frames.push(texture);
    }
    directions.push(frames);await new Promise<void>(resolve=>setTimeout(resolve,0));
  }
  return directions;
}
