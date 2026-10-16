import { useCallback, useRef, useState } from "react";
import WorldCanvas, { type Tool } from "./components/WorldCanvas";
import PopulationChart, { HISTORY_LENGTH } from "./components/PopulationChart";
import type { Stats } from "./engine/World";

const TOOLS: { id: Tool; label: string }[] = [
  { id: "plant", label: "Tree" },
  { id: "herbivore", label: "Deer" },
  { id: "predator", label: "Leopard" },
];

const SPEEDS = [1, 2, 4];

export default function App() {
  const [tool, setTool] = useState<Tool>("plant");
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [resetCount, setResetCount] = useState(0);
  const [stats, setStats] = useState<Stats>({ plants: 0, herbivores: 0, predators: 0 });
  const [history, setHistory] = useState<Stats[]>([]);
  const lastSample = useRef(0);

  // Called about 4 times per second. We save one sample per second for the graph.
  const handleStats = useCallback((s: Stats) => {
    setStats(s);
    const now = performance.now();
    if (now - lastSample.current >= 1000) {
      lastSample.current = now;
      setHistory((h) => [...h.slice(-(HISTORY_LENGTH - 1)), s]);
    }
  }, []);

  function handleReset() {
    setResetCount((c) => c + 1);
    setHistory([]);
  }

  return (
    <>
      <WorldCanvas
        tool={tool}
        paused={paused}
        speed={speed}
        resetCount={resetCount}
        onStats={handleStats}
      />

      <div className="toolbar">
        {TOOLS.map((t) => (
          <button key={t.id} aria-pressed={tool === t.id} onClick={() => setTool(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="toolbar controls">
        <button aria-pressed={paused} onClick={() => setPaused(!paused)}>
          {paused ? "Play" : "Pause"}
        </button>
        {SPEEDS.map((n) => (
          <button key={n} aria-pressed={speed === n} onClick={() => setSpeed(n)}>
            {n}x
          </button>
        ))}
        <button onClick={handleReset}>Reset</button>
      </div>

      <div className="stats">
        <span>Trees {stats.plants}</span>
        <span>Deer {stats.herbivores}</span>
        <span>Leopards {stats.predators}</span>
      </div>

      <PopulationChart history={history} />
    </>
  );
}