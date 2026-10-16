import type { Animal, AnimalKind, Plant } from "./entities";

const SPEED: Record<AnimalKind, number> = { herbivore: 40, predator: 60 };
const PLANT_GROW_SECONDS = 8;

export class World {
  width = 0;
  height = 0;
  plants: Plant[] = [];
  animals: Animal[] = [];
  private nextId = 1;

  // The strip of land where things can live (fractions of the screen height)
  get groundTop() { return this.height * 0.76; }
  get groundBottom() { return this.height * 0.96; }

  setSize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  randomSpot() {
    return {
      x: 40 + Math.random() * (this.width - 80),
      y: this.groundTop + Math.random() * (this.groundBottom - this.groundTop),
    };
  }

  addPlant(x: number, y: number, growth = 0.15) {
    const spot = this.clampToGround(x, y);
    this.plants.push({
      id: this.nextId++,
      kind: "plant",
      x: spot.x,
      y: spot.y,
      growth,
      hue: 110 + Math.random() * 60,
    });
  }

  addAnimal(kind: AnimalKind, x: number, y: number) {
    const spot = this.clampToGround(x, y);
    this.animals.push({
      id: this.nextId++,
      kind,
      x: spot.x,
      y: spot.y,
      vx: 0,
      vy: 0,
      facing: 1,
      wanderTimer: 0,
    });
  }

  // Runs every frame. dt = seconds since the last frame (about 0.016).
  update(dt: number) {
    for (const plant of this.plants) {
      plant.growth = Math.min(1, plant.growth + dt / PLANT_GROW_SECONDS);
    }

    for (const a of this.animals) {
      a.wanderTimer -= dt;
      if (a.wanderTimer <= 0) this.pickNewDirection(a);

      a.x += a.vx * dt;
      a.y += a.vy * dt * 0.5; // move less up/down, it looks more natural
      if (a.vx !== 0) a.facing = a.vx > 0 ? 1 : -1;

      // If it hit the edge of the ground, put it back and choose a new way
      const spot = this.clampToGround(a.x, a.y);
      if (spot.x !== a.x || spot.y !== a.y) {
        a.x = spot.x;
        a.y = spot.y;
        a.wanderTimer = 0;
      }
    }
  }

  private pickNewDirection(a: Animal) {
    a.wanderTimer = 1 + Math.random() * 2.5;
    if (Math.random() < 0.3) {
      a.vx = 0; // sometimes it just stands still
      a.vy = 0;
      return;
    }
    const angle = Math.random() * Math.PI * 2;
    const speed = SPEED[a.kind] * (0.5 + Math.random() * 0.5);
    a.vx = Math.cos(angle) * speed;
    a.vy = Math.sin(angle) * speed;
  }

  private clampToGround(x: number, y: number) {
    return {
      x: Math.min(Math.max(x, 30), this.width - 30),
      y: Math.min(Math.max(y, this.groundTop), this.groundBottom),
    };
  }
}