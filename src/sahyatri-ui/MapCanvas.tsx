/**
 * Stand-in for the live map (original/src/components/LiveMap.tsx +
 * original/src/screens/mapHtml.ts). The real map is Leaflet in a WebView over
 * the OpenFreeMap "liberty" vector style; here the basemap is a drawn SVG street
 * grid in that style's colours, and the markers (car, rider avatars, pickup
 * pins, name tags) copy mapHtml.ts's CSS exactly.
 *
 * Coordinates are canvas pixels. `pointAlong(route, t)` gives a position and
 * heading for animating the car.
 *
 * Note: the real app draws no route line. `route` is drawn only when passed.
 */
import React from 'react';
import { colors, fontFamily, withAlpha } from './tokens';
import { initialsOf } from './primitives';

export interface MapPoint { x: number; y: number }
export interface MapCar extends MapPoint {
  /** Degrees, 0 = up. Draws the yellow heading arrow. */
  heading?: number | null;
  /** Tag text: driver's first name, or "You". */
  label: string;
  /** Riders already aboard → green "+N" in the tag. */
  aboard?: number;
  /** e.g. "2 min ago" when the fix is stale. */
  sub?: string | null;
  stale?: boolean;
  isMe?: boolean;
}
export interface MapPersonPin extends MapPoint {
  id: string;
  label: string;
  name?: string;
  initials?: string;
  color: string;
  isMe?: boolean;
  stale?: boolean;
  sub?: string | null;
}
export interface MapPickup extends MapPoint { name?: string | null }

export interface MapCanvasProps {
  width: number;
  height: number;
  car?: MapCar | null;
  people?: MapPersonPin[];
  pickups?: MapPickup[];
  route?: MapPoint[];
  /** Fraction of the route already driven (drawn faded). */
  routeProgress?: number;
  /** Destination flag at the end of the route, e.g. "Prestige Tech Park". */
  destinationLabel?: string;
  /** Drives the pulsing halo around "me". */
  timeMs?: number;
  /** Shift of the street grid in px (use the same offset as your points so they stay on streets). */
  gridOffset?: MapPoint;
}

/** OpenFreeMap "liberty"-style palette (approximate). */
const MAP = {
  land: '#F8F4F0',
  block: '#EFE9E1',
  building: '#E6DED5',
  park: '#D8E8C8',
  water: '#A0C8F0',
  minor: '#FFFFFF',
  minorCasing: '#DCD6CF',
  major: '#FFEEAA',
  majorCasing: '#E9AC77',
  label: '#666666',
} as const;

/** Position and heading at fraction t (0..1) along a polyline. */
export function pointAlong(route: MapPoint[], t: number): MapPoint & { heading: number } {
  if (route.length < 2) return { ...(route[0] ?? { x: 0, y: 0 }), heading: 0 };
  const seg: number[] = [];
  let total = 0;
  for (let i = 1; i < route.length; i++) {
    const d = Math.hypot(route[i].x - route[i - 1].x, route[i].y - route[i - 1].y);
    seg.push(d);
    total += d;
  }
  let target = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < seg.length; i++) {
    if (target <= seg[i] || i === seg.length - 1) {
      const a = route[i], b = route[i + 1];
      const k = seg[i] ? Math.min(1, target / seg[i]) : 0;
      const heading = (Math.atan2(b.x - a.x, -(b.y - a.y)) * 180) / Math.PI;
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, heading };
    }
    target -= seg[i];
  }
  return { ...route[route.length - 1], heading: 0 };
}

function splitRoute(route: MapPoint[], t: number): [MapPoint[], MapPoint[]] {
  if (route.length < 2 || t <= 0) return [[], route];
  if (t >= 1) return [route, []];
  const p = pointAlong(route, t);
  let total = 0;
  const lens: number[] = [0];
  for (let i = 1; i < route.length; i++) {
    total += Math.hypot(route[i].x - route[i - 1].x, route[i].y - route[i - 1].y);
    lens.push(total);
  }
  const at = t * total;
  const idx = lens.findIndex((l) => l > at);
  return [[...route.slice(0, idx), p], [p, ...route.slice(idx)]];
}

