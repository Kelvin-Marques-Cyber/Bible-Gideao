import { describe, expect, it } from 'vitest';
import { ACTIONS, addItem, applyBattleAction, buyItem, calculateDamage, consumeItem, createGame, currentActor, equipItem, finishBattle, getAvailableActions, getHeroStats, grantXp, restParty, sellItem, startBattle, unequipItem, unlockPura, updateQuest, xpForNextLevel } from '../src/game';
import type { BattleAction, GameState } from '../src/game';

function fight(state: GameState, maxTurns = 150): GameState {
  let next = state;
  for (let count = 0; count < maxTurns && next.battle?.status === 'active'; count++) {
    const actor = currentActor(next)!;
    const enemies = next.battle.units.filter(unit => unit.side === 'enemy' && unit.hp > 0);
    const target = [...enemies].sort((a, b) => a.hp - b.hp)[0];
    const options = getAvailableActions(next);
    if (actor.hp < actor.maxHp * 0.5 && next.inventory.bread > 0) next = applyBattleAction(next, 'supply', actor.id, 'bread');
    else {
      const skill: BattleAction = options.includes('focus') ? 'focus' : options.includes('quick') ? 'quick' : options.includes('precise') ? 'precise' : 'attack';
      next = applyBattleAction(next, skill, target.id);
    }
  }
  return next;
}

describe('inventário, comércio e equipamentos', () => {
  it('compra e vende quantidades com custo real, preservando o estado anterior', () => {
    const initial = createGame();
    const bought = buyItem(initial, 'bread', 2);
    expect(bought.inventory.bread).toBe(6);
    expect(bought.silver).toBe(22);
    expect(initial.inventory.bread).toBe(4);
    const sold = sellItem(bought, 'bread', 3);
    expect(sold.inventory.bread).toBe(3);
    expect(sold.silver).toBe(34);
  });
  it('recusa quantidades inválidas, prata insuficiente e itens de história', () => {
    const game = createGame();
    expect(buyItem(game, 'bronze_sword')).toBe(game);
    expect(buyItem(game, 'bread', -2)).toBe(game);
    expect(buyItem(game, 'bread', 0.5)).toBe(game);
    expect(buyItem(game, 'torch')).toBe(game);
    expect(sellItem(game, 'meal', 2)).toBe(game);
    expect(addItem(game, 'unknown')).toBe(game);
  });
  it('troca equipamento e aplica os modificadores a atributos usados no combate', () => {
    const game = addItem(createGame(), 'bronze_sword');
    const equipped = equipItem(game, 'gideon', 'bronze_sword');
    expect(equipped.inventory.bronze_sword).toBe(0);
    expect(equipped.inventory.short_sword).toBe(1);
    expect(getHeroStats(equipped.party[0]).attack - getHeroStats(game.party[0]).attack).toBe(4);
    expect(startBattle(equipped, 'training').battle!.units[0].attack).toBe(20);
    expect(unequipItem(equipped, 'gideon', 'weapon').inventory.bronze_sword).toBe(1);
  });
  it('não permite duplicar um equipamento inexistente', () => {
    const game = createGame();
    expect(equipItem(game, 'gideon', 'bronze_sword')).toBe(game);
    expect(equipItem(game, 'gideon', 'bread')).toBe(game);
    expect(equipItem(game, 'unknown', 'short_sword')).toBe(game);
  });
  it('limita vida e vigor aos máximos reais após retirar equipamento', () => {
    let game = equipItem(addItem(createGame(), 'leather_vest'), 'gideon', 'leather_vest');
    game = restParty(game);
    expect(game.party[0].stats.hp).toBe(98);
    game = unequipItem(game, 'gideon', 'armor');
    expect(game.party[0].stats.hp).toBe(90);
  });
  it('consome suprimentos com recuperação e não desperdiça itens sem efeito', () => {
    const initial = createGame();
    expect(consumeItem(initial, 'bread', 'gideon')).toBe(initial);
    const injured = structuredClone(initial);
    injured.party[0].stats.hp = 80;
    injured.party[0].stats.vigor = 3;
    const fed = consumeItem(injured, 'meal', 'gideon');
    expect(fed.party[0].stats.hp).toBe(90);
    expect(fed.party[0].stats.vigor).toBe(11);
    expect(fed.inventory.meal).toBe(0);
    expect(injured.inventory.meal).toBe(1);
  });
  it('bloqueia trocas e consumos externos durante batalha', () => {
    const game = startBattle(addItem(createGame(), 'bronze_sword'));
    expect(buyItem(game, 'bread')).toBe(game);
    expect(sellItem(game, 'bread')).toBe(game);
    expect(equipItem(game, 'gideon', 'bronze_sword')).toBe(game);
    expect(consumeItem(game, 'bread', 'gideon')).toBe(game);
  });
});

