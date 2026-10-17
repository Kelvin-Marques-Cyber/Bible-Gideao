import { test, expect, type Page } from '@playwright/test';

type P={x:number;z:number};
const destinations:P[]=[{x:0,z:4},{x:-8,z:-5},{x:11,z:-9},{x:0,z:-5},{x:-6,z:5},{x:-5,z:-8},{x:0,z:4},{x:7,z:-4},{x:3,z:-8},{x:-5,z:-4},{x:-7,z:5},{x:0,z:-10},{x:9,z:-7},{x:0,z:9}];
const read=(page:Page)=>page.evaluate(()=>(window as any).__GIDEAO__.getState());
const world=(page:Page)=>page.evaluate(()=>(window as any).__GIDEAO__.getWorld());
async function dialogues(page:Page){
 for(let i=0;i<15;i++){const button=page.locator('.dialogue-bottom button');if(!await button.count())break;await button.click();await page.waitForTimeout(130);}
}
function path(start:P,end:P,obstacles:any[]):P[]{
 const size=.7, n=51,at=(x:number,z:number)=>`${x},${z}`,cell=(p:P)=>({x:Math.round((p.x+17.5)/size),z:Math.round((p.z+17.5)/size)}),pos=(p:P)=>({x:p.x*size-17.5,z:p.z*size-17.5});
 const first=cell(start),queue=[first],previous=new Map<string,P|null>([[at(first.x,first.z),null]]);let finish:P|undefined;
 const blocked=(p:P)=>{const v=pos(p);return obstacles.some(o=>Math.abs(v.x-o.x)<o.width/2+.37&&Math.abs(v.z-o.z)<o.depth/2+.37);};
 for(let i=0;i<queue.length;i++){const p=queue[i],v=pos(p);if(Math.hypot(v.x-end.x,v.z-end.z)<1.6){finish=p;break;}for(const d of [{x:1,z:0},{x:-1,z:0},{x:0,z:1},{x:0,z:-1}]){const q={x:p.x+d.x,z:p.z+d.z},key=at(q.x,q.z);if(q.x<0||q.z<0||q.x>=n||q.z>=n||previous.has(key)||blocked(q))continue;previous.set(key,p);queue.push(q);}}
 if(!finish)throw new Error(`No walkable path to ${JSON.stringify(end)}`);const route:P[]=[];let cursor:P|null=finish;while(cursor){route.unshift(pos(cursor));cursor=previous.get(at(cursor.x,cursor.z))??null;}return route;
}
async function fight(page:Page){
 for(let i=0;i<100;i++){
  const s=await read(page),b=s.battle;if(!b)return;
  if(b.status!=='active'){expect(b.status,'tactical decisions should win').toBe('victory');await page.getByRole('button',{name:'Continuar a jornada',exact:true}).click();await page.waitForTimeout(400);return;}
  const actor=b.units.find((u:any)=>u.id===b.turnOrder[b.turnIndex]),allies=b.units.filter((u:any)=>u.side==='ally'&&u.hp>0),weak=allies.find((u:any)=>u.hp<u.maxHp*.48);
  if(weak&&Object.entries(s.inventory).some(([id,q])=>['bread','meal','dates'].includes(id)&&Number(q)>0)){
   await page.getByRole('button',{name:`Selecionar aliado ${weak.name}`,exact:true}).click();const choice=page.getByLabel('Suprimento de batalha');if(await choice.count()){const id=['bread','meal'].find(id=>(s.inventory[id]??0)>0);if(id)await choice.selectOption(id);}
   const supply=page.locator('.action-grid button').filter({hasText:'Suprimento'});if(await supply.count()){await supply.click();await page.waitForTimeout(650);continue;}
  }
  const target=b.units.filter((u:any)=>u.side==='enemy'&&u.hp>0).sort((a:any,b:any)=>a.hp-b.hp)[0];await page.getByRole('button',{name:`Selecionar ${target.name}`,exact:true}).click();
  const focus=page.locator('.action-grid button').filter({hasText:'Golpe concentrado'}),precise=page.locator('.action-grid button').filter({hasText:'Ataque preciso'}),quick=page.locator('.action-grid button').filter({hasText:'Ataque rápido'});
  if(actor.vigor>=6&&await focus.count())await focus.click();else if(actor.vigor>=3&&await precise.count())await precise.click();else if(actor.vigor>=3&&await quick.count())await quick.click();else await page.locator('.action-grid button').filter({hasText:'Atacar'}).click();
  await page.waitForTimeout(650);
 }
 throw new Error('Battle failed to resolve');
}
async function walkTo(page:Page,end:P){
 let stuck=0,last:P|undefined;
 for(let tries=0;tries<300;tries++){
  const state=await read(page);if(state.battle){await dialogues(page);await fight(page);continue;}
  if(await page.locator('.dialogue-box').count()){await dialogues(page);continue;}
  const info=await world(page),p=info.position;if(Math.hypot(p.x-end.x,p.z-end.z)<2.15)return;
  const route=path(p,end,info.obstacles),next=route[Math.min(3,route.length-1)]??end,dx=next.x-p.x,dz=next.z-p.z;
  // Invert the camera-aligned movement basis. Tests use real key input only.
  const sx=.852*dx-.523*dz,sy=.523*dx+.852*dz,len=Math.hypot(sx,sy),keys:string[]=[];
  if(sx/len>.37)keys.push('d');if(sx/len<-.37)keys.push('a');if(sy/len>.37)keys.push('s');if(sy/len<-.37)keys.push('w');
  for(const k of keys)await page.keyboard.down(k);await page.waitForTimeout(220);for(const k of keys)await page.keyboard.up(k);
  if(last&&Math.hypot(last.x-p.x,last.z-p.z)<.025)stuck++;else stuck=0;last=p;
  if(stuck>12)throw new Error(`Movement stuck: ${JSON.stringify({p,end,route:route.slice(0,6)})}`);
 }
 throw new Error(`Walking timeout toward ${JSON.stringify(end)}`);
}