const pts = (r: MapPoint[]) => r.map((p) => `${p.x},${p.y}`).join(' ');

/** Basemap: blocks, parks, a lake, a minor-street grid and two arterials. */
function Basemap({ width, height, offset }: { width: number; height: number; offset?: MapPoint }) {
  const step = 78;
  const gx = offset ? (((offset.x % step) + step) % step) - step : 0;
  const gy = offset ? (((offset.y % step) + step) % step) - step : 0;
  const cols = Math.ceil(width / step) + 3;
  const rows = Math.ceil(height / step) + 3;
  const blocks: React.ReactNode[] = [];
  for (let c = -1; c < cols; c++) {
    for (let r = -1; r < rows; r++) {
      const x = c * step + 7;
      const y = r * step + 7;
      const seed = (c * 7 + r * 13 + 100) % 9;
      blocks.push(<rect key={`b${c}-${r}`} x={x} y={y} width={step - 14} height={step - 14} rx={3} fill={MAP.block} />);
      if (seed % 3 === 0) {
        blocks.push(<rect key={`h${c}-${r}`} x={x + 8} y={y + 8} width={(step - 30) * 0.55} height={(step - 30) * 0.45} rx={1.5} fill={MAP.building} />);
        blocks.push(<rect key={`i${c}-${r}`} x={x + 30} y={y + 30} width={(step - 30) * 0.45} height={(step - 30) * 0.5} rx={1.5} fill={MAP.building} />);
      }
    }
  }
  const minor: React.ReactNode[] = [];
  for (let c = 0; c <= cols; c++) {
    const x = c * step;
    minor.push(<line key={`vc${c}`} x1={x} y1={-20} x2={x} y2={height + 20} stroke={MAP.minorCasing} strokeWidth={11} />);
  }
  for (let r = 0; r <= rows; r++) {
    const y = r * step;
    minor.push(<line key={`hc${r}`} x1={-20} y1={y} x2={width + 20} y2={y} stroke={MAP.minorCasing} strokeWidth={11} />);
  }
  for (let c = 0; c <= cols; c++) {
    const x = c * step;
    minor.push(<line key={`v${c}`} x1={x} y1={-20} x2={x} y2={height + 20} stroke={MAP.minor} strokeWidth={9} />);
  }
  for (let r = 0; r <= rows; r++) {
    const y = r * step;
    minor.push(<line key={`h${r}`} x1={-20} y1={y} x2={width + 20} y2={y} stroke={MAP.minor} strokeWidth={9} />);
  }
  const diag = `M ${-40} ${height * 0.78} L ${width + 40} ${height * 0.18}`;
  const ring = `M ${width * 0.62} ${-20} C ${width * 0.58} ${height * 0.3}, ${width * 0.72} ${height * 0.55}, ${width * 0.66} ${height + 20}`;
  return (
    <g>
      <rect x={0} y={0} width={width} height={height} fill={MAP.land} />
      <g transform={`translate(${gx} ${gy})`}>
      {blocks}
      <rect x={step * 1 + 7} y={step * 2 + 7} width={step * 2 - 14} height={step - 14} rx={6} fill={MAP.park} />
      <rect x={step * 3 + 7} y={step * 6 + 7} width={step - 14} height={step * 2 - 14} rx={6} fill={MAP.park} />
      <ellipse cx={width * 0.85} cy={height * 0.62} rx={58} ry={38} fill={MAP.water} />
      {minor}
      <path d={diag} stroke={MAP.majorCasing} strokeWidth={17} fill="none" />
      <path d={ring} stroke={MAP.majorCasing} strokeWidth={17} fill="none" />
      <path d={diag} stroke={MAP.major} strokeWidth={13} fill="none" />
      <path d={ring} stroke={MAP.major} strokeWidth={13} fill="none" />
      <text x={width * 0.08} y={height * 0.72} transform={`rotate(-28 ${width * 0.08} ${height * 0.72})`} fill={MAP.label} fontFamily={fontFamily} fontSize={11} fontWeight={600}>Outer Ring Road</text>
      <text x={width * 0.66 + 10} y={height * 0.42} transform={`rotate(84 ${width * 0.66 + 10} ${height * 0.42})`} fill={MAP.label} fontFamily={fontFamily} fontSize={11} fontWeight={600}>Sarjapur Road</text>
      </g>
    </g>
  );
}

