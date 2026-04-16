/**
 * DecennialTimeline — 十年大运 timeline
 * Real data path: response.data.timeline
 *   .list[] — { key, level, planet, date, nominal, startText, endText, active }
 *   .baseOrder[] — planet names
 *   .orderType, .dayMethod, .calendarType, .birthMoment
 */

interface TimelineEntry {
  key: string;
  level: number;       // 1=L1, 2=L2, etc (nested decennials)
  planet: string;
  date?: string;
  nominal?: string;
  startText?: string;
  endText?: string;
  active?: boolean;
}

const PLANET_GLYPH: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
  Jupiter: "♃", Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇",
};

const PLANET_COLORS: Record<string, string> = {
  Sun: "var(--el-fire)",
  Moon: "var(--ink-secondary)",
  Mercury: "var(--el-wood)",
  Venus: "var(--el-earth)",
  Mars: "var(--el-fire)",
  Jupiter: "var(--el-wood)",
  Saturn: "var(--ink-tertiary)",
  Uranus: "var(--el-water)",
  Neptune: "var(--el-water)",
  Pluto: "var(--ink-primary)",
};

const PLANET_CN: Record<string, string> = {
  Sun: "日", Moon: "月", Mercury: "水", Venus: "金", Mars: "火",
  Jupiter: "木", Saturn: "土", Uranus: "天", Neptune: "海", Pluto: "冥",
};

export default function DecennialTimeline({ data }: { data: Record<string, unknown> }) {
  const timeline = (data.timeline ?? data) as Record<string, unknown>;
  const list = (timeline.list ?? []) as TimelineEntry[];
  const baseOrder = (timeline.baseOrder ?? []) as string[];

  if (!Array.isArray(list) || list.length === 0) {
    return (
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, color: "var(--ink-tertiary)", marginBottom: 12 }}>大运 — 原始数据</div>
        <pre style={{ fontSize: 11, color: "var(--ink-secondary)", overflow: "auto", maxHeight: 400, fontFamily: "var(--font-mono)", whiteSpace: "pre-wrap" }}>
          {JSON.stringify(data, null, 2).slice(0, 4000)}
        </pre>
      </div>
    );
  }

  const l1 = list.filter((e) => e.level === 1);
  const l2 = list.filter((e) => e.level === 2);
  const l3 = list.filter((e) => e.level === 3);

  return (
    <div>
      {/* Meta */}
      <div className="card" style={{ padding: "12px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 13 }}>
          {timeline.orderType && <span><span style={{ color: "var(--ink-tertiary)" }}>顺序: </span>{String(timeline.orderType)}</span>}
          {timeline.dayMethod && <span><span style={{ color: "var(--ink-tertiary)" }}>日法: </span>{String(timeline.dayMethod)}</span>}
          {timeline.calendarType && <span><span style={{ color: "var(--ink-tertiary)" }}>历法: </span>{String(timeline.calendarType)}</span>}
          {timeline.resolvedStartPlanet && <span><span style={{ color: "var(--ink-tertiary)" }}>起行星: </span><span style={{ fontWeight: 500 }}>{String(timeline.resolvedStartPlanet)}</span></span>}
        </div>
      </div>

      {/* Base order */}
      {baseOrder.length > 0 && (
        <div className="card" style={{ padding: "14px 20px", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 10, letterSpacing: 1 }}>
            大运顺序
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {baseOrder.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  padding: "4px 10px", borderRadius: "var(--r-pill)",
                  background: "var(--bg-warm)", fontSize: 13,
                  color: PLANET_COLORS[p] ?? "var(--ink-primary)",
                  fontWeight: 500,
                  display: "inline-flex", alignItems: "center", gap: 4,
                }}>
                  <span style={{ fontSize: 14 }}>{PLANET_GLYPH[p] ?? ""}</span>
                  {p}
                </div>
                {i < baseOrder.length - 1 && (
                  <span style={{ color: "var(--ink-disabled)", fontSize: 11 }}>→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* L1 — main decennials */}
      {l1.length > 0 && (
        <div className="card" style={{ padding: "14px 20px", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 12, letterSpacing: 1 }}>
            十年大运 (Level 1)
          </div>
          <div style={{
            display: "flex", gap: 4, overflowX: "auto",
            paddingBottom: 8, scrollbarWidth: "thin",
          }}>
            {l1.map((e, i) => (
              <div key={i} style={{
                flex: "0 0 auto", minWidth: 130, padding: "12px 10px",
                background: e.active ? "rgba(0,0,0,0.04)" : "var(--bg-base)",
                border: e.active ? "1px solid var(--ink-secondary)" : "1px solid var(--line-subtle)",
                borderRadius: "var(--r-md)",
                textAlign: "center",
              }}>
                <div style={{
                  fontSize: 20, fontFamily: "var(--font-display)", fontWeight: 300,
                  color: PLANET_COLORS[e.planet] ?? "var(--ink-primary)",
                  lineHeight: 1.2,
                }}>
                  {PLANET_GLYPH[e.planet] ?? ""} {PLANET_CN[e.planet] ?? e.planet.slice(0, 1)}
                </div>
                <div style={{ fontSize: 11, color: "var(--ink-secondary)", marginTop: 6 }}>
                  {e.planet}
                </div>
                {e.nominal && (
                  <div style={{ fontSize: 10, color: "var(--ink-tertiary)", marginTop: 3, fontFamily: "var(--font-mono)" }}>
                    {e.nominal}
                  </div>
                )}
                {(e.startText || e.endText) && (
                  <div style={{ fontSize: 10, color: "var(--ink-disabled)", marginTop: 3, fontFamily: "var(--font-mono)" }}>
                    {e.startText}
                    {e.endText && <><br />↓ {e.endText}</>}
                  </div>
                )}
                {e.active && (
                  <div style={{
                    marginTop: 6, fontSize: 10, fontWeight: 600,
                    color: "var(--el-fire)",
                  }}>● 当前</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* L2 — sub-periods */}
      {l2.length > 0 && (
        <div className="card" style={{ padding: "14px 20px", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 10, letterSpacing: 1 }}>
            子限 (Level 2)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 6 }}>
            {l2.slice(0, 30).map((e, i) => (
              <div key={i} style={{
                padding: "8px", background: e.active ? "rgba(0,0,0,0.04)" : "var(--bg-warm)",
                borderRadius: "var(--r-sm)", textAlign: "center",
                border: e.active ? "1px solid var(--ink-secondary)" : "none",
              }}>
                <div style={{ fontSize: 14, color: PLANET_COLORS[e.planet] ?? "var(--ink-primary)", fontWeight: 500 }}>
                  {PLANET_GLYPH[e.planet] ?? ""} {e.planet}
                </div>
                {e.nominal && (
                  <div style={{ fontSize: 10, color: "var(--ink-tertiary)", marginTop: 2, fontFamily: "var(--font-mono)" }}>
                    {e.nominal}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* L3 — micro */}
      {l3.length > 0 && (
        <div className="card" style={{ padding: "14px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 10, letterSpacing: 1 }}>
            微限 (Level 3) · 共 {l3.length} 项
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {l3.slice(0, 60).map((e, i) => (
              <span key={i} style={{
                padding: "2px 8px", fontSize: 11,
                borderRadius: "var(--r-pill)",
                background: e.active ? "var(--bg-warm)" : "transparent",
                color: PLANET_COLORS[e.planet] ?? "var(--ink-tertiary)",
                border: "1px solid var(--line-subtle)",
              }}>
                {PLANET_GLYPH[e.planet] ?? ""} {e.planet}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
