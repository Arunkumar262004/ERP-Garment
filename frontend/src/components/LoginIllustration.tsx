// Isometric scene for the login showcase. Pure SVG, no external assets.

type Tile = 'rack' | 'screen' | 'boxes' | 'chart'

interface CubeProps {
  x: number // centre of the bottom face
  y: number
  a: number // half width
  h: number // height
  top: string
  left: string
  right: string
  stroke?: string
}

function Cube({ x, y, a, h, top, left, right, stroke = 'none' }: CubeProps) {
  const b = a / 2
  return (
    <g stroke={stroke} strokeWidth={1} strokeLinejoin="round">
      <polygon points={`${x - a},${y - h} ${x},${y + b - h} ${x},${y + b} ${x - a},${y}`} fill={left} />
      <polygon points={`${x + a},${y - h} ${x},${y + b - h} ${x},${y + b} ${x + a},${y}`} fill={right} />
      <polygon points={`${x},${y - b - h} ${x + a},${y - h} ${x},${y + b - h} ${x - a},${y - h}`} fill={top} />
    </g>
  )
}

function Platform({ x, y, active }: { x: number; y: number; active: boolean }) {
  return (
    <g className="transition-all duration-500">
      <ellipse cx={x} cy={y + 22} rx={80} ry={30} fill={active ? 'var(--color-primary-200)' : '#e2e8f0'} opacity={0.5} />
      <Cube
        x={x}
        y={y + 10}
        a={85}
        h={10}
        top={active ? 'var(--color-primary-50)' : '#ffffff'}
        left={active ? 'var(--color-primary-200)' : '#e2e8f0'}
        right={active ? 'var(--color-primary-300)' : '#cbd5e1'}
        stroke={active ? 'var(--color-primary-300)' : '#e2e8f0'}
      />
    </g>
  )
}

function Shirt({ x, y, fill }: { x: number; y: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <line x1={0} y1={-8} x2={0} y2={-3} stroke="#94a3b8" strokeWidth={1.5} />
      <path
        d="M-10 0 L-4 -3 L4 -3 L10 0 L15 9 L10 11 L8 7 L8 28 L-8 28 L-8 7 L-10 11 L-15 9 Z"
        fill={fill}
        stroke="var(--color-primary-700)"
        strokeOpacity={0.15}
      />
    </g>
  )
}

function RackTile({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <line x1={x - 38} y1={y + 2} x2={x - 38} y2={y - 78} stroke="#64748b" strokeWidth={3} strokeLinecap="round" />
      <line x1={x + 38} y1={y - 6} x2={x + 38} y2={y - 86} stroke="#64748b" strokeWidth={3} strokeLinecap="round" />
      <line x1={x - 38} y1={y - 76} x2={x + 38} y2={y - 84} stroke="#64748b" strokeWidth={3} strokeLinecap="round" />
      <Shirt x={x - 22} y={y - 70} fill="var(--color-primary-400)" />
      <Shirt x={x} y={y - 72} fill="var(--color-primary-500)" />
      <Shirt x={x + 22} y={y - 74} fill="var(--color-primary-200)" />
    </g>
  )
}

function ScreenTile({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <Cube x={x + 18} y={y + 4} a={34} h={18} top="#f1f5f9" left="#cbd5e1" right="#94a3b8" />
      <g transform={`translate(${x - 8} ${y - 34}) skewY(-26)`}>
        <rect x={-38} y={-52} width={76} height={54} rx={5} fill="#ffffff" stroke="var(--color-primary-200)" strokeWidth={2} />
        <rect x={-32} y={-46} width={30} height={6} rx={3} fill="var(--color-primary-500)" />
        <rect x={-32} y={-34} width={20} height={16} rx={2} fill="var(--color-primary-100)" />
        <rect x={-8} y={-34} width={20} height={16} rx={2} fill="var(--color-primary-200)" />
        <rect x={16} y={-34} width={16} height={16} rx={2} fill="var(--color-primary-300)" />
        <rect x={-32} y={-12} width={64} height={4} rx={2} fill="#e2e8f0" />
      </g>
      <line x1={x - 8} y1={y - 16} x2={x - 8} y2={y - 2} stroke="#94a3b8" strokeWidth={3} />
    </g>
  )
}

