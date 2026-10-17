import { ITEMS } from './items';
import { getHeroStats, grantXp } from './progression';
import { updateQuest } from './state';
import type { BattleAction, BattleKind, BattleState, BattleUnit, EnemyArchetype, GameState } from './types';

export const ACTIONS: Record<BattleAction, { name: string; description: string; cost: number; target: 'enemy' | 'ally' | 'self' | 'none' }> = {
  attack: { name: 'Atacar', description: 'Golpe físico. Recupera 2 de vigor.', cost: 0, target: 'enemy' },
  precise: { name: 'Ataque preciso', description: 'Rompe a postura defensiva e ignora parte da proteção.', cost: 3, target: 'enemy' },
  guard: { name: 'Defender', description: 'Reduz dano em 60% até o próximo turno e recupera 5 de vigor.', cost: 0, target: 'self' },
  command: { name: 'Comando tático', description: 'Organiza a formação: ataque e moral do grupo aumentam por 2 turnos.', cost: 4, target: 'none' },
  focus: { name: 'Golpe concentrado', description: 'Um golpe forte que rompe a guarda. Custa 6 de vigor.', cost: 6, target: 'enemy' },
  quick: { name: 'Ataque rápido', description: 'Dois golpes curtos. Eficaz contra arqueiros.', cost: 3, target: 'enemy' },
  cover: { name: 'Cobertura', description: 'Purá recebe o próximo ataque dirigido ao aliado e reduz seu dano.', cost: 3, target: 'ally' },
  observe: { name: 'Observação', description: 'Revela uma abertura: o alvo recebe 35% mais dano por 2 turnos.', cost: 2, target: 'enemy' },
  supply: { name: 'Suprimento', description: 'Usa pão, provisões ou tâmaras em um aliado.', cost: 0, target: 'ally' },
  retreat: { name: 'Recuar', description: 'Tenta deixar o confronto. Indisponível no confronto final.', cost: 0, target: 'none' },
};

const ENEMIES: Record<EnemyArchetype, { name: string; hp: number; attack: number; defense: number; speed: number }> = {
  raider: { name: 'Saqueador', hp: 41, attack: 13, defense: 3, speed: 7 },
  spearman: { name: 'Lanceiro', hp: 53, attack: 14, defense: 6, speed: 6 },
  archer: { name: 'Arqueiro', hp: 34, attack: 12, defense: 2, speed: 9 },
  captain: { name: 'Líder da patrulha', hp: 105, attack: 19, defense: 7, speed: 8 },
};

function enemy(type: EnemyArchetype, index: number, scale = 1): BattleUnit {
  const data = ENEMIES[type];
  return { id: `${type}-${index}`, name: data.name, side: 'enemy', archetype: type, hp: Math.round(data.hp * scale), maxHp: Math.round(data.hp * scale), vigor: 15, maxVigor: 15, attack: Math.round(data.attack * scale), defense: data.defense, speed: data.speed, leadership: type === 'captain' ? 9 : 3, morale: 60, guarding: false, exposedTurns: 0, inspiredTurns: 0, coveredBy: null, coverTurns: 0 };
}

export function currentActor(state: GameState | BattleState | null): BattleUnit | undefined {
  const battle = state && 'battle' in state ? state.battle : state;
  if (!battle || battle.status !== 'active') return undefined;
  return battle.units.find(unit => unit.id === battle.turnOrder[battle.turnIndex]);
}

export function getAvailableActions(state: GameState): BattleAction[] {
  const actor = currentActor(state);
  if (!actor || actor.side !== 'ally') return [];
  const hero = state.party.find(entry => entry.id === actor.heroId);
  return (hero?.unlockedSkills ?? []).filter(action => {
    if (action === 'retreat' && state.battle?.kind === 'captain') return false;
    if (action === 'supply' && !['bread', 'meal', 'dates'].some(id => (state.inventory[id] ?? 0) > 0)) return false;
    if (action === 'cover' && !state.battle?.units.some(unit => unit.side === 'ally' && unit.id !== actor.id && unit.hp > 0)) return false;
    return actor.vigor >= ACTIONS[action].cost;
  });
}

