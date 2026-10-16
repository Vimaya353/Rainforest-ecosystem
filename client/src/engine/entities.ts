export type AnimalKind = "herbivore" | "predator";

export interface Plant {
  id: number;
  kind: "plant";
  x: number;
  y: number;
  growth: number; // 0 = tiny sprout, 1 = fully grown
  hue: number;    // color angle, so every tree is a slightly different green
}

export interface Animal {
  id: number;
  kind: AnimalKind;
  x: number;
  y: number;
  vx: number;            // horizontal speed in pixels per second
  vy: number;            // vertical speed
  facing: 1 | -1;        // 1 = looking right, -1 = looking left
  wanderTimer: number;   // seconds left before it picks a new direction
}

export type Entity = Plant | Animal;