import React, { useRef, useEffect } from 'react';
import {
  Bomb,
  Character,
  Enemy,
  Explosion,
  Item,
  ItemType,
  TileType,
  GameMode,
} from '../types/game';
import { GRID_COLS, GRID_ROWS, TILE_SIZE } from '../utils/mapGenerator';

interface GameCanvasProps {
  grid: TileType[][];
  players: Character[];
  enemies: Enemy[];
  bombs: Bomb[];
  explosions: Explosion[];
  items: Item[];
  portalPos?: { x: number; y: number };
  portalOpen: boolean;
  mode: GameMode;
  stageTheme?: 'GARDEN' | 'VOLCANO' | 'TECH' | 'BOSS';
  suddenDeathActive: boolean;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  grid,
  players,
  enemies,
  bombs,
  explosions,
  items,
  portalPos,
  portalOpen,
  mode,
  stageTheme = 'GARDEN',
  suddenDeathActive,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = GRID_COLS * TILE_SIZE;
    const height = GRID_ROWS * TILE_SIZE;

    ctx.save();

    // 1. Draw Floor Tile Background
    drawFloor(ctx, width, height, stageTheme);

    // 2. Draw Hidden Portal Exit
    if (portalPos) {
      drawPortal(ctx, portalPos.x, portalPos.y, portalOpen);
    }

    // 3. Draw Items
    for (const item of items) {
      if (item.revealed) {
        drawItem(ctx, item);
      }
    }

    // 4. Draw Maze Tiles (Walls & Bricks)
    drawGridTiles(ctx, grid, stageTheme);

    // 5. Draw Bombs
    for (const bomb of bombs) {
      drawBomb(ctx, bomb);
    }

    // 6. Draw Explosions
    for (const exp of explosions) {
      drawExplosion(ctx, exp);
    }

    // 7. Draw Enemies
    for (const enemy of enemies) {
      if (enemy.alive) {
        drawEnemy(ctx, enemy);
      }
    }

    // 8. Draw Players & Kangaroos
    for (const player of players) {
      if (player.alive) {
        drawPlayer(ctx, player);
      } else if (player.deathTimer && player.deathTimer > 0) {
        drawDeadPlayer(ctx, player);
      }
    }

    // 9. Sudden Death Alert Banner
    if (suddenDeathActive) {
      drawSuddenDeathOverlay(ctx, width, height);
    }

    ctx.restore();
  }, [
    grid,
    players,
    enemies,
    bombs,
    explosions,
    items,
    portalPos,
    portalOpen,
    stageTheme,
    suddenDeathActive,
  ]);

  return (
    <div className="relative flex items-center justify-center p-2 rounded-2xl bg-slate-900/90 shadow-2xl border border-slate-700/60 overflow-hidden">
      <canvas
        ref={canvasRef}
        width={GRID_COLS * TILE_SIZE}
        height={GRID_ROWS * TILE_SIZE}
        className="block max-w-full h-auto rounded-lg shadow-inner bg-slate-950 image-rendering-pixelated"
        style={{
          aspectRatio: `${GRID_COLS} / ${GRID_ROWS}`,
          maxHeight: 'min(70vh, 680px)',
        }}
      />
    </div>
  );
};

// Floor rendering with theme palettes
function drawFloor(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  theme: string
) {
  let lightColor = '#22c55e20';
  let darkColor = '#15803d15';
  let bgBase = '#0f291e';

  if (theme === 'VOLCANO') {
    bgBase = '#27110c';
    lightColor = '#ea580c20';
    darkColor = '#9a341215';
  } else if (theme === 'TECH' || theme === 'BOSS') {
    bgBase = '#091528';
    lightColor = '#3b82f618';
    darkColor = '#1d4ed812';
  }

  ctx.fillStyle = bgBase;
  ctx.fillRect(0, 0, width, height);

  // Checkerboard subtle pattern
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? lightColor : darkColor;
      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

      // Fine grid dots
      ctx.fillStyle = '#ffffff08';
      ctx.fillRect(x * TILE_SIZE + 1, y * TILE_SIZE + 1, 2, 2);
    }
  }
}

