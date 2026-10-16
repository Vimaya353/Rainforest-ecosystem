import { useState } from "react";
import WorldCanvas, { type Tool } from "./components/WorldCanvas";
import type { Stats } from "./engine/World";

const TOOLS: { id: Tool; label: string }[] = [
  { id: "plant", label: "Tree" },
  { id: "herbivore", label: "Deer" },
  { id: "predator", label: "Leopard" },
];

export default function App() {
  const [tool, setTool] = useState<Tool>("plant");
  const [stats, setStats] = useState<Stats>({ plants: 0, herbivores: 0, predators: 0 });

  return (
    <>
      <WorldCanvas tool={tool} onStats={setStats} />
      <div className="toolbar">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            aria-pressed={tool === t.id}
            onClick={() => setTool(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="stats">
        <span>Trees {stats.plants}</span>
        <span>Deer {stats.herbivores}</span>
        <span>Leopards {stats.predators}</span>
      </div>
    </>
  );
}