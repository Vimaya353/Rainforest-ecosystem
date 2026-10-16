import { getSkyColors, getDaylight, mixColor, toCss } from "../engine/sky";

export interface Star {
  x: number;
  y: number;
  r: number;
}

export function createStars(count = 140): Star[] {
  return Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random() * 0.55,
    r: Math.random() * 1.4 + 0.3,
  }));
}

const LAYERS = [
  { base: 0.62, amp: 40, freq: 0.006, offset: 1, day: [58, 130, 98] as const,  night: [14, 32, 40] as const },
  { base: 0.72, amp: 50, freq: 0.009, offset: 4, day: [32, 100, 70] as const,  night: [9, 24, 30] as const },
  { base: 0.84, amp: 40, freq: 0.014, offset: 7, day: [16, 70, 48] as const,   night: [5, 16, 20] as const },
];

function drawHills(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  layer: (typeof LAYERS)[number],
  daylight: number
) {
  const baseY = height * layer.base;
  const amp = layer.amp * (height / 800);
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let x = 0; x <= width; x += 6) {
    const y =
      baseY -
      Math.sin(x * layer.freq + layer.offset) * amp -
      Math.sin(x * layer.freq * 2.7 + layer.offset * 1.3) * amp * 0.4;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fillStyle = toCss(mixColor([...layer.night], [...layer.day], daylight));
  ctx.fill();
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  stars: Star[]
) {
  const daylight = getDaylight(time);
  const sky = getSkyColors(time);
  const horizon = height * 0.6;

  const gradient = ctx.createLinearGradient(0, 0, 0, horizon);
  gradient.addColorStop(0, sky.top);
  gradient.addColorStop(1, sky.bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = Math.max(0, 1 - daylight * 1.6) * 0.9;
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const angle = (time - 0.25) * Math.PI * 2;
  const orbit = (a: number) => ({
    x: width / 2 - Math.cos(a) * width * 0.45,
    y: horizon - Math.sin(a) * height * 0.5,
  });
  const sun = orbit(angle);
  const moon = orbit(angle + Math.PI);
  ctx.fillStyle = "#ffd36e";
  ctx.beginPath();
  ctx.arc(sun.x, sun.y, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e8eefc";
  ctx.beginPath();
  ctx.arc(moon.x, moon.y, 26, 0, Math.PI * 2);
  ctx.fill();

  for (const layer of LAYERS) drawHills(ctx, width, height, layer, daylight);
}