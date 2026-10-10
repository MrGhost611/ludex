export const PIPS = {
  0: [], 1: [4], 2: [2, 6], 3: [2, 4, 6], 4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8]
};

function Half({ n }) {
  const pips = PIPS[n] || [];
  return (
    <div className="h">
      {Array.from({ length: 9 }, (_, i) => <b key={i} className={pips.includes(i) ? 'p' : ''} />)}
    </div>
  );
}

export function DominoTile({ a, b, disabled, selected, onClick, back, small, end }) {
  const cls = ['tile', back && 'back', small && 'small', end && 'end', disabled && 'disabled', selected && 'selected'].filter(Boolean).join(' ');
  if (back) return <span className={cls} />;
  return (
    <span className={cls} onClick={disabled ? undefined : onClick} title={disabled ? 'No encaja en ningún extremo' : `Ficha ${a}|${b} (suma ${a + b})`}>
      <Half n={a} /><Half n={b} />
    </span>
  );
}
