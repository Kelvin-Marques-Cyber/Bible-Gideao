import { ITEMS } from './items';
import { ACTIONS, ENEMY_TACTICS, getEnemyIntent } from './battle';
import type { BattleEvent, BattleState, BattleUnit, GameState, Hero, Stats, WeaponType } from './types';

const DB_NAME = 'bible-gideao';
const STORE = 'saves';
const SLOT = 'campaign';
const BACKUP = 'campaign-backup';
const LOCAL_KEY = 'bible-gideao-save-v1';
const LOCAL_BACKUP = 'bible-gideao-save-v1-backup';
const STATS: (keyof Stats)[] = ['hp', 'maxHp', 'vigor', 'maxVigor', 'attack', 'defense', 'speed', 'leadership', 'xp', 'level', 'morale'];
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const finite = (value: unknown, min = 0, max = 1000000): value is number => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const integer = (value: unknown, min = 0, max = 1000000): value is number => finite(value, min, max) && Number.isInteger(value);
const dictionary = (value: unknown, test: (entry: unknown, key: string) => boolean): boolean => object(value) && Object.entries(value).every(([key, entry]) => test(entry, key));

function validHero(value: unknown): value is Hero {
  if (!object(value) || !['gideon', 'pura'].includes(value.id as string) || typeof value.name !== 'string' || typeof value.role !== 'string' || !object(value.stats) || !object(value.equipment)) return false;
  const stats = value.stats;
  if (!STATS.every(key => finite(stats[key])) || !integer(stats.level, 1, 20) || !finite(stats.morale, 0, 100) || !finite(stats.maxHp, 1) || !finite(stats.maxVigor, 1)) return false;
  if (!['weapon', 'armor', 'accessory'].every(slot => value.equipment && object(value.equipment) && (value.equipment[slot] === null || typeof value.equipment[slot] === 'string' && ITEMS[value.equipment[slot] as string]?.slot === slot))) return false;
  let maxHp = stats.maxHp as number;
  let maxVigor = stats.maxVigor as number;
  for (const itemId of Object.values(value.equipment)) {
    maxHp += typeof itemId === 'string' ? ITEMS[itemId]?.modifiers?.maxHp ?? 0 : 0;
    maxVigor += typeof itemId === 'string' ? ITEMS[itemId]?.modifiers?.maxVigor ?? 0 : 0;
  }
  if ((stats.hp as number) > maxHp || (stats.vigor as number) > maxVigor) return false;
  return Array.isArray(value.unlockedSkills) && value.unlockedSkills.length <= 10 && value.unlockedSkills.every(skill => typeof skill === 'string' && skill in ACTIONS);
}

function validBaseUnit(value: unknown): value is BattleUnit {
  if (!object(value) || typeof value.id !== 'string' || typeof value.name !== 'string' || !['ally', 'enemy'].includes(value.side as string)) return false;
  if (!['hp', 'maxHp', 'vigor', 'maxVigor', 'attack', 'defense', 'speed', 'leadership', 'morale', 'exposedTurns', 'inspiredTurns', 'coverTurns'].every(key => finite(value[key]))) return false;
  if (!finite(value.maxHp, 1) || (value.hp as number) > value.maxHp || (value.vigor as number) > (value.maxVigor as number) || typeof value.guarding !== 'boolean' || !(value.coveredBy === null || typeof value.coveredBy === 'string')) return false;
  return value.side === 'ally' ? ['gideon', 'pura'].includes(value.heroId as string) : ['raider', 'spearman', 'archer', 'captain'].includes(value.archetype as string);
}

