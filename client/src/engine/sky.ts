type RGB = [number,number,number];

// Sky colors at key moments of the day. time 0 = midnight, 0.5 = noon.
const KEYFRAMES: {t:number; top:RGB; bottom:RGB} [] = [
    { t: 0.0,  top: [10,14,40],     bottom:[28,24,70] },        //midnight
    { t: 0.25, top: [60, 70, 130],  bottom: [255, 150, 110] },  // dawn
    { t: 0.5,  top: [60, 170, 200], bottom: [190, 235, 210] },  // noon
    { t: 0.75, top: [90, 60, 140],  bottom: [255, 120, 90] },   // dusk
    { t: 1.0,  top: [10, 14, 40],   bottom: [28, 24, 70] },     // midnight again
]

// Blend two colors. f = 0 gives color a, f = 1 gives color b, 0.5 is halfway.
export function mixColor(a: RGB, b: RGB, f: number): RGB {
  return [
    a[0] + (b[0] - a[0]) * f,
    a[1] + (b[1] - a[1]) * f,
    a[2] + (b[2] - a[2]) * f,
  ];
}

// Turn [r, g, b] numbers into a CSS color string the canvas understands.
export function toCss(c: RGB): string {
  return `rgb(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])})`;
}

// How bright is it? 0 = midnight, 1 = noon. A smooth wave using cosine.
export function getDaylight(time: number): number {
  return 0.5 - 0.5 * Math.cos(time * Math.PI * 2);
}

// Find the two keyframes around "time" and blend between them.
export function getSkyColors(time: number): { top: string; bottom: string } {
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    const a = KEYFRAMES[i];
    const b = KEYFRAMES[i + 1];
    if (time >= a.t && time <= b.t) {
      const f = (time - a.t) / (b.t - a.t);
      return {
        top: toCss(mixColor(a.top, b.top, f)),
        bottom: toCss(mixColor(a.bottom, b.bottom, f)),
      };
    }
  }
  return { top: toCss(KEYFRAMES[0].top), bottom: toCss(KEYFRAMES[0].bottom) };
}