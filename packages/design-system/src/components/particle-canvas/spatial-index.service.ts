import { Injectable } from '@angular/core';

@Injectable()
export class SpatialIndex {
  private data: Float32Array = new Float32Array(0);
  private count = 0;
  private stride = 0;
  private cellSize = 0;
  private readonly cells = new Map<string, number[]>();

  build(
    data: Float32Array,
    count: number,
    stride: number,
    cellSize: number,
  ): void {
    this.data = data;
    this.count = count;
    this.stride = stride;
    this.cellSize = cellSize;
    this.cells.clear();

    for (let i = 0; i < count; i++) {
      const base = i * stride;
      const cellX = Math.floor(data[base] / cellSize);
      const cellY = Math.floor(data[base + 1] / cellSize);
      const key = `${cellX},${cellY}`;
      let cell = this.cells.get(key);
      if (cell === undefined) {
        cell = [];
        this.cells.set(key, cell);
      }
      cell.push(i);
    }
  }

  forEachNeighborPair(
    radius: number,
    callback: (i: number, j: number, distSq: number) => void,
  ): void {
    const { data, stride, cellSize, cells, count } = this;
    const radiusSq = radius * radius;

    for (let i = 0; i < count; i++) {
      const iBase = i * stride;
      const ix = data[iBase];
      const iy = data[iBase + 1];
      const cellX = Math.floor(ix / cellSize);
      const cellY = Math.floor(iy / cellSize);

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const neighbors = cells.get(`${cellX + dx},${cellY + dy}`);
          if (neighbors === undefined) continue;

          for (const j of neighbors) {
            if (j <= i) continue;

            const jBase = j * stride;
            const ddx = ix - data[jBase];
            const ddy = iy - data[jBase + 1];
            const distSq = ddx * ddx + ddy * ddy;

            if (distSq < radiusSq) {
              callback(i, j, distSq);
            }
          }
        }
      }
    }
  }
}
