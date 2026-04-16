/**
 * AstroChart — 西占星盘
 * Real data: response.data.chart
 *   .objects[] — { type: "Planet"|"House"|..., sign, lon, movedir, decl, house, dignities, ... }
 *   .houses[]  — { id: "House1".."House12", sign, lon, ruler, planets[], ... }
 *   .date, .geo
 * Also response.data.aspects
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
const PLANET_GLYPH: Record<string, string> = {
  Sun:"☉",Moon:"☽",Mercury:"☿",Venus:"♀",Mars:"♂",
  Jupiter:"♃",Saturn:"♄",Uranus:"♅",Neptune:"♆",Pluto:"♇",
  NorthNode:"☊",SouthNode:"☋","North Node":"☊","South Node":"☋",
  Asc:"Asc",MC:"MC",Desc:"Dsc",IC:"IC",
  Chiron:"⚷", Pars:"⊕", SyzygyPars:"⊕",
};

interface AstroObject {
  type: string;
  sign: string;
  lon: number;
  signlon?: number;
  movedir?: string;
  house?: string;
  dignities?: Record<string, string>;
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

function getSignIndex(sign: string) {
  return Math.max(0, SIGNS.indexOf(sign));
}

function objectAbsLon(o: AstroObject | AstroHouse): number {
  // prefer lon (already absolute)
  if (typeof o.lon === "number") return o.lon;
  if (typeof o.signlon === "number") return getSignIndex(o.sign) * 30 + o.signlon;
  return 0;
}

function polarXY(cx: number, cy: number, r: number, angleDeg: number) {
  // Astrology convention: 0° Aries at left (9 o'clock), counterclockwise
  const rad = ((180 - angleDeg) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function WheelSVG({ planets, houses }: { planets: AstroObject[]; houses: AstroHouse[] }) {
  const size = 560;
  const cx = size / 2, cy = size / 2;
  const rOuter = 260, rSign = 230, rHouse = 180, rPlanet = 150, rInner = 90;

  // House cusp angles: houses are sorted by id (House1..12); absolute lon of each cusp
  const cusps = houses
    .slice()
    .sort((a, b) => {
      const na = parseInt((a.id || "House0").replace("House", ""));
      const nb = parseInt((b.id || "House0").replace("House", ""));
      return na - nb;
    });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", margin: "0 auto", maxWidth: "100%" }}>
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={rOuter} fill="var(--bg-base)" stroke="var(--line-default)" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={rSign} fill="none" stroke="var(--line-subtle)" strokeWidth="0.5" />
      <circle cx={cx} cy={cy} r={rHouse} fill="var(--bg-warm)" stroke="var(--line-default)" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={rInner} fill="var(--bg-base)" stroke="var(--line-subtle)" strokeWidth="0.5" />

      {/* Sign divisions */}
      {SIGNS.map((sign, i) => {
        const angle = i * 30;
        const p1 = polarXY(cx, cy, rSign, angle);
        const p2 = polarXY(cx, cy, rOuter, angle);
        const mid = polarXY(cx, cy, (rSign + rOuter) / 2, angle + 15);
        return (
          <g key={i}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--line-subtle)" strokeWidth="0.5" />
            <text x={mid.x} y={mid.y} textAnchor="middle" dominantBaseline="central"
              fill="var(--ink-secondary)" fontSize="18" fontFamily="var(--font-body)">
              {SIGN_GLYPH[sign] ?? sign.slice(0, 3)}
            </text>
          </g>
        );
      })}

      {/* House cusps */}
      {cusps.map((h, i) => {
        const lon = objectAbsLon(h);
        const p1 = polarXY(cx, cy, rInner, lon);
        const p2 = polarXY(cx, cy, rHouse, lon);
        const houseNum = parseInt((h.id || "").replace("House", "")) || (i + 1);
        const isAxis = [1, 4, 7, 10].includes(houseNum);
        const labelPos = polarXY(cx, cy, rInner - 12, lon + 15);
        return (
          <g key={`h${i}`}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke={isAxis ? "var(--ink-secondary)" : "var(--line-subtle)"}
              strokeWidth={isAxis ? 1.5 : 0.5} />
            <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="central"
              fill="var(--ink-disabled)" fontSize="9" fontFamily="var(--font-body)">
              {houseNum}
            </text>
          </g>
        );
      })}

      {/* Planets */}
      {planets.map((p, i) => {
        const lon = objectAbsLon(p);
        const pos = polarXY(cx, cy, rPlanet, lon);
        const glyph = PLANET_GLYPH[p.id ?? ""] ?? PLANET_GLYPH[(p.id ?? "").replace(/\s/g, "")] ?? "?";
        return (
          <g key={`p${i}`}>
            <circle cx={pos.x} cy={pos.y} r={13} fill="var(--bg-base)" stroke="var(--line-default)" strokeWidth="0.5" />
            <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
              fill="var(--ink-primary)" fontSize="13" fontFamily="var(--font-body)" fontWeight="500">
              {glyph}
            </text>
            {p.movedir === "Retrograde" && (
              <text x={pos.x + 11} y={pos.y - 8} fill="var(--el-fire)" fontSize="8" fontWeight="600">℞</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function ObjectTable({ objects, houses }: { objects: AstroObject[]; houses: AstroHouse[] }) {
  const planets = objects.filter((o) => o.type === "Planet" || o.type === "Node");

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr>
          {["行星", "星座", "度数", "宫位", "状态"].map((h) => (
            <th key={h} style={{ padding: "8px 12px", textAlign: "left", borderBottom: "1px solid var(--line-default)", color: "var(--ink-tertiary)", fontWeight: 500, fontSize: 12 }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {planets.map((p, i) => {
          const signlon = typeof p.signlon === "number" ? p.signlon : (p.lon % 30);
          const houseNum = p.house ? parseInt(p.house.replace("House", "")) : "—";
          return (
            <tr key={i}>
              <td style={{ padding: "6px 12px", borderBottom: "1px solid var(--line-subtle)" }}>
                <span style={{ marginRight: 6, fontSize: 15 }}>{PLANET_GLYPH[p.id ?? ""] ?? ""}</span>
                {p.id}
              </td>
              <td style={{ padding: "6px 12px", borderBottom: "1px solid var(--line-subtle)", color: "var(--ink-secondary)" }}>
                {SIGN_GLYPH[p.sign] ?? ""} {SIGN_CN[p.sign] ?? p.sign}
              </td>
              <td style={{ padding: "6px 12px", borderBottom: "1px solid var(--line-subtle)", fontFamily: "var(--font-mono)", color: "var(--ink-secondary)", fontSize: 12 }}>
                {signlon.toFixed(2)}°
              </td>
              <td style={{ padding: "6px 12px", borderBottom: "1px solid var(--line-subtle)", color: "var(--ink-tertiary)" }}>
                {houseNum !== "—" ? `${houseNum}宫` : "—"}
              </td>
              <td style={{ padding: "6px 12px", borderBottom: "1px solid var(--line-subtle)", color: p.movedir === "Retrograde" ? "var(--el-fire)" : "var(--ink-disabled)", fontSize: 12 }}>
                {p.movedir === "Retrograde" ? "逆行" : p.movedir === "Direct" ? "顺行" : ""}
              </td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={5} style={{ padding: "8px 12px", fontSize: 11, color: "var(--ink-disabled)", borderTop: "1px solid var(--line-default)" }}>
            十二宫:{houses.slice().sort((a, b) => parseInt((a.id || "").replace("House", "")) - parseInt((b.id || "").replace("House", ""))).slice(0, 12).map((h) => {
              const n = parseInt((h.id || "").replace("House", ""));
              return ` ${n}${SIGN_GLYPH[h.sign] ?? h.sign}`;
            }).join("")}
          </td>
        </tr>
      </tfoot>
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

  // Ensure `id` is populated — from iteration index if not present
  const objectsWithId = objects.map((o, i) => {
    if (o.id) return o;
    // Objects array in Horosa has id in a separate field; try to get id from `type` or infer
    // Since Horosa's object list has names embedded differently, we might need to map
    const inferredNames = ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune","Pluto","NorthNode","SouthNode","Chiron","Asc","MC","Desc","IC"];
    return { ...o, id: inferredNames[i] ?? `Obj${i}` };
  });

  const planets = objectsWithId.filter((o) => o.type === "Planet" || o.type === "Node" || ["Asc", "MC"].includes(o.id ?? ""));

  return (
    <div>
      <div className="card" style={{ padding: 20 }}>
        <WheelSVG planets={planets} houses={houses} />
      </div>
      <div className="card" style={{ padding: "4px 20px 8px", marginTop: 20 }}>
        <ObjectTable objects={objectsWithId} houses={houses} />
      </div>
    </div>
  );
}
