import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Chess } from 'chess.js';
import { api } from '../api';
import ChessBoard, { GLYPH } from '../components/ChessBoard';
import { pickMove, materialOf, PIECE_VALUE } from '../lib/chessAI';
import { CHESS_LEVELS, BOT_NAMES, missionProgress } from '../lib/levelConfig';

const PROMO = [['q', 'Dama'], ['r', 'Torre'], ['b', 'Alfil'], ['n', 'Caballo']];

export default function ChessGame({ level }) {
  const cfg = CHESS_LEVELS[level.id] || { bot: 2, mission: null };
  const gameRef = useRef(new Chess());
  const timer = useRef(null);
  const [, setTick] = useState(0);
  const [botLevel, setBotLevel] = useState(cfg.bot);
  const [selected, setSelected] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [hint, setHint] = useState(null);
  const [promo, setPromo] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [msg, setMsg] = useState('Tu turno: juegas con las piezas blancas.');
  const [hintsUsed, setHintsUsed] = useState(0);
  const navigate = useNavigate();
  const game = gameRef.current;
  const refresh = () => setTick(t => t + 1);

  useEffect(() => () => clearTimeout(timer.current), []);

  const hist = game.history({ verbose: true });
  const over = game.isGameOver();
  const prog = missionProgress(cfg.mission, hist);
  const missionDone = prog.have >= prog.need;
  const mat = materialOf(game);
  const capturedByW = hist.filter(h => h.color === 'w' && h.captured).map(h => h.captured);
  const capturedByB = hist.filter(h => h.color === 'b' && h.captured).map(h => h.captured);

  function statusAfter(who) {
    if (game.isCheckmate()) return who === 'w' ? '¡Jaque mate! Ganaste la partida. 🎉' : 'Jaque mate: ganaron las negras. Revisa qué pudiste hacer distinto e inténtalo de nuevo.';
    if (game.isStalemate()) return 'Tablas por rey ahogado: el jugador que mueve no tiene jugadas legales, pero no está en jaque.';
    if (game.isInsufficientMaterial()) return 'Tablas: no hay material suficiente para dar mate.';
    if (game.isDraw()) return 'Tablas.';
    if (who === 'b') return game.isCheck() ? '⚠️ Estás en jaque: protege a tu rey.' : 'Tu turno.';
    return game.isCheck() ? 'Diste jaque. El bot responde…' : 'Buena jugada. El bot piensa…';
  }

  function scheduleBot() {
    if (game.isGameOver()) return;
    setThinking(true);
    timer.current = setTimeout(() => {
      const m = pickMove(game, botLevel);
      if (m) {
        game.move({ from: m.from, to: m.to, promotion: m.promotion });
        setLastMove({ from: m.from, to: m.to });
      }
      setThinking(false);
      setMsg(statusAfter('b'));
      refresh();
    }, 450);
  }

  function doMove(from, to, promotion) {
    try {
      game.move({ from, to, promotion });
    } catch (e) { return; }
    setLastMove({ from, to });
    setSelected(null);
    setHint(null);
    setPromo(null);
    setMsg(statusAfter('w'));
    refresh();
    scheduleBot();
  }

  function onSquareClick(sq) {
    if (over || thinking || promo || game.turn() !== 'w') return;
    const piece = game.get(sq);
    if (selected) {
      const mv = game.moves({ square: selected, verbose: true }).filter(m => m.to === sq);
      if (mv.length) {
        if (mv[0].promotion) { setPromo({ from: selected, to: sq }); return; }
        doMove(selected, sq);
        return;
      }
    }
    if (piece && piece.color === 'w' && sq !== selected) setSelected(sq);
    else setSelected(null);
  }

  function newGame(level2 = botLevel) {
    clearTimeout(timer.current);
    gameRef.current = new Chess();
    setBotLevel(level2); setSelected(null); setLastMove(null); setHint(null); setPromo(null); setThinking(false);
    setMsg('Nueva partida. Tu turno: juegas con las blancas.');
    setTick(t => t + 1);
  }

  function undo() {
    if (thinking || !hist.length) return;
    clearTimeout(timer.current);
    game.undo();
    if (game.turn() === 'b') game.undo();
    setSelected(null); setLastMove(null); setHint(null);
    setMsg('Movimiento deshecho. Tu turno.');
    refresh();
  }

  function giveHint() {
    if (over || thinking || game.turn() !== 'w') return;
    const m = pickMove(game, 3);
    if (m) { setHint({ from: m.from, to: m.to }); setHintsUsed(h => h + 1); }
  }

  async function finish() {
    await api.advanceStage(level.id).catch(() => {});
    navigate(`/nivel/${level.id}/reto`);
  }

  const targets = selected ? game.moves({ square: selected, verbose: true }).map(m => m.to) : [];
  const pairs = [];
  hist.forEach((h, i) => { if (i % 2 === 0) pairs.push([h.san]); else pairs[pairs.length - 1].push(h.san); });
  const diff = mat.w - mat.b;

  return (
    <>
      <div className="crumb">Ajedrez › {level.title} › <b>Practica</b></div>
      <div className="page">
        <div className="chess-wrap">
          <div style={{ flex: '1 1 340px', maxWidth: 480 }}>
            <ChessBoard chess={game} selected={selected} legalTargets={targets} lastMove={lastMove} hint={hint} onSquareClick={onSquareClick} />
            {promo && (
              <div className="card" style={{ marginTop: 12 }}>
                <b>¡Coronación! Elige tu nueva pieza:</b>
                <div className="btns">
                  {PROMO.map(([p, n]) => <button key={p} className="btn warn" onClick={() => doMove(promo.from, promo.to, p)}>{GLYPH[p]} {n}</button>)}
                </div>
              </div>
            )}
          </div>

          <div style={{ flex: '1 1 260px', minWidth: 240 }}>
            <div className="card" style={{ borderColor: over ? 'var(--yellow)' : undefined }}>
              <b>{over ? 'Partida terminada' : thinking ? 'Pensando el bot…' : 'Tu turno (blancas)'}</b>
              <p style={{ margin: '8px 0 0' }}>{msg}</p>
            </div>

            {cfg.mission && (
              <div className="card" style={{ borderColor: missionDone ? 'var(--teal)' : undefined }}>
                <span className={'tag' + (missionDone ? ' teal' : '')}>{missionDone ? '✔ Misión cumplida' : 'Misión'}</span>
                <p style={{ margin: '8px 0 6px' }}>{cfg.mission.label} <b>({Math.min(prog.have, prog.need)}/{prog.need})</b></p>
                <div className="bar"><i style={{ width: `${Math.min(100, (prog.have / prog.need) * 100)}%` }} /></div>
              </div>
            )}

            <div className="card">
              <span className="tag teal">Matemáticas del tablero</span>
              <p style={{ margin: '8px 0 4px', fontSize: 14 }}>
                Material blancas: <b>{mat.w}</b> · negras: <b>{mat.b}</b>
                {' '}→ {diff === 0 ? 'van iguales' : diff > 0 ? `ganas por ${diff}` : `pierdes por ${-diff}`}
              </p>
              <small style={{ color: 'var(--muted)' }}>
                Valores: ♟1 ♞3 ♝3 ♜5 ♛9
              </small>
              <div className="captured">
                <span>Capturaste: {capturedByW.length ? capturedByW.map((p, i) => <i key={i} className="pc-b">{GLYPH[p]}</i>) : '—'} {capturedByW.length > 0 && <b>(+{capturedByW.reduce((s, p) => s + PIECE_VALUE[p], 0)})</b>}</span>
                <span>Te capturaron: {capturedByB.length ? capturedByB.map((p, i) => <i key={i} className="pc-w">{GLYPH[p]}</i>) : '—'} {capturedByB.length > 0 && <b>(+{capturedByB.reduce((s, p) => s + PIECE_VALUE[p], 0)})</b>}</span>
              </div>
            </div>

            <div className="card">
              <label style={{ marginTop: 0 }}>Dificultad del bot</label>
              <select value={botLevel} onChange={e => newGame(Number(e.target.value))}>
                {Object.entries(BOT_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              {pairs.length > 0 && (
                <div className="moves">
                  {pairs.map((p, i) => <span key={i}><b>{i + 1}.</b> {p[0]} {p[1] || ''}</span>)}
                </div>
              )}
            </div>

            <div className="card" style={{ borderColor: 'var(--teal)' }}>
              <span className="tag teal">Recuerda</span>
              <p style={{ margin: '8px 0 0' }}>{level.math_connection}</p>
            </div>

            <div className="btns">
              <button className="btn" onClick={giveHint} disabled={over || thinking}>💡 Pista</button>
              <button className="btn" onClick={undo} disabled={thinking || !hist.length}>↩ Deshacer</button>
              <button className="btn ghost" onClick={() => newGame()}>Nueva partida</button>
            </div>
            <div className="btns">
              <Link className="btn ghost" to="/">Volver al mapa</Link>
              <button className="btn primary" disabled={!(missionDone || over)} onClick={finish}>
                {missionDone || over ? 'Ir al reto' : 'Cumple la misión para continuar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
