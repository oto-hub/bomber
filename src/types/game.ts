/**
 * Types & Enums for Bomber Arena & Adventure
 */

export type GameMode = 'BATTLE' | 'ADVENTURE';

export type GameStatus =
  | 'TITLE'
  | 'PLAYING'
  | 'PAUSED'
  | 'ROUND_WIN'
  | 'STAGE_CLEAR'
  | 'GAME_OVER'
  | 'VICTORY';

export enum TileType {
  EMPTY = 0,
  WALL = 1,       // Indestructible steel block
  BRICK = 2,      // Destructible soft brick block
  PORTAL = 3,     // Hidden stage exit (revealed when soft block broken)
}

export enum ItemType {
  BOMB_UP = 'BOMB_UP',         // +1 max bombs
  FIRE_UP = 'FIRE_UP',         // +1 explosion radius
  SPEED_UP = 'SPEED_UP',       // +move speed
  BOMB_KICK = 'BOMB_KICK',     // Kick bombs
  PIERCE_BOMB = 'PIERCE_BOMB', // Explosions pierce soft blocks
  KANGAROO_EGG = 'KANGAROO_EGG', // Mount kangaroo
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Position {
  x: number; // grid or pixel coords
  y: number;
}

export interface Item {
  id: string;
  type: ItemType;
  x: number; // grid coords
  y: number;
  revealed: boolean;
  spawnTime: number;
}

export interface Bomb {
  id: string;
  x: number; // grid x
  y: number; // grid y
  ownerId: number;
  range: number;
  isPierce: boolean;
  timer: number; // countdown in ms (usually ~2800ms)
  slidingSpeed: number; // >0 if moving from kick
  slideDir?: Direction;
  pixelX: number;
  pixelY: number;
  passThroughPlayerIds: number[];
}

export interface FlameTile {
  x: number; // grid x
  y: number; // grid y
  type: 'center' | 'up' | 'down' | 'left' | 'right' | 'up_end' | 'down_end' | 'left_end' | 'right_end';
  timeRemaining: number; // duration of flame
}

export interface Explosion {
  id: string;
  tiles: FlameTile[];
  createdAt: number;
  duration: number; // ms
}

export interface KangarooMount {
  hasKangaroo: boolean;
  type: 'GREEN_HOPPER' | 'BLUE_DASH';
  jumpCooldown: number; // ms remaining
  isJumping: boolean;
  jumpProgress: number; // 0 to 1
  jumpStartY: number;
}

export interface Character {
  id: number;
  name: string;
  color: string;
  accentColor: string;
  isAI: boolean;
  isPlayer2?: boolean;
  x: number; // pixel coords
  y: number;
  vx: number;
  vy: number;
  direction: Direction;
  isMoving: boolean;
  alive: boolean;
  invulnerableTime: number; // ms

  // Stats & Items
  maxBombs: number;
  activeBombs: number;
  fireRange: number;
  speed: number;
  hasKick: boolean;
  hasPierce: boolean;
  kangaroo: KangarooMount | null;

  // Visual
  animFrame: number;
  deathTimer?: number;
}

export interface Enemy {
  id: string;
  type: 'SLIME' | 'BALLOON' | 'GHOST' | 'PATROL_BOT' | 'BOSS';
  x: number; // pixel coords
  y: number;
  vx: number;
  vy: number;
  direction: Direction;
  speed: number;
  hp: number;
  maxHp: number;
  animFrame: number;
  alive: boolean;
  attackCooldown?: number;
  specialStateTimer?: number;
}

export interface StageConfig {
  stageNumber: number;
  title: string;
  subtitle: string;
  theme: 'GARDEN' | 'VOLCANO' | 'TECH' | 'BOSS';
  timeLimit: number; // seconds
  enemyCounts: {
    SLIME?: number;
    BALLOON?: number;
    GHOST?: number;
    PATROL_BOT?: number;
    BOSS?: number;
  };
}

export interface BattleScore {
  playerId: number;
  name: string;
  color: string;
  wins: number;
}
