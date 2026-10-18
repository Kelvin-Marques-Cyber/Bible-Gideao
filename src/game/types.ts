export type RegionId = 'ofra' | 'altar' | 'harode' | 'midian';
export type WeaponType = 'sword' | 'spear' | 'bow' | 'staff';
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
  price: number; slot?: EquipmentSlot; weaponType?: WeaponType; modifiers?: Partial<Pick<Stats, 'maxHp' | 'maxVigor' | 'attack' | 'defense' | 'speed' | 'leadership'>>;
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
  weaponType: WeaponType; weaponId: string | null; baseAttack: number;
  weaknesses: WeaponType[]; revealedWeaknesses: WeaponType[]; shield: number; maxShield: number;
  brokenUntilRound: number | null; bp: number; lastBoostRound: number | null; priorityNextRound: boolean;
  intent: EnemyIntent | null;
  guarding: boolean; exposedTurns: number; inspiredTurns: number; coveredBy: string | null; coverTurns: number;
}
export interface EnemyIntent { action: 'attack' | 'guard' | 'rally' | 'heavy'; label: string; targetId?: string; }
export interface BattleEvent {
  id: number; actorId: string; targetId?: string; action: BattleAction | 'enemy' | 'victory' | 'defeat' | 'recover';
  amount?: number; kind: 'hit' | 'heal' | 'guard' | 'tactic' | 'result' | 'break' | 'recover' | 'boost';
  weapon?: WeaponType; hitIndex?: number; hitCount?: number; weakness?: boolean; revealedWeapon?: WeaponType; revealedWeapons?: WeaponType[];
  hpAfter?: number; vigorAfter?: number; shieldAfter?: number; brokenUntilRound?: number | null;
  actorBpAfter?: number; round?: number; message?: string;
}
export interface BattleActionOptions { boost?: number; weapon?: WeaponType; }
export interface AvailableWeapon { type: WeaponType; itemId: string; name: string; attack: number; }
export interface ActionPreview {
  valid: boolean; reason?: string; hits: number; cost: number; boost: number; power: number;
  shieldDamage: number; canBreak: boolean; weaknessKnown: boolean; weapon: WeaponType;
  target: 'enemy' | 'ally' | 'self' | 'none'; description: string; estimatedDamage: number;
}
export interface TimelineEntry { id: string; name: string; side: 'ally' | 'enemy'; round: number; broken: boolean; current: boolean; intent: EnemyIntent | null; }
export interface BattleState {
  combatVersion: 2; events: BattleEvent[];
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
