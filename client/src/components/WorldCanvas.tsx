import { useEffect, useRef } from "react";
import { World, type Stats } from "../engine/World";
import type { AnimalKind } from "../engine/entities";
import { createStars, drawScene } from "./drawScene";
import { drawEntities } from "./drawEntities";

export type Tool = "plant" | AnimalKind;

const DAY_LENGTH_SECONDS = 60;

interface Props {
  tool: Tool;
  onStats: (stats: Stats) => void;
}

export default function WorldCanvas({ tool, onStats }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toolRef = useRef(tool);
  const onStatsRef = useRef(onStats);

  // Keep the newest values where the animation loop can read them
  useEffect(() => {
    toolRef.current = tool;
    onStatsRef.current = onStats;
  }, [tool, onStats]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const world = new World();
    const stars = createStars();
    let width = 0;
    let height = 0;
    let frameId = 0;
    let lastNow = 0;
    let statsTimer = 0;

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
      const dt = Math.min((now - lastNow) / 1000, 0.05);
      lastNow = now;
      const time = (now / 1000 / DAY_LENGTH_SECONDS + 0.3) % 1;

      world.update(dt);
      drawScene(ctx, width, height, time, stars);
      drawEntities(ctx, world, now / 1000);

      statsTimer += dt;
      if (statsTimer > 0.25) {
        statsTimer = 0;
        onStatsRef.current(world.counts);
      }

      frameId = requestAnimationFrame(draw);
    }

    resize();

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