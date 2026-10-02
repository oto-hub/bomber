import { TileType, Item, ItemType, GameMode } from '../types/game';

export const GRID_COLS = 15;
export const GRID_ROWS = 13;
export const TILE_SIZE = 48; // Canvas rendering resolution

export interface MapData {
  grid: TileType[][];
  items: Item[];
  portalPos?: { x: number; y: number };
}

export function generateStageMap(mode: GameMode, stageNumber: number = 1): MapData {
  const grid: TileType[][] = [];

  // Initialize empty grid with walls and indestructible pillars
  for (let y = 0; y < GRID_ROWS; y++) {
    const row: TileType[] = [];
    for (let x = 0; x < GRID_COLS; x++) {
      if (x === 0 || x === GRID_COLS - 1 || y === 0 || y === GRID_ROWS - 1) {
        row.push(TileType.WALL);
      } else if (x % 2 === 0 && y % 2 === 0) {
        row.push(TileType.WALL);
      } else {
        row.push(TileType.EMPTY);
      }
    }
    grid.push(row);
  }

  // Safe spawn corners (must remain empty for players to move)
  const safeSpawns = new Set<string>([
    // Top-Left (P1)
    '1,1', '1,2', '2,1',
    // Top-Right (P2)
    '13,1', '13,2', '12,1',
    // Bottom-Left (P3)
    '1,11', '1,10', '2,11',
    // Bottom-Right (P4)
    '13,11', '13,10', '12,11',
  ]);

  // Center boss arena clearing if boss stage
  const isBossStage = mode === 'ADVENTURE' && stageNumber === 4;
  if (isBossStage) {
    for (let by = 4; by <= 8; by++) {
      for (let bx = 5; bx <= 9; bx++) {
        safeSpawns.add(`${bx},${by}`);
      }
    }
  }

  // Find candidate slots for destructible bricks
  const brickCandidates: { x: number; y: number }[] = [];
  for (let y = 1; y < GRID_ROWS - 1; y++) {
    for (let x = 1; x < GRID_COLS - 1; x++) {
      if (grid[y][x] === TileType.EMPTY && !safeSpawns.has(`${x},${y}`)) {
        brickCandidates.push({ x, y });
      }
    }
  }

  // Shuffle candidates
  for (let i = brickCandidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [brickCandidates[i], brickCandidates[j]] = [brickCandidates[j], brickCandidates[i]];
  }

  // Fill ~65% with destructible bricks
  const brickDensity = isBossStage ? 0.35 : 0.65;
  const numBricks = Math.floor(brickCandidates.length * brickDensity);
  const brickPositions = brickCandidates.slice(0, numBricks);

  for (const pos of brickPositions) {
    grid[pos.y][pos.x] = TileType.BRICK;
  }

  // Setup items to hide inside bricks
  const items: Item[] = [];
  const shuffledBricks = [...brickPositions].sort(() => Math.random() - 0.5);

  let portalPos: { x: number; y: number } | undefined = undefined;

  // Single player mode needs a hidden portal exit under one brick
  if (mode === 'ADVENTURE' && !isBossStage && shuffledBricks.length > 0) {
    const pPos = shuffledBricks.pop()!;
    portalPos = { x: pPos.x, y: pPos.y };
  }

  // Define item distribution pool
  // All requested items: Bomb Up, Fire Up, Speed Up, Bomb Kick, Pierce Bomb, plus Kangaroo Egg!
  const itemPool: ItemType[] = [
    // Bomb Up
    ItemType.BOMB_UP, ItemType.BOMB_UP, ItemType.BOMB_UP, ItemType.BOMB_UP,
    // Fire Up
    ItemType.FIRE_UP, ItemType.FIRE_UP, ItemType.FIRE_UP, ItemType.FIRE_UP,
    // Speed Up
    ItemType.SPEED_UP, ItemType.SPEED_UP, ItemType.SPEED_UP,
    // Bomb Kick
    ItemType.BOMB_KICK, ItemType.BOMB_KICK,
    // Pierce Bomb
    ItemType.PIERCE_BOMB, ItemType.PIERCE_BOMB,
    // Kangaroo Egg (Mount)
    ItemType.KANGAROO_EGG, ItemType.KANGAROO_EGG,
  ];

  if (mode === 'BATTLE') {
    // Add extra kicks, pierce bombs, and kangaroo eggs in battle mode for high excitement!
    itemPool.push(
      ItemType.BOMB_KICK,
      ItemType.PIERCE_BOMB,
      ItemType.KANGAROO_EGG,
      ItemType.FIRE_UP,
      ItemType.BOMB_UP
    );
  }

  // Place items under random bricks
  for (let i = 0; i < itemPool.length && shuffledBricks.length > 0; i++) {
    const pos = shuffledBricks.pop()!;
    items.push({
      id: `item-${pos.x}-${pos.y}-${i}`,
      type: itemPool[i],
      x: pos.x,
      y: pos.y,
      revealed: false,
      spawnTime: 0,
    });
  }

  return { grid, items, portalPos };
}
