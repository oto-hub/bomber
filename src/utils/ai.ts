import { Bomb, Character, Direction, TileType, Item, KangarooMount } from '../types/game';
import { GRID_COLS, GRID_ROWS, TILE_SIZE } from './mapGenerator';

export interface AIDecision {
  direction?: Direction;
  isMoving: boolean;
  plantBomb: boolean;
  kangarooJump: boolean;
}

// Compute danger grid where bombs will explode
export function computeDangerMap(bombs: Bomb[], grid: TileType[][]): number[][] {
  const danger = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(0));

  for (const bomb of bombs) {
    const bx = Math.round(bomb.pixelX / TILE_SIZE);
    const by = Math.round(bomb.pixelY / TILE_SIZE);

    if (by >= 0 && by < GRID_ROWS && bx >= 0 && bx < GRID_COLS) {
      danger[by][bx] = Math.max(danger[by][bx], bomb.timer);

      const dirs = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
      ];

      for (const d of dirs) {
        for (let r = 1; r <= bomb.range; r++) {
          const nx = bx + d.dx * r;
          const ny = by + d.dy * r;

          if (nx < 0 || nx >= GRID_COLS || ny < 0 || ny >= GRID_ROWS) break;
          const tile = grid[ny][nx];

          if (tile === TileType.WALL) break;

          danger[ny][nx] = Math.max(danger[ny][nx], bomb.timer);

          if (tile === TileType.BRICK && !bomb.isPierce) {
            break; // Non-pierce bombs stop at first brick
          }
        }
      }
    }
  }

  return danger;
}

