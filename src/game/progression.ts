import { ITEMS } from './items';
import type { GameState, Hero, Stats } from './types';

export const xpForNextLevel = (level: number) => 35 + (level - 1) * 30;

export function getHeroStats(hero: Hero): Stats {
  const stats = { ...hero.stats };
  for (const itemId of Object.values(hero.equipment)) {
    const item = itemId ? ITEMS[itemId] : null;
    for (const [key, value] of Object.entries(item?.modifiers ?? {})) {
      stats[key as keyof Stats] += value;
    }
  }
  stats.hp = Math.min(stats.hp, stats.maxHp);
  stats.vigor = Math.min(stats.vigor, stats.maxVigor);
  return stats;
}

export function grantXp(state: GameState, amount: number, heroId?: string): GameState {
  if (!Number.isFinite(amount) || amount <= 0) return state;
  return { ...state, party: state.party.map(hero => {
    if (heroId && hero.id !== heroId) return hero;
    const next = structuredClone(hero);
    next.stats.xp += Math.floor(amount);
    while (next.stats.xp >= xpForNextLevel(next.stats.level) && next.stats.level < 20) {
      next.stats.xp -= xpForNextLevel(next.stats.level);
      next.stats.level += 1;
      next.stats.maxHp += 9;
      next.stats.maxVigor += 2;
      next.stats.attack += 2;
      next.stats.defense += 1;
      next.stats.leadership += 1;
      if (next.stats.level % 2 === 0) next.stats.speed += 1;
      next.stats.hp = Math.min(getHeroStats(next).maxHp, next.stats.hp + 18);
      next.stats.vigor = getHeroStats(next).maxVigor;
    }
    if (next.id === 'gideon') {
      if (next.stats.level >= 2 && !next.unlockedSkills.includes('command')) next.unlockedSkills.push('command');
      if (next.stats.level >= 3 && !next.unlockedSkills.includes('focus')) next.unlockedSkills.push('focus');
    } else if (next.stats.level >= 2 && !next.unlockedSkills.includes('cover')) next.unlockedSkills.push('cover');
    return next;
  }) };
}

export function unlockPura(state: GameState): GameState {
  if (state.party.some(hero => hero.id === 'pura')) return state;
  const level = Math.max(2, state.party[0].stats.level);
  const pura: Hero = {
    id: 'pura', name: 'Purá', role: 'Batedor · apoio tático',
    stats: { hp: 69 + (level - 2) * 9, maxHp: 69 + (level - 2) * 9, vigor: 20, maxVigor: 20, attack: 11 + (level - 2) * 2, defense: 4 + level - 2, speed: 13, leadership: 7, xp: 0, level, morale: 75 },
    equipment: { weapon: 'staff', armor: 'woven_cloak', accessory: 'sandals' },
    unlockedSkills: ['attack', 'quick', 'observe', 'cover', 'guard', 'supply', 'retreat'],
  };
  return { ...state, party: [...state.party, pura], flags: { ...state.flags, puraJoined: true } };
}
