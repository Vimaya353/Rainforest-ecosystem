import type { Animal, AnimalKind, Plant } from "./entities";

// Every number that controls the ecosystem. Change these to tune the balance.
export const CONFIG = {
  plantMax: 45,          // most trees allowed at once
  edible: 0.35,          // a tree must be this grown before deer eat it
  bite: 0.5,             // how much growth one bite removes
  plantGrowSeconds: 8,
  herbivore: {
    wanderSpeed: 40, runSpeed: 100, vision: 260, fleeRange: 130,
    drain: 2, hungryBelow: 75, eatRange: 20, eatGain: 45,
    reproduceAbove: 85, birthCost: 40, reproduceEvery: 12, max: 50,
  },
  predator: {
    wanderSpeed: 60, runSpeed: 115, vision: 320, fleeRange: 0,
    drain: 1.8, hungryBelow: 70, eatRange: 24, eatGain: 60,
    reproduceAbove: 90, birthCost: 45, reproduceEvery: 25, max: 12,
  },
};

export interface Stats {
  plants: number;
  herbivores: number;
  predators: number;
}

export class World {
  width = 0;
  height = 0;
  plants: Plant[] = [];
  animals: Animal[] = [];
  private nextId = 1;

  get groundTop() { return this.height * 0.76; }
  get groundBottom() { return this.height * 0.96; }

  get counts(): Stats {
    return {
      plants: this.plants.length,
      herbivores: this.count("herbivore"),
      predators: this.count("predator"),
    };
  }

  setSize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

