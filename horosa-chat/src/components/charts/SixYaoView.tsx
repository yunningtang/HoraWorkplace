/**
 * SixYaoView — 六爻卦象
 * Real data paths:
 *   data.lines[0..5]: { value, change, god, name }
 *   data.current_code: "101010"
 *   data.changed_code: "100011"
 *   data.descriptions[code]: { name, guaname, 卦辞, 爻辞[], ... }
 */

interface YaoLine {
  value: number;  // 1=yang, 0=yin
  change: boolean;
  god: string;    // 六神: 青龙/朱雀/...
  name: string;   // 初爻/二爻/...
}

interface GuaDesc {
  name?: string;
  guaname?: string;
  abrname?: string;
  desc?: string;
  卦辞?: string;
  爻辞?: string[];
}

function YaoSVG({ line, y, isChanged }: { line: YaoLine; y: number; isChanged?: boolean }) {
  const isYang = isChanged ? (line.change ? 1 - line.value : line.value) : line.value;
  const color = line.change && !isChanged ? "var(--el-fire)" : "var(--ink-primary)";
  const w = 100, gap = 12, h = 6;

  if (isYang) {
    // Solid line (yang)
    return <rect x={0} y={y} width={w} height={h} fill={color} rx={1} />;
  }
  // Broken line (yin)
  const segW = (w - gap) / 2;
  return (
    <>
      <rect x={0} y={y} width={segW} height={h} fill={color} rx={1} />
      <rect x={segW + gap} y={y} width={segW} height={h} fill={color} rx={1} />
    </>
  );
}

function HexagramSVG({ lines, isChanged }: { lines: YaoLine[]; isChanged?: boolean }) {
  const lineH = 6, gap = 14, pad = 10;
  const totalH = 6 * lineH + 5 * gap + pad * 2;

  return (
    <svg width={120} height={totalH} viewBox={`-10 0 120 ${totalH}`}>
      {lines.map((line, i) => {
        const idx = 5 - i; // bottom to top
        const y = pad + idx * (lineH + gap);
        return <YaoSVG key={i} line={line} y={y} isChanged={isChanged} />;
      })}
    </svg>
  );
}

export default function SixYaoView({ data }: { data: Record<string, unknown> }) {
  const lines = data.lines as YaoLine[] | undefined;
  const currentCode = data.current_code as string | undefined;
  const changedCode = data.changed_code as string | undefined;
  const descriptions = data.descriptions as Record<string, GuaDesc> | undefined;

  if (!lines || !Array.isArray(lines) || lines.length < 6) {
    return (
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, color: "var(--ink-tertiary)", marginBottom: 12 }}>六爻 — 原始数据</div>
        <pre style={{ fontSize: 11, color: "var(--ink-secondary)", overflow: "auto", maxHeight: 400, fontFamily: "var(--font-mono)", whiteSpace: "pre-wrap" }}>
          {JSON.stringify(data, null, 2).slice(0, 4000)}
        </pre>
      </div>
    );
  }

  const benGua = currentCode && descriptions ? descriptions[currentCode] : null;
  const bianGua = changedCode && descriptions ? descriptions[changedCode] : null;
  const hasChange = lines.some((l) => l.change);

  return (
    <div>
      {/* Gua name header */}
      <div className="card" style={{ padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 300, color: "var(--ink-primary)" }}>
            {benGua?.guaname ?? benGua?.name ?? "卦"}
          </span>
          {benGua?.desc && (
            <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>{benGua.desc}</span>
          )}
          {hasChange && bianGua && (
            <>
              <span style={{ color: "var(--ink-disabled)" }}>→</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 300, color: "var(--ink-secondary)" }}>
                {bianGua.guaname ?? bianGua.name}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Hexagram diagram + line details */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
          {/* Ben gua SVG */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--ink-tertiary)", marginBottom: 8 }}>本卦</div>
            <HexagramSVG lines={lines} />
          </div>

          {/* Bian gua SVG */}
          {hasChange && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "var(--ink-tertiary)", marginBottom: 8 }}>变卦</div>
              <HexagramSVG lines={lines} isChanged />
            </div>
          )}

          {/* Line details table */}
          <div style={{ flex: 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["爻位", "六神", "阴阳", "动爻"].map((h) => (
                    <th key={h} style={{ padding: "4px 8px", textAlign: "left", borderBottom: "1px solid var(--line-subtle)", color: "var(--ink-tertiary)", fontWeight: 500, fontSize: 11 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...lines].reverse().map((line, i) => (
                  <tr key={i}>
                    <td style={{ padding: "4px 8px", borderBottom: "1px solid var(--line-subtle)", color: "var(--ink-secondary)" }}>
                      {line.name}
                    </td>
                    <td style={{ padding: "4px 8px", borderBottom: "1px solid var(--line-subtle)", color: "var(--ink-secondary)" }}>
                      {line.god}
                    </td>
                    <td style={{ padding: "4px 8px", borderBottom: "1px solid var(--line-subtle)" }}>
                      {line.value ? "阳 ━━━" : "阴 ━ ━"}
                    </td>
                    <td style={{ padding: "4px 8px", borderBottom: "1px solid var(--line-subtle)", color: line.change ? "var(--el-fire)" : "var(--ink-disabled)" }}>
                      {line.change ? "◯ 动" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 卦辞 */}
      {benGua?.卦辞 && (
        <div className="card" style={{ padding: "16px 20px", marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 8 }}>卦辞</div>
          <div style={{ fontSize: 14, color: "var(--ink-secondary)", lineHeight: 1.8, fontFamily: "var(--font-display)", fontWeight: 300 }}>
            {benGua.卦辞}
          </div>
        </div>
      )}

      {/* 爻辞 for moving lines */}
      {benGua?.爻辞 && lines.some((l) => l.change) && (
        <div className="card" style={{ padding: "16px 20px", marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 8 }}>动爻爻辞</div>
          {lines.map((line, i) => {
            if (!line.change || !benGua.爻辞?.[i]) return null;
            return (
              <div key={i} style={{ fontSize: 13, color: "var(--ink-secondary)", lineHeight: 1.8, marginBottom: 4 }}>
                <span style={{ color: "var(--el-fire)", fontWeight: 500 }}>{line.name}：</span>
                {benGua.爻辞[i]}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
