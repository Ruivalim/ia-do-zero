// calibration scratch for src/demos/bias.tsx — deleted after use
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function gaussian(next, mean = 0, sd = 1) {
  const u = Math.max(1e-9, next())
  const v = next()
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

const A_N = 300
const B_N = 100
const A_TRAIN = 150

// true rule: apto se x + y > 1 (same boundary for both groups)
// B clusters shifted ALONG the boundary (extrapolation region)
const P = {
  A_IN: [0.3, 0.42], A_AP: [0.58, 0.7], A_SD: 0.13,
  B_IN: [0.55, 0.17], B_AP: [0.83, 0.45], B_SD: 0.13,
}

const next = rng(2024)
function gen(n, cin, cap, sd) {
  const out = []
  for (let i = 0; i < n; i++) {
    const apto = next() < 0.5
    const c = apto ? cap : cin
    out.push({
      x: clamp(gaussian(next, c[0], sd), 0.01, 0.99),
      y: clamp(gaussian(next, c[1], sd), 0.01, 0.99),
      label: apto ? 1 : 0,
    })
  }
  return out
}
const A = gen(A_N, P.A_IN, P.A_AP, P.A_SD)
const B = gen(B_N, P.B_IN, P.B_AP, P.B_SD)

function train(bFrac, noise) {
  const kB = Math.round(bFrac * B_N)
  const samples = []
  for (let i = 0; i < A_TRAIN; i++) samples.push(A[i])
  const fr = rng(777)
  for (let i = 0; i < kB; i++) {
    const u = fr()
    samples.push({ x: B[i].x, y: B[i].y, label: u < noise ? 1 - B[i].label : B[i].label })
  }
  const w = [0, 0, 0]
  const lr = 4
  for (let it = 0; it < 400; it++) {
    const g = [0, 0, 0]
    for (const s of samples) {
      const z = w[0] * s.x + w[1] * s.y + w[2]
      const e = 1 / (1 + Math.exp(-z)) - s.label
      g[0] += e * s.x
      g[1] += e * s.y
      g[2] += e
    }
    const n = samples.length
    w[0] -= (lr * g[0]) / n
    w[1] -= (lr * g[1]) / n
    w[2] -= (lr * g[2]) / n
  }
  return w
}
const acc = (w, pts) => {
  let c = 0
  for (const s of pts) if ((w[0] * s.x + w[1] * s.y + w[2] >= 0 ? 1 : 0) === s.label) c++
  return c / pts.length
}

// sanity: true boundary acc
const WT = [1, 1, -1]
console.log('true boundary: A=%s B=%s', acc(WT, A).toFixed(3), acc(WT, B).toFixed(3))
for (const bf of [0.05, 0.08, 0.12, 0.2, 0.3, 0.5])
  for (const nz of [0, 0.15, 0.3]) {
    const w = train(bf, nz)
    const aA = acc(w, A)
    const aB = acc(w, B)
    const g = (aA * A_N + aB * B_N) / (A_N + B_N)
    console.log(
      `b=${bf} noise=${nz}  global=${g.toFixed(3)} A=${aA.toFixed(3)} B=${aB.toFixed(3)}  w=[${w.map((v) => v.toFixed(2))}]`,
    )
  }