describe('progressão e missões', () => {
  it('ganha níveis, atributos e técnicas em limites definidos', () => {
    const initial = createGame();
    const level2 = grantXp(initial, xpForNextLevel(1));
    expect(level2.party[0].stats.level).toBe(2);
    expect(level2.party[0].stats.xp).toBe(0);
    expect(level2.party[0].stats.attack).toBe(15);
    expect(level2.party[0].unlockedSkills).toContain('command');
    const level3 = grantXp(level2, xpForNextLevel(2));
    expect(level3.party[0].stats.level).toBe(3);
    expect(level3.party[0].unlockedSkills).toContain('focus');
    expect(initial.party[0].stats.level).toBe(1);
  });
  it('suporta vários níveis em uma única recompensa', () => {
    const game = grantXp(createGame(), 200);
    expect(game.party[0].stats.level).toBe(4);
    expect(game.party[0].stats.xp).toBe(5);
    expect(grantXp(game, Number.NaN)).toBe(game);
  });
  it('adiciona Purá apenas uma vez e pode conceder XP a um personagem', () => {
    const game = unlockPura(createGame());
    expect(game.party).toHaveLength(2);
    expect(unlockPura(game)).toBe(game);
    const progressed = grantXp(game, 25, 'pura');
    expect(progressed.party[0].stats.xp).toBe(0);
    expect(progressed.party[1].stats.xp).toBe(25);
    expect(progressed.party[1].unlockedSkills).toContain('cover');
  });
  it('conclui missão e paga a recompensa uma única vez', () => {
    const game = createGame();
    const partial = updateQuest(game, 'grain', 2);
    expect(partial.quests.grain.current).toBe(2);
    expect(partial.silver).toBe(game.silver);
    const completed = updateQuest(partial, 'grain', 10);
    expect(completed.quests.grain.current).toBe(3);
    expect(completed.quests.grain.status).toBe('completed');
    expect(completed.silver).toBe(game.silver + 18);
    expect(completed.party[0].stats.xp).toBe(25);
    expect(updateQuest(completed, 'grain')).toBe(completed);
  });
});

