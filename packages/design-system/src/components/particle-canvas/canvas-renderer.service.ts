import { Injectable } from '@angular/core';
import {
  FLOATS_PER_DOT,
  LABEL_FONT,
  type LabelParticle,
} from './particle-engine.service';
import type { SpatialIndex } from './spatial-index.service';

// ─── Connections ─────────────────────────────────────────────────────────────
const CONNECTION_MAX_OPACITY = 0.15;
const CONNECTION_LINE_WIDTH = 0.5;

// ─── Depth & parallax ────────────────────────────────────────────────────────
const PERSPECTIVE_MIN_SCALE = 0.3;
const PERSPECTIVE_MAX_SCALE = 1.0;
const DEPTH_MIN_OPACITY = 0.2;
const DEPTH_MAX_OPACITY = 0.85;
const DEPTH_SHADOW_MAX = 4;

@Injectable()
export class CanvasRenderer {
  private ctx!: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;

  get canvasWidth(): number {
    return this.width;
  }

  get canvasHeight(): number {
    return this.height;
  }

  init(canvas: HTMLCanvasElement): boolean {
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    this.ctx = ctx;

    return true;
  }

  applyDprScaling(canvas: HTMLCanvasElement): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  renderConnections(
    dotData: Float32Array,
    spatialIndex: SpatialIndex,
    connectionDistance: number,
    connectionColorRgb: string,
  ): void {
    spatialIndex.forEachNeighborPair(connectionDistance, (i, j, dSq) => {
      const iBase = i * FLOATS_PER_DOT;
      const jBase = j * FLOATS_PER_DOT;
      const d = Math.sqrt(dSq);
      const opacity = (1 - d / connectionDistance) * CONNECTION_MAX_OPACITY;
      this.ctx.beginPath();
      this.ctx.moveTo(dotData[iBase], dotData[iBase + 1]);
      this.ctx.lineTo(dotData[jBase], dotData[jBase + 1]);
      this.ctx.strokeStyle = `rgba(${connectionColorRgb}, ${opacity.toFixed(2)})`;
      this.ctx.lineWidth = CONNECTION_LINE_WIDTH;
      this.ctx.stroke();
    });
  }

  renderDots(
    dotData: Float32Array,
    dotCount: number,
    dotColors: string[],
    shadowColor: string,
  ): void {
    const indices = Array.from({ length: dotCount }, (_, i) => i);
    indices.sort(
      (a, b) =>
        dotData[a * FLOATS_PER_DOT + 6] - dotData[b * FLOATS_PER_DOT + 6],
    );

    for (const idx of indices) {
      const base = idx * FLOATS_PER_DOT;
      const x = dotData[base + 0];
      const y = dotData[base + 1];
      const intrinsicRadius = dotData[base + 4];
      const colorIndex = dotData[base + 5];
      const z = dotData[base + 6];

      const scale =
        PERSPECTIVE_MIN_SCALE +
        z * (PERSPECTIVE_MAX_SCALE - PERSPECTIVE_MIN_SCALE);
      const apparentRadius = intrinsicRadius * scale;
      const opacity =
        DEPTH_MIN_OPACITY + z * (DEPTH_MAX_OPACITY - DEPTH_MIN_OPACITY);

      const gradient = this.ctx.createRadialGradient(
        x - apparentRadius * 0.3,
        y - apparentRadius * 0.3,
        apparentRadius * 0.1,
        x,
        y,
        apparentRadius,
      );

      const dotColor = dotColors[colorIndex];
      const baseColor = dotColor.replace(/[\d.]+\)$/, `${opacity.toFixed(2)})`);
      const highlightColor = dotColor.replace(
        /[\d.]+\)$/,
        `${Math.min(opacity * 1.4, 1).toFixed(2)})`,
      );

      gradient.addColorStop(0, highlightColor);
      gradient.addColorStop(1, baseColor);

      if (z > 0.5) {
        const shadowIntensity = (z - 0.5) * 2;
        this.ctx.shadowColor = shadowColor;
        this.ctx.shadowBlur = shadowIntensity * DEPTH_SHADOW_MAX;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = shadowIntensity * 1;
      }

      this.ctx.beginPath();
      this.ctx.arc(x, y, apparentRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = gradient;
      this.ctx.fill();

      if (z > 0.5) {
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
      }
    }
  }

  renderLabels(labels: LabelParticle[], textColor: string): void {
    for (const label of labels) {
      if (label.bitmap) {
        this.ctx.drawImage(
          label.bitmap,
          label.x,
          label.y,
          label.bitmapWidth,
          label.bitmapHeight,
        );
      } else {
        this.ctx.font = LABEL_FONT;
        this.ctx.fillStyle = textColor;
        this.ctx.fillText(label.label, label.x, label.y);
      }
    }
  }
}
