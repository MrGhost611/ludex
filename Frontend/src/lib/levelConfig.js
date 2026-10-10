// Configuración pedagógica por nivel (bot, misión, ayudas)
export const CHESS_LEVELS = {
  'chess-1': { bot: 1, mission: { label: 'Mueve un peón y una torre', kind: 'pieces', pieces: ['p', 'r'] } },
  'chess-2': { bot: 1, mission: { label: 'Mueve el caballo 3 veces', kind: 'piece', piece: 'n', need: 3 } },
  'chess-3': { bot: 2, mission: { label: 'Mueve el alfil 3 veces', kind: 'piece', piece: 'b', need: 3 } },
  'chess-4': { bot: 2, mission: { label: 'Captura 1 pieza con la dama', kind: 'capPiece', piece: 'q', need: 1 } },
  'chess-5': { bot: 3, mission: { label: 'Da jaque al rey negro 1 vez', kind: 'check', need: 1 } },
  'chess-6': { bot: 4, mission: { label: 'Captura 3 piezas y gana material', kind: 'captures', need: 3 } }
};
export const BOT_NAMES = { 1: 'Fácil', 2: 'Medio', 3: 'Difícil', 4: 'Experto' };

export function missionProgress(m, hist) {
  const mine = hist.filter(h => h.color === 'w');
  if (!m) return { have: 0, need: 1 };
  switch (m.kind) {
    case 'pieces': return { have: m.pieces.filter(p => mine.some(h => h.piece === p)).length, need: m.pieces.length };
    case 'piece': return { have: mine.filter(h => h.piece === m.piece).length, need: m.need };
    case 'capPiece': return { have: mine.filter(h => h.piece === m.piece && h.captured).length, need: m.need };
    case 'check': return { have: mine.filter(h => /[+#]/.test(h.san)).length, need: m.need };
    case 'captures': return { have: mine.filter(h => h.captured).length, need: m.need };
    default: return { have: 0, need: 1 };
  }
}

export const DOMINO_LEVELS = {
  'domino-1': { bot: 1, probs: false },
  'domino-2': { bot: 2, probs: false },
  'domino-3': { bot: 3, probs: true },
  'domino-4': { bot: 3, probs: true, expert: true }
};
