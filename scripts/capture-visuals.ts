import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { createGame, serializeSave } from '../src/game';
import { createServer } from 'vite';

const phase=process.argv[2]??'after',url=process.env.VISUAL_URL??'http://127.0.0.1:4173/';
const directory='docs/screenshots/visual-review';
const preview=process.env.VISUAL_ROOT?await createServer({root:process.env.VISUAL_ROOT,server:{host:'127.0.0.1',port:new URL(url).port?Number(new URL(url).port):5175,strictPort:true}}):null;
await preview?.listen();
await mkdir(directory,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
try{
 for(const viewport of [{width:1440,height:900},{width:844,height:390}])for(const [name,position]of [['plaza',{x:0,z:6}],['joas',{x:-5,z:1}]] as const){
  if(process.env.VISUAL_FILTER&&!`${name}-${viewport.width}`.includes(process.env.VISUAL_FILTER))continue;
  const context=await browser.newContext({viewport,deviceScaleFactor:1,hasTouch:viewport.width<900,isMobile:viewport.width<900});
  const game=createGame();game.position={...position};game.flags.intro=true;game.elapsedSeconds=150;
  const snapshot=serializeSave(game),page=await context.newPage(),errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(value=>localStorage.setItem('bible-gideao-save-v1',value),snapshot);
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.evaluate(async value=>{
   const db=await new Promise<IDBDatabase>((resolve,reject)=>{const open=indexedDB.open('bible-gideao',1);open.onupgradeneeded=()=>{if(!open.result.objectStoreNames.contains('saves'))open.result.createObjectStore('saves');};open.onsuccess=()=>resolve(open.result);open.onerror=()=>reject(open.error);});
   await new Promise<void>((resolve,reject)=>{const tx=db.transaction('saves','readwrite');tx.objectStore('saves').put(value,'campaign');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});db.close();
  },snapshot);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Retomar jornada',exact:true}).click({timeout:90000});
  await expect.poll(()=>page.evaluate(()=>(window as any).__GIDEAO__?.getWorld()?.fps??0),{timeout:90000}).toBeGreaterThan(0);
  await expect.poll(()=>page.evaluate(()=>(window as any).__GIDEAO__.getWorld()?.rendering?.preparing??false),{timeout:90000}).toBe(false);
  await expect.poll(()=>page.evaluate(()=>{const debug=(window as any).__GIDEAO__.getWorld();return debug.camera?debug.camera.context==='exploration'&&Math.abs(debug.camera.zoom-1)<.005:true;}),{timeout:30000}).toBe(true);
  await expect.poll(()=>page.evaluate(()=>{const debug=(window as any).__GIDEAO__.getWorld();return (!debug.heroAnimation||debug.heroAnimation.ready)&&(!debug.peopleV2||debug.peopleV2.length===4)&&(!debug.environmentArt||debug.environmentArt.materials&&debug.environmentArt.olive);}),{timeout:90000}).toBe(true);
  const state=await page.evaluate(()=>(window as any).__GIDEAO__.getState()),debug=await page.evaluate(()=>(window as any).__GIDEAO__.getWorld());
  expect(state.region).toBe('ofra');expect(Math.hypot(debug.position.x-position.x,debug.position.z-position.z)).toBeLessThan(.01);
  const filename=`${directory}/${phase}-${name}-${viewport.width}x${viewport.height}`;
  await page.screenshot({path:`${filename}.png`});
  await writeFile(`${filename}.json`,JSON.stringify({phase,url,viewport,source:process.env.VISUAL_SOURCE??'working tree',fixture:{region:state.region,stage:state.stage,position,elapsedSeconds:150},renderer:debug,errors},null,2)+'\n');
  console.log(`${filename}.png · ${debug.quality} · DPR ${debug.pixelRatio} · ${debug.drawCalls} draw calls · ${errors.length} errors`);
  await context.close();
 }
}finally{await browser.close();await preview?.close();}
