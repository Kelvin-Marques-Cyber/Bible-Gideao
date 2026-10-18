import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { applyBattleAction, createGame, deleteSave, deserializeSave, equipItem, addItem, loadGame, saveGame, serializeSave, startBattle, unlockPura, updateQuest, validateGameState } from '../src/game';

class MemoryStorage {
  private items = new Map<string, string>();
  getItem(key: string) { return this.items.get(key) ?? null; }
  setItem(key: string, value: string) { this.items.set(key, value); }
  removeItem(key: string) { this.items.delete(key); }
}

beforeEach(() => { vi.stubGlobal('indexedDB', new IDBFactory()); vi.stubGlobal('localStorage', new MemoryStorage()); });
afterEach(() => vi.unstubAllGlobals());

describe('salvamento versionado e recuperação', () => {
  it('preserva todos os sistemas, posição e uma batalha em andamento em IndexedDB', async () => {
    let game = unlockPura(createGame());
    game = equipItem(addItem(game, 'bronze_sword'), 'gideon', 'bronze_sword');
    game = updateQuest(game, 'grain', 2);
    game.stage = 8; game.region = 'midian'; game.position = { x: 3.6, z: -7.1 }; game.elapsedSeconds = 784;
    game = applyBattleAction(startBattle(game, 'captain'), 'observe', 'captain-0');
    expect(validateGameState(game)).toBe(true);
    expect((await saveGame(game)).storage).toBe('indexeddb');
    const loaded = await loadGame();
    expect(loaded).toEqual(game);
    expect(loaded).not.toBe(game);
  });
  it('retorna nulo quando não há partida e apaga banco e espelho local', async () => {
    expect(await loadGame()).toBeNull();
    await saveGame(createGame());
    await deleteSave();
    expect(await loadGame()).toBeNull();
    expect(localStorage.getItem('bible-gideao-save-v1')).toBeNull();
  });
  it('usa armazenamento local quando IndexedDB está indisponível', async () => {
    vi.stubGlobal('indexedDB', undefined);
    const game = createGame();
    game.stage = 4;
    expect((await saveGame(game)).storage).toBe('localStorage');
    expect(await loadGame()).toEqual(game);
    await deleteSave();
    expect(await loadGame()).toBeNull();
  });
  it('recupera a cópia anterior quando um salvamento local é corrompido', async () => {
    vi.stubGlobal('indexedDB', undefined);
    const older = createGame();
    await saveGame(older);
    const latest = createGame(); latest.stage = 3;
    await saveGame(latest);
    localStorage.setItem('bible-gideao-save-v1', '{broken');
    expect(await loadGame()).toEqual(older);
  });
  it('recupera o backup IndexedDB quando o registro principal é inválido', async () => {
    const earlier = createGame(); await saveGame(earlier);
    const newer = createGame(); newer.stage = 4; await saveGame(newer);
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open('bible-gideao', 1);
      open.onsuccess = () => {
        const db = open.result; const tx = db.transaction('saves', 'readwrite');
        tx.objectStore('saves').put('{invalid', 'campaign');
        tx.oncomplete = () => { db.close(); resolve(); };
      };
      open.onerror = () => reject(open.error);
    });
    expect(await loadGame()).toEqual(earlier);
  });
  it('recusa versões futuras, JSON truncado e dados parciais', () => {
    expect(deserializeSave('bad json')).toBeNull();
    expect(deserializeSave({ format: 'bible-gideao', version: 2, game: createGame() })).toBeNull();
    expect(deserializeSave({ format: 'bible-gideao', version: 1, game: { version: 1 } })).toBeNull();
  });
  it('recusa itens desconhecidos, quantidades negativas e atributos inválidos', () => {
    const game = createGame(); game.inventory.unknown = 1;
    expect(validateGameState(game)).toBe(false);
    delete game.inventory.unknown; game.inventory.bread = -2;
    expect(validateGameState(game)).toBe(false);
    game.inventory.bread = 2; game.party[0].stats.hp = Number.NaN;
    expect(() => serializeSave(game)).toThrow();
  });
  it('recusa equipamento no slot errado, membros duplicados e turnos inconsistentes', () => {
    const equipment = createGame(); equipment.party[0].equipment.armor = 'short_sword';
    expect(validateGameState(equipment)).toBe(false);
    const party = createGame(); party.party.push(structuredClone(party.party[0]));
    expect(validateGameState(party)).toBe(false);
    const battle = startBattle(createGame()); battle.battle!.turnOrder[0] = 'missing';
    expect(validateGameState(battle)).toBe(false);
  });
  it('emite erro quando ambos os mecanismos de armazenamento falham', async () => {
    vi.stubGlobal('indexedDB', undefined);
    vi.stubGlobal('localStorage', undefined);
    await expect(saveGame(createGame())).rejects.toThrow('armazenamento');
    expect(await loadGame()).toBeNull();
  });
});

