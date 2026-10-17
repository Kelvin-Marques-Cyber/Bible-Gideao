import type { Item } from './types';

export const ITEMS: Record<string, Item> = {
  short_sword: { id: 'short_sword', name: 'Espada curta', description: 'Uma lâmina simples, usada para proteger os caminhos.', kind: 'equipment', slot: 'weapon', price: 22, modifiers: { attack: 3 } },
  bronze_sword: { id: 'bronze_sword', name: 'Espada de bronze', description: 'Lâmina reforçada de um artesão de Ofra. Ataque +7.', kind: 'equipment', slot: 'weapon', price: 55, modifiers: { attack: 7 } },
  spear: { id: 'spear', name: 'Lança de freixo', description: 'Alcance e equilíbrio. Ataque +5, velocidade +1.', kind: 'equipment', slot: 'weapon', price: 40, modifiers: { attack: 5, speed: 1 } },
  staff: { id: 'staff', name: 'Bastão de viagem', description: 'Madeira resistente, familiar nas mãos de Purá.', kind: 'equipment', slot: 'weapon', price: 12, modifiers: { attack: 2, speed: 1 } },
  linen_tunic: { id: 'linen_tunic', name: 'Túnica de linho', description: 'Proteção leve para a estrada. Defesa +1.', kind: 'equipment', slot: 'armor', price: 12, modifiers: { defense: 1 } },
  leather_vest: { id: 'leather_vest', name: 'Colete de couro', description: 'Couro trabalhado. Defesa +4, vida máxima +8.', kind: 'equipment', slot: 'armor', price: 42, modifiers: { defense: 4, maxHp: 8 } },
  woven_cloak: { id: 'woven_cloak', name: 'Manto tecido', description: 'Manto que protege durante as vigílias. Defesa +2, vigor +3.', kind: 'equipment', slot: 'armor', price: 30, modifiers: { defense: 2, maxVigor: 3 } },
  leather_belt: { id: 'leather_belt', name: 'Cinto de campanha', description: 'Mantém os suprimentos ao alcance. Vigor máximo +4.', kind: 'equipment', slot: 'accessory', price: 24, modifiers: { maxVigor: 4 } },
  sandals: { id: 'sandals', name: 'Sandálias reforçadas', description: 'Feitas para as colinas. Velocidade +2.', kind: 'equipment', slot: 'accessory', price: 20, modifiers: { speed: 2 } },
  bread: { id: 'bread', name: 'Pão de cevada', description: 'Recupera 34 pontos de vida. Usável durante a batalha.', kind: 'consumable', price: 8, restoreHp: 34 },
  dates: { id: 'dates', name: 'Tâmaras', description: 'Alimento de viagem. Recupera 9 pontos de vigor.', kind: 'consumable', price: 7, restoreVigor: 9 },
  meal: { id: 'meal', name: 'Provisões de campanha', description: 'Pão, grãos e figos. Recuperam 22 de vida e 8 de vigor.', kind: 'consumable', price: 15, restoreHp: 22, restoreVigor: 8 },
  grain: { id: 'grain', name: 'Saco de grãos', description: 'Alimento preservado para as famílias de Ofra.', kind: 'resource', price: 5 },
  torch: { id: 'torch', name: 'Tocha', description: 'Preparada para a noite, conforme Juízes 7:16.', kind: 'resource', price: 0 },
  trumpet: { id: 'trumpet', name: 'Trombeta', description: 'Sinal para as três companhias.', kind: 'resource', price: 0 },
  jar: { id: 'jar', name: 'Cântaro', description: 'Oculta a luz da tocha até o sinal.', kind: 'resource', price: 0 },
};

export const SHOP_ITEMS = ['bread', 'dates', 'meal', 'bronze_sword', 'spear', 'leather_vest', 'woven_cloak', 'leather_belt', 'sandals'];
