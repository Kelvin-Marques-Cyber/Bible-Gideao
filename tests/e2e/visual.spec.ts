import {test,expect,type Page} from '@playwright/test';
import {createGame,serializeSave} from '../../src/game';


/** Inspect a real browser screenshot, away from the HUD, to reject a cleared 3D canvas. */
async function expectVisibleWorld(page:Page){
 const viewport=page.viewportSize()!;
 const capture=await page.screenshot({clip:{x:Math.round(viewport.width*.4),y:Math.round(viewport.height*.35),width:Math.round(viewport.width*.2),height:Math.round(viewport.height*.3)}});
 const colors=await page.evaluate(async encoded=>{
  const bitmap=await createImageBitmap(await(await fetch(`data:image/png;base64,${encoded}`)).blob());
  const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
  const context=canvas.getContext('2d')!;context.drawImage(bitmap,0,0);bitmap.close();
  const pixels=context.getImageData(0,0,canvas.width,canvas.height).data,colors=new Set<number>();
  for(let i=0;i<pixels.length;i+=16)colors.add((pixels[i]>>3)*1024+(pixels[i+1]>>3)*32+(pixels[i+2]>>3));
  return colors.size;
 },capture.toString('base64'));
 expect(colors,'the central world image must contain terrain and character detail').toBeGreaterThan(20);
}

test('Ofra keeps the player readable, collapses its HUD and recovers a lost graphics context',async({page})=>{
 const initial=createGame();initial.flags.intro=true;initial.position={x:0,z:6};initial.elapsedSeconds=150;
 await page.addInitScript(snapshot=>localStorage.setItem('bible-gideao-save-v1',snapshot),serializeSave(initial));
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 const world=()=>page.evaluate(()=>(window as any).__GIDEAO__.getWorld());
 const state=()=>page.evaluate(()=>(window as any).__GIDEAO__.getState());
 await page.goto('/');await page.getByRole('button',{name:'Retomar jornada',exact:true}).click();
 await expect.poll(async()=>(await world()).rendering.preparing,{timeout:60000}).toBe(false);
 await expect.poll(async()=>(await world()).heroAnimation.ready,{timeout:60000}).toBe(true);
 await expect.poll(async()=>(await world()).camera.zoom).toBeGreaterThan(.99);
 await expectVisibleWorld(page);
 const before=await world();expect(before.camera.heroPixels).toBeGreaterThan(65);expect(before.pixelRatio).toBeGreaterThanOrEqual(.65);expect(before.rendering.postprocessing).toBe(true);
 const expand=page.getByRole('button',{name:'Expandir objetivo',exact:true});await expect(expand).toHaveAttribute('aria-expanded','false');
 await expand.click();await expect(page.locator('.objective-details')).toBeVisible();await page.getByRole('button',{name:'Recolher objetivo',exact:true}).click();await expect(page.locator('.objective-details')).toHaveCount(0);
 await page.getByRole('button',{name:'Interagir',exact:true}).click();await expect(page.locator('.dialogue-box')).toBeVisible();
 await expect.poll(async()=>(await world()).camera.context).toBe('dialogue');await expect.poll(async()=>(await world()).camera.zoom).toBeGreaterThan(1.1);
 expect((await world()).position).toEqual(before.position);
 for(let line=0;line<15&&await page.locator('.dialogue-box').count();line++)await page.locator('.dialogue-bottom button').click();
 await expect.poll(async()=>(await state()).stage).toBe(1);await expect.poll(async()=>(await world()).camera.context).toBe('exploration');
 const progress=await state();
 const supported=await page.evaluate(()=>{
  const canvas=document.querySelector('canvas')!,gl=canvas.getContext('webgl2')??canvas.getContext('webgl');
  const extension=gl?.getExtension('WEBGL_lose_context');if(!extension)return false;(window as any).__testContext=extension;extension.loseContext();return true;
 });
 expect(supported,'Chromium must provide its test context-loss extension').toBe(true);
 await expect(page.getByRole('alertdialog',{name:'Restaurando o cenário'})).toBeVisible();expect((await state()).stage).toBe(progress.stage);
 await page.evaluate(()=>{(window as any).__testContext.restoreContext();delete (window as any).__testContext;});
 await expect(page.getByRole('alertdialog',{name:'Restaurando o cenário'})).toHaveCount(0,{timeout:90000});
 await expect.poll(async()=>(await world()).contextLost,{timeout:60000}).toBe(false);expect((await state()).position).toEqual(progress.position);expect((await state()).stage).toBe(progress.stage);
 await expect(page.getByTestId('world-canvas')).toBeVisible();await expectVisibleWorld(page);expect(errors).toEqual([]);
});
