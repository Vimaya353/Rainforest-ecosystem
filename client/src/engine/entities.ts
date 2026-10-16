export type AnimalKind = "herbivore" | "predator";

export interface Plant {
  id: number;
  kind: "plant";
  x: number;
  y: number;
  growth: number;    // 0 = tiny sprout, 1 = fully grown
  hue: number;       // color angle, so every tree is a slightly different green
  seedTimer: number; // seconds until this tree drops a seedling
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
  energy: number;        // 0 = dead, 100 = full
  cooldown: number;      // seconds before it can have another baby
}

export type Entity = Plant | Animal;