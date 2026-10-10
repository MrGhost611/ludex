// Bot de ajedrez de LUDEX: 4 niveles de dificultad (1 = fácil ... 4 = difícil)
export const PIECE_VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const CP = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

function evalSide(game) {
  let s = 0;
  for (const row of game.board()) for (const p of row) if (p) s += (p.color === 'w' ? 1 : -1) * CP[p.type];
  return game.turn() === 'w' ? s : -s;
}

function ordered(game) {
  const m = game.moves({ verbose: true });
  return m.sort((x, y) => (y.captured ? CP[y.captured] : 0) - (x.captured ? CP[x.captured] : 0));
}

function negamax(game, depth, alpha, beta) {
  if (game.isCheckmate()) return -100000 - depth;
  if (game.isDraw()) return 0;
  if (depth === 0) return evalSide(game);
  let best = -Infinity;
  for (const m of ordered(game)) {
    game.move({ from: m.from, to: m.to, promotion: m.promotion });
    const sc = -negamax(game, depth - 1, -beta, -alpha);
    game.undo();
    if (sc > best) best = sc;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

const DEPTH = { 2: 1, 3: 2, 4: 3 };

export function pickMove(game, level = 2) {
  const moves = ordered(game);
  if (!moves.length) return null;
  if (level <= 1) {
    for (const m of moves) { // si puede dar mate en 1, lo da (para que la partida termine)
      game.move({ from: m.from, to: m.to, promotion: m.promotion });
      const mate = game.isCheckmate();
      game.undo();
      if (mate) return m;
    }
    const caps = moves.filter(m => m.captured);
    if (caps.length && Math.random() < 0.4) return caps[Math.floor(Math.random() * caps.length)];
    return moves[Math.floor(Math.random() * moves.length)];
  }
  const depth = DEPTH[Math.min(level, 4)];
  let best = -Infinity, bestMoves = [];
  for (const m of moves) {
    game.move({ from: m.from, to: m.to, promotion: m.promotion });
    const sc = -negamax(game, depth - 1, -Infinity, Infinity) + Math.random() * 6;
    game.undo();
    if (sc > best + 0.0001) { best = sc; bestMoves = [m]; } else if (Math.abs(sc - best) < 0.0001) bestMoves.push(m);
  }
  return bestMoves[0] || moves[0];
}

export function materialOf(game) {
  const t = { w: 0, b: 0 };
  for (const row of game.board()) for (const p of row) if (p) t[p.color] += PIECE_VALUE[p.type];
  return t;
}