test('complete four acts through exploration, combat, equipment and saved progress',async({page})=>{
 test.setTimeout(900000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.getByRole('button',{name:'Iniciar jornada',exact:true}).click();await dialogues(page);await page.waitForTimeout(12500);
 const initial=await world(page);await page.keyboard.down('d');await page.waitForTimeout(1800);await page.keyboard.up('d');expect(Math.hypot((await world(page)).position.x-initial.position.x,(await world(page)).position.z-initial.position.z)).toBeGreaterThan(.5);
 for(let stage=0;stage<14;stage++){
  console.log('Campaign objective',stage);await expect.poll(async()=>(await read(page)).stage).toBe(stage);
  if(stage===2){
   await walkTo(page,{x:6,z:3});await page.getByRole('button',{name:'Interagir',exact:true}).click();await expect(page.getByRole('heading',{name:'Mercador de Ofra'})).toBeVisible();
   await page.locator('.item').filter({hasText:'Pão de cevada'}).getByRole('button',{name:/Vender/}).click();const before=(await read(page)).silver;await page.locator('.item').filter({hasText:'Lança de freixo'}).getByRole('button',{name:'Comprar',exact:true}).click();expect((await read(page)).silver).toBeLessThan(before);
   await page.getByRole('button',{name:'Inventário',exact:true}).last().click();await page.locator('.item').filter({hasText:'Lança de freixo'}).getByRole('button',{name:'Equipar',exact:true}).click();expect((await read(page)).party[0].equipment.weapon).toBe('spear');await page.getByRole('button',{name:'Fechar menu'}).click();
  }
  await walkTo(page,destinations[stage]);await page.getByRole('button',{name:'Interagir',exact:true}).click();await dialogues(page);
  if(stage===2||stage===12)await fight(page);
  await expect.poll(async()=>(await read(page)).stage,{timeout:20000}).toBe(stage+1);
  await page.waitForTimeout(7500);
  if([2,5,8,11,13].includes(stage))await page.screenshot({path:`test-results/act-${stage}.png`});
 }
 const completed=await read(page);expect(completed.flags.completed).toBe(true);expect(completed.quests.campaign.status).toBe('completed');expect(completed.party.length).toBe(2);expect(completed.party[0].stats.level).toBeGreaterThan(1);
 await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('button',{name:/Salvar jornada/}).click();await expect(page.getByRole('status')).toContainText('salva');await page.reload();await page.getByRole('button',{name:'Retomar jornada',exact:true}).click();expect((await read(page)).stage).toBe(14);expect((await read(page)).party[0].equipment.weapon).toBe('spear');expect(errors).toEqual([]);
});

test('touch movement, responsive menus, install manifest and offline recovery',async({browser})=>{
 test.setTimeout(180000);const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:1});const page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.getByRole('button',{name:'Iniciar jornada',exact:true}).click();await dialogues(page);await page.waitForTimeout(12500);
 const before=(await world(page)).position,joy=page.getByLabel('Controle de movimento'),box=(await joy.boundingBox())!;await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+35,box.y+box.height/2);await page.waitForTimeout(950);await page.mouse.up();const after=(await world(page)).position;expect(Math.hypot(after.x-before.x,after.z-before.z)).toBeGreaterThan(.5);
 await page.getByRole('button',{name:'Inventário',exact:true}).first().click();await expect(page.getByRole('heading',{name:'Inventário',exact:true})).toBeVisible();expect(await page.locator('body').evaluate(el=>el.scrollWidth<=innerWidth)).toBe(true);await page.getByRole('button',{name:'Fechar menu'}).click();
 await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('button',{name:/Salvar jornada/}).click();await expect(page.getByRole('status')).toContainText('salva');
 await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>navigator.serviceWorker.controller!==null)).toBe(true);const manifest=await page.request.get('/manifest.webmanifest');expect((await manifest.json()).display).toBe('standalone');
 await context.setOffline(true);await page.reload();await page.getByRole('button',{name:'Retomar jornada',exact:true}).click();await expect(page.getByTestId('world-canvas')).toBeVisible();expect((await read(page)).position.x).toBeCloseTo(after.x,0);await page.screenshot({path:'test-results/mobile-offline.png'});expect(errors).toEqual([]);await context.close();
});
