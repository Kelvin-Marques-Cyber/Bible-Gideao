export type RegionId = 'ofra' | 'altar' | 'harode' | 'midian';
export type EquipmentSlot = 'weapon' | 'armor' | 'accessory';
export interface Stats {
  hp: number; maxHp: number; vigor: number; maxVigor: number;
  attack: number; defense: number; speed: number; leadership: number;
  xp: number; level: number; morale: number;
}
export type BattleAction = 'attack' | 'precise' | 'guard' | 'command' | 'focus' | 'quick' | 'cover' | 'observe' | 'supply' | 'retreat';
export interface Hero {
  id: 'gideon' | 'pura'; name: string; role: string; stats: Stats;
  equipment: Record<EquipmentSlot, string | null>; unlockedSkills: BattleAction[];
}
export interface Item {
  id: string; name: string; description: string; kind: 'consumable' | 'equipment' | 'resource';
  price: number; slot?: EquipmentSlot; modifiers?: Partial<Pick<Stats, 'maxHp' | 'maxVigor' | 'attack' | 'defense' | 'speed' | 'leadership'>>;
  restoreHp?: number; restoreVigor?: number;
}
export interface QuestProgress {
  id: string; title: string; description: string; current: number; total: number;
  status: 'active' | 'completed'; rewarded: boolean; rewardXp: number; rewardSilver: number;
}
export type EnemyArchetype = 'raider' | 'spearman' | 'archer' | 'captain';
export interface BattleUnit {
  id: string; name: string; side: 'ally' | 'enemy'; heroId?: Hero['id']; archetype?: EnemyArchetype;
  hp: number; maxHp: number; vigor: number; maxVigor: number;
  attack: number; defense: number; speed: number; leadership: number; morale: number;
  guarding: boolean; exposedTurns: number; inspiredTurns: number; coveredBy: string | null; coverTurns: number;
}
export interface BattleEvent { id: number; actorId: string; targetId?: string; action: BattleAction | 'enemy' | 'victory' | 'defeat'; amount?: number; kind: 'hit' | 'heal' | 'guard' | 'tactic' | 'result'; }
export interface BattleState {
  kind: BattleKind; units: BattleUnit[]; turnOrder: string[]; turnIndex: number; round: number;
  status: 'active' | 'victory' | 'defeat' | 'escaped'; log: string[]; lastEvent: BattleEvent | null;
  eventId: number; rewards: { xp: number; silver: number; items: Record<string, number> }; rewardsGranted: boolean;
}
export type BattleKind = 'training' | 'patrol' | 'ambush' | 'captain';
export interface GameState {
  version: 1; stage: number; region: RegionId; position: { x: number; z: number };
  party: Hero[]; activeHeroId: Hero['id']; inventory: Record<string, number>; silver: number;
  quests: Record<string, QuestProgress>; battle: BattleState | null; flags: Record<string, boolean>;
  elapsedSeconds: number; seed: number;
}
