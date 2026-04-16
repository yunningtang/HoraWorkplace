import type { BaziData, PillarKey, StemBranchCell } from "../../types/horosa";

const KEYS: PillarKey[] = ["year", "month", "day", "time"];
const CN = { year: "年柱", month: "月柱", day: "日柱", time: "时柱" };
const EL: Record<string, string> = {
  Metal: "el-metal", Wood: "el-wood", Water: "el-water", Fire: "el-fire", Earth: "el-earth",
};
const EL_CN: Record<string, string> = {
  Metal: "金", Wood: "木", Water: "水", Fire: "火", Earth: "土",
};

function c(el: string) { return EL[el] ?? ""; }

/* ── Interactions ── */
function Interactions({ data }: { data: BaziData }) {
  type Ref = { zhu: string; cell: string };
  const lines: { prefix: string; items: string[] }[] = [];

  function collect(keys: { key: string; label: string }[], prefix: string) {
    const items: string[] = [];
    for (const { key, label } of keys) {
      const obj = (data as Record<string, Record<string, Ref[]>>)[key];
      if (!obj) continue;
      for (const [, refs] of Object.entries(obj)) {
        if (refs.length >= 2) items.push(refs.map((r) => r.cell).join("") + label);
      }
    }
    if (items.length) lines.push({ prefix, items });
  }

  collect([{ key: "ganHe", label: "合" }, { key: "ganCong", label: "冲" }], "天干留意");
  collect([
    { key: "ziHe6", label: "六合" }, { key: "ziHe3", label: "三合" },
    { key: "ziHui", label: "三会" }, { key: "ziCong", label: "冲" },
    { key: "ziXing", label: "刑" }, { key: "ziPo", label: "破" },
    { key: "ziCuan", label: "害" },
  ], "地支留意");

  if (!lines.length) return null;

  return (
    <div className="card" style={{ padding: "16px 20px", marginTop: 20 }}>
      {lines.map((l) => (
        <div key={l.prefix} style={{ fontSize: 14, lineHeight: 1.8, letterSpacing: 0.14 }}>
          <span style={{ color: "var(--ink-tertiary)", fontWeight: 500 }}>{l.prefix}：</span>
          <span style={{ color: "var(--ink-secondary)" }}>{l.items.join("，")}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Sanyuan ── */
function Sanyuan({ data }: { data: BaziData }) {
  const items = (["tai", "ming", "shen"] as const)
    .map((k) => ({ k, label: { tai: "胎元", ming: "命宫", shen: "身宫" }[k], p: data.fourColumns[k] }))
    .filter((x) => x.p);
  if (!items.length) return null;

  return (
    <div className="card" style={{ padding: "16px 20px", marginTop: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 12, letterSpacing: 1 }}>
        三元
      </div>
      <div style={{ display: "flex", gap: 40 }}>
        {items.map(({ k, label, p }) => (
          <div key={k}>
            <div style={{ fontSize: 12, color: "var(--ink-disabled)", marginBottom: 6, letterSpacing: 0.5 }}>{label}</div>
            <div style={{
              fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 300,
              color: "var(--ink-primary)", lineHeight: 1.2,
            }}>
              {p!.ganzi}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-tertiary)", marginTop: 4 }}>{p!.naying}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Season ── */
function Season({ season }: { season: Record<string, string> }) {
  const order = ["木", "火", "土", "金", "水"] as const;
  const ek: Record<string, string> = { 金: "Metal", 木: "Wood", 水: "Water", 火: "Fire", 土: "Earth" };

  return (
    <div className="card" style={{ padding: "16px 20px", marginTop: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 12, letterSpacing: 1 }}>
        五行旺相
      </div>
      <div style={{ display: "flex", gap: 32 }}>
        {order.map((el) => (
          <div key={el} style={{ textAlign: "center" }}>
            <div className={c(ek[el])} style={{
              fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 300, lineHeight: 1,
            }}>
              {el}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-tertiary)", marginTop: 6 }}>{season[el] ?? "?"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main ── */
export default function BaziBoard({ data }: { data: BaziData }) {
  const pillars = KEYS.map((k) => data.fourColumns[k]);

  return (
    <div>
      {/* Info */}
      {data.nongli && (
        <div style={{
          marginBottom: 20, display: "flex", alignItems: "center",
          gap: 16, flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 14, color: "var(--ink-secondary)", letterSpacing: 0.14 }}>
            农历 {data.nongli.year}年 {data.nongli.leap ? "闰" : ""}{data.nongli.month}{data.nongli.day}
          </span>
          {data.nongli.jieqi && (
            <span className="info-chip">{data.nongli.jieqi}</span>
          )}
          {data.tiaohou?.length > 0 && (
            <span style={{ fontSize: 14, color: "var(--ink-tertiary)", letterSpacing: 0.14 }}>
              调候用神{" "}
              <span style={{
                fontFamily: "var(--font-display)", fontWeight: 400,
                color: "var(--ink-primary)", fontSize: 16,
              }}>
                {data.tiaohou.join("  ")}
              </span>
            </span>
          )}
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ overflow: "hidden", borderRadius: "var(--r-lg)" }}>
        <table className="bazi-table">
          <thead>
            <tr>
              <th></th>
              {KEYS.map((k) => <th key={k}>{CN[k]}</th>)}
            </tr>
          </thead>
          <tbody>
            {/* 主星 */}
            <tr>
              <th>主星</th>
              {pillars.map((p, i) => (
                <td key={i} className="cell-shishen" style={{
                  color: i === 2 ? "var(--ink-primary)" : "var(--ink-tertiary)",
                  fontWeight: i === 2 ? 600 : 500,
                }}>
                  {i === 2 ? "日主" : p.stem.relative}
                </td>
              ))}
            </tr>

            {/* 天干 */}
            <tr>
              <th>天干</th>
              {pillars.map((p, i) => (
                <td key={i}>
                  <span className={`cell-gan ${c(p.stem.element)}`}>{p.stem.cell}</span>
                </td>
              ))}
            </tr>

            {/* 地支 */}
            <tr>
              <th>地支</th>
              {pillars.map((p, i) => (
                <td key={i}>
                  <span className={`cell-zhi ${c(p.branch.element)}`}>{p.branch.cell}</span>
                </td>
              ))}
            </tr>

            {/* 藏干 */}
            <tr>
              <th>藏干</th>
              {pillars.map((p, i) => (
                <td key={i} className="cell-canggan">
                  {p.stemInBranch?.map((s, j) => (
                    <div key={j}>
                      <span className={c(s.element)} style={{ fontWeight: 400 }}>{s.cell}</span>
                      <span style={{ color: "var(--ink-disabled)", fontSize: 11, marginLeft: 3 }}>
                        {EL_CN[s.element]}
                      </span>
                    </div>
                  ))}
                </td>
              ))}
            </tr>

            {/* 副星 */}
            <tr>
              <th>副星</th>
              {pillars.map((p, i) => (
                <td key={i} style={{ fontSize: 13, color: "var(--ink-tertiary)", lineHeight: 2 }}>
                  {p.stemInBranch?.map((s, j) => <div key={j}>{s.relative}</div>)}
                </td>
              ))}
            </tr>

            {/* 星运 */}
            <tr>
              <th>星运</th>
              {pillars.map((p, i) => (
                <td key={i} style={{ fontSize: 13, color: "var(--ink-secondary)" }}>{p.ganziPhase}</td>
              ))}
            </tr>

            {/* 空亡 */}
            <tr>
              <th>空亡</th>
              {pillars.map((p, i) => (
                <td key={i} style={{ fontSize: 13, color: "var(--ink-disabled)" }}>{p.xunEmpty}</td>
              ))}
            </tr>

            {/* 纳音 */}
            <tr>
              <th>纳音</th>
              {pillars.map((p, i) => (
                <td key={i} className="cell-naying" style={{ color: "var(--ink-secondary)" }}>
                  {p.naying}
                </td>
              ))}
            </tr>

            {/* 神煞 */}
            <tr>
              <th>神煞</th>
              {pillars.map((p, i) => (
                <td key={i} className="cell-gods">
                  {(p.goodGods ?? []).map((g, j) => (
                    <span key={`g${j}`}>{j > 0 && " "}<span style={{ color: "var(--el-wood)" }}>{g}</span></span>
                  ))}
                  {(p.badGods ?? []).map((g, j) => (
                    <span key={`b${j}`}>{" "}<span style={{ color: "var(--el-fire)" }}>{g}</span></span>
                  ))}
                  {(p.neutralGods ?? []).map((g, j) => (
                    <span key={`n${j}`}>{" "}<span style={{ color: "var(--ink-tertiary)" }}>{g}</span></span>
                  ))}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <Interactions data={data} />
      <Sanyuan data={data} />
      <Season season={data.season} />
    </div>
  );
}
