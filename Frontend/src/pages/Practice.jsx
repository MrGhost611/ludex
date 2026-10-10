import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import ChessGame from './ChessGame';
import DominoGame from './DominoGame';

export default function Practice() {
  const { levelId } = useParams();
  const [level, setLevel] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setLevel(null);
    api.level(levelId).then(r => setLevel(r.level)).catch(e => setError(e.message));
  }, [levelId]);

  if (error) return <div className="page"><div className="error-box">{error}</div></div>;
  if (!level) return <div className="loading">Cargando práctica…</div>;

  return level.game_id === 'chess'
    ? <ChessGame key={level.id} level={level} />
    : <DominoGame key={level.id} level={level} />;
}
