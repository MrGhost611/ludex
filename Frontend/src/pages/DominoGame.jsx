import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { DominoTile } from '../components/DominoTile';
import { DOMINO_LEVELS, BOT_NAMES } from '../lib/levelConfig';
import { ends, sidesFor, place, same, sum, botChoose, newDeal, makeQuestion } from '../lib/domino';

const pts = hand => hand.reduce((s, t) => s + sum(t), 0);

function evaluate(s) {
  if (s.player.length === 0) return { winner: 'p', reason: '¡Te quedaste sin fichas!' };
  if (s.bot.length === 0) return { winner: 'b', reason: 'El bot se quedó sin fichas.' };
  if (s.passes >= 2) {
    const p = pts(s.player), b = pts(s.bot);
    const reason = `Juego trancado: nadie puede jugar. Gana quien tenga menos puntos. Tú: ${s.player.map(sum).join(' + ') || 0} = ${p}. Bot: ${s.bot.map(sum).join(' + ') || 0} = ${b}.`;
    return { winner: p < b ? 'p' : b < p ? 'b' : 'tie', reason };
  }
  return null;
}

function init() {
  const d = newDeal();
  const { t, who } = { t: d.starter.t, who: d.starter.who };
  const player = who === 'p' ? d.player.filter(x => !same(x, t)) : d.player;
  const bot = who === 'b' ? d.bot.filter(x => !same(x, t)) : d.bot;
  return {
    table: [t], player, bot, yard: d.yard, turn: who === 'p' ? 'b' : 'p', passes: 0, over: null, played: 0, missing: [],
    msg: who === 'p'
      ? `Tenías la ficha más alta y empezaste con [${t.a}|${t.b}]. Ahora juega el bot.`
      : `El bot empezó con [${t.a}|${t.b}]. ¡Es tu turno!`
  };
}

