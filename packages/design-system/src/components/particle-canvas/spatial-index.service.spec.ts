import { SpatialIndex } from './spatial-index.service';

// Float32Array layout: [x, y, vx, vy, intrinsicRadius, colorIndex, z]
// Matches FLOATS_PER_DOT from particle-engine.service.ts — imported as a
// literal to avoid pulling the full Angular DI chain through ParticleEngine.
const FLOATS_PER_DOT = 7;

describe('UT: SpatialIndex @critical', () => {
  let index: SpatialIndex;

  beforeEach(() => {
    index = new SpatialIndex();
  });

  class should {
    static readonly buildWithoutError =
      'build the spatial index without throwing';
    static readonly findNeighborsWithinRadius =
      'find neighbor pairs within the specified radius';
    static readonly notReturnPairsBeyondRadius =
      'not report pairs beyond the specified radius';
    static readonly handleEmptyData =
      'handle empty data (zero particles) gracefully';
    static readonly handleSingleParticle =
      'produce no pairs when only one particle exists';
    static readonly reportCorrectDistanceSquared =
      'report the correct squared distance for each neighbor pair';
  }

  function buildTestData(positions: [number, number][]): {
    data: Float32Array;
    count: number;
  } {
    const count = positions.length;
    const data = new Float32Array(count * FLOATS_PER_DOT);

    for (let i = 0; i < count; i++) {
      const base = i * FLOATS_PER_DOT;
      data[base] = positions[i][0]; // x
      data[base + 1] = positions[i][1]; // y
      // vx, vy, radius, colorIndex, z remain 0
    }

    return { data, count };
  }

  it(should.buildWithoutError, () => {
    const { data, count } = buildTestData([
      [10, 10],
      [20, 20],
    ]);

    expect(() => {
      index.build(data, count, FLOATS_PER_DOT, 50);
    }).not.toThrow();
  });

  it(should.findNeighborsWithinRadius, () => {
    const { data, count } = buildTestData([
      [0, 0],
      [5, 0],
      [10, 0],
    ]);

    index.build(data, count, FLOATS_PER_DOT, 50);

    const pairs: [number, number][] = [];
    index.forEachNeighborPair(15, (i, j) => {
      pairs.push([i, j]);
    });

    // All three points are within 15 units of each other:
    // (0,0)-(5,0) = 5, (0,0)-(10,0) = 10, (5,0)-(10,0) = 5
    expect(pairs).toHaveLength(3);
  });

  it(should.notReturnPairsBeyondRadius, () => {
    const { data, count } = buildTestData([
      [0, 0],
      [100, 100],
    ]);

    index.build(data, count, FLOATS_PER_DOT, 50);

    const pairs: [number, number][] = [];
    index.forEachNeighborPair(10, (i, j) => {
      pairs.push([i, j]);
    });

    expect(pairs).toHaveLength(0);
  });

  it(should.handleEmptyData, () => {
    const data = new Float32Array(0);

    index.build(data, 0, FLOATS_PER_DOT, 50);

    const pairs: [number, number][] = [];
    index.forEachNeighborPair(100, (i, j) => {
      pairs.push([i, j]);
    });

    expect(pairs).toHaveLength(0);
  });

  it(should.handleSingleParticle, () => {
    const { data, count } = buildTestData([[50, 50]]);

    index.build(data, count, FLOATS_PER_DOT, 50);

    const pairs: [number, number][] = [];
    index.forEachNeighborPair(100, (i, j) => {
      pairs.push([i, j]);
    });

    expect(pairs).toHaveLength(0);
  });

  it(should.reportCorrectDistanceSquared, () => {
    const { data, count } = buildTestData([
      [0, 0],
      [3, 4],
    ]);

    index.build(data, count, FLOATS_PER_DOT, 50);

    const results: { i: number; j: number; distSq: number }[] = [];
    index.forEachNeighborPair(10, (i, j, distSq) => {
      results.push({ i, j, distSq });
    });

    expect(results).toHaveLength(1);
    expect(results[0].i).toBe(0);
    expect(results[0].j).toBe(1);
    // distance(0,0 -> 3,4) = 5, distSq = 25
    expect(results[0].distSq).toBe(25);
  });
});