const tagStyle = (isMe?: boolean): React.CSSProperties => ({
  position: 'absolute', left: 0, transform: 'translate(-50%, 0)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5,
  padding: '4px 9px', borderRadius: 999, fontFamily, fontSize: 12, fontWeight: 700, letterSpacing: -0.1, lineHeight: '15px',
  background: isMe ? colors.brand : colors.surface, color: isMe ? colors.textInverse : colors.text,
  boxShadow: `0 3px 10px ${withAlpha(colors.shadow, 0.22)}`,
});

function CarMarker({ car }: { car: MapCar }) {
  return (
    <div style={{ position: 'absolute', left: car.x, top: car.y, width: 0, height: 0, opacity: car.stale ? 0.55 : 1, zIndex: 1000 }}>
      {typeof car.heading === 'number' && !car.stale ? (
        <div style={{ position: 'absolute', width: 46, height: 46, left: -23, top: -23, transform: `rotate(${Math.round(car.heading)}deg)` }}>
          <div
            style={{
              position: 'absolute', left: '50%', top: -9, transform: 'translateX(-50%)', width: 0, height: 0,
              borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: `9px solid ${colors.mapDriverRing}`,
            }}
          />
        </div>
      ) : null}
      <div
        style={{
          position: 'absolute', width: 46, height: 46, left: -23, top: -23, borderRadius: '50%', boxSizing: 'border-box',
          background: colors.mapDriver, border: `3px solid ${colors.mapDriverRing}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 6px 16px ${withAlpha(colors.shadow, 0.45)}`,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill={colors.textInverse} aria-hidden>
          <path d="M5 11l1.5-4.5A2 2 0 018.4 5h7.2a2 2 0 011.9 1.5L19 11v6a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H8v1a1 1 0 01-1 1H6a1 1 0 01-1-1v-6zm2.2-1h9.6l-1-3H8.2l-1 3zM7.5 14a1 1 0 100-2 1 1 0 000 2zm9 0a1 1 0 100-2 1 1 0 000 2z" />
        </svg>
      </div>
      <div style={{ ...tagStyle(car.isMe), top: -58 }}>
        {car.label}
        {car.sub ? <span style={{ fontWeight: 600, opacity: 0.6 }}>{car.sub}</span> : null}
        {car.aboard && car.aboard > 0 ? (
          <span
            style={{
              minWidth: 18, height: 18, padding: '0 5px', boxSizing: 'border-box', borderRadius: 9, display: 'inline-flex', alignItems: 'center',
              justifyContent: 'center', background: colors.accent, color: colors.textInverse, fontSize: 11,
            }}
          >
            +{car.aboard}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function PersonMarker({ p, timeMs }: { p: MapPersonPin; timeMs?: number }) {
  // mapHtml.ts: @keyframes pulse 2s ease-out infinite, scale .6→2.2, opacity .5→0
  const raw = timeMs === undefined ? 0.3 : (timeMs % 2000) / 2000;
  const v = cubic(raw);
  return (
    <div style={{ position: 'absolute', left: p.x, top: p.y, width: 0, height: 0, opacity: p.stale ? 0.55 : 1, zIndex: p.isMe ? 800 : 500 }}>
      {p.isMe && !p.stale ? (
        <div style={{ position: 'absolute', width: 34, height: 34, left: -17, top: -17, borderRadius: '50%', background: p.color, transform: `scale(${0.6 + 1.6 * v})`, opacity: 0.5 * (1 - v) }} />
      ) : null}
      <div
        style={{
          position: 'absolute', width: 34, height: 34, left: -17, top: -17, borderRadius: '50%', boxSizing: 'border-box',
          border: `3px solid ${colors.surface}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: p.color,
          color: colors.textInverse, fontFamily, fontSize: 12, fontWeight: 800, letterSpacing: -0.3, boxShadow: `0 4px 12px ${withAlpha(colors.shadow, 0.35)}`,
        }}
      >
        {p.initials ?? initialsOf(p.name ?? p.label)}
      </div>
      <div style={{ ...tagStyle(p.isMe), top: -48 }}>
        {p.label}
        {p.sub ? <span style={{ fontWeight: 600, opacity: 0.6 }}>{p.sub}</span> : null}
      </div>
    </div>
  );
}

/** CSS `ease-out` = cubic-bezier(0, 0, 0.58, 1), approximated. */
function cubic(t: number) {
  return 1 - Math.pow(1 - t, 2.2);
}

function PickupMarker({ p }: { p: MapPickup }) {
  return (
    <div style={{ position: 'absolute', left: p.x, top: p.y, width: 0, height: 0, zIndex: 100 }}>
      <div
        style={{
          position: 'absolute', width: 26, height: 26, left: -13, top: -26, borderRadius: '13px 13px 13px 2px', transform: 'rotate(-45deg)',
          background: colors.surface, border: `2px solid ${colors.brand}`, boxSizing: 'border-box', boxShadow: `0 3px 8px ${withAlpha(colors.shadow, 0.25)}`,
        }}
      >
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 8, height: 8, margin: '-4px 0 0 -4px', borderRadius: '50%', background: colors.brand }} />
      </div>
      {p.name ? (
        <div
          style={{
            position: 'absolute', left: 0, top: 4, transform: 'translate(-50%, 0)', whiteSpace: 'nowrap', fontFamily, fontSize: 11, fontWeight: 700,
            color: colors.text, textShadow: `0 0 3px ${colors.surface}, 0 0 3px ${colors.surface}, 0 0 3px ${colors.surface}`,
          }}
        >
          {p.name}
        </div>
      ) : null}
    </div>
  );
}

export default function MapCanvas({ width, height, car, people = [], pickups = [], route, routeProgress = 0, destinationLabel, timeMs, gridOffset }: MapCanvasProps) {
  const [done, todo] = route ? splitRoute(route, routeProgress) : [[], []];
  const end = route?.[route.length - 1];
  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden', background: colors.mapBackground }}>
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        <Basemap width={width} height={height} offset={gridOffset} />
        {route ? (
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {done.length > 1 ? <polyline points={pts(done)} stroke={withAlpha(colors.brand, 0.25)} strokeWidth={6} /> : null}
            {todo.length > 1 ? (
              <>
                <polyline points={pts(todo)} stroke={colors.surface} strokeWidth={9} />
                <polyline points={pts(todo)} stroke={colors.brand} strokeWidth={5} />
              </>
            ) : null}
          </g>
        ) : null}
      </svg>
      {end && destinationLabel ? (
        <div style={{ position: 'absolute', left: end.x, top: end.y, width: 0, height: 0, zIndex: 90 }}>
          <div style={{ position: 'absolute', left: -7, top: -7, width: 14, height: 14, background: colors.brand, border: `3px solid ${colors.surface}`, boxSizing: 'content-box', boxShadow: `0 3px 8px ${withAlpha(colors.shadow, 0.25)}` }} />
          <div style={{ ...tagStyle(false), top: -12, left: -16, transform: 'translate(-100%, 0)' }}>{destinationLabel}</div>
        </div>
      ) : null}
      {pickups.map((p, i) => <PickupMarker key={`pk${i}`} p={p} />)}
      {people.map((p) => <PersonMarker key={p.id} p={p} timeMs={timeMs} />)}
      {car ? <CarMarker car={car} /> : null}
    </div>
  );
}
