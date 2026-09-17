// The wordmark is a 5x7 pixel grid per letter, drawn as SVG rects so it stays crisp at any size.
const GLYPHS: Record<string, string[]> = {
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
};

const PX = 4;
const GAP = 0.6;
const LETTER_GAP = 2;

export function Logo({ text = 'ONB', className }: { text?: string; className?: string }) {
  const letters = text.split('').filter((ch) => GLYPHS[ch]);
  const width = letters.length * (5 * PX + LETTER_GAP) - LETTER_GAP;
  const height = 7 * PX;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width * 1.15}
      height={height * 1.15}
      role="img"
      aria-label={text}
      className={className}
    >
      {letters.map((ch, li) =>
        GLYPHS[ch]!.map((row, y) =>
          row
            .split('')
            .map((cell, x) =>
              cell === '#' ? (
                <rect
                  key={`${li}-${y}-${x}`}
                  x={li * (5 * PX + LETTER_GAP) + x * PX + GAP / 2}
                  y={y * PX + GAP / 2}
                  width={PX - GAP}
                  height={PX - GAP}
                  rx={0.4}
                  fill="currentColor"
                />
              ) : null,
            ),
        ),
      )}
    </svg>
  );
}
