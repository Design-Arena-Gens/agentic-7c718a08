"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import seedrandom from 'seedrandom';
import { perlin2d } from '../lib/perlin';

type SizeOption = { label: string; w: number; h: number };

const SIZES: SizeOption[] = [
  { label: 'Square HD (1024x1024)', w: 1024, h: 1024 },
  { label: 'Landscape (1280x720)', w: 1280, h: 720 },
  { label: 'Portrait (768x1024)', w: 768, h: 1024 },
  { label: 'Instagram (1080x1350)', w: 1080, h: 1350 },
  { label: 'Wallpaper (1920x1080)', w: 1920, h: 1080 },
];

const STYLES = [
  { id: 'day', name: 'Daylight' },
  { id: 'golden', name: 'Golden Hour' },
  { id: 'sunset', name: 'Sunset' },
  { id: 'night', name: 'Starry Night' },
  { id: 'fog', name: 'Misty Morning' },
  { id: 'tropical', name: 'Tropical' },
  { id: 'arctic', name: 'Arctic' },
  { id: 'autumn', name: 'Autumn' },
  { id: 'watercolor', name: 'Watercolor' },
];

function useSeededRng(seed: string) {
  return useMemo(() => seedrandom(seed || Math.random().toString(36).slice(2)), [seed]);
}