function BoxesTile({ x, y }: { x: number; y: number }) {
  const box = { top: 'var(--color-primary-100)', left: 'var(--color-primary-300)', right: 'var(--color-primary-400)' }
  return (
    <g>
      <Cube x={x + 22} y={y - 4} a={22} h={26} {...box} />
      <Cube x={x + 22} y={y - 30} a={22} h={26} {...box} />
      <Cube x={x - 22} y={y + 8} a={22} h={26} {...box} />
      <line x1={x - 22} y1={y - 29} x2={x - 22} y2={y - 7} stroke="#ffffff" strokeWidth={2} opacity={0.7} />
    </g>
  )
}

function ChartTile({ x, y }: { x: number; y: number }) {
  const bars = [
    { dx: 36, dy: -18, h: 72, c: ['var(--color-primary-500)', 'var(--color-primary-600)', 'var(--color-primary-700)'] },
    { dx: 12, dy: -6, h: 52, c: ['var(--color-primary-400)', 'var(--color-primary-500)', 'var(--color-primary-600)'] },
    { dx: -12, dy: 6, h: 36, c: ['var(--color-primary-300)', 'var(--color-primary-400)', 'var(--color-primary-500)'] },
    { dx: -36, dy: 18, h: 22, c: ['var(--color-primary-200)', 'var(--color-primary-300)', 'var(--color-primary-400)'] },
  ]
  return (
    <g>
      {bars.map((bar) => (
        <Cube
          key={bar.dx}
          x={x + bar.dx}
          y={y + bar.dy}
          a={11}
          h={bar.h}
          top={bar.c[0]}
          left={bar.c[1]}
          right={bar.c[2]}
        />
      ))}
      <path
        d={`M${x - 42} ${y - 18} L${x - 14} ${y - 44} L${x + 8} ${y - 50} L${x + 40} ${y - 100}`}
        fill="none"
        stroke="#f59e0b"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={x + 40} cy={y - 100} r={4} fill="#f59e0b" />
    </g>
  )
}

const POSITIONS: Record<Tile, { x: number; y: number }> = {
  rack: { x: 140, y: 125 },
  screen: { x: 380, y: 125 },
  boxes: { x: 140, y: 285 },
  chart: { x: 380, y: 285 },
}

export default function LoginIllustration({ active }: { active: Tile[] }) {
  return (
    <svg viewBox="0 0 520 390" className="h-full w-full" role="img" aria-label="ERP modules illustration">
      <defs>
        <radialGradient id="hub-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-primary-300)" stopOpacity={0.6} />
          <stop offset="100%" stopColor="var(--color-primary-300)" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="hub-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-primary-200)" />
          <stop offset="100%" stopColor="var(--color-primary-300)" />
        </linearGradient>
      </defs>

      {/* Orbit connecting the modules */}
      <ellipse cx={260} cy={210} rx={165} ry={82} fill="none" stroke="var(--color-primary-200)" strokeWidth={2} />
      <ellipse cx={260} cy={210} rx={200} ry={100} fill="none" stroke="var(--color-primary-100)" strokeWidth={1.5} strokeDasharray="4 6" />

      {(['rack', 'screen'] as Tile[]).map((t) => (
        <Platform key={t} {...POSITIONS[t]} active={active.includes(t)} />
      ))}
      <RackTile {...POSITIONS.rack} />
      <ScreenTile {...POSITIONS.screen} />

      {/* Central hub */}
      <ellipse cx={260} cy={214} rx={70} ry={34} fill="url(#hub-glow)" />
      <ellipse cx={260} cy={222} rx={36} ry={16} fill="var(--color-primary-300)" />
      <rect x={224} y={200} width={72} height={22} fill="url(#hub-body)" />
      <ellipse cx={260} cy={200} rx={36} ry={16} fill="var(--color-primary-100)" stroke="var(--color-primary-300)" strokeWidth={1.5} />
      <ellipse cx={260} cy={200} rx={20} ry={8} fill="none" stroke="var(--color-primary-500)" strokeWidth={2} />
      <g className="animate-float">
        <circle cx={260} cy={160} r={18} fill="var(--color-primary-500)" />
        <path
          d="M252 154 L256 152 L264 152 L268 154 L271 159 L268 160 L266 158 L266 169 L254 169 L254 158 L252 160 L249 159 Z"
          fill="#ffffff"
        />
      </g>

      {(['boxes', 'chart'] as Tile[]).map((t) => (
        <Platform key={t} {...POSITIONS[t]} active={active.includes(t)} />
      ))}
      <BoxesTile {...POSITIONS.boxes} />
      <ChartTile {...POSITIONS.chart} />
    </svg>
  )
}
