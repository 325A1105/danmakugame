import React, { useEffect, useRef } from 'react';
import {
  spawnAimedFan,
  spawnCornerSweep,
  spawnCrossfireLanes,
  spawnItemAmidstBarrage,
  spawnRadialRing,
  spawnSpiralStep,
} from '../game/patterns';
import { sound } from '../game/sound';
import {
  Bullet,
  DIFFICULTY_CONFIGS,
  Difficulty,
  FloatingText,
  GameState,
  HudSnapshot,
  ItemPickup,
  Particle,
  RunSummary,
  Shockwave,
  TelegraphMarker,
} from '../game/types';

interface DanmakuCanvasProps {
  gameState: GameState;
  difficulty: Difficulty;
  highScore: number;
  runId: number;
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onGameOver: (summary: RunSummary) => void;
}

interface SpiralEmitter {
  x: number;
  y: number;
  angle: number;
  arms: number;
  speed: number;
  ticksLeft: number;
  tickTimer: number;
  spinSpeed: number;
}

const PLAYER_CORE_RADIUS = 4.5;
const PLAYER_VISUAL_RADIUS = 13;
const PLAYER_GRAZE_RADIUS = 26;
const PLAYER_PICKUP_RADIUS = 22;

export const DanmakuCanvas: React.FC<DanmakuCanvasProps> = ({
  gameState,
  difficulty,
  highScore,
  runId,
  onHudUpdate,
  onGameOver,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameStateRef = useRef<GameState>(gameState);
  const difficultyRef = useRef<Difficulty>(difficulty);
  const highScoreRef = useRef<number>(highScore);
  const onHudUpdateRef = useRef(onHudUpdate);
  const onGameOverRef = useRef(onGameOver);

  gameStateRef.current = gameState;
  difficultyRef.current = difficulty;
  highScoreRef.current = highScore;
  onHudUpdateRef.current = onHudUpdate;
  onGameOverRef.current = onGameOver;

  // Mutable simulation state inside ref for 60fps zero-allocation loop
  const simRef = useRef({
    width: 960,
    height: 600,
    playerX: 480,
    playerY: 300,
    trail: [] as { x: number; y: number; alpha: number }[],
    bullets: [] as Bullet[],
    items: [] as ItemPickup[],
    particles: [] as Particle[],
    shockwaves: [] as Shockwave[],
    floatingTexts: [] as FloatingText[],
    telegraphs: [] as TelegraphMarker[],
    spirals: [] as SpiralEmitter[],
    score: 0,
    multiplier: 1.0,
    maxMultiplier: 1.0,
    grazeCount: 0,
    itemsCollected: 0,
    elapsedSeconds: 0,
    wave: 1,
    hp: 3,
    maxHp: 4,
    hasShield: false,
    invulnRemaining: 0,
    slowRemaining: 0,
    shakeTime: 0,
    shakeMagnitude: 0,
    patternCooldown: 0.7,
    itemCooldown: 5.5,
    ambientTimer: 0,
    ambientAngle: 0,
    hudSyncTimer: 0,
    multiplierDecayGrace: 0,
    lastRunId: -1,
    hasEnded: false,
  });

  // Reset simulation whenever a new runId starts
  useEffect(() => {
    const sim = simRef.current;
    if (sim.lastRunId === runId) return;
    sim.lastRunId = runId;

    const cfg = DIFFICULTY_CONFIGS[difficulty];
    sim.bullets = [];
    sim.items = [];
    sim.particles = [];
    sim.shockwaves = [];
    sim.floatingTexts = [];
    sim.telegraphs = [];
    sim.spirals = [];
    sim.trail = [];
    sim.score = 0;
    sim.multiplier = 1.0;
    sim.maxMultiplier = 1.0;
    sim.grazeCount = 0;
    sim.itemsCollected = 0;
    sim.elapsedSeconds = 0;
    sim.wave = 1;
    sim.hp = cfg.initialHp;
    sim.maxHp = cfg.maxHp;
    sim.hasShield = false;
    sim.invulnRemaining = 1.0;
    sim.slowRemaining = 0;
    sim.shakeTime = 0;
    sim.shakeMagnitude = 0;
    sim.patternCooldown = 0.65;
    sim.itemCooldown = 5.0;
    sim.multiplierDecayGrace = 0;
    sim.hasEnded = false;

    onHudUpdateRef.current({
      score: 0,
      highScore: highScoreRef.current,
      multiplier: 1.0,
      grazeCount: 0,
      elapsedSeconds: 0,
      wave: 1,
      hp: cfg.initialHp,
      maxHp: cfg.maxHp,
      hasShield: false,
      slowRemaining: 0,
      itemsCollected: 0,
    });
  }, [runId, difficulty]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const prevW = simRef.current.width;
      const prevH = simRef.current.height;
      simRef.current.width = rect.width;
      simRef.current.height = rect.height;

      if (prevW === 960 && prevH === 600 && simRef.current.elapsedSeconds === 0) {
        simRef.current.playerX = rect.width / 2;
        simRef.current.playerY = rect.height / 2;
      } else {
        simRef.current.playerX = Math.max(14, Math.min(rect.width - 14, simRef.current.playerX));
        simRef.current.playerY = Math.max(14, Math.min(rect.height - 14, simRef.current.playerY));
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(canvas);

    const spawnBurstParticles = (x: number, y: number, color: string, count: number, speed = 140) => {
      const sim = simRef.current;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const mag = speed * (0.35 + Math.random() * 0.85);
        const maxLife = 0.35 + Math.random() * 0.35;
        sim.particles.push({
          x,
          y,
          vx: Math.cos(angle) * mag,
          vy: Math.sin(angle) * mag,
          radius: 1.8 + Math.random() * 2.4,
          color,
          alpha: 1,
          life: maxLife,
          maxLife,
        });
      }
    };

    const addFloatingText = (x: number, y: number, text: string, color: string) => {
      simRef.current.floatingTexts.push({
        x,
        y,
        vy: -42,
        text,
        color,
        life: 0.95,
        maxLife: 0.95,
      });
    };

    const clearBulletsInRadius = (cx: number, cy: number, radius: number, awardPoints: boolean) => {
      const sim = simRef.current;
      const rSq = radius * radius;
      let cleared = 0;
      sim.bullets = sim.bullets.filter((b) => {
        const dx = b.x - cx;
        const dy = b.y - cy;
        if (dx * dx + dy * dy <= rSq) {
          cleared++;
          if (cleared % 2 === 0) {
            spawnBurstParticles(b.x, b.y, b.color, 3, 95);
          }
          return false;
        }
        return true;
      });
      if (awardPoints && cleared > 0) {
        sim.score += cleared * 35 * sim.multiplier;
      }
      return cleared;
    };

    let rafId = 0;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(0.05, Math.max(0.001, rawDt));

      const sim = simRef.current;
      const state = gameStateRef.current;
      const cfg = DIFFICULTY_CONFIGS[difficultyRef.current];

      if (state === 'TITLE_MENU') {
        // Gentle ambient danmaku demo in background
        sim.ambientTimer -= dt;
        sim.ambientAngle += dt * 1.4;
        if (sim.ambientTimer <= 0) {
          sim.ambientTimer = 0.24;
          const cx = sim.width / 2;
          const cy = sim.height / 2;
          const spawned = spawnSpiralStep(cx, cy, 4, sim.ambientAngle, 125);
          sim.bullets.push(...spawned);
        }
        for (let i = sim.bullets.length - 1; i >= 0; i--) {
          const b = sim.bullets[i];
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.age += dt;
          if (b.x < -40 || b.x > sim.width + 40 || b.y < -40 || b.y > sim.height + 40) {
            sim.bullets.splice(i, 1);
          }
        }
      } else if (state === 'PLAYING' && !sim.hasEnded) {
        // 1. Update timers and wave progression
        sim.elapsedSeconds += dt;
        const nextWave = 1 + Math.floor(sim.elapsedSeconds / 15);
        if (nextWave > sim.wave) {
          sim.wave = nextWave;
          const waveBonus = Math.round(250 * sim.wave * cfg.scoreMultiplier);
          sim.score += waveBonus;
          sound.playWaveUp();
          addFloatingText(sim.width / 2, 76, `WAVE ${sim.wave}  +${waveBonus}`, '#38BDF8');
        }

        if (sim.invulnRemaining > 0) {
          sim.invulnRemaining = Math.max(0, sim.invulnRemaining - dt);
        }
        if (sim.slowRemaining > 0) {
          sim.slowRemaining = Math.max(0, sim.slowRemaining - dt);
        }
        if (sim.shakeTime > 0) {
          sim.shakeTime = Math.max(0, sim.shakeTime - dt);
        }

        // Multiplier gentle decay if not grazing or collecting
        if (sim.multiplierDecayGrace > 0) {
          sim.multiplierDecayGrace -= dt;
        } else if (sim.multiplier > 1.0) {
          sim.multiplier = Math.max(1.0, sim.multiplier - dt * 0.14);
        }

        // Passive survival points
        sim.score += 65 * sim.multiplier * cfg.scoreMultiplier * dt;

        // Trail for player cursor
        sim.trail.push({ x: sim.playerX, y: sim.playerY, alpha: 0.55 });
        if (sim.trail.length > 10) sim.trail.shift();
        for (const t of sim.trail) {
          t.alpha *= 0.84;
        }

        // 2. Pattern Spawning
        sim.patternCooldown -= dt;
        if (sim.patternCooldown <= 0) {
          const baseInterval = Math.max(0.46, 1.38 - sim.wave * 0.085);
          sim.patternCooldown = baseInterval / cfg.spawnRateMultiplier;

          const roll = Math.random();
          if (roll < 0.30) {
            const { bullets, telegraphs } = spawnAimedFan(
              sim.width,
              sim.height,
              sim.playerX,
              sim.playerY,
              sim.wave,
              cfg.speedMultiplier,
            );
            sim.bullets.push(...bullets);
            sim.telegraphs.push(...telegraphs);
          } else if (roll < 0.56) {
            const { bullets, telegraphs } = spawnRadialRing(
              sim.width,
              sim.height,
              sim.playerX,
              sim.playerY,
              sim.wave,
              cfg.speedMultiplier,
            );
            sim.bullets.push(...bullets);
            sim.telegraphs.push(...telegraphs);
          } else if (roll < 0.76) {
            const bullets = spawnCrossfireLanes(sim.width, sim.height, sim.wave, cfg.speedMultiplier);
            sim.bullets.push(...bullets);
          } else if (roll < 0.90) {
            const bullets = spawnCornerSweep(sim.width, sim.height, sim.wave, cfg.speedMultiplier);
            sim.bullets.push(...bullets);
          } else {
            // Spiral emitter near an edge
            const edgeLeft = Math.random() < 0.5;
            sim.spirals.push({
              x: edgeLeft ? 48 : sim.width - 48,
              y: 80 + Math.random() * Math.max(80, sim.height - 160),
              angle: Math.random() * Math.PI * 2,
              arms: Math.min(6, 3 + Math.floor(sim.wave / 3)),
              speed: (165 + sim.wave * 10) * cfg.speedMultiplier,
              ticksLeft: 8,
              tickTimer: 0,
              spinSpeed: (edgeLeft ? 1 : -1) * 0.38,
            });
          }
        }

        // Active spiral emitters
        for (let i = sim.spirals.length - 1; i >= 0; i--) {
          const sp = sim.spirals[i];
          sp.tickTimer -= dt;
          if (sp.tickTimer <= 0) {
            sp.tickTimer = 0.14;
            sp.ticksLeft--;
            sp.angle += sp.spinSpeed;
            sim.bullets.push(...spawnSpiralStep(sp.x, sp.y, sp.arms, sp.angle, sp.speed));
          }
          if (sp.ticksLeft <= 0) {
            sim.spirals.splice(i, 1);
          }
        }

        // 3. Item Spawning amidst the barrage
        sim.itemCooldown -= dt;
        if (sim.itemCooldown <= 0) {
          sim.itemCooldown = 5.5 + Math.random() * 3.5;
          if (sim.items.length < 3) {
            sim.items.push(
              spawnItemAmidstBarrage(
                sim.width,
                sim.height,
                sim.bullets,
                sim.hp,
                sim.maxHp,
                sim.hasShield,
              ),
            );
          }
        }

        // 4. Update Bullets & Check Graze / Collision
        const bulletTimeScale = sim.slowRemaining > 0 ? 0.42 : 1.0;
        const bDt = dt * bulletTimeScale;

        for (let i = sim.bullets.length - 1; i >= 0; i--) {
          const b = sim.bullets[i];
          b.vx += b.ax * bDt;
          b.vy += b.ay * bDt;
          if (b.maxSpeed) {
            const spd = Math.hypot(b.vx, b.vy);
            if (spd > b.maxSpeed) {
              b.vx = (b.vx / spd) * b.maxSpeed;
              b.vy = (b.vy / spd) * b.maxSpeed;
            }
          }
          b.x += b.vx * bDt;
          b.y += b.vy * bDt;
          b.age += dt;

          // Out of bounds cull
          if (b.x < -50 || b.x > sim.width + 50 || b.y < -50 || b.y > sim.height + 50) {
            sim.bullets.splice(i, 1);
            continue;
          }

          const dx = b.x - sim.playerX;
          const dy = b.y - sim.playerY;
          const distSq = dx * dx + dy * dy;

          // Hit check
          const hitDist = PLAYER_CORE_RADIUS + b.radius * 0.78;
          if (distSq <= hitDist * hitDist) {
            if (sim.invulnRemaining <= 0) {
              sim.bullets.splice(i, 1);
              if (sim.hasShield) {
                sim.hasShield = false;
                sim.invulnRemaining = 1.0;
                sim.shakeTime = 0.2;
                sim.shakeMagnitude = 5;
                sound.playShieldBreak();
                sim.shockwaves.push({
                  x: sim.playerX,
                  y: sim.playerY,
                  radius: 14,
                  maxRadius: 190,
                  color: '#10B981',
                  alpha: 0.95,
                });
                clearBulletsInRadius(sim.playerX, sim.playerY, 190, true);
                spawnBurstParticles(sim.playerX, sim.playerY, '#10B981', 18, 200);
                addFloatingText(sim.playerX, sim.playerY - 20, 'バリア展開！', '#34D399');
              } else {
                sim.hp -= 1;
                sim.invulnRemaining = 1.6;
                sim.multiplier = Math.max(1.0, Number((sim.multiplier * 0.5).toFixed(2)));
                sim.shakeTime = 0.28;
                sim.shakeMagnitude = 8;

                if (sim.hp <= 0) {
                  sim.hp = 0;
                  sim.hasEnded = true;
                  sound.playGameOver();
                  spawnBurstParticles(sim.playerX, sim.playerY, '#F43F5E', 34, 240);
                  const finalScore = Math.floor(sim.score);
                  const prevHigh = highScoreRef.current;
                  const nextHigh = Math.max(prevHigh, finalScore);
                  onHudUpdateRef.current({
                    score: finalScore,
                    highScore: nextHigh,
                    multiplier: sim.multiplier,
                    grazeCount: sim.grazeCount,
                    elapsedSeconds: sim.elapsedSeconds,
                    wave: sim.wave,
                    hp: 0,
                    maxHp: sim.maxHp,
                    hasShield: false,
                    slowRemaining: sim.slowRemaining,
                    itemsCollected: sim.itemsCollected,
                  });
                  onGameOverRef.current({
                    score: finalScore,
                    highScore: nextHigh,
                    isNewHighScore: finalScore > prevHigh && finalScore > 0,
                    elapsedSeconds: sim.elapsedSeconds,
                    wave: sim.wave,
                    grazeCount: sim.grazeCount,
                    maxMultiplier: Number(sim.maxMultiplier.toFixed(1)),
                    itemsCollected: sim.itemsCollected,
                    difficulty: difficultyRef.current,
                  });
                  break;
                } else {
                  sound.playHit();
                  sim.shockwaves.push({
                    x: sim.playerX,
                    y: sim.playerY,
                    radius: 14,
                    maxRadius: 210,
                    color: '#F43F5E',
                    alpha: 0.95,
                  });
                  clearBulletsInRadius(sim.playerX, sim.playerY, 210, false);
                  spawnBurstParticles(sim.playerX, sim.playerY, '#F43F5E', 22, 220);
                  addFloatingText(sim.playerX, sim.playerY - 22, '被弾！', '#FB7185');
                }
              }
            }
            continue;
          }

          // Graze check
          if (!b.grazed) {
            const grazeDist = PLAYER_GRAZE_RADIUS + b.radius;
            if (distSq <= grazeDist * grazeDist) {
              b.grazed = true;
              sim.grazeCount += 1;
              sim.multiplier = Math.min(5.0, Number((sim.multiplier + 0.08).toFixed(2)));
              sim.maxMultiplier = Math.max(sim.maxMultiplier, sim.multiplier);
              sim.multiplierDecayGrace = 2.4;
              sim.score += 30 * sim.multiplier * cfg.scoreMultiplier;
              sound.playGraze();
              spawnBurstParticles(
                (sim.playerX + b.x) * 0.5,
                (sim.playerY + b.y) * 0.5,
                '#38BDF8',
                3,
                90,
              );
            }
          }
        }

        // 5. Update Items & Pickups
        for (let i = sim.items.length - 1; i >= 0; i--) {
          const item = sim.items[i];
          item.age += dt;
          item.pulsePhase += dt * 4;
          item.x += item.vx * dt;
          item.y += item.vy * dt;

          // Gentle bounce inside arena margins
          if (item.x < 40 || item.x > sim.width - 40) item.vx *= -1;
          if (item.y < 40 || item.y > sim.height - 40) item.vy *= -1;
          item.x = Math.max(36, Math.min(sim.width - 36, item.x));
          item.y = Math.max(36, Math.min(sim.height - 36, item.y));

          if (item.age >= item.lifetime) {
            sim.items.splice(i, 1);
            continue;
          }

          const dx = item.x - sim.playerX;
          const dy = item.y - sim.playerY;
          const dist = Math.hypot(dx, dy);

          // Subtle magnetic pull when close
          if (dist < 76 && dist > 1) {
            const pull = (1 - dist / 76) * 210 * dt;
            item.x -= (dx / dist) * pull;
            item.y -= (dy / dist) * pull;
          }

          if (dist <= PLAYER_PICKUP_RADIUS + item.radius) {
            sim.items.splice(i, 1);
            sim.itemsCollected += 1;
            sim.multiplierDecayGrace = 3.0;

            if (item.kind === 'SCORE_STAR') {
              sim.multiplier = Math.min(5.0, Number((sim.multiplier + 0.4).toFixed(2)));
              sim.maxMultiplier = Math.max(sim.maxMultiplier, sim.multiplier);
              const pts = Math.round(500 * sim.multiplier * cfg.scoreMultiplier);
              sim.score += pts;
              sound.playPickup('SCORE');
              spawnBurstParticles(item.x, item.y, '#FBBF24', 16, 170);
              addFloatingText(item.x, item.y - 16, `+${pts}`, '#FDE047');
            } else if (item.kind === 'SHIELD') {
              if (!sim.hasShield) {
                sim.hasShield = true;
                addFloatingText(item.x, item.y - 16, 'バリア装備', '#34D399');
              } else {
                const pts = Math.round(700 * cfg.scoreMultiplier);
                sim.score += pts;
                addFloatingText(item.x, item.y - 16, `バリア重複 +${pts}`, '#34D399');
              }
              sound.playPickup('SHIELD');
              spawnBurstParticles(item.x, item.y, '#10B981', 16, 165);
            } else if (item.kind === 'CLEAR_BOMB') {
              const cleared = clearBulletsInRadius(item.x, item.y, Math.max(sim.width, sim.height), true);
              const bonus = Math.round((250 + cleared * 20) * cfg.scoreMultiplier);
              sim.score += bonus;
              sim.shockwaves.push({
                x: item.x,
                y: item.y,
                radius: 16,
                maxRadius: Math.max(sim.width, sim.height) * 0.9,
                color: '#38BDF8',
                alpha: 0.9,
              });
              sound.playPickup('CLEAR');
              spawnBurstParticles(item.x, item.y, '#38BDF8', 24, 230);
              addFloatingText(item.x, item.y - 18, `弾幕消去 +${bonus}`, '#7DD3FC');
            } else if (item.kind === 'SLOW_FIELD') {
              sim.slowRemaining = 4.5;
              sound.playPickup('SLOW');
              spawnBurstParticles(item.x, item.y, '#C084FC', 18, 170);
              addFloatingText(item.x, item.y - 16, 'スロー発動 4.5秒', '#D8B4FE');
            } else if (item.kind === 'HEAL') {
              if (sim.hp < sim.maxHp) {
                sim.hp += 1;
                addFloatingText(item.x, item.y - 16, 'ライフ +1', '#FB7185');
              } else {
                const pts = Math.round(750 * cfg.scoreMultiplier);
                sim.score += pts;
                addFloatingText(item.x, item.y - 16, `満タン +${pts}`, '#FB7185');
              }
              sound.playPickup('HEAL');
              spawnBurstParticles(item.x, item.y, '#FB7185', 16, 165);
            }
          }
        }

        // 6. Update Visual FX (Particles, Shockwaves, Floating Texts, Telegraphs)
        for (let i = sim.particles.length - 1; i >= 0; i--) {
          const p = sim.particles[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= 0.95;
          p.vy *= 0.95;
          p.life -= dt;
          p.alpha = Math.max(0, p.life / p.maxLife);
          if (p.life <= 0) sim.particles.splice(i, 1);
        }

        for (let i = sim.shockwaves.length - 1; i >= 0; i--) {
          const sw = sim.shockwaves[i];
          sw.radius += (sw.maxRadius - sw.radius) * Math.min(1, dt * 8.5) + 180 * dt;
          sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);
          if (sw.radius >= sw.maxRadius) sim.shockwaves.splice(i, 1);
        }

        for (let i = sim.floatingTexts.length - 1; i >= 0; i--) {
          const ft = sim.floatingTexts[i];
          ft.y += ft.vy * dt;
          ft.life -= dt;
          if (ft.life <= 0) sim.floatingTexts.splice(i, 1);
        }

        for (let i = sim.telegraphs.length - 1; i >= 0; i--) {
          const tg = sim.telegraphs[i];
          tg.age += dt;
          if (tg.age >= tg.duration) sim.telegraphs.splice(i, 1);
        }

        // 7. Throttled HUD Sync (~20Hz)
        sim.hudSyncTimer += dt;
        if (sim.hudSyncTimer >= 0.05 && !sim.hasEnded) {
          sim.hudSyncTimer = 0;
          const currentScore = Math.floor(sim.score);
          onHudUpdateRef.current({
            score: currentScore,
            highScore: Math.max(highScoreRef.current, currentScore),
            multiplier: sim.multiplier,
            grazeCount: sim.grazeCount,
            elapsedSeconds: sim.elapsedSeconds,
            wave: sim.wave,
            hp: sim.hp,
            maxHp: sim.maxHp,
            hasShield: sim.hasShield,
            slowRemaining: sim.slowRemaining,
            itemsCollected: sim.itemsCollected,
          });
        }
      }

      // ================= RENDER =================
      ctx.save();

      // Screen shake offset
      if (sim.shakeTime > 0 && state === 'PLAYING') {
        const mag = sim.shakeMagnitude * (sim.shakeTime / 0.28);
        ctx.translate((Math.random() - 0.5) * mag * 2, (Math.random() - 0.5) * mag * 2);
      }

      // Arena Background (60% Neutral Velvet Navy)
      ctx.fillStyle = '#080C18';
      ctx.fillRect(0, 0, sim.width, sim.height);

      // Subtle tactical grid
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.055)';
      ctx.lineWidth = 1;
      const gridStep = 56;
      ctx.beginPath();
      for (let gx = (sim.width % gridStep) / 2; gx < sim.width; gx += gridStep) {
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, sim.height);
      }
      for (let gy = (sim.height % gridStep) / 2; gy < sim.height; gy += gridStep) {
        ctx.moveTo(0, gy);
        ctx.lineTo(sim.width, gy);
      }
      ctx.stroke();

      // Center radar rings
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
      ctx.beginPath();
      ctx.arc(sim.width / 2, sim.height / 2, Math.min(sim.width, sim.height) * 0.22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sim.width / 2, sim.height / 2, Math.min(sim.width, sim.height) * 0.38, 0, Math.PI * 2);
      ctx.stroke();

      // Slow-field tint overlay
      if (sim.slowRemaining > 0 && state !== 'TITLE_MENU') {
        ctx.fillStyle = 'rgba(139, 92, 246, 0.07)';
        ctx.fillRect(0, 0, sim.width, sim.height);
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.45)';
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, sim.width - 4, sim.height - 4);
      }

      // Telegraphs
      for (const tg of sim.telegraphs) {
        const t = tg.age / tg.duration;
        const alpha = (1 - t) * 0.55;
        ctx.save();
        ctx.strokeStyle = tg.color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 1.5;
        if (tg.kind === 'LINE') {
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(tg.x, tg.y);
          ctx.lineTo(tg.targetX, tg.targetY);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(tg.x, tg.y, 12 + t * 28, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Shockwaves
      for (const sw of sim.shockwaves) {
        ctx.save();
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = sw.alpha;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Items amidst the barrage
      if (state !== 'TITLE_MENU') {
        for (const item of sim.items) {
          const pulse = 1 + Math.sin(item.pulsePhase) * 0.1;
          const timeLeftRatio = Math.max(0, 1 - item.age / item.lifetime);
          const blink = item.lifetime - item.age < 2.2 ? (Math.sin(item.age * 18) > 0 ? 1 : 0.35) : 1;

          let color = '#FBBF24';
          let glyph = '★';
          let subLabel = '得点';
          if (item.kind === 'SHIELD') {
            color = '#10B981';
            glyph = '◆';
            subLabel = 'バリア';
          } else if (item.kind === 'CLEAR_BOMB') {
            color = '#38BDF8';
            glyph = '◎';
            subLabel = '弾消し';
          } else if (item.kind === 'SLOW_FIELD') {
            color = '#C084FC';
            glyph = '⧗';
            subLabel = 'スロー';
          } else if (item.kind === 'HEAL') {
            color = '#FB7185';
            glyph = '✚';
            subLabel = '回復';
          }

          ctx.save();
          ctx.globalAlpha = blink;

          // Lifetime ring
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(
            item.x,
            item.y,
            item.radius * 1.32,
            -Math.PI / 2,
            -Math.PI / 2 + Math.PI * 2 * timeLeftRatio,
          );
          ctx.stroke();

          // Outer glow fill
          ctx.fillStyle = `${color}28`;
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.radius * pulse, 0, Math.PI * 2);
          ctx.fill();

          // Crisp center icon
          ctx.fillStyle = color;
          ctx.font = '700 15px "Noto Sans JP", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(glyph, item.x, item.y + 0.5);

          // Tiny readable label below item
          ctx.fillStyle = '#F8FAFC';
          ctx.font = '700 10px "Noto Sans JP", sans-serif';
          ctx.fillText(subLabel, item.x, item.y + item.radius + 12);

          ctx.restore();
        }
      }

      // Bullets
      const bulletAlpha = state === 'TITLE_MENU' ? 0.32 : 1.0;
      ctx.save();
      ctx.globalAlpha = bulletAlpha;
      for (const b of sim.bullets) {
        if (b.kind === 'DART') {
          ctx.save();
          ctx.translate(b.x, b.y);
          ctx.rotate(b.angle);
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.moveTo(b.radius * 1.9, 0);
          ctx.lineTo(-b.radius * 1.3, b.radius * 0.85);
          ctx.lineTo(-b.radius * 0.8, 0);
          ctx.lineTo(-b.radius * 1.3, -b.radius * 0.85);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = b.coreColor;
          ctx.beginPath();
          ctx.arc(0, 0, b.radius * 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          // Outer high-contrast rim
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          ctx.fill();

          // Bright white-tinted inner core for unmistakable hitbox readability
          ctx.fillStyle = b.coreColor;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius * 0.52, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // Particles
      for (const p of sim.particles) {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Player Cursor Ship & Hitbox (rendered during PLAYING and PAUSED)
      if (state === 'PLAYING' || state === 'PAUSED') {
        // Motion trail
        for (let i = 0; i < sim.trail.length; i++) {
          const t = sim.trail[i];
          const ratio = (i + 1) / sim.trail.length;
          ctx.fillStyle = `rgba(56, 189, 248, ${t.alpha * 0.28 * ratio})`;
          ctx.beginPath();
          ctx.arc(t.x, t.y, PLAYER_VISUAL_RADIUS * 0.7 * ratio, 0, Math.PI * 2);
          ctx.fill();
        }

        const invulnBlink = sim.invulnRemaining > 0 && Math.floor(sim.invulnRemaining * 16) % 2 === 0;
        ctx.save();
        if (invulnBlink) {
          ctx.globalAlpha = 0.45;
        }

        // Graze boundary subtle ring
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.arc(sim.playerX, sim.playerY, PLAYER_GRAZE_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Active shield halo
        if (sim.hasShield) {
          ctx.strokeStyle = '#10B981';
          ctx.lineWidth = 2;
          ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
          ctx.beginPath();
          ctx.arc(sim.playerX, sim.playerY, PLAYER_VISUAL_RADIUS + 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        // Player outer ring
        ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sim.playerX, sim.playerY, PLAYER_VISUAL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Precise lethal core dot
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(sim.playerX, sim.playerY, PLAYER_CORE_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // Floating score & item popups
      for (const ft of sim.floatingTexts) {
        const alpha = Math.min(1, (ft.life / ft.maxLife) * 1.4);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = ft.color;
        ctx.font = '700 13px "Plus Jakarta Sans", "Noto Sans JP", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      ctx.restore();

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, []);

  const updatePointerPos = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(14, Math.min(rect.width - 14, clientX - rect.left));
    const y = Math.max(14, Math.min(rect.height - 14, clientY - rect.top));
    simRef.current.playerX = x;
    simRef.current.playerY = y;
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerMove={(e) => updatePointerPos(e.clientX, e.clientY)}
      onPointerDown={(e) => {
        sound.unlock();
        updatePointerPos(e.clientX, e.clientY);
      }}
      className={`block h-full w-full touch-none select-none ${
        gameState === 'PLAYING' ? 'cursor-none' : 'cursor-default'
      }`}
    />
  );
};
