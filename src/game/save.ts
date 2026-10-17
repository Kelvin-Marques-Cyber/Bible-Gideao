import { ITEMS } from './items';
import { ACTIONS } from './battle';
import type { BattleState, BattleUnit, GameState, Hero, Stats } from './types';

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

function validUnit(value: unknown): value is BattleUnit {
  if (!object(value) || typeof value.id !== 'string' || typeof value.name !== 'string' || !['ally', 'enemy'].includes(value.side as string)) return false;
  if (!['hp', 'maxHp', 'vigor', 'maxVigor', 'attack', 'defense', 'speed', 'leadership', 'morale', 'exposedTurns', 'inspiredTurns', 'coverTurns'].every(key => finite(value[key]))) return false;
  if (!finite(value.maxHp, 1) || (value.hp as number) > value.maxHp || (value.vigor as number) > (value.maxVigor as number) || typeof value.guarding !== 'boolean' || !(value.coveredBy === null || typeof value.coveredBy === 'string')) return false;
  return value.side === 'ally' ? ['gideon', 'pura'].includes(value.heroId as string) : ['raider', 'spearman', 'archer', 'captain'].includes(value.archetype as string);
}

function validBattle(value: unknown, partyIds: string[]): value is BattleState | null {
  if (value === null) return true;
  if (!object(value) || !['training', 'patrol', 'ambush', 'captain'].includes(value.kind as string) || !['active', 'victory', 'defeat', 'escaped'].includes(value.status as string) || !Array.isArray(value.units) || !value.units.every(validUnit) || value.units.length > 10 || value.units.length < 2) return false;
  const ids = value.units.map(unit => unit.id);
  if (new Set(ids).size !== ids.length || !Array.isArray(value.turnOrder) || value.turnOrder.length !== ids.length || new Set(value.turnOrder).size !== ids.length || !value.turnOrder.every(id => ids.includes(id))) return false;
  if (!integer(value.turnIndex, 0, ids.length - 1) || !integer(value.round, 1) || !integer(value.eventId) || typeof value.rewardsGranted !== 'boolean') return false;
  if (!value.units.filter(unit => unit.side === 'ally').every(unit => partyIds.includes(unit.heroId!))) return false;
  if (!Array.isArray(value.log) || value.log.length > 80 || !value.log.every(line => typeof line === 'string')) return false;
  if (!object(value.rewards) || !integer(value.rewards.xp) || !integer(value.rewards.silver) || !dictionary(value.rewards.items, (count, id) => !!ITEMS[id] && integer(count))) return false;
  if (value.lastEvent !== null && (!object(value.lastEvent) || !integer(value.lastEvent.id) || typeof value.lastEvent.actorId !== 'string' || !['hit', 'heal', 'guard', 'tactic', 'result'].includes(value.lastEvent.kind as string))) return false;
  return true;
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
    if (!object(envelope) || envelope.format !== 'bible-gideao' || envelope.version !== 1 || !validateGameState(envelope.game)) return null;
    return structuredClone(envelope.game);
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