const WEAPONS: WeaponType[] = ['sword','spear','bow','staff'];
function validIntent(value: unknown): boolean {
  return value === null || object(value) && ['attack','guard','rally','heavy'].includes(value.action as string) && typeof value.label === 'string' && (value.targetId === undefined || typeof value.targetId === 'string');
}
function validUnit(value: unknown): value is BattleUnit {
  if (!validBaseUnit(value) || !object(value)) return false;
  if (!WEAPONS.includes(value.weaponType as WeaponType) || !finite(value.baseAttack) || !(value.weaponId === null || typeof value.weaponId === 'string' && ITEMS[value.weaponId]?.weaponType === value.weaponType)) return false;
  if (!Array.isArray(value.weaknesses) || !value.weaknesses.every(w=>WEAPONS.includes(w)) || new Set(value.weaknesses).size !== value.weaknesses.length) return false;
  if (!Array.isArray(value.revealedWeaknesses) || !value.revealedWeaknesses.every(w=>(value.weaknesses as unknown[]).includes(w)) || new Set(value.revealedWeaknesses).size !== value.revealedWeaknesses.length) return false;
  if (!integer(value.shield,0,20) || !integer(value.maxShield,0,20) || value.shield>value.maxShield || !integer(value.bp,0,5) || !(value.lastBoostRound===null || integer(value.lastBoostRound,1)) || !(value.brokenUntilRound===null || integer(value.brokenUntilRound,1)) || typeof value.priorityNextRound!=='boolean' || !validIntent(value.intent)) return false;
  if (value.side==='enemy' && (value.maxShield<1 || value.weaknesses.length===0)) return false;
  if (value.side==='ally' && (value.maxShield!==0 || value.shield!==0 || value.brokenUntilRound!==null)) return false;
  if (value.brokenUntilRound!==null && value.shield!==0 || value.side==='enemy' && value.hp>0 && value.shield===0 && value.brokenUntilRound===null) return false;
  return true;
}
function validEvent(value: unknown, ids: string[], round: number): boolean {
  if(!object(value)||!integer(value.id,1)||!ids.includes(value.actorId as string)||!(value.targetId===undefined||ids.includes(value.targetId as string))||!['hit','heal','guard','tactic','result','break','recover','boost'].includes(value.kind as string))return false;
  if(!(typeof value.action==='string' && (Object.hasOwn(ACTIONS,value.action)||['enemy','victory','defeat','recover'].includes(value.action))))return false;
  if(value.round!==undefined&&!integer(value.round,1,round))return false;
  if(value.weapon!==undefined&&!WEAPONS.includes(value.weapon as WeaponType)||value.revealedWeapon!==undefined&&!WEAPONS.includes(value.revealedWeapon as WeaponType))return false;
  for(const key of ['amount','hpAfter','vigorAfter','shieldAfter','actorBpAfter','hitIndex','hitCount'])if(value[key]!==undefined&&!integer(value[key]))return false;
  if(value.revealedWeapons!==undefined&&(!Array.isArray(value.revealedWeapons)||!value.revealedWeapons.every(w=>WEAPONS.includes(w))||new Set(value.revealedWeapons).size!==value.revealedWeapons.length))return false;
  if(value.actorBpAfter!==undefined&&!integer(value.actorBpAfter,0,5))return false;
  if(value.brokenUntilRound!==undefined&&value.brokenUntilRound!==null&&!integer(value.brokenUntilRound,1,round+1))return false;
  if(value.weakness!==undefined&&typeof value.weakness!=='boolean'||value.message!==undefined&&typeof value.message!=='string')return false;
  return true;
}
function validBattle(value: unknown, partyIds: string[], legacy=false): value is BattleState | null {
  if (value === null) return true;
  if (!object(value) || !['training', 'patrol', 'ambush', 'captain'].includes(value.kind as string) || !['active', 'victory', 'defeat', 'escaped'].includes(value.status as string) || !Array.isArray(value.units) || !value.units.every(legacy?validBaseUnit:validUnit) || value.units.length > 10 || value.units.length < 2) return false;
  const units=value.units as BattleUnit[], ids=units.map(unit=>unit.id);
  if (new Set(ids).size !== ids.length || !Array.isArray(value.turnOrder) || value.turnOrder.length !== ids.length || new Set(value.turnOrder).size !== ids.length || !value.turnOrder.every(id => ids.includes(id))) return false;
  if (!integer(value.turnIndex, 0, ids.length - 1) || !integer(value.round, 1) || !integer(value.eventId) || typeof value.rewardsGranted !== 'boolean') return false;
  if (!units.filter(unit => unit.side === 'ally').every(unit => partyIds.includes(unit.heroId!))) return false;
  if (!Array.isArray(value.log) || value.log.length > 80 || !value.log.every(line => typeof line === 'string')) return false;
  if (!object(value.rewards) || !integer(value.rewards.xp) || !integer(value.rewards.silver) || !dictionary(value.rewards.items, (count, id) => !!ITEMS[id] && integer(count))) return false;
  if(value.lastEvent!==null&&!validEvent(value.lastEvent,ids,value.round))return false;
  if(!legacy){
    const round=Number(value.round);
    if(value.combatVersion!==2||!Array.isArray(value.events)||value.events.length>200||!value.events.every(e=>validEvent(e,ids,round)))return false;
    const events=value.events as BattleEvent[];
    if(events.some((e,i)=>i>0&&e.id<=events[i-1].id)||events.some(e=>e.id>(value.eventId as number)))return false;
    if(units.some(u=>u.brokenUntilRound!==null&&(u.brokenUntilRound<round||u.brokenUntilRound>Number(value.round)+1)||u.lastBoostRound!==null&&u.lastBoostRound>Number(value.round)))return false;
  }
  return true;
}
function migrateLegacyBattle(game: unknown): unknown {
  if(!object(game)||!object(game.battle)||!Array.isArray(game.party)||!game.party.every(validHero))return game;
  const battle=game.battle;
  if(battle.combatVersion!==undefined&&battle.combatVersion!==0)return game;
  if(battle.events!==undefined || !(battle.units as unknown[])?.every(u=>object(u)&&!['bp','shield','maxShield','weaknesses','revealedWeaknesses','weaponType','weaponId','baseAttack','brokenUntilRound','lastBoostRound','priorityNextRound','intent'].some(key=>Object.hasOwn(u,key))))return game;
  if(!validBattle(battle,game.party.map(h=>h.id),true))return game;
  const next=structuredClone(game) as unknown as GameState, b=next.battle!;b.combatVersion=2;b.events=[];
  for(const u of b.units){
    const h=next.party.find(h=>h.id===u.heroId),t=u.archetype?ENEMY_TACTICS[u.archetype]:undefined;
    u.baseAttack=h?.stats.attack??u.attack;u.weaponId=h?.equipment.weapon??null;u.weaponType=u.weaponId?ITEMS[u.weaponId].weaponType??'staff':u.archetype==='archer'?'bow':u.archetype==='spearman'?'spear':'sword';
    u.weaknesses=t?[...t.weaknesses]:[];u.revealedWeaknesses=[];u.maxShield=t?.shield??0;u.shield=u.maxShield;u.brokenUntilRound=null;u.bp=u.side==='ally'?1:0;u.lastBoostRound=null;u.priorityNextRound=false;u.intent=null;
  }
  for(const u of b.units)u.intent=u.side==='enemy'?getEnemyIntent(next,u.id):null;
  return next;
}