describe('combate tático', () => {
  it('ordena por velocidade e retorna o controle ao próximo aliado vivo', () => {
    const game = startBattle(unlockPura(createGame()), 'patrol');
    expect(currentActor(game)?.id).toBe('pura');
    expect(currentActor(game.battle)?.id).toBe('pura');
    const next = applyBattleAction(game, 'attack', 'raider-0');
    expect(currentActor(next)?.id).toBe('gideon');
    const following = applyBattleAction(next, 'guard');
    expect(currentActor(following)?.id).toBe('gideon'); // Defender grants next-round priority ahead of faster Purá.
    expect(following.battle!.round).toBe(2);
    expect(following.battle!.log.some(line => line.includes('Saqueador atinge'))).toBe(true);
  });
  it('calcula influência de defesa, moral, postura e vulnerabilidade', () => {
    const attacker = { attack: 20, morale: 70 };
    const target = { defense: 7, guarding: false };
    const normal = calculateDamage(attacker, target);
    expect(calculateDamage(attacker, { ...target, defense: 12 })).toBeLessThan(normal);
    expect(calculateDamage(attacker, { ...target, guarding: true })).toBeLessThan(normal / 2);
    expect(calculateDamage(attacker, { ...target, exposedTurns: 1 })).toBeGreaterThan(normal);
    expect(calculateDamage({ ...attacker, morale: 10 }, target)).toBeLessThan(normal);
    expect(calculateDamage(attacker, target, 1, true)).toBeGreaterThan(normal);
  });
  it('exige alvos reais da equipe adequada e recursos suficientes', () => {
    const game = startBattle(createGame(), 'training');
    expect(applyBattleAction(game, 'attack', 'gideon')).toBe(game);
    expect(applyBattleAction(game, 'attack', 'missing')).toBe(game);
    expect(applyBattleAction(game, 'supply', 'raider-0')).toBe(game);
    expect(applyBattleAction(game, 'focus', 'raider-0')).toBe(game);
    const tired = structuredClone(game);
    tired.battle!.units[0].vigor = 1;
    expect(getAvailableActions(tired)).not.toContain('precise');
    expect(applyBattleAction(tired, 'precise', 'raider-0')).toBe(tired);
  });
  it('vigor se recupera defendendo e o dano recebido é reduzido', () => {
    const game = startBattle(createGame(90), 'training');
    game.battle!.units[0].vigor = 0;
    const defending = applyBattleAction(game, 'guard');
    expect(defending.party[0].stats.vigor).toBe(5);
    expect(defending.party[0].stats.hp).toBeGreaterThan(84);
    expect(game.party[0].stats.hp).toBe(90);
  });
  it('ataque preciso rompe a guarda de um lanceiro', () => {
    const game = startBattle(createGame(), 'patrol');
    game.battle!.units.find(unit => unit.id === 'spearman-1')!.guarding = true;
    const next = applyBattleAction(game, 'precise', 'spearman-1');
    expect(next.battle!.log.some(line => line.includes('rompe a postura'))).toBe(true);
    expect(next.party[0].stats.vigor).toBe(17);
  });
  it('observação e comando alteram condições reais', () => {
    let game = startBattle(unlockPura(grantXp(createGame(), 100)), 'captain');
    game = applyBattleAction(game, 'observe', 'captain-0');
    expect(game.battle!.units.find(unit => unit.id === 'captain-0')!.exposedTurns).toBe(3);
    game = applyBattleAction(game, 'command');
    expect(game.battle!.units.find(unit => unit.id === 'gideon')!.inspiredTurns).toBeGreaterThan(0);
    expect(game.battle!.units.find(unit => unit.id === 'pura')!.morale).toBeGreaterThan(75);
    expect(getAvailableActions(game)).not.toContain('retreat');
  });
  it('cobertura redireciona um golpe ao protetor', () => {
    let game = startBattle(unlockPura(createGame()), 'training');
    game = applyBattleAction(game, 'cover', 'gideon');
    // Force the enemy to target Gideão deterministically.
    game.seed = 1;
    game = applyBattleAction(game, 'guard');
    expect(game.battle!.log.some(line => line.includes('Purá cobre Gideão'))).toBe(true);
    expect(game.party[0].stats.hp).toBe(90);
    expect(game.party[1].stats.hp).toBeLessThan(69);
  });
  it('suprimento consome um item e recupera o alvo escolhido', () => {
    const game = startBattle(unlockPura(createGame()), 'training');
    game.battle!.units.find(unit => unit.id === 'gideon')!.hp = 30;
    const next = applyBattleAction(game, 'supply', 'gideon', 'bread');
    expect(next.inventory.bread).toBe(3);
    expect(next.party[0].stats.hp).toBe(64);
    expect(next.battle!.lastEvent?.kind).toBe('heal');
    expect(currentActor(next)?.id).toBe('gideon');
  });
  it('diferencia IA de lanceiro, arqueiro e líder', () => {
    let game = startBattle(unlockPura(grantXp(createGame(), 200)), 'captain');
    game = applyBattleAction(game, 'guard');
    game = applyBattleAction(game, 'guard');
    expect(game.battle!.log.some(line => line.includes('planta a lança'))).toBe(true);
    expect(game.battle!.log.some(line => line.includes('reorganiza a unidade'))).toBe(true);
    expect(game.battle!.log.some(line => line.includes('Arqueiro atinge'))).toBe(true);
  });
  it('vence, ganha XP, prata, saque e missão uma vez', () => {
    const original = createGame();
    const win = fight(startBattle(original, 'training'));
    expect(win.battle!.status).toBe('victory');
    expect(win.battle!.rewardsGranted).toBe(true);
    expect(win.party[0].stats.level).toBe(2);
    expect(win.inventory.bread).toBeGreaterThanOrEqual(original.inventory.bread);
    expect(win.silver).toBe(original.silver + 16 + 15);
    expect(win.quests.patrol.status).toBe('completed');
    expect(applyBattleAction(win, 'attack', 'raider-0')).toBe(win);
    const finished = finishBattle(win);
    expect(finished.battle).toBeNull();
    expect(finished.silver).toBe(win.silver);
  });
  it('permite derrota e recuperação com consequência', () => {
    const base = createGame();
    base.region = 'midian'; base.stage = 12;
    base.party[0].stats.hp = 1;
    const game = applyBattleAction(startBattle(base, 'patrol'), 'attack', 'spearman-1');
    expect(game.battle!.status).toBe('defeat');
    const recovered = finishBattle(game);
    expect(recovered.battle).toBeNull();
    expect(recovered.region).toBe('midian');
    expect(recovered.stage).toBe(12);
    expect(recovered.position).toEqual({ x: 0, z: 9 });
    expect(recovered.silver).toBe(34);
    expect(recovered.party[0].stats.hp).toBe(54);
  });
  it('confronto final é vencível com progressão e uso dos suprimentos', () => {
    let game = unlockPura(grantXp(createGame(), 200));
    game = equipItem(addItem(game, 'bronze_sword'), 'gideon', 'bronze_sword');
    game = equipItem(addItem(game, 'leather_vest'), 'gideon', 'leather_vest');
    game = restParty(addItem(game, 'bread', 5));
    game = fight(startBattle(game, 'captain'));
    expect(game.battle!.status).toBe('victory');
    expect(game.flags.won_captain).toBe(true);
  });
  it('ações idênticas e a mesma semente produzem a mesma batalha', () => {
    const first = fight(startBattle(createGame(123), 'training'));
    const second = fight(startBattle(createGame(123), 'training'));
    expect(first).toEqual(second);
    expect(ACTIONS.focus.cost).toBe(6);
  });
});

