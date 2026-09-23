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

function Platform({ x, y, active = true, a = 85 }: { x: number; y: number; active?: boolean; a?: number }) {
  return (
    <g>
      <ellipse cx={x} cy={y + a * 0.26} rx={a * 0.94} ry={a * 0.35} fill={active ? 'var(--color-primary-200)' : '#e2e8f0'} opacity={0.5} />
      <Cube
        x={x}
        y={y + 10}
        a={a}
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
        stroke="#f472b6"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={x + 40} cy={y - 100} r={4} fill="#f472b6" />
    </g>
  )
}

const POSITIONS: Record<Tile, { x: number; y: number }> = {
  rack: { x: 140, y: 125 },
  screen: { x: 380, y: 125 },
  boxes: { x: 140, y: 285 },
  chart: { x: 380, y: 285 },
}

// Slide 1 — every module connected to a central hub
function HubScene() {
  const active: Tile[] = ['rack', 'screen', 'boxes', 'chart']
  return (
    <>
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
    </>
  )
}

function Label({ x, y, text }: { x: number; y: number; text: string }) {
  const w = text.length * 6.6 + 18
  return (
    <g>
      <rect x={x - w / 2} y={y - 11} width={w} height={22} rx={11} fill="#ffffff" stroke="#e2e8f0" />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill="#334155">
        {text}
      </text>
    </g>
  )
}

// Slide 2 — production line: fabric → cutting → stitching → dispatch
function PipelineScene() {
  const stations = [
    { x: 95, y: 130 },
    { x: 210, y: 188 },
    { x: 325, y: 246 },
    { x: 440, y: 304 },
  ]
  const belt = stations.map((s, i) => `${i ? 'L' : 'M'}${s.x} ${s.y + 4}`).join(' ')

  return (
    <>
      {/* Conveyor belt */}
      <path d={belt} fill="none" stroke="#e2e8f0" strokeWidth={16} strokeLinecap="round" />
      <path
        d={belt}
        fill="none"
        stroke="var(--color-primary-400)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray="8 10"
        className="animate-dash"
      />

      {stations.map((s) => (
        <Platform key={s.x} x={s.x} y={s.y} a={52} />
      ))}

      {/* 1. Fabric roll */}
      <g>
        <ellipse cx={95} cy={128} rx={24} ry={12} fill="var(--color-primary-600)" />
        <rect x={71} y={86} width={48} height={42} fill="var(--color-primary-500)" />
        <path d="M71 96 Q95 108 119 96 M71 108 Q95 120 119 108" fill="none" stroke="var(--color-primary-300)" strokeWidth={1.5} opacity={0.7} />
        <ellipse cx={95} cy={86} rx={24} ry={12} fill="var(--color-primary-300)" />
        <ellipse cx={95} cy={86} rx={7} ry={3.5} fill="var(--color-primary-700)" />
        <path d="M119 118 L140 128 L128 134 L112 126 Z" fill="var(--color-primary-200)" />
      </g>

      {/* 2. Cutting: pattern on the table + scissors */}
      <g transform="matrix(0.9 0.45 -0.9 0.45 210 172)">
        <path
          d="M-10 -14 L-4 -17 L4 -17 L10 -14 L16 -4 L10 -1 L8 -6 L8 16 L-8 16 L-8 -6 L-10 -1 L-16 -4 Z"
          fill="var(--color-primary-50)"
          stroke="var(--color-primary-500)"
          strokeWidth={1.4}
          strokeDasharray="3 2"
        />
      </g>
      <g transform="translate(236 132) rotate(-30)" stroke="#475569" strokeWidth={2.5} strokeLinecap="round" fill="none">
        <circle cx={-6} cy={20} r={5} />
        <circle cx={6} cy={20} r={5} />
        <line x1={-4} y1={15} x2={6} y2={-14} />
        <line x1={4} y1={15} x2={-6} y2={-14} />
      </g>

      {/* 3. Stitched shirts, folded and stacked */}
      <g>
        {[0, 1, 2].map((i) => (
          <Cube
            key={i}
            x={325}
            y={242 - i * 11}
            a={28}
            h={10}
            top={i === 2 ? 'var(--color-primary-300)' : 'var(--color-primary-200)'}
            left="var(--color-primary-400)"
            right="var(--color-primary-500)"
          />
        ))}
        <path d="M317 207 L325 212 L333 207" fill="none" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" />
        <circle cx={345} cy={176} r={3} fill="#f472b6" />
        <path d="M345 179 Q352 192 340 204" fill="none" stroke="#94a3b8" strokeWidth={1.5} />
      </g>

      {/* 4. Delivery truck */}
      <g>
        <ellipse cx={420} cy={318} rx={6} ry={4} fill="#334155" />
        <ellipse cx={462} cy={300} rx={6} ry={4} fill="#334155" />
        <Cube x={452} y={296} a={30} h={40} top="#ffffff" left="#e2e8f0" right="#cbd5e1" stroke="#e2e8f0" />
        <Cube x={418} y={314} a={16} h={24} top="var(--color-primary-300)" left="var(--color-primary-500)" right="var(--color-primary-600)" />
        <polygon points="404,296 418,303 418,294 404,287" fill="var(--color-primary-100)" opacity={0.9} />
        <path d="M440 276 L462 265" stroke="var(--color-primary-400)" strokeWidth={3} strokeLinecap="round" />
      </g>

      <Label x={95} y={54} text="Fabric" />
      <Label x={210} y={104} text="Cutting" />
      <Label x={325} y={166} text="Stitching" />
      <Label x={440} y={232} text="Dispatch" />
    </>
  )
}

