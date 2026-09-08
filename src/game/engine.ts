import type { SceneId, Theme } from "./levels";
import { loadIllustrations, type SpriteName, type Sprites } from "./illustrations";

export type Phase = "idle" | "dashing" | "interact" | "cleared" | "fail" | "treasure" | "finished";

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; size: number; color: string;
  rotation: number; spin: number; gravity: number;
}
interface Floater { text: string; x: number; y: number; life: number; color: string; size: number }

const COLORS = ["#ffd342", "#f56a36", "#5ac56a", "#7ed8fc", "#fff4cb"];
const TAU = Math.PI * 2;
const easeOut = (t: number) => 1 - (1 - Math.max(0, Math.min(1, t))) ** 3;

export class Engine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width = 1;
  private height = 1;
  private dpr = 1;
  private raf = 0;
  private last = 0;
  private time = 0;
  private phaseTime = 0;
  private paused = false;
  private disposed = false;
  private reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  private sprites: Sprites = {};
  private particles: Particle[] = [];
  private floaters: Floater[] = [];
  private shake = 0;
  private wasShaking = false;
  private flash = 0;
  private hit = false;
  private treasureOpened = false;
  private finished = false;
  private bottomInset = 0;
  scene: SceneId | "menu" = "rock";
  phase: Phase = "idle";
  onPhase: ((phase: Phase) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.resize();
    window.addEventListener("resize", this.resize);
    loadIllustrations().then(sprites => { if (!this.disposed) this.sprites = sprites; });
    this.raf = requestAnimationFrame(this.loop);
  }

  destroy() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resize);
  }

  private resize = () => {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.width < 760 ? 1.5 : 2);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    if (this.paused) this.draw();
  };

  setPaused(paused: boolean) { this.paused = paused; }
  setBottomInset(px: number) { this.bottomInset = Math.max(0, px); }

  setLevel(scene: SceneId, _theme?: Theme) {
    this.scene = scene;
    this.phase = "idle";
    this.phaseTime = 0;
    this.particles = [];
    this.floaters = [];
    this.hit = false;
    this.shake = 0;
    this.flash = 0;
    this.treasureOpened = false;
    this.finished = false;
    this.paused = false;
  }

  toMenu() { this.setLevel("rock"); this.scene = "menu"; }
  toCave() { this.setLevel("cave"); this.phase = "treasure"; }

  answerCorrect() {
    if (this.phase !== "idle" || this.paused) return;
    this.phase = "dashing";
    this.phaseTime = 0;
    this.hit = false;
  }

  answerWrong() {
    if (this.phase !== "idle" || this.paused) return;
    this.phase = "fail";
    this.phaseTime = 0;
    this.shake = this.reducedMotion ? 0 : 5;
  }

  forceIdle() { this.phase = "idle"; this.phaseTime = 0; }

  addFloater(text: string, fx: number, fy: number, color: string, size = 26) {
    this.floaters.push({ text, x: fx * this.width, y: fy * this.height, life: 1.8, color, size });
  }

  confetti(count: number) {
    const { obstacleX, ground, size } = this.layout;
    const total = this.reducedMotion ? Math.min(count, 12) : count;
    for (let i = 0; i < total; i++) {
      this.particles.push({
        x: obstacleX + (Math.random() - 0.5) * size, y: ground - size * 0.6,
        vx: (Math.random() - 0.5) * 480, vy: -180 - Math.random() * 370,
        life: 1.1 + Math.random() * 1.5, size: 4 + Math.random() * 7,
        color: COLORS[i % COLORS.length], rotation: Math.random() * TAU,
        spin: (Math.random() - 0.5) * 12, gravity: 380,
      });
    }
    if (this.particles.length > 160) this.particles.splice(0, this.particles.length - 160);
  }

  private get mobile() { return this.width < 760; }

  private get layout() {
    const w = this.width, h = this.height;
    if (this.mobile) {
      const lower = this.bottomInset || Math.min(h * 0.5, 390);
      const ground = Math.max(175, h - lower - 5);
      const available = Math.max(110, ground - 125);
      const size = Math.min(available, w * 0.65, 265);
      return { charX: w * 0.19, obstacleX: w * 0.64, ground, size, obstacleGround: ground - size * 0.14 };
    }
    const size = Math.min(h * 0.51, w * 0.355, 620);
    return { charX: w * 0.125, obstacleX: w * 0.367, ground: h * 0.895, size, obstacleGround: h * 0.735 };
  }

  private get progress() {
    if (this.phase === "interact") return easeOut(this.phaseTime / 0.95);
    if (this.phase === "cleared") return 1;
    return 0;
  }

  private loop = (now: number) => {
    const dt = this.last ? Math.min((now - this.last) / 1000, 0.04) : 0;
    this.last = now;
    if (!this.paused) { this.update(dt); this.draw(); }
    this.raf = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.time += dt;
    this.phaseTime += dt;
    this.shake = Math.max(0, this.shake - dt * 22);
    this.flash = Math.max(0, this.flash - dt * 1.8);
    if (this.phase === "dashing" && this.phaseTime > 0.6) {
      this.phase = "interact";
      this.phaseTime = 0;
    } else if (this.phase === "interact") {
      if (!this.hit && this.phaseTime > 0.2) {
        this.hit = true;
        this.shake = this.reducedMotion ? 0 : 8;
        this.flash = this.reducedMotion ? 0 : 0.2;
        this.confetti(25);
      }
      if (this.phaseTime > 1) {
        this.phase = "cleared";
        this.phaseTime = 0;
        this.confetti(60);
        this.onPhase?.("cleared");
      }
    } else if (this.phase === "fail" && this.phaseTime > 0.6) {
      this.phase = "idle";
      this.phaseTime = 0;
    } else if (this.phase === "treasure") {
      if (!this.treasureOpened && this.phaseTime > 0.65) {
        this.treasureOpened = true;
        this.confetti(100);
        this.flash = this.reducedMotion ? 0 : 0.35;
        this.onPhase?.("treasure");
      }
      if (!this.finished && this.phaseTime > 2.7) {
        this.finished = true;
        this.onPhase?.("finished");
      }
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rotation += p.spin * dt;
    }
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      this.floaters[i].life -= dt;
      this.floaters[i].y -= dt * 32;
      if (this.floaters[i].life <= 0) this.floaters.splice(i, 1);
    }
  }

  private draw() {
    const c = this.ctx;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, this.width, this.height);
    c.save();
    if (this.shake || this.wasShaking) {
      const x = (Math.random() - 0.5) * this.shake;
      const y = (Math.random() - 0.5) * this.shake;
      c.translate(x, y);
      this.canvas.parentElement?.style.setProperty("--scene-shake-x", `${x}px`);
      this.canvas.parentElement?.style.setProperty("--scene-shake-y", `${y}px`);
      this.wasShaking = this.shake > 0;
    }
    this.drawLeaves(); this.drawObstacle(); this.drawExplorer(); this.drawEffects();
    if (this.flash) {
      c.fillStyle = `rgba(255,242,187,${this.flash})`;
      c.fillRect(0, 0, this.width, this.height);
    }
    c.restore();
  }

  private shadow(x: number, y: number, width: number) {
    const c = this.ctx;
    c.fillStyle = "rgba(54,49,19,0.22)";
    c.beginPath(); c.ellipse(x, y, width, width * 0.15, 0, 0, TAU); c.fill();
  }

  private sprite(name: SpriteName, x: number, bottom: number, height: number, rotation = 0, opacity = 1, scaleX = 1) {
    const sprite = this.sprites[name];
    if (!sprite) return;
    const c = this.ctx;
    const width = height * sprite.width / sprite.height;
    c.save();
    c.globalAlpha = Math.max(0, Math.min(1, opacity));
    c.translate(x, bottom); c.rotate(rotation); c.scale(scaleX, 1);
    c.drawImage(sprite, -width / 2, -height, width, height);
    c.restore();
  }

  private drawObstacle() {
    const { obstacleX: x, obstacleGround: y, size } = this.layout;
    const p = this.progress;
    const scene = this.scene === "menu" ? "rock" : this.scene;
    const c = this.ctx;
    let height = size * 0.96;
    if (scene === "rock") height = size * 0.88;
    if (scene === "ball") height = size * 0.47;
    if (scene === "bridge" || scene === "spring") height = size * 0.65;
    if (scene === "tree") height = size * 1.16;
    if (scene === "gate" || scene === "door") height = size * 1.08;
    if (scene === "cave") { this.drawTreasure(x, y, size); return; }
    const roll = scene === "rock" || scene === "ball";
    const moveX = roll ? p * size * 1.18 : 0;
    const moveY = scene === "ball" ? -Math.sin(p * Math.PI) * size * 0.6 : 0;
    const fade = roll ? 1 - p * 0.8 : 1;
    const squash = scene === "spring" ? 1 - Math.sin(p * Math.PI) * 0.25 : 1;
    const opens = scene === "gate" || scene === "door" || scene === "clay";
    this.shadow(x + moveX, y + 2, height * (roll ? 0.37 : 0.4) * fade);
    if (opens && p > 0) {
      this.glow(x, y - height * 0.4, height * 0.65, p);
      if (scene === "clay") this.drawKey(x, y - height * 0.45, height * 0.35, p);
    }
    this.sprite(scene, x + moveX, y + moveY, height * squash, roll ? p * (scene === "ball" ? 5 : 0.6) : 0, opens ? 1 - p * 0.88 : fade, scene === "door" ? 1 - p * 0.82 : scene === "rock" ? 1.3 : 1);
    if (scene === "tree") {
      const ay = y - height * 0.69 + p * height * 0.65;
      c.fillStyle = "#e84026"; c.strokeStyle = "#893115"; c.lineWidth = 2;
      c.beginPath(); c.arc(x - size * 0.1, ay, size * 0.038, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = "#4d8b30";
      c.beginPath(); c.ellipse(x - size * 0.08, ay - size * 0.04, size * 0.026, size * 0.012, -0.6, 0, TAU); c.fill();
    }
    if (scene === "bridge" && p < 1) {
      for (let i = 0; i < 4; i++) {
        this.sparkle(x + (i - 1.5) * size * 0.18, y - height * 0.3 + Math.sin(i) * 7, 4 + Math.sin(this.time * 2 + i) * 2, "#e6fcff", 1 - p);
      }
    }
    if (!this.sprites[scene]) {
      c.fillStyle = "#989587"; c.strokeStyle = "#555349"; c.lineWidth = 3;
      c.beginPath(); c.ellipse(x, y - height * 0.45, height * 0.4, height * 0.45, 0, 0, TAU); c.fill(); c.stroke();
    }
  }

  private drawExplorer() {
    const { charX, obstacleX, ground, size } = this.layout;
    const c = this.ctx;
    let x = charX, y = ground, scale = 1, angle = 0;
    const walk = this.phase === "dashing";
    const ready = this.phase === "interact";
    const target = Math.max(charX, obstacleX - size * 0.61);
    if (walk) {
      x += (target - charX) * easeOut(this.phaseTime / 0.6);
      y -= this.reducedMotion ? 0 : Math.abs(Math.sin(this.phaseTime * 22)) * 5;
      angle = 0.055;
    } else if (ready) {
      x = target;
      angle = this.scene === "rock" ? 0.12 * Math.sin(this.progress * Math.PI) : 0.04;
      if (this.scene === "bridge" || this.scene === "spring") {
        x = target + this.progress * size * 0.75;
        y -= this.scene === "spring" ? Math.sin(this.progress * Math.PI) * size * 0.65 : this.progress * size * 0.15;
      }
    } else if (this.phase === "cleared") {
      const cross = easeOut(this.phaseTime / 1.3);
      x = target + cross * size * 0.55;
      y -= size * 0.09 * cross;
      scale = 1 - cross * 0.12;
    } else if (this.phase === "fail") {
      angle = this.reducedMotion ? 0 : Math.sin(this.phaseTime * 25) * 0.02;
    }
    const breath = this.reducedMotion || walk || ready ? 0 : Math.sin(this.time * 2.1) * 1.2;
    this.shadow(x, ground + 2, size * 0.15 * scale);
    const pushing = ready && (this.scene === "rock" || this.scene === "door") && this.sprites.explorerPush;
    this.sprite(pushing ? "explorerPush" : "explorer", x - (pushing ? size * 0.11 : 0), y, size * scale + breath, angle);
    if ((this.phase === "idle" || this.phase === "fail") && this.scene !== "cave") {
      const radius = Math.min(47, size * 0.12);
      const bx = x + size * 0.13, by = y - size * 1.12 + breath;
      c.save(); c.fillStyle = "#fffdf0"; c.strokeStyle = "#805338";
      c.lineWidth = Math.max(2, size * 0.005);
      c.beginPath(); c.arc(bx, by, radius, Math.PI * 0.34, Math.PI * 2.21);
      c.lineTo(bx + radius * 0.58, by + radius * 1.29); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = "#ef492e";
      c.font = `900 ${radius * 1.58}px Nunito, sans-serif`;
      c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText("!", bx, by + radius * 0.06); c.restore();
    }
  }

  private glow(x: number, y: number, radius: number, alpha: number) {
    const c = this.ctx;
    const gradient = c.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(255,238,145,${alpha * 0.95})`);
    gradient.addColorStop(0.45, `rgba(255,202,76,${alpha * 0.4})`);
    gradient.addColorStop(1, "rgba(255,202,76,0)");
    c.fillStyle = gradient; c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  private drawKey(x: number, y: number, size: number, alpha: number) {
    const c = this.ctx;
    c.save(); c.translate(x, y); c.rotate(-0.35); c.globalAlpha = alpha;
    c.strokeStyle = "#f8c53e"; c.lineWidth = size * 0.12; c.lineCap = "round";
    c.beginPath(); c.arc(-size * 0.3, 0, size * 0.2, 0, TAU);
    c.moveTo(-size * 0.1, 0); c.lineTo(size * 0.5, 0);
    c.moveTo(size * 0.45, 0); c.lineTo(size * 0.45, size * 0.2);
    c.moveTo(size * 0.25, 0); c.lineTo(size * 0.25, size * 0.14);
    c.stroke(); c.restore();
  }

  private drawTreasure(x: number, y: number, size: number) {
    const c = this.ctx;
    const p = easeOut((this.phaseTime - 0.25) / 1.2);
    this.glow(x, y - size * 0.3, size * 0.95, p);
    c.save(); c.translate(x, y - size * 0.28); c.rotate(this.reducedMotion ? 0 : this.time * 0.12);
    c.fillStyle = `rgba(255,223,102,${0.23 * p})`;
    for (let i = 0; i < 10; i++) {
      c.rotate(TAU / 10); c.beginPath(); c.moveTo(0, 0);
      c.lineTo(size * 1.1, -size * 0.06); c.lineTo(size * 1.1, size * 0.06); c.fill();
    }
    c.restore();
    this.shadow(x, y, size * 0.3);
    const open = this.sprites.chestOpen ? Math.min(1, p * 1.6) : 0;
    this.sprite("chest", x, y, size * 0.56, -Math.sin(p * Math.PI) * 0.04, 1 - open);
    if (open > 0) this.sprite("chestOpen", x, y, size * 0.73, 0, open);
    if (p > 0.15) {
      const sy = y - size * (0.26 + 0.54 * p), sw = size * 0.35;
      c.save(); c.globalAlpha = p; c.fillStyle = "#fff1c7"; c.strokeStyle = "#b98337"; c.lineWidth = 3;
      c.beginPath(); c.roundRect(x - sw / 2, sy, sw, sw * 0.72, 4); c.fill(); c.stroke();
      c.fillStyle = "#e5b866";
      c.beginPath(); c.roundRect(x - sw / 2 - 5, sy - 4, sw + 10, 11, 5); c.fill(); c.stroke();
      c.beginPath(); c.roundRect(x - sw / 2 - 5, sy + sw * 0.72 - 7, sw + 10, 11, 5); c.fill(); c.stroke();
      c.strokeStyle = "#b88a4a"; c.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        c.beginPath(); c.moveTo(x - sw * 0.32, sy + sw * (0.2 + i * 0.13));
        c.lineTo(x + sw * 0.3, sy + sw * (0.2 + i * 0.13)); c.stroke();
      }
      c.restore();
    }
    for (let i = 0; i < 8; i++) {
      this.sparkle(x + Math.sin(i * 3.7 + this.time * 0.45) * size * 0.56, y - (i / 8) * size, 3 + Math.sin(this.time * 3 + i) * 2, "#fff0a1", p);
    }
  }

  private sparkle(x: number, y: number, size: number, color: string, alpha = 1) {
    const c = this.ctx;
    c.save(); c.globalAlpha = alpha; c.translate(x, y); c.fillStyle = color;
    c.beginPath(); c.moveTo(0, -size * 2); c.quadraticCurveTo(size * 0.2, -size * 0.2, size * 1.5, 0);
    c.quadraticCurveTo(size * 0.2, size * 0.2, 0, size * 2);
    c.quadraticCurveTo(-size * 0.2, size * 0.2, -size * 1.5, 0);
    c.quadraticCurveTo(-size * 0.2, -size * 0.2, 0, -size * 2); c.fill(); c.restore();
  }

  private drawLeaves() {
    if (this.scene === "cave" || this.reducedMotion) return;
    const c = this.ctx;
    for (let i = 0; i < 7; i++) {
      const y = (this.time * (12 + i * 2) + i * 137) % (this.height + 30) - 15;
      const x = (i * this.width * 0.17 + Math.sin(this.time * 0.4 + i) * 45) % this.width;
      c.save(); c.globalAlpha = 0.7; c.translate(x, y); c.rotate(this.time * 0.35 + i);
      c.fillStyle = i % 2 ? "#b4c650" : "#669d36";
      c.beginPath(); c.ellipse(0, 0, 5 + i % 3, 2.5, 0, 0, TAU); c.fill(); c.restore();
    }
  }

  private drawEffects() {
    const c = this.ctx;
    for (const p of this.particles) {
      c.save(); c.globalAlpha = Math.min(1, p.life * 2);
      c.translate(p.x, p.y); c.rotate(p.rotation); c.fillStyle = p.color;
      c.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.65); c.restore();
    }
    for (const f of this.floaters) {
      c.save(); c.globalAlpha = Math.min(1, f.life);
      c.font = `900 ${this.mobile ? f.size * 0.75 : f.size}px Nunito, sans-serif`;
      c.textAlign = "center"; c.strokeStyle = "#335426"; c.lineWidth = 5; c.lineJoin = "round";
      c.strokeText(f.text, f.x, f.y); c.fillStyle = f.color; c.fillText(f.text, f.x, f.y); c.restore();
    }
  }
}