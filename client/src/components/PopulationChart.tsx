import type { Stats } from "../engine/World";

export const HISTORY_LENGTH = 90; // how many samples the graph holds

const W = 240;
const H = 90;

const SERIES = [
  { key: "plants", color: "#5fd38d", label: "Trees" },
  { key: "herbivores", color: "#ff9f7a", label: "Deer" },
  { key: "predators", color: "#f2b134", label: "Leopards" },
] as const;

export default function PopulationChart({ history }: { history: Stats[] }) {
  // The tallest value sets the scale. The minimum of 10 stops tiny numbers from filling the whole graph.
  const max = Math.max(
    10,
    ...history.flatMap((s) => [s.plants, s.herbivores, s.predators])
  );

  // Turn a list of numbers into "x,y x,y x,y" points for an SVG line.
  // The newest sample sits at the right edge, so the graph scrolls left over time.
  function linePoints(key: (typeof SERIES)[number]["key"]) {
    return history
      .map((s, i) => {
        const x = W - ((history.length - 1 - i) / (HISTORY_LENGTH - 1)) * W;
        const y = H - (s[key] / max) * H;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }

  return (
    <div className="chart">
      <div className="legend">
        {SERIES.map((s) => (
          <span key={s.key}>
            <i style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <svg width={W} height={H} role="img" aria-label="Population over time">
        {SERIES.map((s) => (
          <polyline
            key={s.key}
            points={linePoints(s.key)}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ))}
      </svg>
    </div>
  );
}