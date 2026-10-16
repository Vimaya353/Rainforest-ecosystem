import { useState } from "react";
import WorldCanvas, { type Tool } from "./components/WorldCanvas";

const TOOLS: { id: Tool; label: string }[] = [
  { id: "plant", label: "Tree" },
  { id: "herbivore", label: "Deer" },
  { id: "predator", label: "Leopard" },
];

export default function App() {
  const [tool, setTool] = useState<Tool>("plant");

  return (
    <>
      <WorldCanvas tool={tool} />
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
    </>
  );
}