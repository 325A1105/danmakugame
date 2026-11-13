export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type Difficulty = 'EASY' | 'NORMAL' | 'HARD';

export interface DifficultyConfig {
  id: Difficulty;
  label: string;
  subtitle: string;
  initialHp: number;
  maxHp: number;
  speedMultiplier: number;
  spawnRateMultiplier: number;
  scoreMultiplier: number;
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  EASY: {
    id: 'EASY',
    label: 'イージー',
    subtitle: 'ライフ 4 · 弾速 0.8x',
    initialHp: 4,
    maxHp: 5,
    speedMultiplier: 0.8,
    spawnRateMultiplier: 0.85,
    scoreMultiplier: 0.8,
  },
  NORMAL: {
    id: 'NORMAL',
    label: 'ノーマル',
    subtitle: 'ライフ 3 · 標準速度',
    initialHp: 3,
    maxHp: 4,
    speedMultiplier: 1.0,
    spawnRateMultiplier: 1.0,
    scoreMultiplier: 1.0,
  },
  HARD: {
    id: 'HARD',
    label: 'ハード',
    subtitle: 'ライフ 2 · 弾速 1.22x',
    initialHp: 2,
    maxHp: 3,
    speedMultiplier: 1.22,
    spawnRateMultiplier: 1.25,
    scoreMultiplier: 1.5,
  },
};

export type BulletKind = 'ORB' | 'AIMED' | 'SPIRAL' | 'DART' | 'RING';

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  radius: number;
  kind: BulletKind;
  color: string;
  coreColor: string;
  angle: number;
  grazed: boolean;
  age: number;
  maxSpeed?: number;
}

export type ItemKind = 'SCORE_STAR' | 'SHIELD' | 'CLEAR_BOMB' | 'SLOW_FIELD' | 'HEAL';

export interface ItemPickup {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  kind: ItemKind;
  age: number;
  lifetime: number;
  pulsePhase: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}

export interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface TelegraphMarker {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  age: number;
  duration: number;
  kind: 'LINE' | 'RING';
}

export interface HudSnapshot {
  score: number;
  highScore: number;
  multiplier: number;
  grazeCount: number;
  elapsedSeconds: number;
  wave: number;
  hp: number;
  maxHp: number;
  hasShield: boolean;
  slowRemaining: number;
  itemsCollected: number;
}

export interface RunSummary {
  score: number;
  highScore: number;
  isNewHighScore: boolean;
  elapsedSeconds: number;
  wave: number;
  grazeCount: number;
  maxMultiplier: number;
  itemsCollected: number;
  difficulty: Difficulty;
}
