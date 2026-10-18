import { ITEMS } from './items';
import { getHeroStats, grantXp } from './progression';
import { updateQuest } from './state';
import type { ActionPreview, AvailableWeapon, BattleAction, BattleActionOptions, BattleEvent, BattleKind, BattleState, BattleUnit, EnemyArchetype, EnemyIntent, GameState, TimelineEntry, WeaponType } from './types';

export const WEAPON_NAMES: Record<WeaponType, string> = { sword: 'Espada', spear: 'Lança', bow: 'Arco', staff: 'Cajado' };
export const MAX_BP = 5;
export const MAX_BOOST = 3;
export const ACTIONS: Record<BattleAction, { name: string; description: string; cost: number; target: 'enemy' | 'ally' | 'self' | 'none'; supportsBoost: boolean }> = {
  attack: { name: 'Atacar', description: '1 golpe + 1 por Ímpeto. Cada acerto na fraqueza reduz 1 escudo. Recupera 2 de vigor.', cost: 0, target: 'enemy', supportsBoost: true },
  precise: { name: 'Ataque preciso', description: 'Um golpe preciso com a arma escolhida, que ignora a guarda e parte da proteção. Ímpeto aumenta a força.', cost: 3, target: 'enemy', supportsBoost: true },
  guard: { name: 'Defender', description: 'Reduz dano em 60%, recupera 5 de vigor e age antes na próxima rodada. Não usa Ímpeto.', cost: 0, target: 'self', supportsBoost: false },
  command: { name: 'Comando tático', description: 'Aumenta ataque e moral do grupo. Ímpeto prolonga a formação.', cost: 4, target: 'none', supportsBoost: true },
  focus: { name: 'Golpe concentrado', description: 'Um golpe forte. Use durante a Quebra para dobrar o dano. Ímpeto aumenta a força.', cost: 6, target: 'enemy', supportsBoost: true },
  quick: { name: 'Ataque rápido', description: 'Dois golpes com a arma escolhida. Ímpeto aumenta a força de cada golpe.', cost: 3, target: 'enemy', supportsBoost: true },
  cover: { name: 'Cobertura', description: 'Intercepta o próximo ataque a um aliado com dano reduzido. Ímpeto prolonga a cobertura.', cost: 3, target: 'ally', supportsBoost: true },
  observe: { name: 'Observação', description: 'Revela uma fraqueza e expõe o alvo. Ímpeto revela mais fraquezas e prolonga a abertura.', cost: 2, target: 'enemy', supportsBoost: true },
  supply: { name: 'Suprimento', description: 'Usa pão, provisões ou tâmaras em um aliado. Não usa Ímpeto.', cost: 0, target: 'ally', supportsBoost: false },
  retreat: { name: 'Recuar', description: 'Tenta deixar o confronto. Indisponível no confronto final.', cost: 0, target: 'none', supportsBoost: false },
};
export const ENEMY_TACTICS: Record<EnemyArchetype, { weaknesses: WeaponType[]; shield: number }> = {
  raider: { weaknesses: ['sword', 'bow'], shield: 2 }, spearman: { weaknesses: ['spear', 'staff'], shield: 3 },
  archer: { weaknesses: ['sword', 'staff'], shield: 2 }, captain: { weaknesses: ['spear', 'bow'], shield: 5 },
};
const ENEMIES = {
  raider: { name: 'Saqueador', hp: 41, attack: 13, defense: 3, speed: 7, weaponType: 'sword' as WeaponType },
  spearman: { name: 'Lanceiro', hp: 53, attack: 14, defense: 6, speed: 6, weaponType: 'spear' as WeaponType },
  archer: { name: 'Arqueiro', hp: 34, attack: 12, defense: 2, speed: 9, weaponType: 'bow' as WeaponType },
  captain: { name: 'Líder da patrulha', hp: 185, attack: 19, defense: 7, speed: 8, weaponType: 'sword' as WeaponType },
};
export function isBroken(unit: BattleUnit, round?: number): boolean { return unit.brokenUntilRound !== null && (round === undefined || round <= unit.brokenUntilRound); }
const stateBattle = (state: GameState | BattleState | null) => state && 'battle' in state ? state.battle : state;
export function currentActor(state: GameState | BattleState | null): BattleUnit | undefined {
  const battle = stateBattle(state); return battle?.status === 'active' ? battle.units.find(unit => unit.id === battle.turnOrder[battle.turnIndex]) : undefined;
}
export function getAvailableWeapons(state: GameState, actorId = currentActor(state)?.id ?? state.activeHeroId): AvailableWeapon[] {
  const hero = state.party.find(h => h.id === actorId); if (!hero) return [];
  const ids = new Set([hero.equipment.weapon, ...Object.keys(state.inventory).filter(id => state.inventory[id] > 0)]);
  const choices = new Map<WeaponType, AvailableWeapon>();
  for (const id of ids) {
    const item = id ? ITEMS[id] : null; if (!item?.weaponType || item.slot !== 'weapon') continue;
    const attack = hero.stats.attack + (item.modifiers?.attack ?? 0);
    if (!choices.has(item.weaponType) || choices.get(item.weaponType)!.attack < attack) choices.set(item.weaponType, { type: item.weaponType, itemId: item.id, name: item.name, attack });
  }
  return [...choices.values()];
}
export function getAvailableActions(state: GameState): BattleAction[] {
  const actor = currentActor(state); if (!actor || actor.side !== 'ally') return [];
  return (state.party.find(h => h.id === actor.heroId)?.unlockedSkills ?? []).filter(action =>
    !(action === 'retreat' && state.battle?.kind === 'captain') &&
    !(action === 'supply' && !['bread','meal','dates'].some(id => state.inventory[id] > 0)) &&
    !(action === 'cover' && !state.battle?.units.some(u => u.side === 'ally' && u.id !== actor.id && u.hp > 0)) && actor.vigor >= ACTIONS[action].cost);
}
function orderUnits(units: BattleUnit[]): string[] { return [...units].sort((a,b) => Number(b.priorityNextRound)-Number(a.priorityNextRound) || b.speed-a.speed || a.id.localeCompare(b.id)).map(u=>u.id); }
export function getTurnTimeline(state: GameState | BattleState | null): { current: TimelineEntry[]; next: TimelineEntry[] } {
  const b = stateBattle(state); if (!b) return { current: [], next: [] };
  const entries = (ids: string[], round: number) => ids.flatMap(id => { const u=b.units.find(unit=>unit.id===id); return !u || u.hp<=0 ? [] : [{id,name:u.name,side:u.side,round,broken:isBroken(u,round),current:round===b.round&&id===b.turnOrder[b.turnIndex],intent:u.side==='enemy'?getEnemyIntent({...b,round},u.id):null}]; });
  return { current: entries(b.turnOrder.slice(b.turnIndex),b.round), next: entries(orderUnits(b.units),b.round+1) };
}
export const getCurrentTurnOrder = (state: GameState | BattleState | null) => getTurnTimeline(state).current;
export const getNextTurnOrder = (state: GameState | BattleState | null) => getTurnTimeline(state).next;
export function getEnemyIntent(state: GameState | BattleState, unitId: string): EnemyIntent | null {
  const b=stateBattle(state),unit=b?.units.find(u=>u.id===unitId); if (!b || !unit || unit.side!=='enemy' || unit.hp<=0) return null;
  if (isBroken(unit,b.round)) return {action:'guard',label:'Quebra · sem ação'};
  if(unit.archetype==='spearman'&&b.round%3===1)return{action:'guard',label:'Preparar a guarda'};
  if(unit.archetype==='captain'&&b.round%3===1)return{action:'rally',label:'Reorganizar a unidade'};
  const allies=b.units.filter(u=>u.side==='ally'&&u.hp>0);const target=unit.archetype==='archer'?[...allies].sort((a,c)=>a.hp/a.maxHp-c.hp/c.maxHp)[0]:allies[(b.round-1)%Math.max(1,allies.length)];
  const heavy=unit.archetype==='spearman'||unit.archetype==='captain'&&unit.hp<unit.maxHp/2;
  return{action:heavy?'heavy':'attack',label:unit.archetype==='archer'?'Disparo no aliado ferido':heavy?'Investida pesada':'Ataque físico',targetId:target?.id};
}
function refreshIntents(state: GameState) { for(const u of state.battle!.units)u.intent=u.side==='enemy'?getEnemyIntent(state,u.id):null; }
function enemy(type: EnemyArchetype,index:number,scale=1):BattleUnit {
  const d=ENEMIES[type],t=ENEMY_TACTICS[type];return{id:`${type}-${index}`,name:d.name,side:'enemy',archetype:type,hp:Math.round(d.hp*scale),maxHp:Math.round(d.hp*scale),vigor:15,maxVigor:15,attack:Math.round(d.attack*scale),baseAttack:Math.round(d.attack*scale),defense:d.defense,speed:d.speed,leadership:type==='captain'?9:3,morale:60,weaponType:d.weaponType,weaponId:null,weaknesses:[...t.weaknesses],revealedWeaknesses:[],shield:t.shield,maxShield:t.shield,brokenUntilRound:null,bp:0,lastBoostRound:null,priorityNextRound:false,intent:null,guarding:false,exposedTurns:0,inspiredTurns:0,coveredBy:null,coverTurns:0};
}
export function startBattle(state:GameState,kind:BattleKind='patrol'):GameState {
  if(state.battle||state.party.every(h=>h.stats.hp<=0))return state;const next=structuredClone(state);
  const allies:BattleUnit[]=next.party.map(h=>{const s=getHeroStats(h);return{id:h.id,heroId:h.id,name:h.name,side:'ally',hp:s.hp,maxHp:s.maxHp,vigor:s.vigor,maxVigor:s.maxVigor,attack:s.attack,baseAttack:h.stats.attack,defense:s.defense,speed:s.speed,leadership:s.leadership,morale:s.morale,weaponType:ITEMS[h.equipment.weapon??'']?.weaponType??'staff',weaponId:h.equipment.weapon,weaknesses:[],revealedWeaknesses:[],shield:0,maxShield:0,brokenUntilRound:null,bp:1,lastBoostRound:null,priorityNextRound:false,intent:null,guarding:false,exposedTurns:0,inspiredTurns:0,coveredBy:null,coverTurns:0};});
  const foes=kind==='training'?[enemy('raider',0,.8)]:kind==='captain'?[enemy('captain',0),enemy('spearman',1),enemy('archer',2)]:kind==='ambush'?[enemy('raider',0),enemy('archer',1)]:[enemy('raider',0),enemy('spearman',1)];const units=[...allies,...foes];
  const rewards:BattleState['rewards']=kind==='training'?{xp:32,silver:16,items:{bread:1}}:kind==='captain'?{xp:95,silver:65,items:{meal:2,bronze_sword:1}}:kind==='ambush'?{xp:42,silver:25,items:{dates:2}}:{xp:45,silver:24,items:{bread:2}};
  next.battle={combatVersion:2,events:[],kind,units,turnOrder:orderUnits(units),turnIndex:0,round:1,status:'active',log:[kind==='captain'?'Uma unidade em retirada bloqueia a trilha. Encontro ficcional de adaptação.':'Explore as fraquezas, rompa os escudos e use Ímpeto na abertura.'],lastEvent:null,eventId:0,rewards,rewardsGranted:false};refreshIntents(next);runEnemyTurns(next);return syncParty(next);
}
/** Human morale, weapon force and protection; Break doubles damage without requiring a weakness. */
export function calculateDamage(attacker:Pick<BattleUnit,'attack'|'morale'>&Partial<Pick<BattleUnit,'inspiredTurns'>>,defender:Pick<BattleUnit,'defense'|'guarding'>&Partial<Pick<BattleUnit,'exposedTurns'|'brokenUntilRound'>>,multiplier=1,pierce=false):number {
  const morale=.8+Math.max(0,Math.min(100,attacker.morale))/250,offense=attacker.attack*morale*(attacker.inspiredTurns?1.22:1);
  return Math.max(1,Math.round(Math.max(2,offense*multiplier-defender.defense*(pierce?.25:.6))*(defender.guarding?.4:1)*(defender.exposedTurns?1.35:1)*(defender.brokenUntilRound!=null?2:1)));
}
function parameters(action:BattleAction,boost:number){return{hits:action==='attack'?1+boost:action==='quick'?2:1,power:(action==='focus'?1.7:action==='precise'?1.12:action==='quick'?.64:1)*(action==='attack'?1:1+boost*.4)};}
export function getActionPreview(state:GameState,action:BattleAction,targetId?:string,options:BattleActionOptions={}):ActionPreview {
  const actor=currentActor(state),meta=ACTIONS[action],boost=options.boost??0,weapon=options.weapon??actor?.weaponType??'sword',p=parameters(action,boost),target=state.battle?.units.find(u=>u.id===targetId);
  let reason:string|undefined;if(!actor||!getAvailableActions(state).includes(action))reason='Ação indisponível.';
  else if(!Number.isInteger(boost)||boost<0||boost>MAX_BOOST||boost>actor.bp)reason='Ímpeto insuficiente.';
  else if(boost>0&&!meta.supportsBoost)reason='Esta ação não usa Ímpeto.';
  const choice=getAvailableWeapons(state,actor?.id).find(w=>w.type===weapon);
  if(!reason&&options.weapon&&!choice&&['attack','precise','focus','quick'].includes(action))reason='A arma não está equipada nem disponível no inventário.';
  if(!reason&&meta.target==='enemy'&&(!target||target.side!=='enemy'||target.hp<=0))reason='Selecione um inimigo.';
  if(!reason&&meta.target==='ally'&&(!target||target.side!=='ally'||target.hp<=0||action==='cover'&&target.id===actor?.id))reason='Selecione um aliado disponível.';
  const known=!!target?.revealedWeaknesses.includes(weapon),damaging=['attack','precise','focus','quick'].includes(action),shieldDamage=damaging&&known&&!isBroken(target!,state.battle!.round)?Math.min(target!.shield,p.hits):0;
  const attack=choice?.attack??actor?.attack??0,estimated=actor&&target&&damaging?calculateDamage({...actor,attack},action==='precise'||action==='focus'?{...target,guarding:false}:target,p.power*(known?1.2:1),action==='precise')*p.hits:0;
  return{valid:!reason,reason,hits:damaging?p.hits:0,cost:meta.cost,boost,power:p.power,shieldDamage,canBreak:shieldDamage>0&&shieldDamage>=target!.shield,weaknessKnown:known,weapon,target:meta.target,description:meta.description,estimatedDamage:estimated};
}
function random(s:GameState){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
function log(b:BattleState,message:string){b.log.push(message);if(b.log.length>80)b.log.splice(0,b.log.length-80);}
function emit(b:BattleState,value:Omit<BattleEvent,'id'|'round'>){const e={...value,id:++b.eventId,round:b.round};b.events.push(e);b.lastEvent=e;}
function effect(b:BattleState,a:BattleUnit,action:BattleEvent['action'],kind:BattleEvent['kind'],t?:BattleUnit,amount?:number,message?:string){emit(b,{actorId:a.id,targetId:t?.id,action,kind,amount,message,hpAfter:t?.hp,vigorAfter:t?.vigor,shieldAfter:t?.shield,brokenUntilRound:t?.brokenUntilRound,actorBpAfter:a.bp});}
function hit(s:GameState,a:BattleUnit,original:BattleUnit,multiplier:number,pierce=false,action:BattleAction|'enemy'='attack',hitIndex=1,hitCount=1){
  const b=s.battle!;let t=original;if(t.coveredBy){const cover=b.units.find(u=>u.id===t.coveredBy&&u.hp>0);if(cover){t=cover;t.guarding=true;log(b,`${cover.name} cobre ${original.name}.`);effect(b,cover,'cover','guard',original,undefined,'Cobertura');}original.coveredBy=null;original.coverTurns=0;}
  const weak=t.side==='enemy'&&!!a.weaponId&&t.weaknesses.includes(a.weaponType),fresh=weak&&!t.revealedWeaknesses.includes(a.weaponType);
  if(fresh)t.revealedWeaknesses.push(a.weaponType);
  const damage=Math.max(1,calculateDamage(a,t,multiplier*(weak?1.2:1),pierce)+Math.floor(random(s)*3)-1);t.hp=Math.max(0,t.hp-damage);t.morale=Math.max(15,t.morale-(damage>=20?4:1));
  const breaks=weak&&!isBroken(t,b.round)&&t.shield>0;if(breaks)t.shield=Math.max(0,t.shield-1);
  log(b,`${a.name} atinge ${t.name}: ${damage} de dano.${weak?' Fraqueza!':''}${t.hp===0?' Fora de combate.':''}`);
  emit(b,{actorId:a.id,targetId:t.id,action,kind:'hit',amount:damage,weapon:a.weaponType,hitIndex,hitCount,weakness:weak,revealedWeapon:fresh?a.weaponType:undefined,hpAfter:t.hp,vigorAfter:t.vigor,shieldAfter:t.shield,brokenUntilRound:t.brokenUntilRound,actorBpAfter:a.bp});
  if(breaks&&t.shield===0&&t.hp>0){t.brokenUntilRound=b.round+1;t.guarding=false;log(b,`${t.name}: QUEBRA! Sem ação nesta rodada e na próxima. Dano recebido ×2.`);effect(b,a,action,'break',t,undefined,'Quebra');}
}
export function applyBattleAction(state:GameState,action:BattleAction,targetId?:string,itemId?:string,options:BattleActionOptions={}):GameState {
  const preview=getActionPreview(state,action,targetId,options);if(!preview.valid)return state;
  const selectedItem=itemId??['bread','meal','dates'].find(id=>state.inventory[id]>0);if(action==='supply'&&(!selectedItem||ITEMS[selectedItem]?.kind!=='consumable'||!(state.inventory[selectedItem]>0)))return state;
  let next=structuredClone(state);const b=next.battle!,a=currentActor(next)!,t=b.units.find(u=>u.id===targetId),boost=preview.boost;b.events=[];
  const weapon=getAvailableWeapons(next,a.id).find(w=>w.type===preview.weapon);if(weapon){a.weaponType=weapon.type;a.weaponId=weapon.itemId;a.attack=weapon.attack;}
  a.vigor-=ACTIONS[action].cost;if(boost){a.bp-=boost;a.lastBoostRound=b.round;log(b,`${a.name} usa Ímpeto ×${boost}.`);effect(b,a,action,'boost',a,boost,'Ímpeto');}
  if(['attack','precise','focus','quick'].includes(action)){
    if((action==='precise'||action==='focus')&&t!.guarding){t!.guarding=false;log(b,`${a.name} rompe a postura de ${t!.name}.`);}
    for(let i=0;i<preview.hits&&t!.hp>0;i++)hit(next,a,t!,preview.power,action==='precise',action,i+1,preview.hits);
    if(action==='attack')a.vigor=Math.min(a.maxVigor,a.vigor+2);
  }else switch(action){
    case'guard':a.guarding=true;a.priorityNextRound=true;a.vigor=Math.min(a.maxVigor,a.vigor+5);a.morale=Math.min(100,a.morale+3);log(b,`${a.name} firma a postura e recupera vigor. Agirá antes na próxima rodada.`);effect(b,a,action,'guard',a);break;
    case'command':for(const u of b.units.filter(u=>u.side==='ally'&&u.hp>0)){u.inspiredTurns=3+boost;u.morale=Math.min(100,u.morale+Math.round(a.leadership/2)+boost*2);}log(b,`${a.name} coordena a formação. O grupo ganha ataque e moral.`);effect(b,a,action,'tactic',a,undefined,'Formação');break;
    case'observe':{const hidden=t!.weaknesses.filter(w=>!t!.revealedWeaknesses.includes(w)).slice(0,1+boost);for(const w of hidden)t!.revealedWeaknesses.push(w);t!.exposedTurns=3+boost;t!.guarding=false;log(b,`${a.name} identifica uma abertura em ${t!.name}. ${hidden.map(w=>WEAPON_NAMES[w]).join(', ')||'Fraquezas já conhecidas'}. Dano recebido +35%.`);effect(b,a,action,'tactic',t,undefined,'Observação');b.events.at(-1)!.revealedWeapons=[...t!.revealedWeaknesses];break;}
    case'cover':t!.coveredBy=a.id;t!.coverTurns=2+boost;a.guarding=true;log(b,`${a.name} protege ${t!.name} contra o próximo ataque.`);effect(b,a,action,'guard',t,undefined,'Cobertura');break;
    case'supply':{const item=ITEMS[selectedItem!],before=t!.hp;t!.hp=Math.min(t!.maxHp,t!.hp+(item.restoreHp??0));t!.vigor=Math.min(t!.maxVigor,t!.vigor+(item.restoreVigor??0));next.inventory[selectedItem!]--;log(b,`${a.name} usa ${item.name.toLowerCase()} em ${t!.name}.`);effect(b,a,action,'heal',t,t!.hp-before,item.name);break;}
    case'retreat':if(random(next)<.75){b.status='escaped';log(b,'O grupo recua pela trilha. Sem recompensas.');}else log(b,'A patrulha fecha o caminho. O recuo falhou.');effect(b,a,action,'tactic',a,undefined,'Recuo');break;
  }
  resolveResult(next);refreshIntents(next);if(b.status==='active'){advanceTurn(next);runEnemyTurns(next);}next=syncParty(next);if(next.battle?.status==='victory'&&!next.battle.rewardsGranted)next=awardVictory(next);return next;
}
function beginTurn(u:BattleUnit){u.guarding=false;u.exposedTurns=Math.max(0,u.exposedTurns-1);u.inspiredTurns=Math.max(0,u.inspiredTurns-1);u.coverTurns=Math.max(0,u.coverTurns-1);if(!u.coverTurns)u.coveredBy=null;}
function newRound(s:GameState){const b=s.battle!;b.round++;b.turnOrder=orderUnits(b.units);for(const u of b.units){u.priorityNextRound=false;if(u.side==='ally'&&u.hp>0&&u.lastBoostRound!==b.round-1){u.bp=Math.min(MAX_BP,u.bp+1);effect(b,u,'recover','boost',u,1,'Ímpeto +1');}if(u.brokenUntilRound!==null&&b.round>u.brokenUntilRound){u.brokenUntilRound=null;u.shield=u.maxShield;log(b,`${u.name} recupera os escudos.`);effect(b,u,'recover','recover',u,undefined,'Escudos recuperados');}}refreshIntents(s);}
function advanceTurn(s:GameState){const b=s.battle!;for(let i=0;i<b.units.length*3;i++){b.turnIndex++;if(b.turnIndex>=b.turnOrder.length){newRound(s);b.turnIndex=0;}const u=b.units.find(u=>u.id===b.turnOrder[b.turnIndex]);if(u&&u.hp>0&&!isBroken(u,b.round)){beginTurn(u);return;}}}
function runEnemyTurns(s:GameState){const b=s.battle!;for(let i=0;i<b.units.length*3&&b.status==='active';i++){const a=currentActor(s);if(!a)break;if(a.hp<=0||isBroken(a,b.round)){advanceTurn(s);continue;}if(a.side==='ally')break;const intent=getEnemyIntent(s,a.id)!;a.intent=intent;const t=b.units.find(u=>u.id===intent.targetId&&u.hp>0)??b.units.find(u=>u.side==='ally'&&u.hp>0);if(!t){resolveResult(s);break;}
  if(intent.action==='guard'){a.guarding=true;a.vigor=Math.min(a.maxVigor,a.vigor+3);log(b,`${a.name} planta a lança e assume postura defensiva.`);effect(b,a,'enemy','guard',a);}
  else if(intent.action==='rally'){b.units.filter(u=>u.side==='enemy'&&u.hp>0).forEach(u=>{u.inspiredTurns=3;});log(b,'O líder da patrulha reorganiza a unidade. Os inimigos avançam juntos.');effect(b,a,'enemy','tactic',a,undefined,'Reorganizar');}
  else hit(s,a,t,intent.action==='heavy'?1.3:1,a.archetype==='archer','enemy');resolveResult(s);if(b.status==='active')advanceTurn(s);
 }refreshIntents(s);}
function resolveResult(s:GameState){const b=s.battle!;if(b.status!=='active')return;if(!b.units.some(u=>u.side==='enemy'&&u.hp>0)){b.status='victory';log(b,'O caminho está livre. Vitória do grupo.');emit(b,{actorId:'gideon',action:'victory',kind:'result',message:'Vitória'});}else if(!b.units.some(u=>u.side==='ally'&&u.hp>0)){b.status='defeat';log(b,'O grupo foi vencido e precisa se reagrupar em um ponto seguro.');emit(b,{actorId:'gideon',action:'defeat',kind:'result',message:'Derrota'});}}
function syncParty(s:GameState):GameState {return!s.battle?s:{...s,party:s.party.map(h=>{const u=s.battle!.units.find(u=>u.heroId===h.id);return u?{...h,stats:{...h.stats,hp:u.hp,vigor:u.vigor,morale:u.morale}}:h;})};}
function awardVictory(s:GameState){const b=s.battle!;let next=grantXp(s,b.rewards.xp);next.silver+=b.rewards.silver;next.inventory={...next.inventory};for(const[id,n]of Object.entries(b.rewards.items))next.inventory[id]=(next.inventory[id]??0)+n;next.battle={...b,rewardsGranted:true};next.flags={...next.flags,[`won_${b.kind}`]:true};if(b.kind==='patrol'||b.kind==='training')next=updateQuest(next,'patrol');return next;}
export function finishBattle(s:GameState):GameState {if(!s.battle||s.battle.status==='active')return s;const next={...s,battle:null};if(s.battle.status==='defeat'){next.position={x:0,z:9};next.silver=Math.floor(next.silver*.9);next.party=next.party.map(h=>({...h,stats:{...h.stats,hp:Math.max(1,Math.floor(getHeroStats(h).maxHp*.6)),vigor:getHeroStats(h).maxVigor}}));}return next;}
export const act=applyBattleAction;
