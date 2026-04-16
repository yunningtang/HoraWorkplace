/**
 * AstroChart — 西占星盘
 * Real data: response.data.chart.objects[] / .houses[]
 *
 * Wheel strategy:
 * - Only 10 classical planets + Asc/MC/Nodes on the wheel
 * - Asteroids/lots listed in the table below
 * - Collision avoidance: nearby planets (<8°) get staggered radially
 * - Degree tick + radial line connecting outer ring to planet glyph
 */

const SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
const SIGN_CN: Record<string, string> = {
  Aries:"白羊",Taurus:"金牛",Gemini:"双子",Cancer:"巨蟹",Leo:"狮子",Virgo:"处女",
  Libra:"天秤",Scorpio:"天蝎",Sagittarius:"射手",Capricorn:"摩羯",Aquarius:"水瓶",Pisces:"双鱼",
};
const SIGN_GLYPH: Record<string, string> = {
  Aries:"♈",Taurus:"♉",Gemini:"♊",Cancer:"♋",Leo:"♌",Virgo:"♍",
  Libra:"♎",Scorpio:"♏",Sagittarius:"♐",Capricorn:"♑",Aquarius:"♒",Pisces:"♓",
};

// Glyph map — only show these on the wheel
const PLANET_GLYPH: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
  Jupiter: "♃", Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇",
  NorthNode: "☊", SouthNode: "☋",
  "North Node": "☊", "South Node": "☋",
  Chiron: "⚷",
  Asc: "Asc", MC: "MC", Desc: "Dc", IC: "IC",
};

// Only these get rendered on the wheel (in display priority order)
const WHEEL_BODIES = new Set([
  "Sun", "Moon", "Mercury", "Venus", "Mars",
  "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
  "NorthNode", "SouthNode", "North Node", "South Node",
  "Chiron", "Asc", "MC",
]);

// Background table gets every object, but filter out the house objects
const TABLE_EXCLUDE = new Set<string>();

interface AstroObject {
  type: string;
  sign: string;
  lon: number;
  signlon?: number;
  movedir?: string;
  house?: string;
  id?: string;
}

interface AstroHouse {
  id: string;
  sign: string;
  lon: number;
  signlon?: number;
  ruler: string;
  planets?: string[];
  size?: number;
}

function absLon(o: { lon?: number; signlon?: number; sign?: string }): number {
  if (typeof o.lon === "number") return o.lon;
  if (typeof o.signlon === "number" && o.sign) return SIGNS.indexOf(o.sign) * 30 + o.signlon;
  return 0;
}

function normLon(lon: number): number {
  return ((lon % 360) + 360) % 360;
}

/**
 * Convert zodiac longitude to SVG polar (x, y).
 * Astrology wheel: Aries 0° at the LEFT (9 o'clock), counterclockwise.
 */
