/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bomb,
  Character,
  Direction,
  Enemy,
  Explosion,
  GameMode,
  GameStatus,
  Item,
  ItemType,
  TileType,
  BattleScore,
  StageConfig,
} from './types/game';
import { GRID_COLS, GRID_ROWS, TILE_SIZE, generateStageMap } from './utils/mapGenerator';
import { computeBotDecision } from './utils/ai';
import { sound } from './utils/audio';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { TitleScreen } from './components/TitleScreen';
import { GameOverModal } from './components/GameOverModal';
import { ItemGuideModal } from './components/ItemGuideModal';
import { TouchControls } from './components/TouchControls';

// Stage configurations for 1P Adventure
const STAGES: StageConfig[] = [
  {
    stageNumber: 1,
    title: 'グリーンガーデン',
    subtitle: 'スライムとバルーンの草原迷路',
    theme: 'GARDEN',
    timeLimit: 180,
    enemyCounts: { SLIME: 4, BALLOON: 2 },
  },
  {
    stageNumber: 2,
    title: 'マグマケイブ',
    subtitle: '灼熱の洞窟とゴーストの巣窟',
    theme: 'VOLCANO',
    timeLimit: 180,
    enemyCounts: { SLIME: 2, BALLOON: 3, GHOST: 2 },
  },
  {
    stageNumber: 3,
    title: 'メカノ要塞',
    subtitle: '電脳警備ロボットが巡回する要塞',
    theme: 'TECH',
    timeLimit: 200,
    enemyCounts: { BALLOON: 2, GHOST: 2, PATROL_BOT: 4 },
  },
  {
    stageNumber: 4,
    title: '決戦！メカキング',
    subtitle: '要塞の中枢に潜む巨大メカボス',
    theme: 'BOSS',
    timeLimit: 240,
    enemyCounts: { BOSS: 1, PATROL_BOT: 2 },
  },
];