function legacyEnvelope(game:ReturnType<typeof createGame>,version?:0){
  const legacy=JSON.parse(JSON.stringify(game));
  if(legacy.battle){
    delete legacy.battle.combatVersion;if(version===0)legacy.battle.combatVersion=0;delete legacy.battle.events;
    for(const u of legacy.battle.units)for(const field of ['weaponType','weaponId','baseAttack','weaknesses','revealedWeaknesses','shield','maxShield','brokenUntilRound','bp','lastBoostRound','priorityNextRound','intent'])delete u[field];
  }
  return JSON.stringify({format:'bible-gideao',version:1,savedAt:Date.now(),game:legacy});
}

describe('migração do combate e persistência de Quebra/Ímpeto',()=>{
  it.each([undefined,0] as const)('migra combate legado v%s sem alterar inventário, progresso, atributos ou recompensas',(version)=>{
    const game=applyBattleAction(startBattle(unlockPura(createGame()),'captain'),'observe','captain-0');
    game.stage=12;game.region='midian';game.flags.storyBattle=true;
    const loaded=deserializeSave(legacyEnvelope(game,version))!;
    expect(loaded).not.toBeNull();expect(loaded.version).toBe(1);expect(loaded.stage).toBe(12);
    expect(loaded.party).toEqual(game.party);expect(loaded.inventory).toEqual(game.inventory);expect(loaded.silver).toBe(game.silver);expect(loaded.flags).toEqual(game.flags);
    expect(loaded.battle!.combatVersion).toBe(2);expect(loaded.battle!.units.find(u=>u.id==='captain-0')!.shield).toBe(5);
    expect(loaded.battle!.units.find(u=>u.id==='gideon')!.bp).toBe(1);expect(loaded.battle!.events).toEqual([]);
    expect(loaded.battle!.status).toBe(game.battle!.status);expect(loaded.battle!.rewardsGranted).toBe(game.battle!.rewardsGranted);
    expect(loaded.battle!.log).toEqual(game.battle!.log);
  });
  it('preserva um resultado legado vitorioso para não pagar recompensa duas vezes',()=>{
    let game=startBattle(createGame(),'training');game=applyBattleAction(game,'attack','raider-0',undefined,{boost:1});
    expect(game.battle!.status).toBe('victory');const loaded=deserializeSave(legacyEnvelope(game))!;
    expect(loaded.battle!.status).toBe('victory');expect(loaded.battle!.rewardsGranted).toBe(true);
    expect(loaded.silver).toBe(game.silver);expect(loaded.party).toEqual(game.party);
    expect(applyBattleAction(loaded,'attack','raider-0')).toBe(loaded);
  });
  it('restaura escudos, fraquezas, BP, duração da Quebra e fila de animação pendente',async()=>{
    const game=createGame();game.party[0].stats.maxHp=500;game.party[0].stats.hp=500;
    let s=startBattle(game,'training');s.battle!.units[1].hp=500;s.battle!.units[1].maxHp=500;
    s=applyBattleAction(s,'attack','raider-0',undefined,{boost:1});
    expect(s.battle!.events.some(e=>e.kind==='break')).toBe(true);
    await saveGame(s);const loaded=await loadGame();expect(loaded).toEqual(s);
    expect(loaded!.battle!.units[1].revealedWeaknesses).toEqual(['sword']);expect(loaded!.battle!.units[1].brokenUntilRound).toBe(2);
    expect(loaded!.battle!.units[0].bp).toBe(0);expect(loaded!.battle!.events.filter(e=>e.kind==='hit')).toHaveLength(2);
    const next=applyBattleAction(loaded!,'guard');expect(next.battle!.units[1].shield).toBe(2);expect(next.battle!.units[1].brokenUntilRound).toBeNull();
  });
  it('recusa campos táticos corrompidos em v2 e dados parcialmente convertidos',()=>{
    const game=startBattle(createGame(),'training');
    for(const mutate of [
      (s:typeof game)=>{s.battle!.units[0].bp=6;},
      (s:typeof game)=>{s.battle!.units[1].shield=-1;},
      (s:typeof game)=>{s.battle!.units[1].revealedWeaknesses=['staff'];},
      (s:typeof game)=>{s.battle!.units[1].brokenUntilRound=2;},
      (s:typeof game)=>{s.battle!.units[0].weaponId='bow';s.battle!.units[0].weaponType='sword';},
    ]){const invalid=structuredClone(game);mutate(invalid);expect(validateGameState(invalid)).toBe(false);}
    const partial=JSON.parse(JSON.stringify(game));delete partial.battle.combatVersion;delete partial.battle.events;
    expect(deserializeSave(JSON.stringify({format:'bible-gideao',version:1,game:partial}))).toBeNull();
  });
  it('valida a ordem dos eventos e snapshots, incluindo reconhecimento',()=>{
    const s=applyBattleAction(startBattle(unlockPura(createGame()),'captain'),'observe','captain-0');
    expect(s.battle!.events[0].revealedWeapons).toEqual(['spear']);expect(deserializeSave(serializeSave(s))).toEqual(s);
    const invalid=structuredClone(s);invalid.battle!.events[0].actorBpAfter=8;expect(validateGameState(invalid)).toBe(false);
  });
});