function polarXY(cx: number, cy: number, r: number, lonDeg: number) {
  const rad = ((180 - lonDeg) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

/**
 * Collision-avoid: assign each planet a radius offset so nearby ones don't overlap.
 * Returns array of radius adjustments in same order as input.
 */
function staggerRadii(planets: { lon: number }[], baseR: number, spacing: number = 16): number[] {
  const indices = planets.map((_, i) => i);
  indices.sort((a, b) => planets[a].lon - planets[b].lon);
  const radii = new Array(planets.length).fill(baseR);

  for (let k = 0; k < indices.length; k++) {
    const i = indices[k];
    // Count recent planets within 9° ahead
    let cluster: number[] = [i];
    for (let j = k + 1; j < indices.length; j++) {
      const other = indices[j];
      let delta = planets[other].lon - planets[i].lon;
      if (delta < 0) delta += 360;
      if (delta < 9) cluster.push(other);
      else break;
    }
    if (cluster.length > 1) {
      cluster.forEach((idx, pos) => {
        // Alternate in/out around base
        const dir = pos % 2 === 0 ? -1 : 1;
        const step = Math.floor(pos / 2) + 1;
        radii[idx] = baseR + dir * step * spacing;
      });
      k += cluster.length - 1;
    }
  }
  return radii;
}

function WheelSVG({ planets, houses }: { planets: AstroObject[]; houses: AstroHouse[] }) {
  const size = 640;
  const cx = size / 2, cy = size / 2;
  const rOuter = 296, rSignInner = 258, rHouseRing = 216, rInner = 88;
  const rPlanetBase = 150;

  const cusps = houses
    .slice()
    .sort((a, b) => {
      const na = parseInt((a.id || "House0").replace("House", ""));
      const nb = parseInt((b.id || "House0").replace("House", ""));
      return na - nb;
    });

  const wheelPlanets = planets.filter((p) => WHEEL_BODIES.has(p.id ?? ""));
  const radii = staggerRadii(wheelPlanets.map((p) => ({ lon: normLon(absLon(p)) })), rPlanetBase, 20);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", margin: "0 auto", maxWidth: "100%" }}>
      {/* Rings */}
      <circle cx={cx} cy={cy} r={rOuter} fill="var(--bg-base)" stroke="var(--line-default)" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={rSignInner} fill="none" stroke="var(--line-subtle)" strokeWidth="0.5" />
      <circle cx={cx} cy={cy} r={rHouseRing} fill="var(--bg-warm)" fillOpacity="0.3" stroke="var(--line-default)" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={rInner} fill="var(--bg-base)" stroke="var(--line-subtle)" strokeWidth="0.5" />

      {/* Sign divisions */}
      {SIGNS.map((sign, i) => {
        const angle = i * 30;
        const p1 = polarXY(cx, cy, rSignInner, angle);
        const p2 = polarXY(cx, cy, rOuter, angle);
        const mid = polarXY(cx, cy, (rSignInner + rOuter) / 2, angle + 15);
        return (
          <g key={`s${i}`}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--line-subtle)" strokeWidth="0.5" />
            <text x={mid.x} y={mid.y} textAnchor="middle" dominantBaseline="central"
              fill="var(--ink-secondary)" fontSize="20" fontFamily="var(--font-body)">
              {SIGN_GLYPH[sign] ?? sign.slice(0, 3)}
            </text>
          </g>
        );
      })}

      {/* Minor degree ticks every 5° inside sign ring */}
      {Array.from({ length: 72 }, (_, i) => i * 5).map((deg) => {
        const isMajor = deg % 30 === 0;
        if (isMajor) return null;
        const p1 = polarXY(cx, cy, rSignInner, deg);
        const p2 = polarXY(cx, cy, rSignInner + 4, deg);
        return <line key={`t${deg}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--line-subtle)" strokeWidth="0.5" />;
      })}

      {/* House cusps */}
      {cusps.map((h, i) => {
        const lon = absLon(h);
        const p1 = polarXY(cx, cy, rInner, lon);
        const p2 = polarXY(cx, cy, rHouseRing, lon);
        const houseNum = parseInt((h.id || "").replace("House", "")) || (i + 1);
        const isAxis = [1, 4, 7, 10].includes(houseNum);
        const labelPos = polarXY(cx, cy, rInner + 14, lon + 15);
        return (
          <g key={`h${i}`}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke={isAxis ? "var(--ink-secondary)" : "var(--line-default)"}
              strokeWidth={isAxis ? 1.25 : 0.6}
              strokeDasharray={isAxis ? undefined : "3 3"} />
            <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="central"
              fill="var(--ink-disabled)" fontSize="10" fontFamily="var(--font-body)">
              {houseNum}
            </text>
          </g>
        );
      })}

      {/* Planets */}
      {wheelPlanets.map((p, i) => {
        const lon = normLon(absLon(p));
        const r = radii[i];
        const pos = polarXY(cx, cy, r, lon);
        const tickInner = polarXY(cx, cy, rSignInner - 2, lon);
        const tickOuter = polarXY(cx, cy, rSignInner, lon);
        const glyph = PLANET_GLYPH[p.id ?? ""] ?? (p.id ?? "").slice(0, 2);
        const isRetro = p.movedir === "Retrograde";
        return (
          <g key={`p${i}`}>
            {/* Line from outer ring to stagger position */}
            <line x1={pos.x} y1={pos.y} x2={tickInner.x} y2={tickInner.y}
              stroke="var(--line-default)" strokeWidth="0.5" strokeDasharray="2 3" />
            {/* Degree tick on outer ring */}
            <line x1={tickInner.x} y1={tickInner.y} x2={tickOuter.x} y2={tickOuter.y}
              stroke="var(--ink-secondary)" strokeWidth="1.25" />
            {/* Planet circle + glyph */}
            <circle cx={pos.x} cy={pos.y} r={14} fill="var(--bg-base)" stroke="var(--line-default)" strokeWidth="1" />
            <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="central"
              fill="var(--ink-primary)" fontSize={glyph.length <= 2 ? 14 : 10}
              fontFamily="var(--font-body)" fontWeight="500">
              {glyph}
            </text>
            {isRetro && (
              <text x={pos.x + 12} y={pos.y - 10} fill="var(--el-fire)" fontSize="9" fontWeight="600">
                ℞
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function ObjectTable({ objects }: { objects: AstroObject[] }) {
  // Group into planets, luminaries, points, asteroids, lots
  const classical = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
  const modern = ["Uranus", "Neptune", "Pluto"];
  const points = ["NorthNode", "SouthNode", "North Node", "South Node", "Asc", "MC", "Desc", "IC", "Chiron"];

  const order = (p: AstroObject): number => {
    const id = p.id ?? "";
    const c = classical.indexOf(id);
    if (c >= 0) return c;
    const m = modern.indexOf(id);
    if (m >= 0) return 7 + m;
    const pt = points.indexOf(id);
    if (pt >= 0) return 10 + pt;
    return 30;
  };

  const sorted = objects
    .filter((o) => !TABLE_EXCLUDE.has(o.id ?? "") && o.type !== "House")
    .sort((a, b) => order(a) - order(b) || absLon(a) - absLon(b));

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr>
          {["行星 / 点", "星座", "度数", "宫位", "状态"].map((h) => (
            <th key={h} style={{
              padding: "10px 14px", textAlign: "left",
              borderBottom: "1px solid var(--line-default)",
              color: "var(--ink-tertiary)", fontWeight: 500, fontSize: 12,
              letterSpacing: 0.6, textTransform: "uppercase" as const,
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((p, i) => {
          const signlon = typeof p.signlon === "number" ? p.signlon : (absLon(p) % 30);
          const houseNum = p.house ? parseInt(p.house.replace("House", "")) : null;
          const isMain = WHEEL_BODIES.has(p.id ?? "");
          const glyph = PLANET_GLYPH[p.id ?? ""] ?? "·";
          return (
            <tr key={i} style={{ opacity: isMain ? 1 : 0.68 }}>
              <td style={{
                padding: "7px 14px", borderBottom: "1px solid var(--line-subtle)",
                fontWeight: isMain ? 500 : 400,
              }}>
                <span style={{
                  marginRight: 8, fontSize: 15, color: "var(--ink-secondary)",
                  display: "inline-block", width: 16, textAlign: "center",
                }}>{glyph}</span>
                {p.id}
              </td>
              <td style={{ padding: "7px 14px", borderBottom: "1px solid var(--line-subtle)", color: "var(--ink-secondary)" }}>
                <span style={{ marginRight: 6 }}>{SIGN_GLYPH[p.sign] ?? ""}</span>
                {SIGN_CN[p.sign] ?? p.sign}
              </td>
              <td style={{ padding: "7px 14px", borderBottom: "1px solid var(--line-subtle)", fontFamily: "var(--font-mono)", color: "var(--ink-secondary)", fontSize: 12 }}>
                {signlon.toFixed(2)}°
              </td>
              <td style={{ padding: "7px 14px", borderBottom: "1px solid var(--line-subtle)", color: "var(--ink-tertiary)" }}>
                {houseNum ? `${houseNum}宫` : "—"}
              </td>
              <td style={{
                padding: "7px 14px", borderBottom: "1px solid var(--line-subtle)",
                color: p.movedir === "Retrograde" ? "var(--el-fire)" : "var(--ink-disabled)",
                fontSize: 12, fontWeight: p.movedir === "Retrograde" ? 500 : 400,
              }}>
                {p.movedir === "Retrograde" ? "逆行 ℞" : p.movedir === "Direct" ? "顺行" : ""}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function AstroChart({ data }: { data: Record<string, unknown> }) {
  const chart = (data.chart ?? data) as Record<string, unknown>;
  const objects = (chart.objects ?? []) as AstroObject[];
  const houses = (chart.houses ?? []) as AstroHouse[];

  if (!Array.isArray(objects) || objects.length === 0) {
    return (
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, color: "var(--ink-tertiary)", marginBottom: 12 }}>西占星盘 — 原始数据</div>
        <pre style={{ fontSize: 11, color: "var(--ink-secondary)", overflow: "auto", maxHeight: 400, fontFamily: "var(--font-mono)", whiteSpace: "pre-wrap" }}>
          {JSON.stringify(data, null, 2).slice(0, 4000)}
        </pre>
      </div>
    );
  }

  // Infer ids by canonical order if missing
  const canonical = [
    "Sun", "Moon", "Mercury", "Venus", "Mars",
    "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
    "NorthNode", "SouthNode", "Chiron",
    "Asc", "MC", "Desc", "IC",
    "Pars", "Syzygy", "Vertex", "Anti-Vertex",
    "Pallas", "Ceres", "Vesta", "Juno",
    "Pholus", "Dark Moon", "Purple Clouds",
    "Intp_Apog", "Intp_Perg", "SyzygyPars",
    "Pars Fortuna",
  ];
  const objectsWithId = objects.map((o, i) => ({
    ...o,
    id: o.id ?? canonical[i] ?? `Obj${i}`,
  }));

  return (
    <div>
      <div className="card" style={{ padding: 20 }}>
        <WheelSVG planets={objectsWithId} houses={houses} />
      </div>
      <div className="card" style={{ padding: "4px 20px 8px", marginTop: 20 }}>
        <ObjectTable objects={objectsWithId} />
      </div>
    </div>
  );
}
