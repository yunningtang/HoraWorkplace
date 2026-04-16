/**
 * QimenGrid — 奇门遁甲 9-palace grid
 * Real data path: response.data.pan
 *   .cells[0..8]: { palaceNum, palaceName, diGan, tianXing, door, god, tianGan, isCenter, ... }
 *   .yinYangDun, .juText, .zhiFu, .zhiShi, .kongWang, .yiMa
 */

interface QimenCell {
  palaceNum: number;
  palaceName: string;
  diGan?: string;
  tianGan?: string;
  tianXing?: string;
  door?: string;
  god?: string;
  isCenter?: boolean;
  isZhiFu?: boolean;
  isZhiShi?: boolean;
  hasJiXing?: boolean;
  hasKongWang?: boolean;
  isYiMa?: boolean;
}

interface PanData {
  cells: QimenCell[];
  yinYangDun?: string;
  juText?: string;
  zhiFu?: string;
  zhiShi?: string;
  kongWang?: string;
  yiMa?: string;
  ganzhi?: Record<string, unknown>;
}

// Luoshu order for 3x3: [4,9,2 / 3,5,7 / 8,1,6]
const LUOSHU = [4, 9, 2, 3, 5, 7, 8, 1, 6];
const PALACE_NAMES: Record<number, string> = {
  1: "坎一", 2: "坤二", 3: "震三", 4: "巽四", 5: "中五",
  6: "乾六", 7: "兑七", 8: "艮八", 9: "离九",
};

function CellView({ cell }: { cell: QimenCell }) {
  return (
    <div style={{
      padding: "8px 10px",
      background: cell.isCenter ? "var(--bg-warm)" : "var(--bg-base)",
      display: "flex", flexDirection: "column", gap: 4,
      height: "100%", position: "relative",
    }}>
      {/* Palace header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "var(--ink-disabled)", fontWeight: 500 }}>
          {PALACE_NAMES[cell.palaceNum] ?? cell.palaceName}
        </span>
        <div style={{ display: "flex", gap: 3 }}>
          {cell.isZhiFu && <span style={{ fontSize: 8, background: "var(--el-fire)", color: "#fff", padding: "0 3px", borderRadius: 2 }}>符</span>}
          {cell.isZhiShi && <span style={{ fontSize: 8, background: "var(--el-water)", color: "#fff", padding: "0 3px", borderRadius: 2 }}>使</span>}
          {cell.hasKongWang && <span style={{ fontSize: 8, background: "var(--ink-disabled)", color: "#fff", padding: "0 3px", borderRadius: 2 }}>空</span>}
          {cell.isYiMa && <span style={{ fontSize: 8, background: "var(--el-wood)", color: "#fff", padding: "0 3px", borderRadius: 2 }}>马</span>}
        </div>
      </div>

      {/* Content rows */}
      {cell.god && (
        <div style={{ fontSize: 11, color: "var(--el-metal)" }}>
          <span style={{ fontSize: 9, color: "var(--ink-disabled)" }}>神 </span>{cell.god}
        </div>
      )}
      {cell.tianXing && (
        <div style={{ fontSize: 12, color: "var(--el-water)", fontWeight: 500 }}>
          <span style={{ fontSize: 9, color: "var(--ink-disabled)" }}>星 </span>{cell.tianXing}
        </div>
      )}
      {cell.door && (
        <div style={{ fontSize: 12, color: "var(--el-wood)", fontWeight: 500 }}>
          <span style={{ fontSize: 9, color: "var(--ink-disabled)" }}>门 </span>{cell.door}
        </div>
      )}

      {/* 天盘/地盘 */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto", paddingTop: 4, borderTop: "1px solid var(--line-subtle)" }}>
        <div style={{ fontSize: 11 }}>
          <span style={{ fontSize: 9, color: "var(--ink-disabled)" }}>天 </span>
          <span style={{ color: "var(--el-fire)", fontFamily: "var(--font-display)" }}>{cell.tianGan ?? "—"}</span>
        </div>
        <div style={{ fontSize: 11 }}>
          <span style={{ fontSize: 9, color: "var(--ink-disabled)" }}>地 </span>
          <span style={{ color: "var(--el-earth)", fontFamily: "var(--font-display)" }}>{cell.diGan ?? "—"}</span>
        </div>
      </div>
    </div>
  );
}

export default function QimenGrid({ data }: { data: Record<string, unknown> }) {
  const pan = (data.pan ?? data) as Record<string, unknown>;
  const cells = pan.cells as QimenCell[] | undefined;

  if (!cells || !Array.isArray(cells) || cells.length < 9) {
    return (
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, color: "var(--ink-tertiary)", marginBottom: 12 }}>奇门遁甲 — 原始数据</div>
        <pre style={{ fontSize: 11, color: "var(--ink-secondary)", overflow: "auto", maxHeight: 400, fontFamily: "var(--font-mono)", whiteSpace: "pre-wrap" }}>
          {JSON.stringify(data, null, 2).slice(0, 4000)}
        </pre>
      </div>
    );
  }

  const cellMap = Object.fromEntries(cells.map((c) => [c.palaceNum, c]));

  return (
    <div>
      {/* Meta info */}
      <div className="card" style={{ padding: "12px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13 }}>
          {pan.juText && <span><span style={{ color: "var(--ink-tertiary)" }}>局: </span><span style={{ fontWeight: 500 }}>{String(pan.juText)}</span></span>}
          {pan.yinYangDun && <span><span style={{ color: "var(--ink-tertiary)" }}>遁: </span>{String(pan.yinYangDun)}</span>}
          {pan.zhiFu && <span><span style={{ color: "var(--ink-tertiary)" }}>值符: </span>{String(pan.zhiFu)}</span>}
          {pan.zhiShi && <span><span style={{ color: "var(--ink-tertiary)" }}>值使: </span>{String(pan.zhiShi)}</span>}
          {pan.kongWang && <span><span style={{ color: "var(--ink-tertiary)" }}>空亡: </span>{String(pan.kongWang)}</span>}
          {pan.yiMa && <span><span style={{ color: "var(--ink-tertiary)" }}>驿马: </span>{String(pan.yiMa)}</span>}
        </div>
      </div>

      {/* 3x3 Grid */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridAutoRows: "minmax(130px, auto)",
        }}>
          {LUOSHU.map((num) => {
            const cell = cellMap[num];
            if (!cell) return <div key={num} style={{ border: "1px solid var(--line-subtle)" }} />;
            return (
              <div key={num} style={{ border: "1px solid var(--line-subtle)" }}>
                <CellView cell={cell} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