function hsl(h: number, s: number, l: number, a = 1) {
  return `hsla(${h}, ${s}%, ${l}%, ${a})`;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function map(x: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  return ((x - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

function clamp(x: number, min: number, max: number) { return Math.max(min, Math.min(max, x)); }

function getPalette(style: string) {
  switch (style) {
    case 'golden':
      return { skyTop: hsl(210, 80, 92), skyBottom: hsl(40, 90, 70), sun: hsl(40, 100, 60), mountain: hsl(200, 24, 36), nearMountain: hsl(205, 26, 22), water: hsl(201, 60, 60), tree: hsl(140, 32, 22) };
    case 'sunset':
      return { skyTop: hsl(260, 80, 70), skyBottom: hsl(12, 90, 62), sun: hsl(30, 100, 60), mountain: hsl(260, 28, 26), nearMountain: hsl(270, 30, 20), water: hsl(210, 50, 45), tree: hsl(140, 34, 20) };
    case 'night':
      return { skyTop: hsl(220, 40, 10), skyBottom: hsl(220, 50, 20), sun: hsl(60, 40, 80), mountain: hsl(220, 20, 18), nearMountain: hsl(220, 20, 12), water: hsl(220, 30, 18), tree: hsl(140, 20, 12) };
    case 'fog':
      return { skyTop: hsl(210, 20, 92), skyBottom: hsl(210, 10, 86), sun: hsl(50, 60, 82), mountain: hsl(210, 10, 68), nearMountain: hsl(210, 10, 54), water: hsl(210, 14, 70), tree: hsl(140, 16, 30) };
    case 'tropical':
      return { skyTop: hsl(195, 94, 86), skyBottom: hsl(187, 95, 68), sun: hsl(50, 100, 60), mountain: hsl(170, 30, 36), nearMountain: hsl(163, 30, 28), water: hsl(186, 95, 50), tree: hsl(150, 40, 20) };
    case 'arctic':
      return { skyTop: hsl(210, 60, 96), skyBottom: hsl(204, 60, 88), sun: hsl(50, 80, 88), mountain: hsl(210, 12, 74), nearMountain: hsl(210, 14, 62), water: hsl(200, 50, 72), tree: hsl(160, 24, 32) };
    case 'autumn':
      return { skyTop: hsl(25, 60, 90), skyBottom: hsl(15, 60, 78), sun: hsl(45, 90, 70), mountain: hsl(20, 30, 38), nearMountain: hsl(18, 32, 24), water: hsl(205, 40, 56), tree: hsl(25, 60, 26) };
    case 'watercolor':
      return { skyTop: hsl(210, 80, 96), skyBottom: hsl(190, 80, 88), sun: hsl(45, 98, 75), mountain: hsl(210, 18, 54), nearMountain: hsl(210, 20, 42), water: hsl(200, 70, 70), tree: hsl(150, 28, 26) };
    case 'day':
    default:
      return { skyTop: hsl(210, 92, 92), skyBottom: hsl(200, 92, 75), sun: hsl(50, 96, 60), mountain: hsl(210, 22, 36), nearMountain: hsl(210, 24, 24), water: hsl(200, 60, 60), tree: hsl(140, 30, 22) };
  }
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function drawGradientSky(ctx: CanvasRenderingContext2D, w: number, h: number, top: string, bottom: string) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawSun(ctx: CanvasRenderingContext2D, rng: seedrandom.PRNG, w: number, h: number, color: string, style: string) {
  const radius = lerp(Math.min(w, h) * 0.05, Math.min(w, h) * 0.12, rng());
  const x = lerp(radius + 20, w - radius - 20, rng());
  const yRange = style === 'night' ? [h * 0.1, h * 0.35] : [h * 0.08, h * 0.45];
  const y = lerp(yRange[0], yRange[1], rng());

  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
  glow.addColorStop(0, `${color.replace('hsla', 'rgba').replace(/\)/, ', 0.8)')}`);
  glow.addColorStop(1, `${color.replace('hsla', 'rgba').replace(/\)/, ', 0)')}`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawStars(ctx: CanvasRenderingContext2D, rng: seedrandom.PRNG, w: number, h: number) {
  const count = Math.floor(300 + rng() * 300);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = rng() * w;
    const y = rng() * h * 0.6;
    const r = rng() * 1.4 + 0.2;
    ctx.globalAlpha = 0.5 + rng() * 0.5;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawMountains(ctx: CanvasRenderingContext2D, rng: seedrandom.PRNG, w: number, h: number, colorFar: string, colorNear: string, style: string, seed: number) {
  const layers = 4;
  for (let layer = 0; layer < layers; layer++) {
    const t = layer / (layers - 1);
    const baseY = lerp(h * 0.35, h * 0.75, t);
    const amplitude = lerp(h * 0.06, h * 0.22, (1 - t) * (0.6 + rng() * 0.6));
    const roughness = 0.002 + t * 0.005 + rng() * 0.002;

    const color = t < 0.5 ? colorFar : colorNear;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, baseY);

    for (let x = 0; x <= w; x++) {
      const n = perlin2d(x * roughness, (seed + layer * 1000) * 0.001);
      const y = baseY - (n * 2 - 1) * amplitude;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Snow caps for colder themes
    if (['arctic', 'night', 'fog', 'watercolor'].includes(style) && layer < 2) {
      ctx.save();
      ctx.globalAlpha = 0.15 + (1 - t) * 0.1;
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.moveTo(0, baseY);
      for (let x = 0; x <= w; x++) {
        const n = perlin2d(x * (roughness * 1.1), (seed + layer * 1000 + 99) * 0.001);
        const y = baseY - (n * 2 - 1) * amplitude * 0.55;
        ctx.lineTo(x, Math.min(y, baseY - amplitude * 0.2));
      }
      ctx.lineTo(w, baseY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}

function drawWater(ctx: CanvasRenderingContext2D, rng: seedrandom.PRNG, w: number, h: number, waterColor: string) {
  const horizon = h * (0.55 + rng() * 0.12);
  const g = ctx.createLinearGradient(0, horizon, 0, h);
  g.addColorStop(0, waterColor);
  g.addColorStop(1, hsl(200, 40, 24));

  ctx.fillStyle = g;
  ctx.fillRect(0, horizon, w, h - horizon);

  // Waves
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 4; i++) {
    const y = horizon + i * 18 + rng() * 10;
    ctx.beginPath();
    for (let x = 0; x <= w; x++) {
      const n = perlin2d(x * 0.02, i * 10 + 1000 * rng());
      const yy = y + Math.sin(x * 0.015 + i) * 2 + (n - 0.5) * 4;
      ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawTrees(ctx: CanvasRenderingContext2D, rng: seedrandom.PRNG, w: number, h: number, treeColor: string) {
  const groundY = h * (0.68 + rng() * 0.08);
  const count = Math.floor(30 + rng() * 50);

  // Ground
  ctx.fillStyle = hsl(120, 25, 22);
  ctx.fillRect(0, groundY, w, h - groundY);

  // Trees layers
  for (let i = 0; i < count; i++) {
    const x = rng() * w;
    const size = lerp(30, 120, rng());
    const y = groundY - size - rng() * 20;
    const hueShift = map(rng(), 0, 1, -6, 6);
    ctx.fillStyle = treeColor.replace(/hsla\((\d+)/, (_m, h) => `hsla(${Number(h) + hueShift}`);

    // Trunk
    ctx.fillStyle = hsl(25, 20, 20);
    ctx.fillRect(x - size * 0.05, y + size * 0.6, size * 0.1, size * 0.6);

    // Foliage (cone)
    ctx.fillStyle = treeColor;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - size * 0.5, y + size);
    ctx.lineTo(x + size * 0.5, y + size);
    ctx.closePath();
    ctx.fill();

    // Highlights
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(x - size * 0.15, y + size * 0.2);
    ctx.lineTo(x - size * 0.4, y + size * 0.9);
    ctx.lineTo(x - size * 0.1, y + size * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function applyWatercolor(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const image = ctx.getImageData(0, 0, w, h);
  const data = image.data;

  // Simple watercolor effect via posterization + subtle blur-like blend
  const levels = 8;
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const v = data[i + c];
      const q = Math.round((v / 255) * levels) / levels;
      data[i + c] = Math.round(q * 255);
    }
    data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);

  ctx.globalAlpha = 0.06;
  for (let y = 0; y < h; y += 2) {
    ctx.drawImage(ctx.canvas, 0, y, w, 2, -1, y, w + 2, 2);
  }
  ctx.globalAlpha = 1;
}

export default function NatureGenerator() {
  const [size, setSize] = useState<SizeOption>(SIZES[0]);
  const [style, setStyle] = useState<string>('day');
  const [seed, setSeed] = useState<string>('nature');
  const [includeWater, setIncludeWater] = useState<boolean>(true);
  const [includeTrees, setIncludeTrees] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const rng = useSeededRng(seed);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const onRandomizeSeed = () => setSeed(Math.random().toString(36).slice(2));

  const render = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const { w, h } = size;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsGenerating(true);
    requestAnimationFrame(() => {
      const pal = getPalette(style);

      drawGradientSky(ctx, w, h, pal.skyTop, pal.skyBottom);
      if (style === 'night') {
        drawStars(ctx, rng, w, h);
      }
      drawSun(ctx, rng, w, h, pal.sun, style);
      drawMountains(ctx, rng, w, h, pal.mountain, pal.nearMountain, style, Math.floor(rng() * 100000));
      if (includeWater) {
        drawWater(ctx, rng, w, h, pal.water);
      }
      if (includeTrees) {
        drawTrees(ctx, rng, w, h, pal.tree);
      }
      if (style === 'watercolor') {
        applyWatercolor(ctx, w, h);
      }

      setIsGenerating(false);
    });
  };

  useEffect(() => {
    render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, style, seed, includeWater, includeTrees]);

  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="controls-grid" style={{ marginBottom: 12 }}>
        <div>
          <label>Style</label>
          <select value={style} onChange={(e) => setStyle(e.target.value)} style={{ width: '100%' }}>
            {STYLES.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Size</label>
          <select
            value={size.label}
            onChange={(e) => {
              const next = SIZES.find((s) => s.label === e.target.value) || SIZES[0];
              setSize(next);
            }}
            style={{ width: '100%' }}
          >
            {SIZES.map((s) => (
              <option key={s.label} value={s.label}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Seed</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={seed} onChange={(e) => setSeed(e.target.value)} style={{ flex: 1 }} placeholder="random seed" />
            <button className="btn ghost" onClick={onRandomizeSeed} aria-label="Randomize seed">??</button>
          </div>
        </div>
        <div>
          <label>Water</label>
          <select value={includeWater ? 'yes' : 'no'} onChange={(e) => setIncludeWater(e.target.value === 'yes')} style={{ width: '100%' }}>
            <option value="yes">Include water</option>
            <option value="no">No water</option>
          </select>
        </div>
        <div>
          <label>Trees</label>
          <select value={includeTrees ? 'yes' : 'no'} onChange={(e) => setIncludeTrees(e.target.value === 'yes')} style={{ width: '100%' }}>
            <option value="yes">Include trees</option>
            <option value="no">No trees</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <button className="btn" onClick={render} disabled={isGenerating}>
            {isGenerating ? 'Generating?' : 'Generate'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <canvas ref={canvasRef} className="card" style={{ width: '100%', height: 'auto', display: 'block', background: '#fff' }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn secondary" onClick={() => { if (canvasRef.current) downloadCanvas(canvasRef.current, `nature-${style}-${size.w}x${size.h}.png`); }}>Download PNG</button>
        </div>
      </div>
    </div>
  );
}
