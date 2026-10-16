import { useEffect, useRef } from "react";
import { World } from "../engine/World";
import type { AnimalKind } from "../engine/entities";
import { createStars, drawScene } from "./drawScene";
import { drawEntities } from "./drawEntities";

export type Tool = "plant" | AnimalKind;

const DAY_LENGTH_SECONDS = 60;

export default function WorldCanvas({ tool }: { tool: Tool }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toolRef = useRef(tool);

  // Keep the newest selected tool where the click handler can read it
  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const world = new World();
    const stars = createStars();
    let width = 0;
    let height = 0;
    let frameId = 0;
    let lastNow = 0;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      world.setSize(width, height);
    }

    function onClick(e: MouseEvent) {
      const t = toolRef.current;
      if (t === "plant") world.addPlant(e.clientX, e.clientY);
      else world.addAnimal(t, e.clientX, e.clientY);
    }

    function draw(now: number) {
      const dt = Math.min((now - lastNow) / 1000, 0.05); // cap big jumps
      lastNow = now;
      const time = (now / 1000 / DAY_LENGTH_SECONDS + 0.3) % 1;

      world.update(dt);
      drawScene(ctx, width, height, time, stars);
      drawEntities(ctx, world, now / 1000);

      frameId = requestAnimationFrame(draw);
    }

    resize();

    // Start the forest with a few residents
    for (let i = 0; i < 8; i++) {
      const p = world.randomSpot();
      world.addPlant(p.x, p.y, 1);
    }
    for (let i = 0; i < 4; i++) {
      const p = world.randomSpot();
      world.addAnimal("herbivore", p.x, p.y);
    }
    const leopard = world.randomSpot();
    world.addAnimal("predator", leopard.x, leopard.y);

    window.addEventListener("resize", resize);
    canvas.addEventListener("click", onClick);
    frameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("click", onClick);
    };
  }, []);

  return <canvas ref={canvasRef} />;
}