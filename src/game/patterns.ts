import { Bullet, ItemKind, ItemPickup, TelegraphMarker } from './types';

let nextEntityId = 1;
export function allocId(): number {
  return nextEntityId++;
}

function randomEdgePoint(width: number, height: number, margin = 18): { x: number; y: number; inwardAngle: number } {
  const side = Math.floor(Math.random() * 4);
  if (side === 0) {
    // Top
    const x = margin + Math.random() * Math.max(40, width - margin * 2);
    return { x, y: -12, inwardAngle: Math.PI / 2 };
  }
  if (side === 1) {
    // Right
    const y = margin + Math.random() * Math.max(40, height - margin * 2);
    return { x: width + 12, y, inwardAngle: Math.PI };
  }
  if (side === 2) {
    // Bottom
    const x = margin + Math.random() * Math.max(40, width - margin * 2);
    return { x, y: height + 12, inwardAngle: -Math.PI / 2 };
  }
  // Left
  const y = margin + Math.random() * Math.max(40, height - margin * 2);
  return { x: -12, y, inwardAngle: 0 };
}

function clampSafeEmitter(
  width: number,
  height: number,
  playerX: number,
  playerY: number,
  minDist = 180,
): { x: number; y: number } {
  for (let i = 0; i < 8; i++) {
    const x = 60 + Math.random() * Math.max(80, width - 120);
    const y = 60 + Math.random() * Math.max(80, height - 120);
    const dx = x - playerX;
    const dy = y - playerY;
    if (dx * dx + dy * dy >= minDist * minDist) {
      return { x, y };
    }
  }
  return {
    x: playerX < width / 2 ? width - 70 : 70,
    y: playerY < height / 2 ? height - 70 : 70,
  };
}

export function spawnAimedFan(
  width: number,
  height: number,
  playerX: number,
  playerY: number,
  wave: number,
  speedMult: number,
): { bullets: Bullet[]; telegraphs: TelegraphMarker[] } {
  const origin = randomEdgePoint(width, height);
  const baseAngle = Math.atan2(playerY - origin.y, playerX - origin.x);
  const count = Math.min(9, 3 + Math.floor(wave / 2) * 2);
  const spread = Math.min(0.95, 0.34 + wave * 0.05);
  const speed = (220 + Math.min(180, wave * 16)) * speedMult;

  const bullets: Bullet[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1) - 0.5;
    const angle = baseAngle + t * spread;
    bullets.push({
      id: allocId(),
      x: origin.x,
      y: origin.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      ax: 0,
      ay: 0,
      radius: 5.5,
      kind: 'AIMED',
      color: '#F59E0B',
      coreColor: '#FEF3C7',
      angle,
      grazed: false,
      age: 0,
    });
  }

  const telegraphs: TelegraphMarker[] = [
    {
      x: Math.max(12, Math.min(width - 12, origin.x)),
      y: Math.max(12, Math.min(height - 12, origin.y)),
      targetX: origin.x + Math.cos(baseAngle) * 70,
      targetY: origin.y + Math.sin(baseAngle) * 70,
      color: '#F59E0B',
      age: 0,
      duration: 0.35,
      kind: 'LINE',
    },
  ];

  return { bullets, telegraphs };
}

export function spawnRadialRing(
  width: number,
  height: number,
  playerX: number,
  playerY: number,
  wave: number,
  speedMult: number,
): { bullets: Bullet[]; telegraphs: TelegraphMarker[] } {
  const origin = clampSafeEmitter(width, height, playerX, playerY, 190);
  const count = Math.min(26, 12 + wave * 2);
  const speed = (165 + Math.min(140, wave * 12)) * speedMult;
  const phase = Math.random() * Math.PI * 2;

  const bullets: Bullet[] = [];
  for (let i = 0; i < count; i++) {
    const angle = phase + (i / count) * Math.PI * 2;
    bullets.push({
      id: allocId(),
      x: origin.x,
      y: origin.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      ax: 0,
      ay: 0,
      radius: 5.5,
      kind: 'RING',
      color: '#F43F5E',
      coreColor: '#FFE4E6',
      angle,
      grazed: false,
      age: 0,
    });
  }

  const telegraphs: TelegraphMarker[] = [
    {
      x: origin.x,
      y: origin.y,
      targetX: origin.x,
      targetY: origin.y,
      color: '#F43F5E',
      age: 0,
      duration: 0.45,
      kind: 'RING',
    },
  ];

  return { bullets, telegraphs };
}

