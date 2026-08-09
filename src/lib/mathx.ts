/** Small numeric helpers shared by the demos. No dependencies, all pure. */

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const round = (v: number, places = 2) => {
  const p = 10 ** places
  return Math.round(v * p) / p
}

/** map v from [a0,a1] onto [b0,b1] */
export const remap = (v: number, a0: number, a1: number, b0: number, b1: number) =>
  b0 + ((v - a0) / (a1 - a0)) * (b1 - b0)

/** deterministic PRNG (mulberry32) — demos must look the same on every reload */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Box–Muller, fed by a seeded uniform generator */
export function gaussian(next: () => number, mean = 0, sd = 1) {
  const u = Math.max(1e-9, next())
  const v = next()
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export function softmax(xs: number[], temperature = 1): number[] {
  const t = Math.max(1e-6, temperature)
  const scaled = xs.map((x) => x / t)
  const max = Math.max(...scaled)
  const exps = scaled.map((x) => Math.exp(x - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}

export const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0)
export const norm = (a: number[]) => Math.sqrt(dot(a, a))

export function cosine(a: number[], b: number[]) {
  const d = norm(a) * norm(b)
  return d === 0 ? 0 : dot(a, b) / d
}

export const euclid = (a: number[], b: number[]) =>
  Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0))

export const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

/** sample an index from a probability vector using a supplied uniform source */
export function sampleIndex(probs: number[], u: number): number {
  let acc = 0
  for (let i = 0; i < probs.length; i++) {
    acc += probs[i]
    if (u <= acc) return i
  }
  return probs.length - 1
}

/** Shannon entropy in bits — used by the decision-tree and sampling demos */
export function entropy(probs: number[]): number {
  return -probs.reduce((s, p) => (p > 0 ? s + p * Math.log2(p) : s), 0)
}

export function gini(counts: number[]): number {
  const total = sum(counts)
  if (total === 0) return 0
  return 1 - counts.reduce((s, c) => s + (c / total) ** 2, 0)
}

/** least squares fit of a polynomial of the given degree, via normal equations */
export function polyfit(xs: number[], ys: number[], degree: number, ridge = 1e-8): number[] {
  const n = degree + 1
  const A: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0))
  const b = new Array<number>(n).fill(0)

  for (let i = 0; i < xs.length; i++) {
    const powers: number[] = [1]
    for (let p = 1; p < n; p++) powers.push(powers[p - 1] * xs[i])
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) A[r][c] += powers[r] * powers[c]
      b[r] += powers[r] * ys[i]
    }
  }
  for (let r = 0; r < n; r++) A[r][r] += ridge
  return solve(A, b)
}

export function polyval(coeffs: number[], x: number): number {
  let acc = 0
  for (let i = coeffs.length - 1; i >= 0; i--) acc = acc * x + coeffs[i]
  return acc
}

/** Gaussian elimination with partial pivoting. Returns zeros for singular systems. */
export function solve(Ain: number[][], bin: number[]): number[] {
  const n = bin.length
  const A = Ain.map((row) => row.slice())
  const b = bin.slice()

  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[pivot][col])) pivot = r
    if (Math.abs(A[pivot][col]) < 1e-12) return new Array<number>(n).fill(0)
    ;[A[col], A[pivot]] = [A[pivot], A[col]]
    ;[b[col], b[pivot]] = [b[pivot], b[col]]

    for (let r = col + 1; r < n; r++) {
      const f = A[r][col] / A[col][col]
      if (f === 0) continue
      for (let c = col; c < n; c++) A[r][c] -= f * A[col][c]
      b[r] -= f * b[col]
    }
  }

  const x = new Array<number>(n).fill(0)
  for (let r = n - 1; r >= 0; r--) {
    let acc = b[r]
    for (let c = r + 1; c < n; c++) acc -= A[r][c] * x[c]
    x[r] = acc / A[r][r]
  }
  return x
}

export const mse = (pred: number[], truth: number[]) =>
  mean(pred.map((p, i) => (p - truth[i]) ** 2))

export const fmt = (v: number, places = 2) => {
  if (!Number.isFinite(v)) return '∞'
  return v.toFixed(places)
}

/** 1.2M, 34k, 780 — for parameter counts and token counts */
export function compact(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1e12) return `${round(v / 1e12, 1)}T`
  if (abs >= 1e9) return `${round(v / 1e9, 1)}B`
  if (abs >= 1e6) return `${round(v / 1e6, 1)}M`
  if (abs >= 1e3) return `${round(v / 1e3, 1)}k`
  return String(Math.round(v))
}