export function startBattle(state: GameState, kind: BattleKind = 'patrol'): GameState {
  if (state.battle || state.party.every(hero => hero.stats.hp <= 0)) return state;
  const next = structuredClone(state);
  const allies: BattleUnit[] = next.party.map(hero => {
    const stats = getHeroStats(hero);
    return { id: hero.id, heroId: hero.id, name: hero.name, side: 'ally', hp: stats.hp, maxHp: stats.maxHp, vigor: stats.vigor, maxVigor: stats.maxVigor, attack: stats.attack, defense: stats.defense, speed: stats.speed, leadership: stats.leadership, morale: stats.morale, guarding: false, exposedTurns: 0, inspiredTurns: 0, coveredBy: null, coverTurns: 0 };
  });
  const foes = kind === 'training' ? [enemy('raider', 0, 0.8)]
    : kind === 'captain' ? [enemy('captain', 0), enemy('spearman', 1), enemy('archer', 2)]
    : kind === 'ambush' ? [enemy('raider', 0), enemy('archer', 1)]
    : [enemy('raider', 0), enemy('spearman', 1)];
  const units = [...allies, ...foes];
  const rewards: BattleState['rewards'] = kind === 'training' ? { xp: 32, silver: 16, items: { bread: 1 } }
    : kind === 'captain' ? { xp: 95, silver: 65, items: { meal: 2, bronze_sword: 1 } }
    : kind === 'ambush' ? { xp: 42, silver: 25, items: { dates: 2 } }
    : { xp: 45, silver: 24, items: { bread: 2 } };
  next.battle = { kind, units, turnOrder: [...units].sort((a, b) => b.speed - a.speed || a.id.localeCompare(b.id)).map(unit => unit.id), turnIndex: 0, round: 1, status: 'active', log: [kind === 'captain' ? 'Uma unidade em retirada bloqueia a trilha. Encontro ficcional de adaptação.' : 'A patrulha intercepta o caminho. Prepare a formação.'], lastEvent: null, eventId: 0, rewards, rewardsGranted: false };
  runEnemyTurns(next);
  return syncParty(next);
}

/** Pure physical damage before a small seeded variance. Morale is human resolve. */
export function calculateDamage(attacker: Pick<BattleUnit, 'attack' | 'morale'> & Partial<Pick<BattleUnit, 'inspiredTurns'>>, defender: Pick<BattleUnit, 'defense' | 'guarding'> & Partial<Pick<BattleUnit, 'exposedTurns'>>, multiplier = 1, pierce = false): number {
  const morale = 0.8 + Math.max(0, Math.min(100, attacker.morale)) / 250;
  const offense = attacker.attack * morale * (attacker.inspiredTurns ? 1.22 : 1);
  const base = Math.max(2, offense * multiplier - defender.defense * (pierce ? 0.25 : 0.6));
  return Math.max(1, Math.round(base * (defender.guarding ? 0.4 : 1) * (defender.exposedTurns ? 1.35 : 1)));
}

function random(state: GameState): number {
  state.seed = (Math.imul(state.seed, 1664525) + 1013904223) >>> 0;
  return state.seed / 4294967296;
}

function writeLog(battle: BattleState, message: string): void {
  battle.log.push(message);
  if (battle.log.length > 80) battle.log.splice(0, battle.log.length - 80);
}

function event(battle: BattleState, actor: BattleUnit, action: BattleAction | 'enemy', kind: 'hit' | 'heal' | 'guard' | 'tactic', target?: BattleUnit, amount?: number): void {
  battle.lastEvent = { id: ++battle.eventId, actorId: actor.id, targetId: target?.id, action, kind, amount };
}

function hit(state: GameState, actor: BattleUnit, originalTarget: BattleUnit, multiplier: number, pierce = false, action: BattleAction | 'enemy' = 'attack'): number {
  const battle = state.battle!;
  let target = originalTarget;
  if (originalTarget.coveredBy) {
    const protector = battle.units.find(unit => unit.id === originalTarget.coveredBy && unit.hp > 0);
    if (protector) { target = protector; target.guarding = true; writeLog(battle, `${protector.name} cobre ${originalTarget.name}.`); }
    originalTarget.coveredBy = null;
    originalTarget.coverTurns = 0;
  }
  const damage = Math.max(1, calculateDamage(actor, target, multiplier, pierce) + Math.floor(random(state) * 3) - 1);
  target.hp = Math.max(0, target.hp - damage);
  target.morale = Math.max(15, target.morale - (damage >= 20 ? 4 : 1));
  writeLog(battle, `${actor.name} atinge ${target.name}: ${damage} de dano.${target.hp === 0 ? ' Fora de combate.' : ''}`);
  event(battle, actor, action, 'hit', target, damage);
  return damage;
}