// Slide 3 — analytics dashboard with alerts and automation
function InsightsScene() {
  const bars = [34, 52, 40, 66, 58, 82]
  return (
    <>
      <defs>
        <filter id="card-shadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx={0} dy={6} stdDeviation={8} floodColor="#0f172a" floodOpacity={0.08} />
        </filter>
      </defs>

      <Platform x={260} y={300} a={150} />
      <Cube x={260} y={306} a={28} h={10} top="#f1f5f9" left="#cbd5e1" right="#94a3b8" />
      <rect x={255} y={236} width={10} height={62} fill="#cbd5e1" />

      {/* Monitor */}
      <g transform="translate(260 180) skewY(-18)">
        <rect x={-130} y={-104} width={260} height={160} rx={12} fill="#ffffff" stroke="var(--color-primary-200)" strokeWidth={2} filter="url(#card-shadow)" />
        <rect x={-130} y={-104} width={260} height={24} rx={12} fill="var(--color-primary-50)" />
        <circle cx={-114} cy={-92} r={3.5} fill="#f9a8d4" />
        <circle cx={-103} cy={-92} r={3.5} fill="#e0d6fe" />
        <circle cx={-92} cy={-92} r={3.5} fill="#c9b8fb" />

        {/* KPI tiles */}
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${-118 + i * 60} -70)`}>
            <rect width={52} height={30} rx={6} fill={i === 0 ? 'var(--color-primary-500)' : 'var(--color-primary-100)'} />
            <rect x={7} y={8} width={22} height={4} rx={2} fill={i === 0 ? '#ffffff' : 'var(--color-primary-400)'} opacity={0.8} />
            <rect x={7} y={17} width={34} height={6} rx={3} fill={i === 0 ? '#ffffff' : 'var(--color-primary-600)'} />
          </g>
        ))}

        {/* Bar chart */}
        {bars.map((h, i) => (
          <rect
            key={i}
            x={-116 + i * 18}
            y={44 - h * 0.9}
            width={11}
            height={h * 0.9}
            rx={3}
            fill={i === bars.length - 1 ? 'var(--color-primary-600)' : 'var(--color-primary-300)'}
          />
        ))}
        <line x1={-120} y1={45} x2={-8} y2={45} stroke="#e2e8f0" strokeWidth={1.5} />

        {/* Donut */}
        <circle cx={40} cy={-2} r={26} fill="none" stroke="var(--color-primary-100)" strokeWidth={10} />
        <circle
          cx={40}
          cy={-2}
          r={26}
          fill="none"
          stroke="var(--color-primary-500)"
          strokeWidth={10}
          strokeDasharray="112 164"
          transform="rotate(-90 40 -2)"
          strokeLinecap="round"
        />
        <circle cx={40} cy={-2} r={26} fill="none" stroke="#f472b6" strokeWidth={10} strokeDasharray="30 164" strokeDashoffset={-116} transform="rotate(-90 40 -2)" />

        {/* Mini list */}
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(80 ${-28 + i * 22})`}>
            <circle cx={4} cy={4} r={4} fill={['var(--color-primary-500)', '#f472b6', 'var(--color-primary-200)'][i]} />
            <rect x={13} y={1} width={26} height={6} rx={3} fill="#e2e8f0" />
          </g>
        ))}
        <rect x={80} y={40} width={38} height={6} rx={3} fill="var(--color-primary-100)" />
      </g>

      {/* Floating alert card */}
      <g className="animate-float" filter="url(#card-shadow)">
        <rect x={20} y={70} width={120} height={46} rx={12} fill="#ffffff" stroke="#f1f5f9" />
        <circle cx={43} cy={93} r={12} fill="#fce7f3" />
        <path d="M43 86 L43 95 M43 99 L43 100" stroke="#f472b6" strokeWidth={2.5} strokeLinecap="round" />
        <rect x={62} y={84} width={56} height={6} rx={3} fill="#334155" opacity={0.8} />
        <rect x={62} y={96} width={38} height={5} rx={2.5} fill="#cbd5e1" />
      </g>

      {/* Floating growth card */}
      <g className="animate-float [animation-delay:-3s]" filter="url(#card-shadow)">
        <rect x={390} y={232} width={116} height={46} rx={12} fill="#ffffff" stroke="#f1f5f9" />
        <circle cx={413} cy={255} r={12} fill="var(--color-primary-100)" />
        <path d="M407 259 L412 253 L415 256 L420 250 M416 250 L420 250 L420 254" fill="none" stroke="var(--color-primary-600)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <rect x={432} y={246} width={52} height={6} rx={3} fill="#334155" opacity={0.8} />
        <rect x={432} y={258} width={34} height={5} rx={2.5} fill="var(--color-primary-300)" />
      </g>

      {/* Automation gear */}
      <g className="animate-[spin_10s_linear_infinite]" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
        <circle cx={450} cy={70} r={18} fill="none" stroke="var(--color-primary-400)" strokeWidth={9} strokeDasharray="7 5.1" />
        <circle cx={450} cy={70} r={13} fill="var(--color-primary-500)" />
        <circle cx={450} cy={70} r={5} fill="#ffffff" />
      </g>
    </>
  )
}

const SCENES = [HubScene, PipelineScene, InsightsScene]

export default function LoginIllustration({ variant }: { variant: number }) {
  const Scene = SCENES[variant % SCENES.length]
  return (
    <svg
      key={variant}
      viewBox="0 0 520 390"
      className="h-full w-full animate-fade-up"
      role="img"
      aria-label="ERP modules illustration"
    >
      <Scene />
    </svg>
  )
}
