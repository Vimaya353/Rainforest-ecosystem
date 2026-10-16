import { useEffect, useRef } from "react";
import { World, type Stats } from "../engine/World";
import type { AnimalKind } from "../engine/entities";
import { createStars, drawScene } from "./drawScene";
import { drawEntities } from "./drawEntities";

export type Tool = "plant" | AnimalKind;

const DAY_LENGTH_SECONDS = 60;

interface Props {
  tool: Tool;
  paused: boolean;
  speed: number;
  resetCount: number;
  onStats: (stats: Stats) => void;
}

export default function WorldCanvas({ tool, paused, speed, resetCount, onStats }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World | null>(null);

  // The animation loop is created once, so it reads the newest settings from this box
  const live = useRef({ tool, paused, speed, onStats });
  useEffect(() => {
    live.current = { tool, paused, speed, onStats };
  }, [tool, paused, speed, onStats]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const world = new World();
    worldRef.current = world;
    const stars = createStars();
    let width = 0;
    let height = 0;
    let frameId = 0;
    let lastNow = 0;
    let statsTimer = 0;
    let clock = 0; // simulation time in seconds. It stops while paused.

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
      const t = live.current.tool;
      if (t === "plant") world.addPlant(e.clientX, e.clientY);
      else world.addAnimal(t, e.clientX, e.clientY);
    }

    function draw(now: number) {
      const dt = Math.min((now - lastNow) / 1000, 0.05);
      lastNow = now;
      const { paused, speed, onStats } = live.current;

      if (!paused) {
        for (let i = 0; i < speed; i++) world.update(dt); // faster = more steps per frame
        clock += dt * speed;

        statsTimer += dt;
        if (statsTimer > 0.25) {
          statsTimer = 0;
          onStats(world.counts);
        }
      }

      const time = (clock / DAY_LENGTH_SECONDS + 0.3) % 1;
      drawScene(ctx, width, height, time, stars);
      drawEntities(ctx, world, clock);

      frameId = requestAnimationFrame(draw);
    }

    resize();
    world.seed();

    window.addEventListener("resize", resize);
    canvas.addEventListener("click", onClick);
    frameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("click", onClick);
    };
  }, []);

  // Every time the reset button is pressed, resetCount goes up and we re-seed the world
  useEffect(() => {
    if (resetCount > 0) worldRef.current?.seed();
  }, [resetCount]);

  return <canvas ref={canvasRef} />;
}