export function spawnCrossfireLanes(
  width: number,
  height: number,
  wave: number,
  speedMult: number,
): Bullet[] {
  const horizontal = Math.random() < 0.5;
  const count = Math.min(12, 6 + Math.floor(wave / 2));
  const speed = (240 + Math.min(160, wave * 14)) * speedMult;
  const bullets: Bullet[] = [];

  if (horizontal) {
    const fromLeft = Math.random() < 0.5;
    const step = height / (count + 1);
    const offset = (Math.random() - 0.5) * step * 0.6;
    for (let i = 1; i <= count; i++) {
      const y = step * i + offset;
      const x = fromLeft ? -14 : width + 14;
      const vx = fromLeft ? speed : -speed;
      bullets.push({
        id: allocId(),
        x,
        y,
        vx,
        vy: 0,
        ax: fromLeft ? 45 * speedMult : -45 * speedMult,
        ay: 0,
        radius: 5,
        kind: 'DART',
        color: '#EC4899',
        coreColor: '#FCE7F3',
        angle: fromLeft ? 0 : Math.PI,
        grazed: false,
        age: 0,
        maxSpeed: speed * 1.45,
      });
    }
  } else {
    const fromTop = Math.random() < 0.5;
    const step = width / (count + 1);
    const offset = (Math.random() - 0.5) * step * 0.6;
    for (let i = 1; i <= count; i++) {
      const x = step * i + offset;
      const y = fromTop ? -14 : height + 14;
      const vy = fromTop ? speed : -speed;
      bullets.push({
        id: allocId(),
        x,
        y,
        vx: 0,
        vy,
        ax: 0,
        ay: fromTop ? 45 * speedMult : -45 * speedMult,
        radius: 5,
        kind: 'DART',
        color: '#EC4899',
        coreColor: '#FCE7F3',
        angle: fromTop ? Math.PI / 2 : -Math.PI / 2,
        grazed: false,
        age: 0,
        maxSpeed: speed * 1.45,
      });
    }
  }

  return bullets;
}

export function spawnSpiralStep(
  originX: number,
  originY: number,
  armCount: number,
  baseAngle: number,
  speed: number,
): Bullet[] {
  const bullets: Bullet[] = [];
  for (let i = 0; i < armCount; i++) {
    const angle = baseAngle + (i / armCount) * Math.PI * 2;
    bullets.push({
      id: allocId(),
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      ax: 0,
      ay: 0,
      radius: 5,
      kind: 'SPIRAL',
      color: '#A78BFA',
      coreColor: '#EDE9FE',
      angle,
      grazed: false,
      age: 0,
    });
  }
  return bullets;
}

export function spawnCornerSweep(
  width: number,
  height: number,
  wave: number,
  speedMult: number,
): Bullet[] {
  const cornerPair = Math.random() < 0.5 ? 0 : 1;
  const corners =
    cornerPair === 0
      ? [
          { x: 14, y: 14, baseAngle: Math.PI * 0.25 },
          { x: width - 14, y: height - 14, baseAngle: -Math.PI * 0.75 },
        ]
      : [
          { x: width - 14, y: 14, baseAngle: Math.PI * 0.75 },
          { x: 14, y: height - 14, baseAngle: -Math.PI * 0.25 },
        ];

  const countPerCorner = Math.min(9, 4 + Math.floor(wave / 2));
  const speed = (195 + Math.min(130, wave * 11)) * speedMult;
  const bullets: Bullet[] = [];

  for (const c of corners) {
    for (let i = 0; i < countPerCorner; i++) {
      const offset = (i / Math.max(1, countPerCorner - 1) - 0.5) * 1.1;
      const angle = c.baseAngle + offset;
      bullets.push({
        id: allocId(),
        x: c.x,
        y: c.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        ax: 0,
        ay: 0,
        radius: 5.5,
        kind: 'ORB',
        color: '#FB7185',
        coreColor: '#FFF1F2',
        angle,
        grazed: false,
        age: 0,
      });
    }
  }
  return bullets;
}

export function spawnItemAmidstBarrage(
  width: number,
  height: number,
  bullets: Bullet[],
  hp: number,
  maxHp: number,
  hasShield: boolean,
): ItemPickup {
  // Choose item type weighted by player situation
  const roll = Math.random();
  let kind: ItemKind = 'SCORE_STAR';
  if (hp < maxHp && roll < 0.14) {
    kind = 'HEAL';
  } else if (!hasShield && roll < 0.34) {
    kind = 'SHIELD';
  } else if (bullets.length >= 22 && roll < 0.50) {
    kind = 'CLEAR_BOMB';
  } else if (roll < 0.64) {
    kind = 'SLOW_FIELD';
  } else {
    kind = 'SCORE_STAR';
  }

  // Prefer spawning near the middle of active bullets so items live *inside* the barrage
  let spawnX = width * (0.2 + Math.random() * 0.6);
  let spawnY = height * (0.2 + Math.random() * 0.6);

  const interiorBullets = bullets.filter(
    (b) => b.x > 80 && b.x < width - 80 && b.y > 80 && b.y < height - 80,
  );
  if (interiorBullets.length > 0) {
    const anchor = interiorBullets[Math.floor(Math.random() * interiorBullets.length)];
    spawnX = Math.max(70, Math.min(width - 70, anchor.x + (Math.random() - 0.5) * 80));
    spawnY = Math.max(70, Math.min(height - 70, anchor.y + (Math.random() - 0.5) * 80));
  }

  const driftAngle = Math.random() * Math.PI * 2;
  const driftSpeed = 28 + Math.random() * 24;

  return {
    id: allocId(),
    x: spawnX,
    y: spawnY,
    vx: Math.cos(driftAngle) * driftSpeed,
    vy: Math.sin(driftAngle) * driftSpeed,
    radius: 15,
    kind,
    age: 0,
    lifetime: 9.5,
    pulsePhase: Math.random() * Math.PI * 2,
  };
}
