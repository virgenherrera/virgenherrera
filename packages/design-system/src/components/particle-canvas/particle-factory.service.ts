import { Injectable } from '@angular/core';
import {
  FLOATS_PER_DOT,
  LABEL_FONT,
  LABEL_BITMAP_HEIGHT,
  LABEL_BITMAP_PADDING,
  type LabelParticle,
  type ParticleCanvasConfig,
} from './particle-engine.service';

const DOT_MAX_SPEED = 0.4;
const DOT_MIN_INTRINSIC = 1;
const DOT_MAX_INTRINSIC = 8;
const DOT_LARGE_PROBABILITY = 0.15;
const DOT_MEDIUM_PROBABILITY = 0.25;
const LABEL_MAX_SPEED = 0.25;

@Injectable()
export class ParticleFactory {
  createParticles(
    config: ParticleCanvasConfig,
    canvasWidth: number,
    canvasHeight: number,
    textColor: string,
  ): {
    dotData: Float32Array;
    dotCount: number;
    dotColors: string[];
    labels: LabelParticle[];
  } {
    const isMobile = window.innerWidth < config.mobileBreakpoint;
    const dotCount = isMobile ? config.mobileDotCount : config.dotCount;
    const labelCount = isMobile ? config.mobileTextCount : config.textCount;

    const dotColors = [...config.palette];
    const dotData = new Float32Array(dotCount * FLOATS_PER_DOT);

    for (let i = 0; i < dotCount; i++) {
      const base = i * FLOATS_PER_DOT;
      const roll = Math.random();
      let intrinsicRadius: number;
      if (roll < DOT_LARGE_PROBABILITY) {
        intrinsicRadius = 5 + Math.random() * (DOT_MAX_INTRINSIC - 5);
      } else if (roll < DOT_LARGE_PROBABILITY + DOT_MEDIUM_PROBABILITY) {
        intrinsicRadius = 3 + Math.random() * 2;
      } else {
        intrinsicRadius = DOT_MIN_INTRINSIC + Math.random();
      }

      dotData[base + 0] = Math.random() * canvasWidth;
      dotData[base + 1] = Math.random() * canvasHeight;
      dotData[base + 2] = (Math.random() - 0.5) * DOT_MAX_SPEED;
      dotData[base + 3] = (Math.random() - 0.5) * DOT_MAX_SPEED;
      dotData[base + 4] = intrinsicRadius;
      dotData[base + 5] = Math.floor(Math.random() * dotColors.length);
      dotData[base + 6] = Math.random();
    }

    const configLabels = config.labels;
    if (configLabels.length === 0) {
      return { dotData, dotCount, dotColors, labels: [] };
    }

    const labels: LabelParticle[] = Array.from(
      { length: labelCount },
      (_, i) => {
        const text = configLabels[i % configLabels.length];
        const bitmapInfo = this.createLabelBitmap(text, textColor);

        return {
          x: Math.random() * canvasWidth,
          y: Math.random() * canvasHeight,
          vx: (Math.random() - 0.5) * LABEL_MAX_SPEED,
          vy: (Math.random() - 0.5) * LABEL_MAX_SPEED,
          label: text,
          color:
            config.palette[Math.floor(Math.random() * config.palette.length)],
          bitmap: bitmapInfo.canvas,
          bitmapWidth: bitmapInfo.width,
          bitmapHeight: bitmapInfo.height,
        };
      },
    );

    return { dotData, dotCount, dotColors, labels };
  }

  createLabelBitmap(
    label: string,
    textColor: string,
  ): {
    canvas: OffscreenCanvas | null;
    width: number;
    height: number;
  } {
    const dpr = window.devicePixelRatio || 1;
    const h = LABEL_BITMAP_HEIGHT;

    if (typeof OffscreenCanvas === 'undefined') {
      return { canvas: null, width: 0, height: h };
    }

    const measure = new OffscreenCanvas(1, 1);
    const mctx = measure.getContext('2d')!;
    mctx.font = LABEL_FONT;
    const metrics = mctx.measureText(label);
    const w = Math.ceil(metrics.width) + LABEL_BITMAP_PADDING;

    const canvas = new OffscreenCanvas(w * dpr, h * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return { canvas: null, width: w, height: h };

    ctx.scale(dpr, dpr);
    ctx.font = LABEL_FONT;
    ctx.fillStyle = textColor;
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 2, h / 2);

    return { canvas, width: w, height: h };
  }

  rescalePositions(
    dotData: Float32Array,
    dotCount: number,
    labels: LabelParticle[],
    oldW: number,
    oldH: number,
    newW: number,
    newH: number,
  ): void {
    const sx = newW / oldW;
    const sy = newH / oldH;

    for (let i = 0; i < dotCount; i++) {
      const base = i * FLOATS_PER_DOT;
      dotData[base + 0] *= sx;
      dotData[base + 1] *= sy;
    }
    for (const label of labels) {
      label.x *= sx;
      label.y *= sy;
    }
  }
}