export default function DominoGame({ level }) {
  const cfg = DOMINO_LEVELS[level.id] || { bot: 2, probs: false };
  const [g, setG] = useState(init);
  const [sel, setSel] = useState(null);
  const [q, setQ] = useState(null);
  const [qRes, setQRes] = useState(null);
  const [stars, setStars] = useState(0);
  const navigate = useNavigate();

  const [l, r] = ends(g.table);
  const stuck = g.turn === 'p' && !g.over && !g.player.some(t => sidesFor(t, g.table).length);

  // Turno del bot
  useEffect(() => {
    if (g.turn !== 'b' || g.over) return;
    const id = setTimeout(() => setG(prev => {
      if (prev.turn !== 'b' || prev.over) return prev;
      let { bot, yard, table } = prev;
      let drew = 0;
      let c = botChoose(bot, table, cfg.bot, new Set(prev.missing));
      while (!c && yard.length) { bot = [...bot, yard[0]]; yard = yard.slice(1); drew++; c = botChoose(bot, table, cfg.bot, new Set(prev.missing)); }
      let next;
      if (c) {
        const tile = bot[c.i];
        next = { ...prev, bot: bot.filter((_, k) => k !== c.i), yard, table: place(table, tile, c.side), passes: 0, turn: 'p',
          msg: `${drew ? `El bot robó ${drew} ficha(s). ` : ''}El bot jugó [${tile.a}|${tile.b}]. Tu turno.` };
      } else {
        next = { ...prev, bot, yard, passes: prev.passes + 1, turn: 'p', msg: `El bot robó ${drew} ficha(s) y aun así no puede jugar: pasa el turno.` };
      }
      return { ...next, over: evaluate(next) };
    }), 900);
    return () => clearTimeout(id);
  }, [g.turn, g.over, g.table.length, g.bot.length]); // eslint-disable-line

  function play(i, side) {
    setSel(null); setQ(null); setQRes(null);
    setG(prev => {
      const tile = prev.player[i];
      const next = { ...prev, table: place(prev.table, tile, side), player: prev.player.filter((_, k) => k !== i), passes: 0, turn: 'b', played: prev.played + 1,
        msg: `Jugaste [${tile.a}|${tile.b}]. Suma de sus puntos: ${tile.a} + ${tile.b} = ${tile.a + tile.b}.` };
      return { ...next, over: evaluate(next) };
    });
  }

  function clickTile(i) {
    if (g.turn !== 'p' || g.over) return;
    const sides = sidesFor(g.player[i], g.table);
    if (!sides.length) return;
    if (sides.length === 1) play(i, sides[0]); else setSel(i);
  }

  function draw() {
    setG(prev => prev.yard.length ? ({ ...prev, player: [...prev.player, prev.yard[0]], yard: prev.yard.slice(1),
      missing: [...prev.missing, ...ends(prev.table)],
      msg: `Robaste la ficha [${prev.yard[0].a}|${prev.yard[0].b}] del pozo.` }) : prev);
  }

  function pass() {
    setQ(null); setQRes(null);
    setG(prev => {
      const next = { ...prev, passes: prev.passes + 1, turn: 'b', missing: [...prev.missing, ...ends(prev.table)], msg: 'Pasaste el turno.' };
      return { ...next, over: evaluate(next) };
    });
  }

  function ask() { setQ(makeQuestion(g.table, g.player)); setQRes(null); }
  function answer(v) {
    if (qRes) return;
    const ok = v === q.answer;
    setQRes({ ok, v });
    if (ok) setStars(s => s + 1);
  }

  function restart() { setG(init()); setSel(null); setQ(null); setQRes(null); }

  async function finish() {
    await api.advanceStage(level.id).catch(() => {});
    navigate(`/nivel/${level.id}/reto`);
  }

  // Probabilidad (niveles 3 y 4): fichas con cada número que aún no vemos
  const seen = n => [...g.table, ...g.player].filter(t => t.a === n || t.b === n).length;
  const hiddenTotal = g.bot.length + g.yard.length;
  const canFinish = g.over || g.played >= 4;
  const winnerText = g.over && (g.over.winner === 'p' ? '🎉 ¡Ganaste!' : g.over.winner === 'b' ? 'Ganó el bot. ¡Revancha!' : 'Empate');

  return (
    <>
      <div className="crumb">Dominó › {level.title} › <b>Practica</b></div>
      <div className="page">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span className="tag">Bot {BOT_NAMES[cfg.bot] || ''}</span>
            <small style={{ color: 'var(--muted)' }}>Pozo: <b>{g.yard.length}</b> fichas · Bot: <b>{g.bot.length}</b> fichas · ⭐ {stars}</small>
          </div>
          <div className="hand" style={{ marginBottom: 10 }}>
            {g.bot.map((_, i) => <DominoTile key={i} back small />)}
            {g.bot.length === 0 && <small>El bot no tiene fichas</small>}
          </div>
          <div className="table-surface">
            {g.table.map((t, i) => <DominoTile key={i} a={t.a} b={t.b} end={i === 0 || i === g.table.length - 1} />)}
          </div>
          <small style={{ color: 'var(--muted)' }}>Extremos abiertos: <b>{l}</b> (izquierda) y <b>{r}</b> (derecha)</small>
        </div>

        <div className="card" style={{ borderColor: g.turn === 'p' && !g.over ? 'var(--teal)' : undefined }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span className="tag teal">{g.over ? 'Fin de la partida' : g.turn === 'p' ? 'Tu turno' : 'Turno del bot…'}</span>
            <small style={{ color: 'var(--muted)' }}>Puntos en tu mano: <b>{pts(g.player)}</b></small>
          </div>
          <div className="hand">
            {g.player.map((t, i) => (
              <DominoTile key={i} a={t.a} b={t.b} selected={sel === i}
                disabled={g.turn !== 'p' || !!g.over || !sidesFor(t, g.table).length}
                onClick={() => clickTile(i)} />
            ))}
          </div>
          {sel !== null && g.player[sel] && (
            <div className="btns">
              <span style={{ alignSelf: 'center', fontSize: 14 }}>Esta ficha encaja en los dos lados. ¿Dónde la pones?</span>
              <button className="btn primary" onClick={() => play(sel, 'left')}>◀ Izquierda ({l})</button>
              <button className="btn primary" onClick={() => play(sel, 'right')}>Derecha ({r}) ▶</button>
            </div>
          )}
        </div>

        {stuck && (
          <div className="card" style={{ borderColor: 'var(--yellow)', background: '#FFFBEC' }}>
            <b>No tienes ninguna ficha que encaje con {l} ni con {r}.</b>
            {g.yard.length > 0 ? (
              <>
                <p style={{ margin: '6px 0 0' }}>Debes robar una ficha del pozo hasta que encuentres una que sirva.</p>
                <div className="btns"><button className="btn warn" onClick={draw}>🂠 Robar ficha del pozo ({g.yard.length})</button></div>
              </>
            ) : (
              <>
                <p style={{ margin: '6px 0 0' }}>El pozo está vacío. Puedes <b>pasar el turno</b> o <b>responder una pregunta</b> de práctica antes de pasar (⭐ de bonus).</p>
                <div className="btns">
                  <button className="btn warn" onClick={pass}>⏭ Pasar turno</button>
                  <button className="btn" onClick={ask}>❓ Responder una pregunta</button>
                </div>
                {q && (
                  <div style={{ marginTop: 12 }}>
                    <b>{q.text}</b>
                    <div className="opts">
                      {q.options.map(o => (
                        <button key={o} className={`opt${qRes && o === q.answer ? ' correct' : ''}${qRes && qRes.v === o && !qRes.ok ? ' wrong' : ''}`} disabled={!!qRes} onClick={() => answer(o)}>{o}</button>
                      ))}
                    </div>
                    {qRes && <div className="hint-box">{qRes.ok ? '¡Correcto! Ganaste una ⭐. Ahora pasa el turno.' : `Casi. La respuesta era ${q.answer}. Ahora pasa el turno.`}</div>}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="card" style={{ borderColor: 'var(--teal)' }}>{g.msg}</div>

        {g.over && (
          <div className="card" style={{ borderColor: 'var(--yellow)' }}>
            <h3>{winnerText}</h3>
            <p style={{ margin: 0 }}>{g.over.reason}</p>
            <p style={{ margin: '6px 0 0' }}>Puntos que te quedaron: <b>{pts(g.player)}</b> · Puntos del bot: <b>{pts(g.bot)}</b></p>
          </div>
        )}

        {cfg.probs && (
          <div className="card">
            <span className="tag">Probabilidad</span>
            <p style={{ margin: '8px 0', fontSize: 14 }}>
              Cada número está en 7 fichas. Restando las que ves (mesa + tu mano) sabes cuántas siguen ocultas ({hiddenTotal} fichas ocultas en total).
            </p>
            <div className="badges">
              {[0, 1, 2, 3, 4, 5, 6].map(n => (
                <div className="badge" key={n} style={{ minWidth: 70 }}><span className="g">{n}</span>{7 - seen(n)} ocultas</div>
              ))}
            </div>
            {hiddenTotal > 0 && (
              <p style={{ margin: '10px 0 0', fontSize: 14 }}>
                Probabilidad de que una ficha oculta tenga un <b>{l}</b>: {7 - seen(l)}/{hiddenTotal} ≈ {Math.round(((7 - seen(l)) / hiddenTotal) * 100)}%
              </p>
            )}
          </div>
        )}

        <div className="card" style={{ borderColor: 'var(--teal)' }}>
          <span className="tag teal">Recuerda</span>
          <p style={{ margin: '8px 0 0' }}>{level.math_connection}</p>
        </div>

        <div className="btns">
          <Link className="btn ghost" to="/">Volver al mapa</Link>
          <button className="btn ghost" onClick={restart}>Nueva partida</button>
          <button className="btn primary" disabled={!canFinish} onClick={finish}>
            {canFinish ? 'Ir al reto' : `Juega al menos 4 fichas (${g.played}/4) o termina la partida`}
          </button>
        </div>
      </div>
    </>
  );
}
