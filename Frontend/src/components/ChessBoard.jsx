import { useMemo } from 'react';

const GLYPH = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export default function ChessBoard({ chess, selected, legalTargets = [], lastMove, hint, onSquareClick, orientation = 'white' }) {
  const board = chess.board();
  const ranks = orientation === 'white' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const files = orientation === 'white' ? FILES : [...FILES].reverse();

  let checkSq = null;
  if (chess.isCheck()) {
    board.forEach((row, r) => row.forEach((p, f) => {
      if (p && p.type === 'k' && p.color === chess.turn()) checkSq = FILES[f] + (8 - r);
    }));
  }

  return (
    <div className="board">
      {ranks.map(rank =>
        files.map(file => {
          const sq = file + rank;
          const fileIdx = FILES.indexOf(file);
          const rankIdx = 8 - rank;
          const piece = board[rankIdx][fileIdx];
          const dark = (fileIdx + rankIdx) % 2 === 1;
          const isTarget = legalTargets.includes(sq);
          const cls = ['sq', dark ? 'd' : 'l',
            selected === sq && 'sel',
            isTarget && (piece ? 'cap' : 'hi'),
            lastMove && (lastMove.from === sq || lastMove.to === sq) && 'lastmove',
            hint && (hint.from === sq || hint.to === sq) && 'hintsq',
            checkSq === sq && 'chk'
          ].filter(Boolean).join(' ');
          return (
            <div key={sq} className={cls} onClick={() => onSquareClick(sq)}>
              {file === files[0] && <span className="coord r">{rank}</span>}
              {rank === ranks[ranks.length - 1] && <span className="coord f">{file}</span>}
              {piece && <span className={piece.color === 'w' ? 'pc-w' : 'pc-b'}>{GLYPH[piece.type]}</span>}
            </div>
          );
        })
      )}
    </div>
  );
}

export { GLYPH };
