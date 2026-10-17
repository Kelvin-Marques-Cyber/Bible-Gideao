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
