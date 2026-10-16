import type { World } from "../engine/World";
import type { Animal, Entity, Plant } from "../engine/entities";

const TAU = Math.PI * 2;

export function drawEntities(ctx: CanvasRenderingContext2D, world: World, time: number) {
  // Draw things higher on the screen first, so nearer things cover farther ones
  const all: Entity[] = [...world.plants, ...world.animals].sort((a, b) => a.y - b.y);

  for (const e of all) {
    // Perspective: things lower on the screen are closer, so they look bigger
    const t = (e.y - world.groundTop) / (world.groundBottom - world.groundTop);
    const scale = 0.55 + 0.75 * t;
    if (e.kind === "plant") drawPlant(ctx, e, scale);
    else drawAnimal(ctx, e, scale, time);
  }
}

function drawPlant(ctx: CanvasRenderingContext2D, p: Plant, s: number) {
  const g = p.growth;
  const height = 100 * s * g;

  ctx.fillStyle = "rgba(0,0,0,0.2)"; // ground shadow
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, 28 * s * g, 7 * s * g, 0, 0, TAU);
  ctx.fill();

  ctx.fillStyle = "#6b4630"; // trunk
  ctx.fillRect(p.x - 4 * s * g, p.y - height, 8 * s * g, height);

  // Canopy: three overlapping circles in shades of one hue
  const r = 26 * s * g;
  const top = p.y - height;
  const blobs = [
    { dx: -r * 0.7, dy: r * 0.3, light: 32 },
    { dx: r * 0.7, dy: r * 0.3, light: 36 },
    { dx: 0, dy: -r * 0.3, light: 42 },
  ];
  for (const b of blobs) {
    ctx.fillStyle = `hsl(${p.hue}, 60%, ${b.light}%)`;
    ctx.beginPath();
    ctx.arc(p.x + b.dx, top + b.dy, r, 0, TAU);
    ctx.fill();
  }

  if (g > 0.8) { // a little flower once fully grown
    ctx.fillStyle = "#ff6f91";
    ctx.beginPath();
    ctx.arc(p.x + r * 0.2, top - r * 0.5, 4 * s, 0, TAU);
    ctx.fill();
  }
}

function drawAnimal(ctx: CanvasRenderingContext2D, a: Animal, s: number, time: number) {
  const big = a.kind === "predator";
  const L = (big ? 26 : 17) * s; // base unit: everything is sized from this
  const moving = a.vx !== 0 || a.vy !== 0;
  const bob = Math.sin(time * 8 + a.id) * (moving ? 2.5 : 0.8) * s;
  const body = big ? "#f2b134" : "#ff9f7a";
  const belly = big ? "#ffe2a0" : "#ffe3d3";

  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.scale(a.facing, 1); // a facing of -1 mirrors the whole drawing

  ctx.fillStyle = "rgba(0,0,0,0.22)"; // shadow
  ctx.beginPath();
  ctx.ellipse(0, 0, L, L * 0.25, 0, 0, TAU);
  ctx.fill();

  ctx.fillStyle = body; // tail
  ctx.beginPath();
  ctx.arc(-L * 0.95, -L * 0.7 + bob, L * 0.22, 0, TAU);
  ctx.fill();

  ctx.beginPath(); // body
  ctx.ellipse(0, -L * 0.65 + bob, L, L * 0.6, 0, 0, TAU);
  ctx.fill();

  ctx.fillStyle = belly;
  ctx.beginPath();
  ctx.ellipse(L * 0.1, -L * 0.45 + bob, L * 0.7, L * 0.3, 0, 0, TAU);
  ctx.fill();

  if (big) { // leopard spots
    ctx.fillStyle = "#5a3a14";
    for (const [sx, sy] of [[-0.5, -0.9], [0, -1.0], [0.45, -0.85], [-0.2, -0.7]]) {
      ctx.beginPath();
      ctx.arc(L * sx, L * sy + bob, L * 0.09, 0, TAU);
      ctx.fill();
    }
  }

  ctx.fillStyle = body; // head
  ctx.beginPath();
  ctx.arc(L * 0.95, -L * 1.0 + bob, L * 0.42, 0, TAU);
  ctx.fill();

  if (big) { // pointed leopard ear
    ctx.beginPath();
    ctx.moveTo(L * 0.8, -L * 1.3 + bob);
    ctx.lineTo(L * 0.85, -L * 1.75 + bob);
    ctx.lineTo(L * 1.1, -L * 1.35 + bob);
    ctx.fill();
  } else { // tall deer ear
    ctx.beginPath();
    ctx.ellipse(L * 0.85, -L * 1.5 + bob, L * 0.1, L * 0.3, 0.2, 0, TAU);
    ctx.fill();
  }

  ctx.fillStyle = "#ffffff"; // eye
  ctx.beginPath();
  ctx.arc(L * 1.1, -L * 1.08 + bob, L * 0.12, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#1b1b1b";
  ctx.beginPath();
  ctx.arc(L * 1.13, -L * 1.08 + bob, L * 0.06, 0, TAU);
  ctx.fill();

  ctx.restore();

  // Hunger bar: only appears when the animal is starving
  if (a.energy < 40) {
    const w = 30 * s;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(a.x - w / 2, a.y - L * 2.1, w, 4);
    ctx.fillStyle = "#ff5a5f";
    ctx.fillRect(a.x - w / 2, a.y - L * 2.1, (w * Math.max(0, a.energy)) / 40, 4);
  }
}