    // Clear everything and plant the starting forest.
  // Used when the page loads and when the reset button is pressed.
  seed() {
    this.plants = [];
    this.animals = [];
    for (let i = 0; i < 8; i++) {
      const p = this.randomSpot();
      this.addPlant(p.x, p.y, 1);
    }
    for (let i = 0; i < 4; i++) {
      const p = this.randomSpot();
      this.addAnimal("herbivore", p.x, p.y);
    }
    const leopard = this.randomSpot();
    this.addAnimal("predator", leopard.x, leopard.y);
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
      seedTimer: 6 + Math.random() * 8,
    });
  }

  addAnimal(kind: AnimalKind, x: number, y: number): Animal {
    const spot = this.clampToGround(x, y);
    const animal: Animal = {
      id: this.nextId++,
      kind,
      x: spot.x,
      y: spot.y,
      vx: 0,
      vy: 0,
      facing: 1,
      wanderTimer: 0,
      energy: 60 + Math.random() * 30,
      cooldown: 5 + Math.random() * 10,
    };
    this.animals.push(animal);
    return animal;
  }

  // Runs every frame. dt = seconds since the last frame (about 0.016).
  update(dt: number) {
    this.updatePlants(dt);

    const births: { kind: AnimalKind; x: number; y: number }[] = [];

    for (const a of this.animals) {
      const c = CONFIG[a.kind];
      a.energy -= c.drain * dt;   // hunger
      a.cooldown -= dt;

      this.think(a, dt);          // decide where to go and what to do

      a.x += a.vx * dt;
      a.y += a.vy * dt * 0.5;
      if (a.vx !== 0) a.facing = a.vx > 0 ? 1 : -1;

      const spot = this.clampToGround(a.x, a.y);
      if (spot.x !== a.x || spot.y !== a.y) {
        a.x = spot.x;
        a.y = spot.y;
        a.wanderTimer = 0;
      }

      // Reproduction: enough energy, rested, and the species isn't at its limit
      const sameKindBabies = births.filter((b) => b.kind === a.kind).length;
      if (
        a.energy >= c.reproduceAbove &&
        a.cooldown <= 0 &&
        this.count(a.kind) + sameKindBabies < c.max
      ) {
        a.energy -= c.birthCost;
        a.cooldown = c.reproduceEvery;
        births.push({ kind: a.kind, x: a.x + (Math.random() - 0.5) * 40, y: a.y });
      }
    }

    for (const b of births) {
      const baby = this.addAnimal(b.kind, b.x, b.y);
      baby.energy = 50;
      baby.cooldown = CONFIG[b.kind].reproduceEvery;
    }

    // Remove the dead: starved animals, eaten animals, fully eaten trees
    this.animals = this.animals.filter((a) => a.energy > 0);
    this.plants = this.plants.filter((p) => p.growth > 0);
  }

  private updatePlants(dt: number) {
    const seeds: { x: number; y: number }[] = [];
    for (const p of this.plants) {
      p.growth = Math.min(1, p.growth + dt / CONFIG.plantGrowSeconds);
      if (p.growth >= 1) {
        p.seedTimer -= dt;
        if (p.seedTimer <= 0) {
          p.seedTimer = 8 + Math.random() * 8;
          if (this.plants.length + seeds.length < CONFIG.plantMax) {
            seeds.push({
              x: p.x + (Math.random() - 0.5) * 200,
              y: p.y + (Math.random() - 0.5) * 60,
            });
          }
        }
      }
    }
    for (const s of seeds) this.addPlant(s.x, s.y);
  }

  // The animal's "brain": flee, then eat if hungry, otherwise wander.
  private think(a: Animal, dt: number) {
    const c = CONFIG[a.kind];

    // 1. Deer run away from nearby leopards
    if (a.kind === "herbivore") {
      const threat = this.nearest(a, this.animals, c.fleeRange, (o) => o.kind === "predator");
      if (threat) {
        this.steer(a, a.x - threat.x, a.y - threat.y, c.runSpeed);
        return;
      }
    }

    // 2. If hungry, find food and go to it
    if (a.energy < c.hungryBelow) {
      const target: Plant | Animal | null =
        a.kind === "herbivore"
          ? this.nearest(a, this.plants, c.vision, (p) => p.growth >= CONFIG.edible)
          : this.nearest(a, this.animals, c.vision, (o) => o.kind === "herbivore" && o.energy > 0);

      if (target) {
        const dx = target.x - a.x;
        const dy = target.y - a.y;
        if (Math.hypot(dx, dy) < c.eatRange) this.eat(a, target);
        else this.steer(a, dx, dy, c.runSpeed);
        return;
      }
    }

    // 3. Otherwise wander around
    a.wanderTimer -= dt;
    if (a.wanderTimer <= 0) this.pickNewDirection(a);
  }

  private eat(a: Animal, target: Plant | Animal) {
    const gain = CONFIG[a.kind].eatGain;
    if (target.kind === "plant") {
      target.growth -= CONFIG.bite;
    } else {
      target.energy = 0; // the prey dies, and gets removed at the end of update
    }
    a.energy = Math.min(100, a.energy + gain);
    a.vx = 0;
    a.vy = 0;
  }

  // Point the animal in a direction (dx, dy) and set its speed.
  private steer(a: Animal, dx: number, dy: number, speed: number) {
    const len = Math.hypot(dx, dy) || 1;
    a.vx = (dx / len) * speed;
    a.vy = (dy / len) * speed;
    a.wanderTimer = 0;
  }

  // Find the closest item in a list that is within "range" and passes the "ok" test.
  private nearest<T extends { x: number; y: number }>(
    from: Animal,
    list: T[],
    range: number,
    ok: (item: T) => boolean
  ): T | null {
    let best: T | null = null;
    let bestDist = range * range; // comparing squared distances avoids slow square roots
    for (const item of list) {
      if (!ok(item)) continue;
      const d = (item.x - from.x) ** 2 + (item.y - from.y) ** 2;
      if (d < bestDist) {
        best = item;
        bestDist = d;
      }
    }
    return best;
  }

  private pickNewDirection(a: Animal) {
    a.wanderTimer = 1 + Math.random() * 2.5;
    if (Math.random() < 0.3) {
      a.vx = 0;
      a.vy = 0;
      return;
    }
    const angle = Math.random() * Math.PI * 2;
    const speed = CONFIG[a.kind].wanderSpeed * (0.5 + Math.random() * 0.5);
    a.vx = Math.cos(angle) * speed;
    a.vy = Math.sin(angle) * speed;
  }

  private count(kind: AnimalKind) {
    let n = 0;
    for (const a of this.animals) if (a.kind === kind) n++;
    return n;
  }

  private clampToGround(x: number, y: number) {
    return {
      x: Math.min(Math.max(x, 30), this.width - 30),
      y: Math.min(Math.max(y, this.groundTop), this.groundBottom),
    };
  }
}