export function applyBattleAction(state: GameState, action: BattleAction, targetId?: string, itemId?: string): GameState {
  const actorBefore = currentActor(state);
  if (!state.battle || state.battle.status !== 'active' || !actorBefore || !getAvailableActions(state).includes(action)) return state;
  const targetType = ACTIONS[action].target;
  const targetBefore = state.battle.units.find(unit => unit.id === targetId);
  if (targetType === 'enemy' && (!targetBefore || targetBefore.side !== 'enemy' || targetBefore.hp <= 0)) return state;
  if (targetType === 'ally' && (!targetBefore || targetBefore.side !== 'ally' || targetBefore.hp <= 0 || (action === 'cover' && targetBefore.id === actorBefore.id))) return state;
  const selectedItem = itemId ?? ['bread', 'meal', 'dates'].find(id => (state.inventory[id] ?? 0) > 0);
  if (action === 'supply' && (!selectedItem || !ITEMS[selectedItem] || ITEMS[selectedItem].kind !== 'consumable' || !(state.inventory[selectedItem] > 0))) return state;
  let next = structuredClone(state);
  const battle = next.battle!;
  const actor = battle.units.find(unit => unit.id === actorBefore.id)!;
  const target = battle.units.find(unit => unit.id === targetId);
  actor.vigor -= ACTIONS[action].cost;
  switch (action) {
    case 'attack': hit(next, actor, target!, 1); actor.vigor = Math.min(actor.maxVigor, actor.vigor + 2); break;
    case 'precise':
      if (target!.guarding) writeLog(battle, `${actor.name} rompe a postura de ${target!.name}.`);
      target!.guarding = false;
      hit(next, actor, target!, 1.12, true, action);
      break;
    case 'focus':
      target!.guarding = false;
      hit(next, actor, target!, target!.archetype === 'raider' ? 1.95 : 1.7, false, action);
      break;
    case 'quick':
      hit(next, actor, target!, target!.archetype === 'archer' ? 0.85 : 0.64, false, action);
      if (target!.hp > 0) hit(next, actor, target!, target!.archetype === 'archer' ? 0.85 : 0.64, false, action);
      break;
    case 'guard':
      actor.guarding = true;
      actor.vigor = Math.min(actor.maxVigor, actor.vigor + 5);
      actor.morale = Math.min(100, actor.morale + 3);
      writeLog(battle, `${actor.name} firma a postura e recupera vigor.`);
      event(battle, actor, action, 'guard', actor);
      break;
    case 'command':
      for (const ally of battle.units.filter(unit => unit.side === 'ally' && unit.hp > 0)) {
        ally.inspiredTurns = 3;
        ally.morale = Math.min(100, ally.morale + Math.round(actor.leadership / 2));
      }
      writeLog(battle, `${actor.name} coordena a formação. O grupo ganha ataque e moral.`);
      event(battle, actor, action, 'tactic');
      break;
    case 'observe':
      target!.exposedTurns = 3;
      target!.guarding = false;
      writeLog(battle, `${actor.name} identifica uma abertura em ${target!.name}. Dano recebido +35%.`);
      event(battle, actor, action, 'tactic', target);
      break;
    case 'cover':
      target!.coveredBy = actor.id;
      target!.coverTurns = 2;
      actor.guarding = true;
      writeLog(battle, `${actor.name} protege ${target!.name} contra o próximo ataque.`);
      event(battle, actor, action, 'guard', target);
      break;
    case 'supply': {
      const item = ITEMS[selectedItem!];
      const hp = target!.hp;
      target!.hp = Math.min(target!.maxHp, target!.hp + (item.restoreHp ?? 0));
      target!.vigor = Math.min(target!.maxVigor, target!.vigor + (item.restoreVigor ?? 0));
      next.inventory[selectedItem!] -= 1;
      writeLog(battle, `${actor.name} usa ${item.name.toLowerCase()} em ${target!.name}.`);
      event(battle, actor, action, 'heal', target, target!.hp - hp);
      break;
    }
    case 'retreat':
      if (random(next) < 0.75) { battle.status = 'escaped'; writeLog(battle, 'O grupo recua pela trilha. Sem recompensas.'); }
      else writeLog(battle, 'A patrulha fecha o caminho. O recuo falhou.');
      event(battle, actor, action, 'tactic');
      break;
  }
  resolveResult(next);
  if (battle.status === 'active') { advanceTurn(battle); runEnemyTurns(next); }
  next = syncParty(next);
  if (next.battle?.status === 'victory' && !next.battle.rewardsGranted) next = awardVictory(next);
  return next;
}

function beginTurn(unit: BattleUnit): void {
  unit.guarding = false;
  unit.exposedTurns = Math.max(0, unit.exposedTurns - 1);
  unit.inspiredTurns = Math.max(0, unit.inspiredTurns - 1);
  unit.coverTurns = Math.max(0, unit.coverTurns - 1);
  if (unit.coverTurns === 0) unit.coveredBy = null;
}

