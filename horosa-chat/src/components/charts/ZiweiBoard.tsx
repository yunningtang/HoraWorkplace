/**
 * ZiweiBoard — 紫微斗数 12-palace grid
 * Real data path: response.data.chart.houses[0..11]
 *
 * 4x4 grid, center 2x2 = info:
 *   [巳5] [午6] [未7] [申8]
 *   [辰4] [info     ] [酉9]
 *   [卯3] [info     ] [戌10]
 *   [寅2] [丑1] [子0] [亥11]
 */

interface Star {
  name: string;
  starlight?: string;
  sihua?: string;
}

interface House {
  name: string;
  ganzi: string;
  phase?: string;
  isLife?: boolean;
  isBody?: boolean;
  starsMain?: Star[];
  starsAssist?: Star[];
  starsEvil?: Star[];
  starsOthersGood?: Star[];
  starsOthersBad?: Star[];
}

interface ChartData {
  houses: House[];
  wuxingJuText?: string;
  lifeMaster?: string;
  bodyMaster?: string;
}

// Grid position → house index. "info" cells are center 2x2
const GRID: (number | null)[] = [
  5, 6, 7, 8,
  4, null, null, 9,
  3, null, null, 10,
  2, 1, 0, 11,
];

const SIHUA_STYLE: Record<string, { color: string; label: string }> = {
  "化禄": { color: "var(--el-wood)", label: "禄" },
  "化权": { color: "var(--el-fire)", label: "权" },
  "化科": { color: "var(--el-water)", label: "科" },
  "化忌": { color: "var(--el-fire)", label: "忌" },
};

function StarLine({ star }: { star: Star }) {
  const sh = star.sihua ? SIHUA_STYLE[star.sihua] : null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      <span style={{ fontWeight: 500, color: "var(--ink-primary)", fontSize: 12 }}>{star.name}</span>
      {star.starlight && <span style={{ fontSize: 9, color: "var(--ink-disabled)" }}>{star.starlight}</span>}
      {sh && <span style={{ fontSize: 9, fontWeight: 700, color: sh.color }}>{sh.label}</span>}
    </div>
  );
}

function PalaceCell({ house }: { house: House }) {
  const main = [...(house.starsMain ?? []), ...(house.starsAssist ?? [])];
  const minor = [...(house.starsEvil ?? []), ...(house.starsOthersGood ?? []), ...(house.starsOthersBad ?? [])];

  return (
    <div style={{
      padding: "6px 8px", height: "100%",
      display: "flex", flexDirection: "column",
      background: house.isLife ? "rgba(0,0,0,0.03)" : "transparent",
      boxShadow: house.isLife ? "inset 0 0 0 1px rgba(0,0,0,0.1)" : undefined,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: house.isLife ? "var(--ink-primary)" : "var(--ink-secondary)" }}>
          {house.name}{house.isBody ? " 身" : ""}
        </span>
        <span style={{ fontSize: 10, color: "var(--ink-disabled)", fontFamily: "var(--font-display)" }}>{house.ganzi}</span>
      </div>
      <div style={{ flex: 1, lineHeight: 1.6 }}>
        {main.map((s, i) => <StarLine key={i} star={s} />)}
      </div>
      {minor.length > 0 && (
        <div style={{ fontSize: 9, color: "var(--ink-disabled)", borderTop: "1px solid var(--line-subtle)", paddingTop: 3, marginTop: 2, lineHeight: 1.4 }}>
          {minor.map((s) => s.name).join(" ")}
        </div>
      )}
    </div>
  );
}

export default function ZiweiBoard({ data }: { data: Record<string, unknown> }) {
  const chart = (data.chart ?? data) as Record<string, unknown>;
  const houses = chart.houses as House[] | undefined;

  if (!houses || !Array.isArray(houses) || houses.length < 12) {
    return (
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, color: "var(--ink-tertiary)", marginBottom: 12 }}>紫微斗数 — 原始数据</div>
        <pre style={{ fontSize: 11, color: "var(--ink-secondary)", overflow: "auto", maxHeight: 400, fontFamily: "var(--font-mono)", whiteSpace: "pre-wrap" }}>
          {JSON.stringify(data, null, 2).slice(0, 4000)}
        </pre>
      </div>
    );
  }

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gridAutoRows: "minmax(110px, auto)",
      }}>
        {GRID.map((houseIdx, gridIdx) => {
          // Center info block (rendered once at first null)
          if (houseIdx === null) {
            if (gridIdx === 5) {
              return (
                <div key="info" style={{
                  gridColumn: "2 / 4", gridRow: "2 / 4",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  border: "1px solid var(--line-subtle)", gap: 6, padding: 16,
                }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 300 }}>紫微斗数</div>
                  {chart.wuxingJuText && <div style={{ fontSize: 13, color: "var(--ink-secondary)" }}>{String(chart.wuxingJuText)}</div>}
                  {chart.lifeMaster && <div style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>命主 {String(chart.lifeMaster)}</div>}
                  {chart.bodyMaster && <div style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>身主 {String(chart.bodyMaster)}</div>}
                </div>
              );
            }
            return null;
          }

          return (
            <div key={gridIdx} style={{ border: "1px solid var(--line-subtle)" }}>
              <PalaceCell house={houses[houseIdx]} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