/** Reject malformed, future-version, or internally inconsistent snapshots. */
export function validateGameState(value: unknown): value is GameState {
  if (!object(value) || value.version !== 1 || !integer(value.stage, 0, 100) || !['ofra', 'altar', 'harode', 'midian'].includes(value.region as string)) return false;
  if (!object(value.position) || !finite(value.position.x, -500, 500) || !finite(value.position.z, -500, 500)) return false;
  if (!Array.isArray(value.party) || value.party.length < 1 || value.party.length > 2 || !value.party.every(validHero)) return false;
  const ids = value.party.map(hero => hero.id);
  if (new Set(ids).size !== ids.length || !ids.includes('gideon') || !ids.includes(value.activeHeroId as Hero['id'])) return false;
  if (!integer(value.silver) || !dictionary(value.inventory, (quantity, id) => !!ITEMS[id] && integer(quantity))) return false;
  if (!dictionary(value.flags, entry => typeof entry === 'boolean') || !finite(value.elapsedSeconds, 0, 100000000) || !integer(value.seed, 0, 4294967295)) return false;
  if (!dictionary(value.quests, (entry, key) => object(entry) && entry.id === key && typeof entry.title === 'string' && typeof entry.description === 'string' && integer(entry.total, 1) && integer(entry.current, 0, entry.total) && ['active', 'completed'].includes(entry.status as string) && typeof entry.rewarded === 'boolean' && integer(entry.rewardXp) && integer(entry.rewardSilver) && (entry.status !== 'completed' || entry.current === entry.total))) return false;
  return validBattle(value.battle, ids);
}