function durableBattle(kind: 'training'|'patrol'|'captain' = 'training', party=false): GameState {
  let s=createGame(123);s.party[0].stats.maxHp=1000;s.party[0].stats.hp=1000;
  if(party){s=unlockPura(s);s.party[1].stats.hp=1000;s.party[1].stats.maxHp=1000;}
  s=startBattle(s,kind);
  for(const u of s.battle!.units.filter(u=>u.side==='enemy')){u.hp=1000;u.maxHp=1000;}
  return s;
}

describe('Ruptura e Impulso',()=>{
  it('permite apenas armas equipadas ou presentes e aplica seu ataque real',async()=>{
    const {getAvailableWeapons,getActionPreview}=await import('../src/game');
    let s=createGame();expect(s.inventory.staff).toBe(1);
    expect(getAvailableWeapons(s,'gideon').map(w=>w.type)).toEqual(['sword','staff']);
    s=buyItem(s,'bow');s=startBattle(s,'training');
    expect(getAvailableWeapons(s).find(w=>w.type==='bow')!.attack).toBe(17);
    expect(getActionPreview(s,'attack','raider-0',{weapon:'spear'}).valid).toBe(false);
    expect(applyBattleAction(s,'attack','raider-0',undefined,{weapon:'spear'})).toBe(s);
    const next=applyBattleAction(s,'attack','raider-0',undefined,{weapon:'bow'});
    expect(next.battle!.units[0].weaponId).toBe('bow');
    expect(next.battle!.units[0].attack).toBe(17);
    const joined=unlockPura(createGame());expect(joined.inventory.bow).toBe(1);
    expect(getAvailableWeapons(joined,'pura').map(w=>w.type)).not.toContain('sword');
  });
  it('BP começa em 1, limita-se a 5 e não cresce na rodada após gastar',async()=>{
    let s=durableBattle();expect(s.battle!.units[0].bp).toBe(1);
    s=applyBattleAction(s,'attack','raider-0',undefined,{boost:1,weapon:'staff'});
    expect(s.battle!.round).toBe(2);expect(s.battle!.units[0].bp).toBe(0);
    expect(s.battle!.events.filter(e=>e.actorId==='gideon'&&e.kind==='hit')).toHaveLength(2);
    s=applyBattleAction(s,'attack','raider-0',undefined,{weapon:'staff'});
    expect(s.battle!.round).toBe(3);expect(s.battle!.units[0].bp).toBe(1);
    for(let i=0;i<8;i++)s=applyBattleAction(s,'guard');
    expect(s.battle!.units[0].bp).toBe(5);
    expect(applyBattleAction(s,'attack','raider-0',undefined,{boost:4})).toBe(s);
    expect(applyBattleAction(s,'attack','raider-0',undefined,{boost:-1})).toBe(s);
    expect(applyBattleAction(s,'guard',undefined,undefined,{boost:1})).toBe(s);
    expect(applyBattleAction(s,'supply','gideon','bread',{boost:1})).toBe(s);
  });
  it('acertos de fraqueza reduzem a postura por golpe e revelam só o tipo atingido',()=>{
    const original=durableBattle('patrol');
    const wrong=applyBattleAction(original,'attack','spearman-1',undefined,{weapon:'sword'});
    const right=applyBattleAction(original,'attack','spearman-1',undefined,{weapon:'staff'});
    const a=wrong.battle!.units.find(u=>u.id==='spearman-1')!,b=right.battle!.units.find(u=>u.id==='spearman-1')!;
    expect(a.shield).toBe(3);expect(a.revealedWeaknesses).toEqual([]);
    expect(b.shield).toBe(2);expect(b.revealedWeaknesses).toEqual(['staff']);
    expect(b.hp).toBeLessThan(a.hp);
  });
  it('Ruptura suspende a rodada atual e a próxima e recupera toda a postura depois',()=>{
    let s=durableBattle();
    s=applyBattleAction(s,'attack','raider-0',undefined,{boost:1,weapon:'sword'});
    const foe=()=>s.battle!.units.find(u=>u.id==='raider-0')!;
    expect(foe().shield).toBe(0);expect(foe().brokenUntilRound).toBe(2);expect(s.battle!.round).toBe(2);
    expect(s.battle!.events.filter(e=>e.kind==='hit'&&e.actorId==='raider-0')).toHaveLength(0);
    expect(s.battle!.events.filter(e=>e.kind==='hit'&&e.actorId==='gideon').map(e=>e.shieldAfter)).toEqual([1,0]);
    s=applyBattleAction(s,'guard');expect(s.battle!.round).toBe(3);expect(foe().shield).toBe(2);expect(foe().brokenUntilRound).toBeNull();
    expect(s.battle!.events.some(e=>e.kind==='recover'&&e.targetId==='raider-0')).toBe(true);
    expect(s.battle!.events.filter(e=>e.kind==='hit'&&e.actorId==='raider-0')).toHaveLength(0);
    s=applyBattleAction(s,'attack','raider-0',undefined,{weapon:'staff'});
    expect(s.battle!.events.some(e=>e.kind==='hit'&&e.actorId==='raider-0')).toBe(true);
  });
  it('dobra dano em Ruptura inclusive de uma arma que não é fraqueza',()=>{
    const a={attack:20,morale:50},d={defense:0,guarding:false};
    expect(calculateDamage(a,{...d,brokenUntilRound:2})).toBe(calculateDamage(a,d)*2);
    let s=durableBattle();s.battle!.units[1].shield=0;s.battle!.units[1].brokenUntilRound=2;
    const next=applyBattleAction(s,'attack','raider-0',undefined,{weapon:'staff'});
    const hit=next.battle!.events.find(e=>e.actorId==='gideon'&&e.kind==='hit')!;
    expect(hit.weakness).toBe(false);expect(hit.amount).toBeGreaterThan(20);
  });
  it('escala técnicas com BP sem criar golpes extras e mantém previsão sem revelar fraquezas',async()=>{
    const {getActionPreview}=await import('../src/game');const s=durableBattle();s.battle!.units[0].bp=3;
    const normal=getActionPreview(s,'precise','raider-0',{boost:0}),boosted=getActionPreview(s,'precise','raider-0',{boost:3});
    expect(boosted.hits).toBe(1);expect(boosted.power).toBeGreaterThan(normal.power);expect(boosted.estimatedDamage).toBeGreaterThan(normal.estimatedDamage);
    expect(boosted.weaknessKnown).toBe(false);expect(boosted.shieldDamage).toBe(0);
    const learned=applyBattleAction(s,'attack','raider-0',undefined,{weapon:'sword'});
    const preview=getActionPreview(learned,'attack','raider-0',{boost:1});expect(preview.weaknessKnown).toBe(true);expect(preview.canBreak).toBe(true);
  });
  it('Observação revela parcialmente e Impulso amplia reconhecimento',()=>{
    let s=durableBattle('captain',true);s=applyBattleAction(s,'observe','captain-0');
    expect(s.battle!.units.find(u=>u.id==='captain-0')!.revealedWeaknesses).toEqual(['spear']);
    while(currentActor(s)?.id!=='pura')s=applyBattleAction(s,'guard');
    s=applyBattleAction(s,'observe','captain-0',undefined,{boost:1});
    expect(s.battle!.units.find(u=>u.id==='captain-0')!.revealedWeaknesses).toEqual(['spear','bow']);
  });
  it('mantém todos os eventos em ordem com snapshots antes dos inimigos e do resultado',()=>{
    const s=applyBattleAction(durableBattle(),'attack','raider-0',undefined,{boost:1,weapon:'staff'}),events=s.battle!.events;
    expect(events.map(e=>e.id)).toEqual([...events.map(e=>e.id)].sort((a,b)=>a-b));
    expect(events.filter(e=>e.kind==='hit').map(e=>e.actorId)).toEqual(['gideon','gideon','raider-0']);
    expect(events.filter(e=>e.actorId==='gideon'&&e.kind==='hit').map(e=>e.hitIndex)).toEqual([1,2]);
    expect(events.find(e=>e.kind==='hit')!.actorBpAfter).toBe(0);
    const win=applyBattleAction(startBattle(createGame(),'training'),'attack','raider-0',undefined,{boost:1});
    expect(win.battle!.status).toBe('victory');expect(win.battle!.events.at(-1)!.kind).toBe('result');
    expect(win.battle!.events.filter(e=>e.kind==='hit').length).toBeGreaterThan(0);
    expect(win.battle!.events.filter(e=>e.kind==='hit').at(-1)!.hpAfter).toBe(0);
  });
  it('antecipa a intenção inimiga e a prioridade de Defender na linha do tempo',async()=>{
    const {getTurnTimeline,getEnemyIntent}=await import('../src/game');let s=durableBattle('captain',true);
    expect(getEnemyIntent(s,'spearman-1')!.action).toBe('guard');expect(getEnemyIntent(s,'captain-0')!.action).toBe('rally');
    expect(getTurnTimeline(s).next.find(u=>u.id==='spearman-1')!.intent!.action).toBe('heavy');
    s=applyBattleAction(s,'attack','captain-0');expect(currentActor(s)?.id).toBe('gideon');
    s=applyBattleAction(s,'guard');expect(currentActor(s)?.id).toBe('gideon');
    expect(getTurnTimeline(s).current[0].current).toBe(true);
  });
});