// Portal rendering
function drawPortal(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  isOpen: boolean
) {
  const px = gx * TILE_SIZE;
  const py = gy * TILE_SIZE;
  const now = Date.now();

  ctx.save();
  ctx.fillStyle = isOpen ? '#3b82f6' : '#475569';
  ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);

  // Glowing portal circle
  const cx = px + TILE_SIZE / 2;
  const cy = py + TILE_SIZE / 2;

  const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 18);
  if (isOpen) {
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, '#60a5fa');
    grad.addColorStop(1, '#1e3a8a');
  } else {
    grad.addColorStop(0, '#94a3b8');
    grad.addColorStop(1, '#334155');
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.fill();

  // Spiral swirl if open
  if (isOpen) {
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const rot = (now / 200) % (Math.PI * 2);
    ctx.arc(cx, cy, 8, rot, rot + Math.PI);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px DotGothic16, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', cx, py + TILE_SIZE - 6);
  } else {
    // Lock symbol
    ctx.fillStyle = '#f8fafc';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔒', cx, cy);
  }

  ctx.restore();
}

// Draw Solid Walls and Destructible Bricks
function drawGridTiles(
  ctx: CanvasRenderingContext2D,
  grid: TileType[][],
  theme: string
) {
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      const tile = grid[y][x];
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;

      if (tile === TileType.WALL) {
        drawSolidWall(ctx, px, py, theme);
      } else if (tile === TileType.BRICK) {
        drawSoftBrick(ctx, px, py, theme);
      }
    }
  }
}

function drawSolidWall(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  theme: string
) {
  ctx.save();
  // 3D Metallic / Stone Pillar
  let topColor = '#64748b';
  let sideColor = '#334155';
  let borderColor = '#1e293b';

  if (theme === 'VOLCANO') {
    topColor = '#78350f';
    sideColor = '#451a03';
    borderColor = '#291003';
  } else if (theme === 'TECH') {
    topColor = '#0284c7';
    sideColor = '#0369a1';
    borderColor = '#082f49';
  }

  // Base shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(px, py + TILE_SIZE - 4, TILE_SIZE, 6);

  // Pillar Body
  ctx.fillStyle = sideColor;
  ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);

  // Top Face
  ctx.fillStyle = topColor;
  ctx.fillRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 12);

  // Bevel highlight
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(px + 3, py + 3, TILE_SIZE - 6, 2);
  ctx.fillRect(px + 3, py + 3, 2, TILE_SIZE - 12);

  // 4 Corner bolts
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(px + 6, py + 6, 3, 3);
  ctx.fillRect(px + TILE_SIZE - 9, py + 6, 3, 3);
  ctx.fillRect(px + 6, py + TILE_SIZE - 15, 3, 3);
  ctx.fillRect(px + TILE_SIZE - 9, py + TILE_SIZE - 15, 3, 3);

  // Border outline
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);

  ctx.restore();
}

function drawSoftBrick(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  theme: string
) {
  ctx.save();
  let brickColor = '#b45309';
  let brickLight = '#d97706';
  let mortarColor = '#78350f';

  if (theme === 'VOLCANO') {
    brickColor = '#dc2626';
    brickLight = '#f87171';
    mortarColor = '#7f1d1d';
  } else if (theme === 'TECH') {
    brickColor = '#0d9488';
    brickLight = '#2dd4bf';
    mortarColor = '#134e4a';
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(px + 2, py + TILE_SIZE - 3, TILE_SIZE - 4, 4);

  // Mortar background
  ctx.fillStyle = mortarColor;
  ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);

  // Row 1 bricks
  ctx.fillStyle = brickColor;
  ctx.fillRect(px + 4, py + 4, 18, 9);
  ctx.fillRect(px + 25, py + 4, 19, 9);

  // Row 2 bricks
  ctx.fillRect(px + 4, py + 16, 9, 9);
  ctx.fillRect(px + 16, py + 16, 18, 9);
  ctx.fillRect(px + 37, py + 16, 7, 9);

  // Row 3 bricks
  ctx.fillRect(px + 4, py + 28, 18, 9);
  ctx.fillRect(px + 25, py + 28, 19, 9);

  // Brick highlight
  ctx.fillStyle = brickLight;
  ctx.fillRect(px + 5, py + 5, 16, 2);
  ctx.fillRect(px + 26, py + 5, 17, 2);
  ctx.fillRect(px + 17, py + 17, 16, 2);

  ctx.restore();
}