// Shortest path BFS to nearest safe tile
function findEscapeTile(
  startX: number,
  startY: number,
  grid: TileType[][],
  danger: number[][],
  bombs: Bomb[]
): Direction | null {
  const queue: { x: number; y: number; firstDir: Direction | null }[] = [
    { x: startX, y: startY, firstDir: null },
  ];
  const visited = new Set<string>();
  visited.add(`${startX},${startY}`);

  const bombPosSet = new Set(
    bombs.map((b) => `${Math.round(b.pixelX / TILE_SIZE)},${Math.round(b.pixelY / TILE_SIZE)}`)
  );

  const dirs: { dir: Direction; dx: number; dy: number }[] = [
    { dir: 'UP', dx: 0, dy: -1 },
    { dir: 'DOWN', dx: 0, dy: 1 },
    { dir: 'LEFT', dx: -1, dy: 0 },
    { dir: 'RIGHT', dx: 1, dy: 0 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Safe tile found!
    if (danger[current.y][current.x] === 0 && current.firstDir !== null) {
      return current.firstDir;
    }

    for (const d of dirs) {
      const nx = current.x + d.dx;
      const ny = current.y + d.dy;

      if (nx < 1 || nx >= GRID_COLS - 1 || ny < 1 || ny >= GRID_ROWS - 1) continue;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;

      const tile = grid[ny][nx];
      // Can only walk on empty tile with no solid bomb
      if (tile === TileType.EMPTY && !bombPosSet.has(key)) {
        visited.add(key);
        queue.push({
          x: nx,
          y: ny,
          firstDir: current.firstDir || d.dir,
        });
      }
    }
  }

  return null;
}

// Check if placing a bomb right here leaves a safe escape route
function canSafelyEscapeAfterPlacingBomb(
  gx: number,
  gy: number,
  range: number,
  isPierce: boolean,
  grid: TileType[][],
  existingBombs: Bomb[]
): boolean {
  const simulatedBomb: Bomb = {
    id: 'sim',
    x: gx,
    y: gy,
    pixelX: gx * TILE_SIZE,
    pixelY: gy * TILE_SIZE,
    ownerId: -1,
    range,
    isPierce,
    timer: 2800,
    slidingSpeed: 0,
    passThroughPlayerIds: [],
  };

  const simBombs = [...existingBombs, simulatedBomb];
  const simDanger = computeDangerMap(simBombs, grid);

  return findEscapeTile(gx, gy, grid, simDanger, simBombs) !== null;
}

export function computeBotDecision(
  bot: Character,
  grid: TileType[][],
  bombs: Bomb[],
  items: Item[],
  allPlayers: Character[]
): AIDecision {
  const gx = Math.round(bot.x / TILE_SIZE);
  const gy = Math.round(bot.y / TILE_SIZE);

  const danger = computeDangerMap(bombs, grid);
  const inDanger = danger[gy]?.[gx] > 0;

  // 1. EMERGENCY: In blast zone! Flee to safety immediately!
  if (inDanger) {
    const escapeDir = findEscapeTile(gx, gy, grid, danger, bombs);
    if (escapeDir) {
      // If mounted on kangaroo and path blocked, consider jumping!
      let shouldHop = false;
      if (bot.kangaroo && bot.kangaroo.jumpCooldown <= 0) {
        shouldHop = Math.random() < 0.25;
      }

      return {
        direction: escapeDir,
        isMoving: true,
        plantBomb: false,
        kangarooJump: shouldHop,
      };
    }
  }

  // 2. SAFE: Look for revealed nearby items to collect
  const revealedItems = items.filter((i) => i.revealed);
  if (revealedItems.length > 0) {
    let closestItem: Item | null = null;
    let minDist = Infinity;

    for (const item of revealedItems) {
      const dist = Math.abs(item.x - gx) + Math.abs(item.y - gy);
      if (dist < minDist && danger[item.y]?.[item.x] === 0) {
        minDist = dist;
        closestItem = item;
      }
    }

    if (closestItem && minDist <= 6) {
      const queue: { x: number; y: number; firstDir: Direction | null }[] = [
        { x: gx, y: gy, firstDir: null },
      ];
      const visited = new Set<string>([`${gx},${gy}`]);
      const dirs: { dir: Direction; dx: number; dy: number }[] = [
        { dir: 'UP', dx: 0, dy: -1 },
        { dir: 'DOWN', dx: 0, dy: 1 },
        { dir: 'LEFT', dx: -1, dy: 0 },
        { dir: 'RIGHT', dx: 1, dy: 0 },
      ];

      while (queue.length > 0) {
        const curr = queue.shift()!;
        if (curr.x === closestItem.x && curr.y === closestItem.y && curr.firstDir) {
          return {
            direction: curr.firstDir,
            isMoving: true,
            plantBomb: false,
            kangarooJump: false,
          };
        }

        for (const d of dirs) {
          const nx = curr.x + d.dx;
          const ny = curr.y + d.dy;
          if (nx < 1 || nx >= GRID_COLS - 1 || ny < 1 || ny >= GRID_ROWS - 1) continue;
          if (visited.has(`${nx},${ny}`)) continue;

          // Safe empty tile
          if (grid[ny][nx] === TileType.EMPTY && danger[ny][nx] === 0) {
            visited.add(`${nx},${ny}`);
            queue.push({ x: nx, y: ny, firstDir: curr.firstDir || d.dir });
          }
        }
      }
    }
  }

  // 3. Check if near destructible soft brick or enemy player to bomb
  const adjacentCoords = [
    { x: gx, y: gy - 1, dir: 'UP' as Direction },
    { x: gx, y: gy + 1, dir: 'DOWN' as Direction },
    { x: gx - 1, y: gy, dir: 'LEFT' as Direction },
    { x: gx + 1, y: gy, dir: 'RIGHT' as Direction },
  ];

  let nearBrick = false;
  for (const ac of adjacentCoords) {
    if (ac.x >= 0 && ac.x < GRID_COLS && ac.y >= 0 && ac.y < GRID_ROWS) {
      if (grid[ac.y][ac.x] === TileType.BRICK) {
        nearBrick = true;
        break;
      }
    }
  }

  // Check if near enemy player
  let nearEnemy = false;
  for (const p of allPlayers) {
    if (p.id !== bot.id && p.alive) {
      const pgx = Math.round(p.x / TILE_SIZE);
      const pgy = Math.round(p.y / TILE_SIZE);
      const dist = Math.abs(pgx - gx) + Math.abs(pgy - gy);
      if (dist <= 3) {
        nearEnemy = true;
        break;
      }
    }
  }

  // Can plant bomb?
  const canPlant =
    bot.activeBombs < bot.maxBombs &&
    !bombs.some((b) => Math.round(b.pixelX / TILE_SIZE) === gx && Math.round(b.pixelY / TILE_SIZE) === gy);

  if (canPlant && (nearBrick || nearEnemy)) {
    if (canSafelyEscapeAfterPlacingBomb(gx, gy, bot.fireRange, bot.hasPierce, grid, bombs)) {
      return {
        direction: bot.direction,
        isMoving: false,
        plantBomb: true,
        kangarooJump: false,
      };
    }
  }

  // 4. Wander towards open paths
  const validMoves: Direction[] = [];
  for (const ac of adjacentCoords) {
    if (ac.x >= 1 && ac.x < GRID_COLS - 1 && ac.y >= 1 && ac.y < GRID_ROWS - 1) {
      const isBombThere = bombs.some(
        (b) => Math.round(b.pixelX / TILE_SIZE) === ac.x && Math.round(b.pixelY / TILE_SIZE) === ac.y
      );
      if (grid[ac.y][ac.x] === TileType.EMPTY && danger[ac.y][ac.x] === 0 && !isBombThere) {
        validMoves.push(ac.dir);
      }
    }
  }

  if (validMoves.length > 0) {
    // Prefer continuing in current direction if valid
    const chosenDir = validMoves.includes(bot.direction) && Math.random() < 0.7
      ? bot.direction
      : validMoves[Math.floor(Math.random() * validMoves.length)];

    return {
      direction: chosenDir,
      isMoving: true,
      plantBomb: false,
      kangarooJump: false,
    };
  }

  return {
    direction: bot.direction,
    isMoving: false,
    plantBomb: false,
    kangarooJump: false,
  };
}