export function serializeSave(state: GameState, savedAt = Date.now()): string {
  if (!validateGameState(state)) throw new Error('O estado da partida não é válido para salvamento.');
  return JSON.stringify({ format: 'bible-gideao', version: 1, savedAt, game: state });
}

export function deserializeSave(raw: unknown): GameState | null {
  try {
    const envelope: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!object(envelope) || envelope.format !== 'bible-gideao' || envelope.version !== 1) return null;
    const game=migrateLegacyBattle(envelope.game);
    if(!validateGameState(game))return null;
    return structuredClone(game);
  } catch { return null; }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB indisponível')); return; }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Banco de dados bloqueado por outra janela.'));
  });
}

function localRead(key: string): string | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage.getItem(key); } catch { return null; }
}

function saveLocal(serialized: string): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    const previous = localStorage.getItem(LOCAL_KEY);
    if (deserializeSave(previous)) localStorage.setItem(LOCAL_BACKUP, previous!);
    localStorage.setItem(LOCAL_KEY, serialized);
    return true;
  } catch { return false; }
}

export async function saveGame(state: GameState): Promise<{ storage: 'indexeddb' | 'localStorage'; savedAt: number }> {
  const savedAt = Date.now();
  const serialized = serializeSave(state, savedAt);
  let db: IDBDatabase | undefined;
  try {
    db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db!.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const read = store.get(SLOT);
      read.onsuccess = () => { if (deserializeSave(read.result)) store.put(read.result, BACKUP); store.put(serialized, SLOT); };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    saveLocal(serialized);
    return { storage: 'indexeddb', savedAt };
  } catch {
    if (saveLocal(serialized)) return { storage: 'localStorage', savedAt };
    throw new Error('Não foi possível salvar. O armazenamento deste navegador está indisponível.');
  } finally { db?.close(); }
}

export async function loadGame(): Promise<GameState | null> {
  let db: IDBDatabase | undefined;
  try {
    db = await openDatabase();
    const values = await new Promise<unknown[]>((resolve, reject) => {
      const tx = db!.transaction(STORE, 'readonly');
      const main = tx.objectStore(STORE).get(SLOT);
      const backup = tx.objectStore(STORE).get(BACKUP);
      tx.oncomplete = () => resolve([main.result, backup.result]);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    for (const raw of values) { const state = deserializeSave(raw); if (state) return state; }
  } catch { /* Private browsing and storage failures use the local mirror. */ }
  finally { db?.close(); }
  return deserializeSave(localRead(LOCAL_KEY)) ?? deserializeSave(localRead(LOCAL_BACKUP));
}

export async function deleteSave(): Promise<void> {
  let db: IDBDatabase | undefined;
  try {
    db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db!.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(SLOT); tx.objectStore(STORE).delete(BACKUP);
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
    });
  } catch { /* Clearing a local-only save does not require IndexedDB. */ }
  finally {
    db?.close();
    try { if (typeof localStorage !== 'undefined') { localStorage.removeItem(LOCAL_KEY); localStorage.removeItem(LOCAL_BACKUP); } } catch { /* inaccessible local mirror */ }
  }
}