function advanceTurn(battle: BattleState): void {
  for (let i = 0; i < battle.turnOrder.length; i++) {
    battle.turnIndex += 1;
    if (battle.turnIndex >= battle.turnOrder.length) { battle.turnIndex = 0; battle.round += 1; }
    const next = battle.units.find(unit => unit.id === battle.turnOrder[battle.turnIndex]);
    if (next && next.hp > 0) { beginTurn(next); return; }
  }
}

function runEnemyTurns(state: GameState): void {
  const battle = state.battle!;
  // At most one full round is needed to reach a living ally.
  for (let i = 0; i < battle.units.length + 1 && battle.status === 'active'; i++) {
    const actor = currentActor(state);
    if (!actor) break;
    if (actor.hp <= 0) { advanceTurn(battle); continue; }
    if (actor.side === 'ally') break;
    const allies = battle.units.filter(unit => unit.side === 'ally' && unit.hp > 0);
    if (allies.length === 0) { resolveResult(state); break; }
    let target = allies[Math.floor(random(state) * allies.length)];
    if (actor.archetype === 'archer') target = [...allies].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (actor.archetype === 'spearman' && battle.round % 3 === 1) {
      actor.guarding = true;
      actor.vigor = Math.min(actor.maxVigor, actor.vigor + 3);
      writeLog(battle, `${actor.name} planta a lança e assume postura defensiva.`);
      event(battle, actor, 'enemy', 'guard', actor);
    } else if (actor.archetype === 'captain' && battle.round % 3 === 1) {
      battle.units.filter(unit => unit.side === 'enemy' && unit.hp > 0).forEach(unit => { unit.inspiredTurns = 3; });
      writeLog(battle, 'O líder da patrulha reorganiza a unidade. Os inimigos avançam juntos.');
      event(battle, actor, 'enemy', 'tactic');
    } else {
      const multiplier = actor.archetype === 'spearman' ? 1.3 : actor.archetype === 'captain' && actor.hp < actor.maxHp / 2 ? 1.18 : 1;
      hit(state, actor, target, multiplier, actor.archetype === 'archer', 'enemy');
    }
    resolveResult(state);
    if (battle.status === 'active') advanceTurn(battle);
  }
}

function resolveResult(state: GameState): void {
  const battle = state.battle!;
  if (battle.status !== 'active') return;
  if (!battle.units.some(unit => unit.side === 'enemy' && unit.hp > 0)) {
    battle.status = 'victory';
    writeLog(battle, 'O caminho está livre. Vitória do grupo.');
    battle.lastEvent = { id: ++battle.eventId, actorId: 'gideon', action: 'victory', kind: 'result' };
  } else if (!battle.units.some(unit => unit.side === 'ally' && unit.hp > 0)) {
    battle.status = 'defeat';
    writeLog(battle, 'O grupo foi vencido e precisa se reagrupar em um ponto seguro.');
    battle.lastEvent = { id: ++battle.eventId, actorId: 'gideon', action: 'defeat', kind: 'result' };
  }
}

function syncParty(state: GameState): GameState {
  if (!state.battle) return state;
  return { ...state, party: state.party.map(hero => {
    const unit = state.battle!.units.find(entry => entry.heroId === hero.id);
    return unit ? { ...hero, stats: { ...hero.stats, hp: unit.hp, vigor: unit.vigor, morale: unit.morale } } : hero;
  }) };
}

function awardVictory(state: GameState): GameState {
  const battle = state.battle!;
  let next = grantXp(state, battle.rewards.xp);
  next.silver += battle.rewards.silver;
  next.inventory = { ...next.inventory };
  for (const [id, count] of Object.entries(battle.rewards.items)) next.inventory[id] = (next.inventory[id] ?? 0) + count;
  next.battle = { ...battle, rewardsGranted: true };
  next.flags = { ...next.flags, [`won_${battle.kind}`]: true };
  if (battle.kind === 'patrol' || battle.kind === 'training') next = updateQuest(next, 'patrol');
  return next;
}

export function finishBattle(state: GameState): GameState {
  if (!state.battle || state.battle.status === 'active') return state;
  const next = { ...state, battle: null };
  if (state.battle.status === 'defeat') {
    next.position = { x: 0, z: 9 }; next.silver = Math.floor(next.silver * 0.9);
    next.party = next.party.map(hero => ({ ...hero, stats: { ...hero.stats, hp: Math.max(1, Math.floor(getHeroStats(hero).maxHp * 0.6)), vigor: getHeroStats(hero).maxVigor } }));
  }
  return next;
}

export const act = applyBattleAction;
