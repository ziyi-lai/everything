/** Renders a bitmap (rows of "0"/"1" strings) as a small dot-matrix grid —
 * Nothing Glyph Matrix style: a tight grid of round dots forming a pixel-art
 * icon, lit dots at full opacity, unlit dots invisible against the button's
 * own dark circle. Lit dots idle-twinkle by default, staggered diagonally
 * so the glyph reads as a scan wave rather than a flat pictogram. */
export function DotGlyph({
  rows,
  dot = 2.25,
  gap = 0.75,
  animate = true,
}: {
  rows: string[];
  dot?: number;
  gap?: number;
  animate?: boolean;
}) {
  const cols = rows[0]?.length ?? 0;
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${cols}, ${dot}px)`,
        gridTemplateRows: `repeat(${rows.length}, ${dot}px)`,
        gap,
      }}
    >
      {rows.flatMap((row, r) =>
        [...row].map((cell, c) => (
          <span
            key={`${r}-${c}`}
            className={`rounded-full bg-current ${animate && cell === "1" ? "dot-glyph-pulse" : ""}`}
            style={{
              width: dot,
              height: dot,
              opacity: cell === "1" ? 1 : 0,
              animationDelay: animate ? `${(r + c) * 90}ms` : undefined,
            }}
          />
        ))
      )}
    </div>
  );
}

export const MOOD_GLYPH = [
  "000000000",
  "000000000",
  "011000110",
  "011000110",
  "000000000",
  "010000010",
  "001111100",
  "000000000",
  "000000000",
];

export const DIM_GLYPH = [
  "000000000",
  "000000000",
  "000000100",
  "000000100",
  "000010100",
  "000010100",
  "001010100",
  "001010100",
  "001010100",
];

export const TIMER_GLYPH = [
  "001111100",
  "010001010",
  "100010001",
  "100010001",
  "100010001",
  "100000001",
  "100000001",
  "010000010",
  "001111100",
];
