export const sum = t => t.a + t.b;
export function fullSet() {
  const s = [];
  for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) s.push({ a, b });
  return s;
}
export function shuffle(arr) {
  const x = [...arr];
  for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; }
  return x;
}
export const ends = table => (table.length ? [table[0].a, table[table.length - 1].b] : [null, null]);
export function sidesFor(tile, table) {
  if (!table.length) return ['right'];
  const [l, r] = ends(table);
  const s = [];
  if (tile.a === l || tile.b === l) s.push('left');
  if (tile.a === r || tile.b === r) s.push('right');
  return s;
}
export function place(table, tile, side) {
  if (!table.length) return [tile];
  const [l, r] = ends(table);
  if (side === 'right') return [...table, tile.a === r ? tile : { a: tile.b, b: tile.a }];
  return [tile.b === l ? tile : { a: tile.b, b: tile.a }, ...table];
}
export const same = (x, y) => x.a === y.a && x.b === y.b;

// Elige la jugada del bot. level 1 = al azar, 2 = la de más puntos, 3 = estratégica
export function botChoose(hand, table, level, playerMissing) {
  const opts = [];
  hand.forEach((t, i) => sidesFor(t, table).forEach(side => opts.push({ i, side, t })));
  if (!opts.length) return null;
  if (level <= 1) return opts[Math.floor(Math.random() * opts.length)];
  if (level === 2) return opts.sort((x, y) => sum(y.t) - sum(x.t))[0];
  let best = null, bestScore = -Infinity;
  for (const o of opts) {
    const nt = place(table, o.t, o.side);
    const [l, r] = ends(nt);
    const rest = hand.filter((_, k) => k !== o.i);
    let score = sum(o.t) * 0.6 + (o.t.a === o.t.b ? 2 : 0);
    [l, r].forEach(e => {
      score += rest.filter(t => t.a === e || t.b === e).length * 1.5;
      if (playerMissing.has(e)) score += 4;
    });
    if (score > bestScore) { bestScore = score; best = o; }
  }
  return best;
}

export function newDeal() {
  const d = shuffle(fullSet());
  const player = d.slice(0, 7), bot = d.slice(7, 14), yard = d.slice(14);
  // Empieza quien tenga el doble más alto; si nadie tiene dobles, la ficha de mayor suma
  const all = [...player.map(t => ({ t, who: 'p' })), ...bot.map(t => ({ t, who: 'b' }))];
  const dbls = all.filter(x => x.t.a === x.t.b).sort((x, y) => y.t.a - x.t.a);
  const starter = dbls.length ? dbls[0] : all.sort((x, y) => sum(y.t) - sum(x.t))[0];
  return { player, bot, yard, starter };
}

export function makeQuestion(table, hand) {
  const [l, r] = ends(table);
  const mk = (text, ans) => {
    const opts = new Set([ans]);
    while (opts.size < 4) { const v = ans + Math.floor(Math.random() * 7) - 3; if (v >= 0 && v !== ans) opts.add(v); }
    return { text, answer: ans, options: shuffle([...opts]) };
  };
  const kind = Math.floor(Math.random() * 3);
  if (kind === 0) return mk(`Los extremos de la mesa son ${l} y ${r}. ¿Cuánto suman?`, l + r);
  if (kind === 1 && hand.length) return mk(`Suma los puntos de todas tus fichas (${hand.map(t => `[${t.a}|${t.b}]`).join(' ')}). ¿Cuánto da?`, hand.reduce((s, t) => s + sum(t), 0));
  return mk(`Cada jugador empieza con 7 fichas y el dominó tiene 28. ¿Cuántas fichas quedan en el pozo al empezar?`, 14);
}
