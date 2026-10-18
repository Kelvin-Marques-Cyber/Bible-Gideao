import { getHeroStats, grantXp } from './progression';
import { ITEMS } from './items';
import type { EquipmentSlot, GameState, QuestProgress } from './types';

export function createGame(seed = 7419): GameState {
  return {
    version: 1, stage: 0, region: 'ofra', position: { x: 0, z: 7 }, activeHeroId: 'gideon',
    party: [{ id: 'gideon', name: 'Gideão', role: 'Filho de Joás · líder relutante', stats: { hp: 90, maxHp: 90, vigor: 20, maxVigor: 20, attack: 13, defense: 5, speed: 10, leadership: 8, xp: 0, level: 1, morale: 65 }, equipment: { weapon: 'short_sword', armor: 'linen_tunic', accessory: null }, unlockedSkills: ['attack', 'precise', 'guard', 'supply', 'retreat'] }],
    inventory: { staff: 1, bread: 4, dates: 3, meal: 1, grain: 0 }, silver: 38,
    quests: {
      campaign: quest('campaign', 'A espada e a tocha', 'Acompanhe o chamado de Gideão e a libertação de Israel.', 14, 90, 0),
      grain: quest('grain', 'O pão de amanhã', 'Recupere três sacos de grãos nos campos e leve-os à moradora.', 3, 25, 18),
      patrol: quest('patrol', 'Caminho seguro', 'Afaste uma patrulha que ameaça os arredores de Ofra.', 1, 20, 15),
      supplies: quest('supplies', 'Preparativos em Harode', 'Inspecione as provisões e os equipamentos do acampamento.', 2, 20, 10),
    }, battle: null, flags: {}, elapsedSeconds: 0, seed: seed >>> 0,
  };
}

function quest(id: string, title: string, description: string, total: number, rewardXp: number, rewardSilver: number): QuestProgress {
  return { id, title, description, current: 0, total, rewardXp, rewardSilver, status: 'active', rewarded: false };
}

export function addItem(state: GameState, itemId: string, quantity = 1): GameState {
  if (!ITEMS[itemId] || !Number.isInteger(quantity) || quantity <= 0) return state;
  return { ...state, inventory: { ...state.inventory, [itemId]: (state.inventory[itemId] ?? 0) + quantity } };
}

export function buyItem(state: GameState, itemId: string, quantity = 1): GameState {
  const item = ITEMS[itemId];
  if (!item || item.price <= 0 || state.battle?.status === 'active' || !Number.isInteger(quantity) || quantity <= 0 || state.silver < item.price * quantity) return state;
  return { ...addItem(state, itemId, quantity), silver: state.silver - item.price * quantity };
}

export function sellItem(state: GameState, itemId: string, quantity = 1): GameState {
  const item = ITEMS[itemId];
  if (!item || item.price <= 0 || item.kind === 'resource' || state.battle?.status === 'active' || !Number.isInteger(quantity) || quantity <= 0 || (state.inventory[itemId] ?? 0) < quantity) return state;
  return { ...state, inventory: { ...state.inventory, [itemId]: state.inventory[itemId] - quantity }, silver: state.silver + Math.max(1, Math.floor(item.price / 2)) * quantity };
}

export function equipItem(state: GameState, heroId: string, itemId: string): GameState {
  const item = ITEMS[itemId];
  const hero = state.party.find(h => h.id === heroId);
  if (!hero || !item || !item.slot || item.kind !== 'equipment' || (state.inventory[itemId] ?? 0) < 1 || state.battle?.status === 'active') return state;
  const oldItem = hero.equipment[item.slot];
  const next = structuredClone(state);
  const nextHero = next.party.find(h => h.id === heroId)!;
  next.inventory[itemId] -= 1;
  if (oldItem) next.inventory[oldItem] = (next.inventory[oldItem] ?? 0) + 1;
  nextHero.equipment[item.slot] = itemId;
  const stats = getHeroStats(nextHero);
  nextHero.stats.hp = Math.min(nextHero.stats.hp, stats.maxHp);
  nextHero.stats.vigor = Math.min(nextHero.stats.vigor, stats.maxVigor);
  return next;
}

export function unequipItem(state: GameState, heroId: string, slot: EquipmentSlot): GameState {
  const hero = state.party.find(h => h.id === heroId);
  if (!hero?.equipment[slot] || state.battle?.status === 'active') return state;
  const next = structuredClone(state);
  const nextHero = next.party.find(h => h.id === heroId)!;
  const itemId = nextHero.equipment[slot]!;
  next.inventory[itemId] = (next.inventory[itemId] ?? 0) + 1;
  nextHero.equipment[slot] = null;
  const stats = getHeroStats(nextHero);
  nextHero.stats.hp = Math.min(nextHero.stats.hp, stats.maxHp);
  nextHero.stats.vigor = Math.min(nextHero.stats.vigor, stats.maxVigor);
  return next;
}

export function consumeItem(state: GameState, itemId: string, heroId: string): GameState {
  const item = ITEMS[itemId];
  const hero = state.party.find(h => h.id === heroId);
  if (!hero || !item || item.kind !== 'consumable' || !state.inventory[itemId] || state.battle?.status === 'active') return state;
  const effective = getHeroStats(hero);
  if (!(item.restoreHp && hero.stats.hp < effective.maxHp) && !(item.restoreVigor && hero.stats.vigor < effective.maxVigor)) return state;
  const next = structuredClone(state);
  const nextHero = next.party.find(h => h.id === heroId)!;
  next.inventory[itemId] -= 1;
  nextHero.stats.hp = Math.min(effective.maxHp, hero.stats.hp + (item.restoreHp ?? 0));
  nextHero.stats.vigor = Math.min(effective.maxVigor, hero.stats.vigor + (item.restoreVigor ?? 0));
  return next;
}

export function updateQuest(state: GameState, questId: string, amount = 1): GameState {
  const entry = state.quests[questId];
  if (!entry || entry.status === 'completed' || !Number.isFinite(amount) || amount <= 0) return state;
  let next = structuredClone(state);
  const nextQuest = next.quests[questId];
  nextQuest.current = Math.min(nextQuest.total, nextQuest.current + Math.floor(amount));
  if (nextQuest.current >= nextQuest.total) {
    nextQuest.status = 'completed';
    nextQuest.rewarded = true;
    next.silver += nextQuest.rewardSilver;
    next = grantXp(next, nextQuest.rewardXp);
  }
  return next;
}

export function restParty(state: GameState): GameState {
  if (state.battle?.status === 'active') return state;
  return { ...state, party: state.party.map(hero => ({ ...hero, stats: { ...hero.stats, hp: getHeroStats(hero).maxHp, vigor: getHeroStats(hero).maxVigor, morale: Math.min(100, hero.stats.morale + 8) } })) };
}