// Items rendering with bouncing animation
function drawItem(ctx: CanvasRenderingContext2D, item: Item) {
  const px = item.x * TILE_SIZE;
  const py = item.y * TILE_SIZE;
  const time = Date.now() / 150;
  const bounceY = Math.sin(time) * 3;

  ctx.save();
  ctx.translate(px + TILE_SIZE / 2, py + TILE_SIZE / 2 + bounceY);

  // Item base tile aura
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.stroke();

  switch (item.type) {
    case ItemType.BOMB_UP: {
      // Black bomb with '+1'
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-1, 2, 9, 0, Math.PI * 2);
      ctx.fill();

      // Bomb fuse & spark
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-2, -10, 3, 4);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-0.5, -11, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // + text
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+1', 0, 3);
      break;
    }

    case ItemType.FIRE_UP: {
      // Fiery Flame
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.bezierCurveTo(8, -5, 11, 4, 0, 11);
      ctx.bezierCurveTo(-11, 4, -8, -5, 0, -11);
      ctx.fill();

      // Inner yellow core
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.bezierCurveTo(4, -2, 6, 3, 0, 8);
      ctx.bezierCurveTo(-6, 3, -4, -2, 0, -6);
      ctx.fill();
      break;
    }

    case ItemType.SPEED_UP: {
      // Roller Skate / Winged Boot
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(-9, -2, 18, 7);
      ctx.beginPath();
      ctx.arc(9, 1, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Wheels
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(-6, 8, 3.5, 0, Math.PI * 2);
      ctx.arc(6, 8, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-6, 8, 1.5, 0, Math.PI * 2);
      ctx.arc(6, 8, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Wing
      ctx.fillStyle = '#67e8f9';
      ctx.beginPath();
      ctx.moveTo(-7, -2);
      ctx.lineTo(-12, -9);
      ctx.lineTo(-4, -6);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case ItemType.BOMB_KICK: {
      // Boxing boot kicking bomb
      ctx.fillStyle = '#dc2626';
      // Boot
      ctx.beginPath();
      ctx.moveTo(-9, -8);
      ctx.lineTo(-4, -8);
      ctx.lineTo(-4, 0);
      ctx.lineTo(5, 0);
      ctx.lineTo(7, 6);
      ctx.lineTo(-9, 6);
      ctx.closePath();
      ctx.fill();

      // Small kicked bomb
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(9, -2, 4.5, 0, Math.PI * 2);
      ctx.fill();
      // Motion lines
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(3, -6);
      ctx.lineTo(8, -8);
      ctx.stroke();
      break;
    }

    case ItemType.PIERCE_BOMB: {
      // Penetrating Pierce Bomb: spiked iron bomb
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();

      // Golden spikes around circumference
      ctx.fillStyle = '#fbbf24';
      const spikes = 6;
      for (let s = 0; s < spikes; s++) {
        const ang = (s * Math.PI * 2) / spikes;
        const sx = Math.cos(ang) * 11;
        const sy = Math.sin(ang) * 11;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('P', 0, 1);
      break;
    }

    case ItemType.KANGAROO_EGG: {
      // Kangaroo Egg with cute kangaroo silhouette / spots
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Kangaroo pouch spots
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(-2, -3, 3, 0, Math.PI * 2);
      ctx.arc(3, 4, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Boxing gloves icon
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, 1, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}

// Bomb rendering with squash & stretch and sparking fuse
function drawBomb(ctx: CanvasRenderingContext2D, bomb: Bomb) {
  const px = bomb.pixelX;
  const py = bomb.pixelY;
  const cx = px + TILE_SIZE / 2;
  const cy = py + TILE_SIZE / 2;

  // Pulse animation as timer gets closer to 0
  const progress = Math.max(0, 1 - bomb.timer / 2800);
  const pulseScale = 1 + Math.sin(Date.now() / 80) * 0.08 * (1 + progress * 2);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(pulseScale, pulseScale);

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 14, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // If Pierce Bomb, draw spiked ring
  if (bomb.isPierce) {
    ctx.fillStyle = '#f59e0b';
    const spikes = 8;
    for (let i = 0; i < spikes; i++) {
      const ang = (i * Math.PI * 2) / spikes + Date.now() / 400;
      const sx = Math.cos(ang) * 17;
      const sy = Math.sin(ang) * 17;
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Bomb spherical body
  const grad = ctx.createRadialGradient(-4, -4, 2, 0, 0, 15);
  if (bomb.isPierce) {
    grad.addColorStop(0, '#f87171');
    grad.addColorStop(0.7, '#b91c1c');
    grad.addColorStop(1, '#450a0a');
  } else {
    grad.addColorStop(0, '#475569');
    grad.addColorStop(0.6, '#0f172a');
    grad.addColorStop(1, '#020617');
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 1, 14, 0, Math.PI * 2);
  ctx.fill();

  // Highlight shine
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.arc(-4, -5, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Neck
  ctx.fillStyle = '#64748b';
  ctx.fillRect(-3, -16, 6, 4);

  // Burning Fuse & Spark
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.quadraticCurveTo(4, -20, 2, -23);
  ctx.stroke();

  // Spark flare
  const sparkColors = ['#f59e0b', '#ef4444', '#facc15', '#ffffff'];
  const sparkColor = sparkColors[Math.floor(Math.random() * sparkColors.length)];
  ctx.fillStyle = sparkColor;
  ctx.beginPath();
  ctx.arc(2, -23, 3 + Math.random() * 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Explosions
function drawExplosion(ctx: CanvasRenderingContext2D, exp: Explosion) {
  const age = Date.now() - exp.createdAt;
  const progress = Math.min(1, age / exp.duration);
  const alpha = Math.sin(progress * Math.PI);

  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);

  for (const tile of exp.tiles) {
    const px = tile.x * TILE_SIZE;
    const py = tile.y * TILE_SIZE;
    const cx = px + TILE_SIZE / 2;
    const cy = py + TILE_SIZE / 2;

    // Fiery blast gradient
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, TILE_SIZE / 2);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#fde047');
    grad.addColorStop(0.7, '#f97316');
    grad.addColorStop(1, '#dc262600');

    ctx.fillStyle = grad;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // Blast flame tendrils
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(cx, cy, (TILE_SIZE / 3) * (0.8 + Math.random() * 0.4), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// Player Character (with Kangaroo mount support!)
function drawPlayer(ctx: CanvasRenderingContext2D, player: Character) {
  const px = player.x;
  const py = player.y;

  ctx.save();

  // Invulnerability blink
  if (player.invulnerableTime > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(px + TILE_SIZE / 2, py + TILE_SIZE - 4, 13, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // If riding Kangaroo!
  if (player.kangaroo) {
    drawKangarooWithRider(ctx, player);
  } else {
    // Normal Bomber on foot
    drawBomber(ctx, player);
  }

  ctx.restore();
}

function drawBomber(ctx: CanvasRenderingContext2D, player: Character) {
  const cx = player.x + TILE_SIZE / 2;
  const cy = player.y + TILE_SIZE / 2;

  ctx.save();
  ctx.translate(cx, cy);

  // Feet - alternating steps cleanly without body shaking
  ctx.fillStyle = '#dc2626'; // Red boots
  const footOffset = player.isMoving
    ? Math.floor(Date.now() / 140) % 2 === 0
      ? 2.5
      : -2.5
    : 0;

  ctx.beginPath();
  ctx.ellipse(-7, 14 + footOffset, 5, 3.5, 0, 0, Math.PI * 2);
  ctx.ellipse(7, 14 - footOffset, 5, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body Suit
  ctx.fillStyle = player.color; // Suit color (white, black, red, blue)
  ctx.beginPath();
  ctx.ellipse(0, 6, 11, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Belt & Buckle
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-9, 8, 18, 3);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(-3, 7.5, 6, 4);

  // Head (Helmet)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, -6, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Antenna pom-pom
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(0, -23);
  ctx.stroke();
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(0, -24, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Face Visor / Eyes (only if not facing UP)
  if (player.direction !== 'UP') {
    ctx.fillStyle = '#fbcfe8'; // Soft peach skin
    ctx.beginPath();
    ctx.ellipse(0, -5, 8.5, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes based on direction
    ctx.fillStyle = '#0f172a';
    let eyeX = 0;
    if (player.direction === 'LEFT') eyeX = -3;
    if (player.direction === 'RIGHT') eyeX = 3;

    ctx.fillRect(-4 + eyeX, -7, 2.5, 5);
    ctx.fillRect(1.5 + eyeX, -7, 2.5, 5);
    // Rosy cheeks
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(-5 + eyeX, -2, 2, 0, Math.PI * 2);
    ctx.arc(4.5 + eyeX, -2, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Player 1 marker badge
  if (player.id === 1) {
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 9px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('1P', 0, -29);
  } else if (player.isPlayer2) {
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('2P', 0, -29);
  }

  ctx.restore();
}

// Kangaroo Mount with Rider (4-Way Directional & Rock Solid, No Shaking)
function drawKangarooWithRider(ctx: CanvasRenderingContext2D, player: Character) {
  const k = player.kangaroo!;
  const cx = player.x + TILE_SIZE / 2;
  const cy = player.y + TILE_SIZE / 2;

  // Jump hop parabolic offset - ONLY active during actual kangaroo leap!
  const jumpOffset = k.isJumping ? Math.sin(k.jumpProgress * Math.PI) * 28 : 0;

  ctx.save();
  ctx.translate(cx, cy - jumpOffset);

  // Stepping feet alternation without body shaking
  const step = player.isMoving ? (Math.floor(Date.now() / 150) % 2 === 0 ? 3 : -3) : 0;

  if (player.direction === 'LEFT' || player.direction === 'RIGHT') {
    // === SIDE PROFILE (FACING LEFT / RIGHT) ===
    ctx.save();
    if (player.direction === 'LEFT') {
      ctx.scale(-1, 1); // Flip horizontally to face left!
    }

    // 1. Long Kangaroo Tail (curling backwards to the left)
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, 10);
    ctx.quadraticCurveTo(-18, 14, -20, 2);
    ctx.stroke();

    // 2. Kangaroo Back Leg (springy hind leg)
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(-3, 11, 7, 5, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Feet (large foot stepping forward)
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.ellipse(2 + step, 17, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Kangaroo Body
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(0, 6, 12, 10, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 4. Belly / Pouch in front
    ctx.fillStyle = '#bbf7d0';
    ctx.beginPath();
    ctx.ellipse(5, 7, 6, 7, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 5. Kangaroo Head (facing right)
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(4, -4, 8, 7, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Snout
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(10, -2, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#14532d'; // Nose
    ctx.beginPath();
    ctx.arc(14, -2.5, 2, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(5, -6, 2.5, 3.5);

    // Cute long ears tilted back
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(-3, -13, 3, 8, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.ellipse(-3, -13, 1.5, 5, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // 6. Boxing Glove (front paw reaching forward)
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(12, 4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 7. Rider sitting on saddle facing sideways
    ctx.save();
    ctx.translate(-4, -13);

    // Rider Helmet
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -4, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Visor facing right
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.ellipse(3, -4, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(4, -5, 2, 3); // Eye looking right!

    // Antenna on helmet
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -16, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.restore();
  } else if (player.direction === 'UP') {
    // === BACK VIEW (FACING UP) ===
    // Kangaroo Tail pointing down
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(0, 20);
    ctx.stroke();

    // Feet
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(-8, 16 + step, 5, 3.5, 0, 0, Math.PI * 2);
    ctx.ellipse(8, 16 - step, 5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Kangaroo Back Body
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(0, 7, 13, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Ears pointing straight up
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(-5, -12, 3, 8, -0.1, 0, Math.PI * 2);
    ctx.ellipse(5, -12, 3, 8, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Back of Rider Helmet
    ctx.save();
    ctx.translate(0, -14);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -5, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Antenna
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -17, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    // === FRONT VIEW (FACING DOWN) ===
    // Kangaroo Tail
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-4, 12);
    ctx.quadraticCurveTo(-14, 15, -16, 8);
    ctx.stroke();

    // Kangaroo Body
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(0, 8, 13, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pouch
    ctx.fillStyle = '#bbf7d0';
    ctx.beginPath();
    ctx.ellipse(0, 10, 8, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Feet
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(-9, 17 + step, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.ellipse(9, 17 - step, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Boxing Gloves on sides
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(-11, 6, 5, 0, Math.PI * 2);
    ctx.arc(11, 6, 5, 0, Math.PI * 2);
    ctx.fill();

    // Kangaroo Head & Ears
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(0, -2, 8, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(-6, -11, 3, 7, -0.2, 0, Math.PI * 2);
    ctx.ellipse(6, -11, 3, 7, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.ellipse(-6, -11, 1.5, 5, -0.2, 0, Math.PI * 2);
    ctx.ellipse(6, -11, 1.5, 5, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Eyes & Snout
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-4, -3, 2, 3);
    ctx.fillRect(2, -3, 2, 3);
    ctx.fillStyle = '#14532d';
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Rider Bomber
    ctx.save();
    ctx.translate(0, -14);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -5, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Visor
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.ellipse(0, -4, 6, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-3, -5, 1.5, 3.5);
    ctx.fillRect(1.5, -5, 1.5, 3.5);

    // Antenna
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -17, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Kangaroo Mount Text Tag
  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 8px DotGothic16, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ルーイ騎乗中', 0, -34);

  ctx.restore();
}

function drawDeadPlayer(ctx: CanvasRenderingContext2D, player: Character) {
  const cx = player.x + TILE_SIZE / 2;
  const cy = player.y + TILE_SIZE / 2;
  const alpha = Math.max(0, (player.deathTimer || 0) / 1000);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);

  // Angel wings floating up
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, -10, 8, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Halo
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -22, 10, 3, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Floating ghost trail
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.moveTo(-6, -6);
  ctx.lineTo(6, -6);
  ctx.lineTo(4, 10);
  ctx.lineTo(-4, 10);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// Enemy Monster rendering
function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  const cx = enemy.x + TILE_SIZE / 2;
  const cy = enemy.y + TILE_SIZE / 2;
  const wobble = Math.sin(Date.now() / 100) * 2;

  ctx.save();
  ctx.translate(cx, cy + wobble);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 14, 12, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  switch (enemy.type) {
    case 'SLIME': {
      // Squishy orange slime
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(-12, 12);
      ctx.quadraticCurveTo(-14, -6, 0, -10);
      ctx.quadraticCurveTo(14, -6, 12, 12);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#c2410c';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Shiny highlight
      ctx.fillStyle = '#fdba74';
      ctx.beginPath();
      ctx.arc(-4, -4, 3, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-6, 0, 3, 4);
      ctx.fillRect(3, 0, 3, 4);
      break;
    }

    case 'BALLOON': {
      // Menacing red balloon
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, -1, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Sharp fangs
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-5, 4);
      ctx.lineTo(-2, 8);
      ctx.lineTo(1, 4);
      ctx.lineTo(4, 8);
      ctx.lineTo(7, 4);
      ctx.fill();

      // Angry eyes
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(-5, -3, 3.5, 0, Math.PI * 2);
      ctx.arc(5, -3, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-4, -4, 2, 2.5);
      ctx.fillRect(4, -4, 2, 2.5);
      break;
    }

    case 'GHOST': {
      // Ethereal purple phantom
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(0, -4, 12, Math.PI, 0, false);
      ctx.lineTo(12, 10);
      ctx.lineTo(6, 6);
      ctx.lineTo(0, 11);
      ctx.lineTo(-6, 6);
      ctx.lineTo(-12, 10);
      ctx.closePath();
      ctx.fill();

      // Glowing cyan eyes
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(-4, -4, 3, 0, Math.PI * 2);
      ctx.arc(4, -4, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'PATROL_BOT': {
      // Tech armored patrol bot
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-11, -10, 22, 20);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.strokeRect(-11, -10, 22, 20);

      // Red laser visor
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-8, -4, 16, 4);

      // Caterpillar tracks
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-13, 8, 26, 6);
      break;
    }

    case 'BOSS': {
      // Giant Mecha Boss
      ctx.scale(1.4, 1.4);
      ctx.fillStyle = '#475569';
      ctx.fillRect(-14, -14, 28, 28);
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-14, -14, 28, 28);

      // Boss Horns
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(-12, -14);
      ctx.lineTo(-16, -22);
      ctx.lineTo(-8, -14);
      ctx.moveTo(8, -14);
      ctx.lineTo(16, -22);
      ctx.lineTo(12, -14);
      ctx.fill();

      // Big core eye
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      // HP Bar above boss
      const hpPercent = Math.max(0, enemy.hp / enemy.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(-18, -28, 36, 5);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-17, -27, 34 * hpPercent, 3);
      break;
    }
  }

  ctx.restore();
}

function drawSuddenDeathOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.save();
  const time = Date.now() / 200;
  if (Math.sin(time) > 0) {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, width - 4, height - 4);

    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 16px DotGothic16, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚠️ SUDDEN DEATH !! 警告: 鉄球ブロック落下中 ⚠️', width / 2, 22);
  }
  ctx.restore();
}