export default function App() {
  // Game State
  const [gameStatus, setGameStatus] = useState<GameStatus>('TITLE');
  const [gameMode, setGameMode] = useState<GameMode>('BATTLE');
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const [singlePlayerLives, setSinglePlayerLives] = useState<number>(3);
  const [singlePlayerScore, setSinglePlayerScore] = useState<number>(0);

  // Battle Mode Options
  const [isTwoPlayer, setIsTwoPlayer] = useState<boolean>(false);
  const [targetWins, setTargetWins] = useState<number>(2);
  const [cpuDifficulty, setCpuDifficulty] = useState<'NORMAL' | 'HARD'>('NORMAL');
  const [battleScores, setBattleScores] = useState<BattleScore[]>([
    { playerId: 1, name: '1P 白ボン', color: '#ffffff', wins: 0 },
    { playerId: 2, name: '2P 黒ボン', color: '#38bdf8', wins: 0 },
    { playerId: 3, name: 'CPU 赤ボン', color: '#ef4444', wins: 0 },
    { playerId: 4, name: 'CPU 青ボン', color: '#3b82f6', wins: 0 },
  ]);

  // Map & Entity State Refs for 60fps Loop
  const gridRef = useRef<TileType[][]>([]);
  const playersRef = useRef<Character[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const bombsRef = useRef<Bomb[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const itemsRef = useRef<Item[]>([]);
  const portalPosRef = useRef<{ x: number; y: number } | undefined>(undefined);
  const portalOpenRef = useRef<boolean>(false);

  // Time & Effects
  const [timeRemaining, setTimeRemaining] = useState<number>(180);
  const [suddenDeathActive, setSuddenDeathActive] = useState<boolean>(false);

  // UI state
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [bgmMuted, setBgmMuted] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [roundWinner, setRoundWinner] = useState<{ name: string; color: string } | null>(null);

  // Keys active set
  const keysDownRef = useRef<Set<string>>(new Set());
  const touchDirRef = useRef<Direction | null>(null);

  // State mirror for React HUD rendering
  const [p1State, setP1State] = useState<Character>({
    id: 1,
    name: '1P 白ボン',
    color: '#ffffff',
    accentColor: '#ef4444',
    isAI: false,
    x: TILE_SIZE,
    y: TILE_SIZE,
    vx: 0,
    vy: 0,
    direction: 'DOWN',
    isMoving: false,
    alive: true,
    invulnerableTime: 0,
    maxBombs: 1,
    activeBombs: 0,
    fireRange: 1,
    speed: 3.8,
    hasKick: false,
    hasPierce: false,
    kangaroo: null,
    animFrame: 0,
  });

  // Sudden death falling block step
  const suddenDeathIndexRef = useRef<number>(0);

  // Setup Stage / Round
  const initRound = useCallback((mode: GameMode, stageIdx: number = 0) => {
    const stageConf = STAGES[stageIdx] || STAGES[0];
    const map = generateStageMap(mode, stageConf.stageNumber);

    gridRef.current = map.grid;
    itemsRef.current = map.items;
    portalPosRef.current = map.portalPos;
    portalOpenRef.current = false;
    bombsRef.current = [];
    explosionsRef.current = [];
    suddenDeathIndexRef.current = 0;
    setSuddenDeathActive(false);
    setTimeRemaining(mode === 'BATTLE' ? 120 : stageConf.timeLimit);

    // Initialize Players with brisk arcade speed (3.8)
    const newPlayers: Character[] = [];
    // 1P: Top Left (1, 1)
    newPlayers.push({
      id: 1,
      name: '1P 白ボン',
      color: '#ffffff',
      accentColor: '#ef4444',
      isAI: false,
      x: TILE_SIZE,
      y: TILE_SIZE,
      vx: 0,
      vy: 0,
      direction: 'DOWN',
      isMoving: false,
      alive: true,
      invulnerableTime: 1000,
      maxBombs: 1,
      activeBombs: 0,
      fireRange: 1,
      speed: 3.8,
      hasKick: false,
      hasPierce: false,
      kangaroo: null,
      animFrame: 0,
    });

    if (mode === 'BATTLE') {
      // 2P: Top Right (13, 1)
      newPlayers.push({
        id: 2,
        name: isTwoPlayer ? '2P 水色ボン' : 'CPU 黒ボン',
        color: isTwoPlayer ? '#38bdf8' : '#1e293b',
        accentColor: '#38bdf8',
        isAI: !isTwoPlayer,
        isPlayer2: isTwoPlayer,
        x: (GRID_COLS - 2) * TILE_SIZE,
        y: TILE_SIZE,
        vx: 0,
        vy: 0,
        direction: 'DOWN',
        isMoving: false,
        alive: true,
        invulnerableTime: 1000,
        maxBombs: 1,
        activeBombs: 0,
        fireRange: 1,
        speed: 3.8,
        hasKick: false,
        hasPierce: false,
        kangaroo: null,
        animFrame: 0,
      });

      // 3P: Bottom Left (1, 11)
      newPlayers.push({
        id: 3,
        name: 'CPU 赤ボン',
        color: '#dc2626',
        accentColor: '#fbbf24',
        isAI: true,
        x: TILE_SIZE,
        y: (GRID_ROWS - 2) * TILE_SIZE,
        vx: 0,
        vy: 0,
        direction: 'UP',
        isMoving: false,
        alive: true,
        invulnerableTime: 1000,
        maxBombs: 1,
        activeBombs: 0,
        fireRange: 1,
        speed: 3.8,
        hasKick: false,
        hasPierce: false,
        kangaroo: null,
        animFrame: 0,
      });

      // 4P: Bottom Right (13, 11)
      newPlayers.push({
        id: 4,
        name: 'CPU 青ボン',
        color: '#2563eb',
        accentColor: '#60a5fa',
        isAI: true,
        x: (GRID_COLS - 2) * TILE_SIZE,
        y: (GRID_ROWS - 2) * TILE_SIZE,
        vx: 0,
        vy: 0,
        direction: 'UP',
        isMoving: false,
        alive: true,
        invulnerableTime: 1000,
        maxBombs: 1,
        activeBombs: 0,
        fireRange: 1,
        speed: 3.8,
        hasKick: false,
        hasPierce: false,
        kangaroo: null,
        animFrame: 0,
      });

      enemiesRef.current = [];
    } else {
      // Single Player Enemies
      const enemies: Enemy[] = [];
      const ec = stageConf.enemyCounts;

      // Find valid empty floor tiles for enemies away from spawn (1, 1)
      const validTiles: { x: number; y: number }[] = [];
      for (let y = 1; y < GRID_ROWS - 1; y++) {
        for (let x = 1; x < GRID_COLS - 1; x++) {
          if (map.grid[y][x] === TileType.EMPTY && (x > 3 || y > 3)) {
            validTiles.push({ x, y });
          }
        }
      }
      validTiles.sort(() => Math.random() - 0.5);

      const spawnEnemyType = (type: Enemy['type'], count: number, speed: number, hp: number) => {
        for (let i = 0; i < count && validTiles.length > 0; i++) {
          const pos = validTiles.pop()!;
          enemies.push({
            id: `enemy-${type}-${i}`,
            type,
            x: pos.x * TILE_SIZE,
            y: pos.y * TILE_SIZE,
            vx: 0,
            vy: 0,
            direction: ['UP', 'DOWN', 'LEFT', 'RIGHT'][Math.floor(Math.random() * 4)] as Direction,
            speed,
            hp,
            maxHp: hp,
            animFrame: 0,
            alive: true,
          });
        }
      };

      if (ec.SLIME) spawnEnemyType('SLIME', ec.SLIME, 1.2, 1);
      if (ec.BALLOON) spawnEnemyType('BALLOON', ec.BALLOON, 1.6, 1);
      if (ec.GHOST) spawnEnemyType('GHOST', ec.GHOST, 1.4, 1);
      if (ec.PATROL_BOT) spawnEnemyType('PATROL_BOT', ec.PATROL_BOT, 1.8, 2);

      // Boss
      if (ec.BOSS) {
        enemies.push({
          id: 'boss-mecha-king',
          type: 'BOSS',
          x: 7 * TILE_SIZE,
          y: 6 * TILE_SIZE,
          vx: 0,
          vy: 0,
          direction: 'DOWN',
          speed: 1.5,
          hp: 8,
          maxHp: 8,
          animFrame: 0,
          alive: true,
        });
      }

      enemiesRef.current = enemies;
    }

    playersRef.current = newPlayers;
    setP1State(newPlayers[0]);
  }, [isTwoPlayer]);

  // Start Game handler
  const handleStartGame = (
    mode: GameMode,
    options: { isTwoPlayer: boolean; targetWins: number; cpuDifficulty: 'NORMAL' | 'HARD' }
  ) => {
    setGameMode(mode);
    setIsTwoPlayer(options.isTwoPlayer);
    setTargetWins(options.targetWins);
    setCpuDifficulty(options.cpuDifficulty);

    if (mode === 'BATTLE') {
      setBattleScores([
        { playerId: 1, name: '1P 白ボン', color: '#ffffff', wins: 0 },
        { playerId: 2, name: options.isTwoPlayer ? '2P 水色ボン' : 'CPU 黒ボン', color: '#38bdf8', wins: 0 },
        { playerId: 3, name: 'CPU 赤ボン', color: '#ef4444', wins: 0 },
        { playerId: 4, name: 'CPU 青ボン', color: '#3b82f6', wins: 0 },
      ]);
      initRound('BATTLE');
    } else {
      setCurrentStageIndex(0);
      setSinglePlayerLives(3);
      setSinglePlayerScore(0);
      initRound('ADVENTURE', 0);
    }

    setGameStatus('PLAYING');
    setIsPaused(false);
    sound.startBGM();
  };

  // Keyboard & Interaction Event Listeners
  useEffect(() => {
    const handleUserInteraction = () => {
      sound.ensureAudioReady();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      sound.ensureAudioReady();

      // Prevent scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      keysDownRef.current.add(e.code);

      // Pause toggle
      if (e.code === 'KeyP' || e.code === 'Escape') {
        setIsPaused((prev) => !prev);
      }

      // 1P Plant Bomb (Space or KeyJ)
      if ((e.code === 'Space' || e.code === 'KeyJ') && gameStatus === 'PLAYING') {
        attemptPlantBomb(1);
      }

      // 1P Kangaroo Jump (KeyK or ShiftLeft)
      if ((e.code === 'KeyK' || e.code === 'ShiftLeft') && gameStatus === 'PLAYING') {
        attemptKangarooJump(1);
      }

      // 2P Plant Bomb (Numpad0 or Enter or KeyO)
      if (
        isTwoPlayer &&
        (e.code === 'Numpad0' || e.code === 'Enter' || e.code === 'KeyO') &&
        gameStatus === 'PLAYING'
      ) {
        attemptPlantBomb(2);
      }

      // 2P Kangaroo Jump (NumpadPeriod or KeyU)
      if (
        isTwoPlayer &&
        (e.code === 'NumpadDecimal' || e.code === 'KeyU') &&
        gameStatus === 'PLAYING'
      ) {
        attemptKangarooJump(2);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('pointerdown', handleUserInteraction);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('pointerdown', handleUserInteraction);
    };
  }, [gameStatus, isTwoPlayer]);

  // Kangaroo Jump Execution
  const attemptKangarooJump = (playerId: number) => {
    const player = playersRef.current.find((p) => p.id === playerId);
    if (!player || !player.alive || !player.kangaroo) return;
    if (player.kangaroo.jumpCooldown > 0 || player.kangaroo.isJumping) return;

    // Check tile in front
    const gx = Math.round(player.x / TILE_SIZE);
    const gy = Math.round(player.y / TILE_SIZE);

    let dx = 0;
    let dy = 0;
    if (player.direction === 'UP') dy = -1;
    if (player.direction === 'DOWN') dy = 1;
    if (player.direction === 'LEFT') dx = -1;
    if (player.direction === 'RIGHT') dx = 1;

    const targetX = gx + dx * 2;
    const targetY = gy + dy * 2;

    // Must leap over exactly 1 tile into a valid empty tile within arena
    if (
      targetX >= 1 &&
      targetX < GRID_COLS - 1 &&
      targetY >= 1 &&
      targetY < GRID_ROWS - 1
    ) {
      const targetTile = gridRef.current[targetY]?.[targetX];
      if (targetTile === TileType.EMPTY) {
        player.kangaroo.isJumping = true;
        player.kangaroo.jumpProgress = 0;
        player.kangaroo.jumpCooldown = 1200; // 1.2s cooldown
        sound.playKangarooHop();

        // Teleport destination target
        player.x = targetX * TILE_SIZE;
        player.y = targetY * TILE_SIZE;
      }
    }
  };

  // Plant Bomb Execution
  const attemptPlantBomb = (playerId: number) => {
    const player = playersRef.current.find((p) => p.id === playerId);
    if (!player || !player.alive) return;

    if (player.activeBombs >= player.maxBombs) return;

    const gx = Math.round(player.x / TILE_SIZE);
    const gy = Math.round(player.y / TILE_SIZE);

    // Cannot plant on existing bomb
    const bombExists = bombsRef.current.some(
      (b) => Math.round(b.pixelX / TILE_SIZE) === gx && Math.round(b.pixelY / TILE_SIZE) === gy
    );
    if (bombExists) return;

    // Check if any alive players are currently overlapping this bomb tile
    const bombPixelX = gx * TILE_SIZE;
    const bombPixelY = gy * TILE_SIZE;

    const overlappingPlayerIds = playersRef.current
      .filter((p) => {
        if (!p.alive) return false;
        const pLeft = p.x + 8;
        const pRight = p.x + TILE_SIZE - 8;
        const pTop = p.y + 8;
        const pBottom = p.y + TILE_SIZE - 8;
        return (
          pLeft < bombPixelX + TILE_SIZE &&
          pRight > bombPixelX &&
          pTop < bombPixelY + TILE_SIZE &&
          pBottom > bombPixelY
        );
      })
      .map((p) => p.id);

    if (!overlappingPlayerIds.includes(player.id)) {
      overlappingPlayerIds.push(player.id);
    }

    const newBomb: Bomb = {
      id: `bomb-${playerId}-${Date.now()}-${Math.random()}`,
      x: gx,
      y: gy,
      pixelX: bombPixelX,
      pixelY: bombPixelY,
      ownerId: player.id,
      range: player.fireRange,
      isPierce: player.hasPierce,
      timer: 2800,
      slidingSpeed: 0,
      passThroughPlayerIds: overlappingPlayerIds,
    };

    bombsRef.current.push(newBomb);
    player.activeBombs++;
    sound.playBombDrop();
  };

  // Explosion Detonation & Chain Reactions
  const detonateBomb = (bomb: Bomb) => {
    const bx = Math.round(bomb.pixelX / TILE_SIZE);
    const by = Math.round(bomb.pixelY / TILE_SIZE);

    sound.playExplosion();

    const flameTiles: Explosion['tiles'] = [
      { x: bx, y: by, type: 'center', timeRemaining: 450 },
    ];

    const dirs: { dx: number; dy: number; dir: 'up' | 'down' | 'left' | 'right' }[] = [
      { dx: 0, dy: -1, dir: 'up' },
      { dx: 0, dy: 1, dir: 'down' },
      { dx: -1, dy: 0, dir: 'left' },
      { dx: 1, dy: 0, dir: 'right' },
    ];

    for (const d of dirs) {
      for (let r = 1; r <= bomb.range; r++) {
        const nx = bx + d.dx * r;
        const ny = by + d.dy * r;

        if (nx < 0 || nx >= GRID_COLS || ny < 0 || ny >= GRID_ROWS) break;

        const tile = gridRef.current[ny][nx];

        // Indestructible steel wall stops all explosions
        if (tile === TileType.WALL) break;

        const isEnd = r === bomb.range;
        const flameType = `${d.dir}${isEnd ? '_end' : ''}` as Explosion['tiles'][0]['type'];
        flameTiles.push({ x: nx, y: ny, type: flameType, timeRemaining: 450 });

        // Destructible brick hit!
        if (tile === TileType.BRICK) {
          gridRef.current[ny][nx] = TileType.EMPTY;

          // Reveal hidden item if any
          const hiddenItem = itemsRef.current.find((i) => i.x === nx && i.y === ny && !i.revealed);
          if (hiddenItem) {
            hiddenItem.revealed = true;
            hiddenItem.spawnTime = Date.now();
          }

          // If not pierce bomb, explosion ray stops here!
          if (!bomb.isPierce) {
            break;
          }
        }
      }
    }

    explosionsRef.current.push({
      id: `exp-${Date.now()}-${Math.random()}`,
      tiles: flameTiles,
      createdAt: Date.now(),
      duration: 450,
    });

    // Check chain reaction on other bombs caught in flames
    const otherBombs = bombsRef.current.filter((b) => b.id !== bomb.id);
    for (const ob of otherBombs) {
      const obx = Math.round(ob.pixelX / TILE_SIZE);
      const oby = Math.round(ob.pixelY / TILE_SIZE);
      if (flameTiles.some((ft) => ft.x === obx && ft.y === oby)) {
        ob.timer = Math.min(ob.timer, 50); // explode instantly!
      }
    }
  };

  // Main 60FPS Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min(100, currentTime - lastTime);
      lastTime = currentTime;

      if (gameStatus === 'PLAYING' && !isPaused) {
        updateGame(dt);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameStatus, isPaused, gameMode, currentStageIndex]);

  // Update game state per tick
  const updateGame = (dt: number) => {
    // 1. Update Explosions
    explosionsRef.current = explosionsRef.current.filter((exp) => {
      const age = Date.now() - exp.createdAt;
      return age < exp.duration;
    });

    // 2. Update Bombs (Timers & Kicked Bomb Sliding)
    const activeBombs: Bomb[] = [];
    for (const bomb of bombsRef.current) {
      bomb.timer -= dt;

      // Handle Sliding if kicked
      if (bomb.slidingSpeed > 0 && bomb.slideDir) {
        let dx = 0;
        let dy = 0;
        if (bomb.slideDir === 'UP') dy = -1;
        if (bomb.slideDir === 'DOWN') dy = 1;
        if (bomb.slideDir === 'LEFT') dx = -1;
        if (bomb.slideDir === 'RIGHT') dx = 1;

        const nextPx = bomb.pixelX + dx * bomb.slidingSpeed;
        const nextPy = bomb.pixelY + dy * bomb.slidingSpeed;

        const checkGx = Math.round((nextPx + (dx > 0 ? 32 : dx < 0 ? 0 : 16)) / TILE_SIZE);
        const checkGy = Math.round((nextPy + (dy > 0 ? 32 : dy < 0 ? 0 : 16)) / TILE_SIZE);

        const obstacle =
          gridRef.current[checkGy]?.[checkGx] !== TileType.EMPTY ||
          bombsRef.current.some(
            (b) =>
              b.id !== bomb.id &&
              Math.round(b.pixelX / TILE_SIZE) === checkGx &&
              Math.round(b.pixelY / TILE_SIZE) === checkGy
          );

        if (obstacle) {
          // Stop sliding at current grid center
          bomb.slidingSpeed = 0;
          bomb.pixelX = Math.round(bomb.pixelX / TILE_SIZE) * TILE_SIZE;
          bomb.pixelY = Math.round(bomb.pixelY / TILE_SIZE) * TILE_SIZE;
        } else {
          bomb.pixelX = nextPx;
          bomb.pixelY = nextPy;
        }
      }

      if (bomb.timer <= 0) {
        detonateBomb(bomb);
        const owner = playersRef.current.find((p) => p.id === bomb.ownerId);
        if (owner) owner.activeBombs = Math.max(0, owner.activeBombs - 1);
      } else {
        activeBombs.push(bomb);
      }
    }
    bombsRef.current = activeBombs;

    // 3. Update Players & Kangaroo Cooldowns
    for (const player of playersRef.current) {
      if (!player.alive) {
        if (player.deathTimer && player.deathTimer > 0) {
          player.deathTimer -= dt;
        }
        continue;
      }

      if (player.invulnerableTime > 0) {
        player.invulnerableTime -= dt;
      }

      if (player.kangaroo) {
        if (player.kangaroo.jumpCooldown > 0) {
          player.kangaroo.jumpCooldown -= dt;
        }
        if (player.kangaroo.isJumping) {
          player.kangaroo.jumpProgress += 0.08;
          if (player.kangaroo.jumpProgress >= 1) {
            player.kangaroo.isJumping = false;
            player.kangaroo.jumpProgress = 0;
          }
        }
      }

      // Handle Movement Input
      if (player.id === 1) {
        handleHumanPlayerMovement(player, 1);
      } else if (player.isPlayer2) {
        handleHumanPlayerMovement(player, 2);
      } else if (player.isAI) {
        handleAIPlayer(player);
      }

      // Check Item Pickups
      for (let i = itemsRef.current.length - 1; i >= 0; i--) {
        const item = itemsRef.current[i];
        if (item.revealed) {
          const pgx = Math.round(player.x / TILE_SIZE);
          const pgy = Math.round(player.y / TILE_SIZE);

          if (pgx === item.x && pgy === item.y) {
            applyItemToPlayer(player, item.type);
            sound.playItemPickup();
            itemsRef.current.splice(i, 1);
          }
        }
      }

      // Check Damage from Explosions
      if (player.invulnerableTime <= 0) {
        const pgx = Math.round(player.x / TILE_SIZE);
        const pgy = Math.round(player.y / TILE_SIZE);

        for (const exp of explosionsRef.current) {
          if (exp.tiles.some((t) => t.x === pgx && t.y === pgy)) {
            hurtPlayer(player);
            break;
          }
        }
      }
    }

    // 4. Update Enemies (Adventure Mode)
    if (gameMode === 'ADVENTURE') {
      let livingEnemies = 0;
      for (const enemy of enemiesRef.current) {
        if (!enemy.alive) continue;
        livingEnemies++;

        handleEnemyMovement(enemy);

        // Check if enemy hit by explosion
        const egx = Math.round(enemy.x / TILE_SIZE);
        const egy = Math.round(enemy.y / TILE_SIZE);

        for (const exp of explosionsRef.current) {
          if (exp.tiles.some((t) => t.x === egx && t.y === egy)) {
            enemy.hp--;
            if (enemy.hp <= 0) {
              enemy.alive = false;
              sound.playExplosion();
              setSinglePlayerScore((s) => s + (enemy.type === 'BOSS' ? 5000 : 400));
            }
            break;
          }
        }

        // Check if enemy touches 1P
        const p1 = playersRef.current[0];
        if (p1 && p1.alive && p1.invulnerableTime <= 0) {
          const dist = Math.hypot(p1.x - enemy.x, p1.y - enemy.y);
          if (dist < TILE_SIZE * 0.7) {
            hurtPlayer(p1);
          }
        }
      }

      // Portal opens if all enemies defeated!
      if (livingEnemies === 0) {
        portalOpenRef.current = true;
      }

      // Check Stage Clear via Portal
      const p1 = playersRef.current[0];
      if (
        p1 &&
        p1.alive &&
        portalOpenRef.current &&
        portalPosRef.current
      ) {
        const pgx = Math.round(p1.x / TILE_SIZE);
        const pgy = Math.round(p1.y / TILE_SIZE);

        if (pgx === portalPosRef.current.x && pgy === portalPosRef.current.y) {
          // Stage Cleared!
          sound.playStageClear();
          if (currentStageIndex >= STAGES.length - 1) {
            setGameStatus('VICTORY');
          } else {
            setGameStatus('STAGE_CLEAR');
          }
        }
      }
    }

    // 5. Check Battle Mode End Condition
    if (gameMode === 'BATTLE') {
      const livingPlayers = playersRef.current.filter((p) => p.alive);
      if (livingPlayers.length <= 1) {
        const winner = livingPlayers[0];
        if (winner) {
          setRoundWinner({ name: winner.name, color: winner.color });
          setBattleScores((prev) =>
            prev.map((bs) =>
              bs.playerId === winner.id ? { ...bs, wins: bs.wins + 1 } : bs
            )
          );

          sound.playStageClear();

          // Check if overall match won
          const winnerTotalWins = (battleScores.find((b) => b.playerId === winner.id)?.wins || 0) + 1;
          if (winnerTotalWins >= targetWins) {
            setGameStatus('ROUND_WIN');
          } else {
            setGameStatus('ROUND_WIN');
          }
        } else {
          // Draw!
          setRoundWinner({ name: '引き分け (相打ち)', color: '#94a3b8' });
          setGameStatus('ROUND_WIN');
        }
      }
    }

    // Mirror 1P state to React state for HUD
    if (playersRef.current[0]) {
      setP1State({ ...playersRef.current[0] });
    }
  };

  // Hurt Player with Kangaroo Shield Protection!
  const hurtPlayer = (player: Character) => {
    // If mounted on Kangaroo, kangaroo absorbs the blow!
    if (player.kangaroo) {
      player.kangaroo = null;
      player.invulnerableTime = 1600; // grace period
      sound.playKangarooRescue();
      return;
    }

    // Otherwise, player loses a life
    player.alive = false;
    player.deathTimer = 1000;
    sound.playDeath();

    if (gameMode === 'ADVENTURE' && player.id === 1) {
      setSinglePlayerLives((l) => {
        const next = l - 1;
        if (next <= 0) {
          setGameStatus('GAME_OVER');
        } else {
          // Respawn after short delay
          setTimeout(() => {
            if (player) {
              player.alive = true;
              player.x = TILE_SIZE;
              player.y = TILE_SIZE;
              player.invulnerableTime = 2000;
            }
          }, 800);
        }
        return next;
      });
    }
  };

  // Apply picked-up item
  const applyItemToPlayer = (player: Character, type: ItemType) => {
    switch (type) {
      case ItemType.BOMB_UP:
        player.maxBombs = Math.min(8, player.maxBombs + 1);
        break;
      case ItemType.FIRE_UP:
        player.fireRange = Math.min(GRID_COLS, player.fireRange + 1);
        break;
      case ItemType.SPEED_UP:
        player.speed = Math.min(5.4, player.speed + 0.4);
        break;
      case ItemType.BOMB_KICK:
        player.hasKick = true;
        break;
      case ItemType.PIERCE_BOMB:
        player.hasPierce = true;
        break;
      case ItemType.KANGAROO_EGG:
        // Mount Kangaroo!
        player.kangaroo = {
          hasKangaroo: true,
          type: 'GREEN_HOPPER',
          jumpCooldown: 0,
          isJumping: false,
          jumpProgress: 0,
          jumpStartY: 0,
        };
        break;
    }
  };

  // Helper to check if player's hitbox overlaps a bomb tile
  const isPlayerOverlappingBomb = (p: Character, b: Bomb): boolean => {
    const margin = 8;
    const pLeft = p.x + margin;
    const pRight = p.x + TILE_SIZE - margin;
    const pTop = p.y + margin;
    const pBottom = p.y + TILE_SIZE - margin;

    const bLeft = b.pixelX;
    const bRight = b.pixelX + TILE_SIZE;
    const bTop = b.pixelY;
    const bBottom = b.pixelY + TILE_SIZE;

    return pLeft < bRight && pRight > bLeft && pTop < bBottom && pBottom > bTop;
  };

  // Helper to test if character can occupy a candidate position
  const canPlayerOccupy = (
    char: Character,
    posX: number,
    posY: number
  ): { valid: boolean; hitBomb?: Bomb } => {
    const margin = 8;
    const pLeft = posX + margin;
    const pRight = posX + TILE_SIZE - margin;
    const pTop = posY + margin;
    const pBottom = posY + TILE_SIZE - margin;

    // Check bounds
    if (
      pLeft < 0 ||
      pRight > GRID_COLS * TILE_SIZE ||
      pTop < 0 ||
      pBottom > GRID_ROWS * TILE_SIZE
    ) {
      return { valid: false };
    }

    // Check grid tiles
    const minGx = Math.floor(pLeft / TILE_SIZE);
    const maxGx = Math.floor((pRight - 0.01) / TILE_SIZE);
    const minGy = Math.floor(pTop / TILE_SIZE);
    const maxGy = Math.floor((pBottom - 0.01) / TILE_SIZE);

    for (let gy = minGy; gy <= maxGy; gy++) {
      for (let gx = minGx; gx <= maxGx; gx++) {
        if (gx < 0 || gx >= GRID_COLS || gy < 0 || gy >= GRID_ROWS) {
          return { valid: false };
        }
        if (gridRef.current[gy][gx] !== TileType.EMPTY) {
          return { valid: false };
        }
      }
    }

    // Check solid bombs (only bombs that player is NOT allowed to pass through)
    for (const b of bombsRef.current) {
      if (b.passThroughPlayerIds.includes(char.id)) {
        continue;
      }

      const bLeft = b.pixelX + 2;
      const bRight = b.pixelX + TILE_SIZE - 2;
      const bTop = b.pixelY + 2;
      const bBottom = b.pixelY + TILE_SIZE - 2;

      if (pLeft < bRight && pRight > bLeft && pTop < bBottom && pBottom > bTop) {
        return { valid: false, hitBomb: b };
      }
    }

    return { valid: true };
  };

  // Corner-sliding smooth player navigation
  const moveCharacter = (
    char: Character,
    requestedDir: Direction | null
  ) => {
    if (!requestedDir) {
      char.isMoving = false;
      // Update passThroughPlayerIds when stationary
      for (const b of bombsRef.current) {
        if (b.passThroughPlayerIds.includes(char.id)) {
          if (!isPlayerOverlappingBomb(char, b)) {
            b.passThroughPlayerIds = b.passThroughPlayerIds.filter((id) => id !== char.id);
          }
        }
      }
      return;
    }

    char.direction = requestedDir;
    char.isMoving = true;

    const speed = char.speed;
    let dx = 0;
    let dy = 0;

    if (requestedDir === 'UP') dy = -speed;
    if (requestedDir === 'DOWN') dy = speed;
    if (requestedDir === 'LEFT') dx = -speed;
    if (requestedDir === 'RIGHT') dx = speed;

    const directAttempt = canPlayerOccupy(char, char.x + dx, char.y + dy);

    if (directAttempt.valid) {
      char.x += dx;
      char.y += dy;

      // Auto-center on perpendicular axis (corner sliding alignment with jitter-free snapping)
      if (requestedDir === 'UP' || requestedDir === 'DOWN') {
        const targetX = Math.round(char.x / TILE_SIZE) * TILE_SIZE;
        const diffX = targetX - char.x;
        if (Math.abs(diffX) < 1.2) {
          char.x = targetX;
        } else if (Math.abs(diffX) <= 14) {
          const testX = char.x + Math.sign(diffX) * Math.min(Math.abs(diffX), 2);
          if (canPlayerOccupy(char, testX, char.y).valid) {
            char.x = testX;
          }
        }
      } else {
        const targetY = Math.round(char.y / TILE_SIZE) * TILE_SIZE;
        const diffY = targetY - char.y;
        if (Math.abs(diffY) < 1.2) {
          char.y = targetY;
        } else if (Math.abs(diffY) <= 14) {
          const testY = char.y + Math.sign(diffY) * Math.min(Math.abs(diffY), 2);
          if (canPlayerOccupy(char, char.x, testY).valid) {
            char.y = testY;
          }
        }
      }
    } else {
      // Blocked directly: check for corner sliding assist around obstacles
      if (requestedDir === 'UP' || requestedDir === 'DOWN') {
        const targetX = Math.round(char.x / TILE_SIZE) * TILE_SIZE;
        const diffX = targetX - char.x;
        if (Math.abs(diffX) > 0.5 && Math.abs(diffX) <= 16) {
          const slideStep = Math.sign(diffX) * Math.min(Math.abs(diffX), speed);
          if (canPlayerOccupy(char, char.x + slideStep, char.y).valid) {
            char.x += slideStep;
          }
        }
      } else {
        const targetY = Math.round(char.y / TILE_SIZE) * TILE_SIZE;
        const diffY = targetY - char.y;
        if (Math.abs(diffY) > 0.5 && Math.abs(diffY) <= 16) {
          const slideStep = Math.sign(diffY) * Math.min(Math.abs(diffY), speed);
          if (canPlayerOccupy(char, char.x, char.y + slideStep).valid) {
            char.y += slideStep;
          }
        }
      }

      // KICK MECHANIC: If blocked by a solid bomb and player has Bomb Kick item!
      if (directAttempt.hitBomb && char.hasKick && directAttempt.hitBomb.slidingSpeed === 0) {
        directAttempt.hitBomb.slidingSpeed = 7;
        directAttempt.hitBomb.slideDir = char.direction;
        sound.playKick();
      }
    }

    // Update passThroughPlayerIds after moving: if char completely stepped off bomb, remove permission
    for (const b of bombsRef.current) {
      if (b.passThroughPlayerIds.includes(char.id)) {
        if (!isPlayerOverlappingBomb(char, b)) {
          b.passThroughPlayerIds = b.passThroughPlayerIds.filter((id) => id !== char.id);
        }
      }
    }
  };

  // Human player input resolution
  const handleHumanPlayerMovement = (player: Character, playerNum: 1 | 2) => {
    let dir: Direction | null = null;
    const keys = keysDownRef.current;

    if (playerNum === 1) {
      // Touch or Keyboard
      if (touchDirRef.current) {
        dir = touchDirRef.current;
      } else if (keys.has('ArrowUp') || keys.has('KeyW')) {
        dir = 'UP';
      } else if (keys.has('ArrowDown') || keys.has('KeyS')) {
        dir = 'DOWN';
      } else if (keys.has('ArrowLeft') || keys.has('KeyA')) {
        dir = 'LEFT';
      } else if (keys.has('ArrowRight') || keys.has('KeyD')) {
        dir = 'RIGHT';
      }
    } else {
      // 2P Keyboard
      if (keys.has('Numpad8') || keys.has('KeyI')) {
        dir = 'UP';
      } else if (keys.has('Numpad5') || keys.has('Numpad2') || keys.has('KeyK')) {
        dir = 'DOWN';
      } else if (keys.has('Numpad4') || keys.has('KeyJ')) {
        dir = 'LEFT';
      } else if (keys.has('Numpad6') || keys.has('KeyL')) {
        dir = 'RIGHT';
      }
    }

    moveCharacter(player, dir);
  };

  // AI Bot logic per tick
  const handleAIPlayer = (bot: Character) => {
    const decision = computeBotDecision(
      bot,
      gridRef.current,
      bombsRef.current,
      itemsRef.current,
      playersRef.current
    );

    if (decision.plantBomb) {
      attemptPlantBomb(bot.id);
    }
    if (decision.kangarooJump) {
      attemptKangarooJump(bot.id);
    }

    moveCharacter(bot, decision.isMoving ? decision.direction || null : null);
  };

  // Wandering Enemy movement
  const handleEnemyMovement = (enemy: Enemy) => {
    const dirs: { [key in Direction]: { dx: number; dy: number } } = {
      UP: { dx: 0, dy: -1 },
      DOWN: { dx: 0, dy: 1 },
      LEFT: { dx: -1, dy: 0 },
      RIGHT: { dx: 1, dy: 0 },
    };

    const d = dirs[enemy.direction];
    const nx = enemy.x + d.dx * enemy.speed;
    const ny = enemy.y + d.dy * enemy.speed;

    const checkGx = Math.round((nx + (d.dx > 0 ? 32 : d.dx < 0 ? 4 : 18)) / TILE_SIZE);
    const checkGy = Math.round((ny + (d.dy > 0 ? 32 : d.dy < 0 ? 4 : 18)) / TILE_SIZE);

    const isGhost = enemy.type === 'GHOST';
    const tile = gridRef.current[checkGy]?.[checkGx];

    // Ghost can pass through soft bricks; others blocked by walls & bricks
    const blocked =
      tile === TileType.WALL ||
      (tile === TileType.BRICK && !isGhost) ||
      bombsRef.current.some(
        (b) => Math.round(b.pixelX / TILE_SIZE) === checkGx && Math.round(b.pixelY / TILE_SIZE) === checkGy
      );

    if (blocked || Math.random() < 0.02) {
      // Pick random new direction
      const allDirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
      enemy.direction = allDirs[Math.floor(Math.random() * allDirs.length)];
    } else {
      enemy.x = nx;
      enemy.y = ny;
    }
  };

  // Sudden Death Timer Interval
  useEffect(() => {
    if (gameStatus !== 'PLAYING' || isPaused) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1;

        // Sudden death start at 45 seconds in battle mode
        if (gameMode === 'BATTLE' && next <= 45 && !suddenDeathActive) {
          setSuddenDeathActive(true);
        }

        // Sudden death block drop
        if (gameMode === 'BATTLE' && next <= 40 && next > 0) {
          dropSuddenDeathBlock();
        }

        if (next <= 0) {
          // Time Up
          if (gameMode === 'BATTLE') {
            setRoundWinner({ name: '時間切れ (引き分け)', color: '#94a3b8' });
            setGameStatus('ROUND_WIN');
          } else {
            setGameStatus('GAME_OVER');
          }
          return 0;
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus, isPaused, gameMode, suddenDeathActive]);

  // Drop indestructible steel block in sudden death
  const dropSuddenDeathBlock = () => {
    // Spiral inward coords
    const perimeterCoords: { x: number; y: number }[] = [];
    for (let x = 1; x < GRID_COLS - 1; x++) perimeterCoords.push({ x, y: 1 });
    for (let y = 2; y < GRID_ROWS - 1; y++) perimeterCoords.push({ x: GRID_COLS - 2, y });
    for (let x = GRID_COLS - 3; x >= 1; x--) perimeterCoords.push({ x, y: GRID_ROWS - 2 });
    for (let y = GRID_ROWS - 3; y >= 2; y--) perimeterCoords.push({ x: 1, y });

    const target = perimeterCoords[suddenDeathIndexRef.current % perimeterCoords.length];
    if (target && gridRef.current[target.y]) {
      gridRef.current[target.y][target.x] = TileType.WALL;
      sound.playExplosion();

      // Squashes any player standing there
      for (const p of playersRef.current) {
        if (
          Math.round(p.x / TILE_SIZE) === target.x &&
          Math.round(p.y / TILE_SIZE) === target.y
        ) {
          p.kangaroo = null;
          p.alive = false;
        }
      }
    }
    suddenDeathIndexRef.current++;
  };

  // Next Round / Stage handlers
  const handleNextRound = () => {
    initRound('BATTLE');
    setGameStatus('PLAYING');
  };

  const handleNextStage = () => {
    const nextIdx = currentStageIndex + 1;
    setCurrentStageIndex(nextIdx);
    initRound('ADVENTURE', nextIdx);
    setGameStatus('PLAYING');
  };

  const handleRetry = () => {
    if (gameMode === 'BATTLE') {
      setBattleScores((prev) => prev.map((bs) => ({ ...bs, wins: 0 })));
      initRound('BATTLE');
    } else {
      setSinglePlayerLives(3);
      initRound('ADVENTURE', currentStageIndex);
    }
    setGameStatus('PLAYING');
  };

  const handleReturnToTitle = () => {
    setGameStatus('TITLE');
    sound.stopBGM();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Bar Contract: Single text wordmark, 4-6 nav links, 1-2 actions */}
      <header className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800/90 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <a href="/" className="text-lg font-extrabold tracking-tight text-white font-['DotGothic16'] flex items-center gap-2">
          <span>💣</span>
          <span className="text-amber-400">ボンバーアリーナ</span>
        </a>

        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
          <button
            onClick={() => {
              if (gameStatus === 'TITLE') setGameMode('BATTLE');
            }}
            className="hover:text-amber-300 transition-colors cursor-pointer"
          >
            対戦モード
          </button>
          <button
            onClick={() => {
              if (gameStatus === 'TITLE') setGameMode('ADVENTURE');
            }}
            className="hover:text-emerald-300 transition-colors cursor-pointer"
          >
            一人用アドベンチャー
          </button>
          <button
            onClick={() => setIsGuideOpen(true)}
            className="hover:text-sky-300 transition-colors cursor-pointer"
          >
            アイテム・カンガルー説明
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsGuideOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
          >
            マニュアル
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 max-w-7xl mx-auto w-full">
        {gameStatus === 'TITLE' ? (
          <TitleScreen
            onStartGame={handleStartGame}
            onOpenGuide={() => setIsGuideOpen(true)}
          />
        ) : (
          <div className="w-full flex flex-col items-center">
            {/* Retro Arcade HUD */}
            <HUD
              mode={gameMode}
              stageNumber={STAGES[currentStageIndex]?.stageNumber || 1}
              timeRemaining={timeRemaining}
              player={p1State}
              battleScores={battleScores}
              isMuted={isMuted}
              bgmMuted={bgmMuted}
              isPaused={isPaused}
              onToggleMute={() => {
                const muted = sound.toggleMute();
                setIsMuted(muted);
              }}
              onToggleBgm={() => {
                const playing = sound.toggleBgm();
                setBgmMuted(!playing);
              }}
              onTogglePause={() => setIsPaused((prev) => !prev)}
              onOpenGuide={() => setIsGuideOpen(true)}
              onExitToTitle={handleReturnToTitle}
              singlePlayerLives={singlePlayerLives}
              singlePlayerScore={singlePlayerScore}
            />

            {/* Game Canvas */}
            <GameCanvas
              grid={gridRef.current}
              players={playersRef.current}
              enemies={enemiesRef.current}
              bombs={bombsRef.current}
              explosions={explosionsRef.current}
              items={itemsRef.current}
              portalPos={portalPosRef.current}
              portalOpen={portalOpenRef.current}
              mode={gameMode}
              stageTheme={STAGES[currentStageIndex]?.theme}
              suddenDeathActive={suddenDeathActive}
            />

            {/* Virtual Touch D-Pad & Actions for Mobile */}
            <TouchControls
              onDirectionChange={(dir) => {
                touchDirRef.current = dir;
              }}
              onPlantBomb={() => attemptPlantBomb(1)}
              onKangarooJump={() => attemptKangarooJump(1)}
              hasKangaroo={!!p1State.kangaroo}
            />
          </div>
        )}
      </main>

      {/* Item & Kangaroo Manual Modal */}
      <ItemGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* Round / Match / Stage End Modals */}
      {gameStatus === 'ROUND_WIN' && (
        <GameOverModal
          type={
            battleScores.some((b) => b.wins >= targetWins)
              ? 'MATCH_WIN'
              : 'ROUND_WIN'
          }
          winnerName={roundWinner?.name || '1P'}
          winnerColor={roundWinner?.color || '#ffffff'}
          battleScores={battleScores}
          targetWins={targetWins}
          onNextRound={handleNextRound}
          onRetry={handleRetry}
          onReturnTitle={handleReturnToTitle}
        />
      )}

      {gameStatus === 'STAGE_CLEAR' && (
        <GameOverModal
          type="STAGE_CLEAR"
          stageNumber={STAGES[currentStageIndex]?.stageNumber || 1}
          score={singlePlayerScore}
          onNextStage={handleNextStage}
          onReturnTitle={handleReturnToTitle}
        />
      )}

      {gameStatus === 'GAME_OVER' && (
        <GameOverModal
          type="GAME_OVER"
          score={singlePlayerScore}
          onRetry={handleRetry}
          onReturnTitle={handleReturnToTitle}
        />
      )}

      {gameStatus === 'VICTORY' && (
        <GameOverModal
          type="ALL_CLEAR"
          score={singlePlayerScore}
          onReturnTitle={handleReturnToTitle}
        />
      )}
    </div>
  );
}
