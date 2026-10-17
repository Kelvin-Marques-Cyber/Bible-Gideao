export interface Obstacle { x: number; z: number; width: number; depth: number; }
export interface Position { x: number; z: number; }

/** Axis-separated swept steps prevent tunnelling while allowing wall sliding. */
export function moveWithCollisions(position: Position, dx: number, dz: number, obstacles: Obstacle[], radius = 0.29, bounds = 18): Position {
  const result = { ...position };
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.18));
  const blocked = (x: number, z: number) => Math.abs(x) > bounds - radius || Math.abs(z) > bounds - radius || obstacles.some(o => x + radius > o.x - o.width / 2 && x - radius < o.x + o.width / 2 && z + radius > o.z - o.depth / 2 && z - radius < o.z + o.depth / 2);
  for (let i = 0; i < steps; i++) {
    const nx = result.x + dx / steps;
    if (!blocked(nx, result.z)) result.x = nx;
    const nz = result.z + dz / steps;
    if (!blocked(result.x, nz)) result.z = nz;
  }
  return result;
}

export function canSeePlayer(guard: Position & { angle: number }, player: Position, cover: Obstacle[], range = 5.2): boolean {
  const dx = player.x - guard.x, dz = player.z - guard.z;
  const distance = Math.hypot(dx, dz);
  if (distance > range || distance < 0.05) return distance < 0.8;
  const dot = (Math.sin(guard.angle) * dx + Math.cos(guard.angle) * dz) / distance;
  if (dot < Math.cos(Math.PI / 3.2)) return false;
  for (let i = 1; i < 18; i++) {
    const t = i / 18, x = guard.x + dx * t, z = guard.z + dz * t;
    if (cover.some(o => Math.abs(x - o.x) < o.width / 2 && Math.abs(z - o.z) < o.depth / 2)) return false;
  }
  return true;
}
