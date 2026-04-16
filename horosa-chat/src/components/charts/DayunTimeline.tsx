/**
 * DayunTimeline — 八字大运 + 流年 (nested)
 * Data path: baziData.direction[] (9 dayun pillars, each with subDirect[] 10 liunian)
 * Also uses baziData.directAge / directTime for 起运.
 */
import { useState } from "react";
import type { BaziData, Dayun, Pillar, StemBranchCell } from "../../types/horosa";

const EL_CLS: Record<string, string> = {
  Metal: "el-metal", Wood: "el-wood", Water: "el-water", Fire: "el-fire", Earth: "el-earth",
};

function elCls(el: string) { return EL_CLS[el] ?? ""; }

function getCurrentAge(birthDate: string): number {
  const [y, m, d] = birthDate.split("-").map(Number);
  const now = new Date();
  let age = now.getFullYear() - y;
  const monthDiff = now.getMonth() + 1 - m;
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d)) age--;
  return age;
}

function StemBranchPair({ stem, branch, compact = false }: { stem: StemBranchCell; branch: StemBranchCell; compact?: boolean }) {
  const size = compact ? 18 : 22;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
      <span style={{
        fontFamily: "var(--font-display)",
        fontSize: size, fontWeight: 300, lineHeight: 1.1,
      }} className={elCls(stem.element)}>{stem.cell}</span>
      <span style={{
        fontFamily: "var(--font-display)",
        fontSize: size, fontWeight: 300, lineHeight: 1.1,
      }} className={elCls(branch.element)}>{branch.cell}</span>
    </div>
  );
}

function ShenshaChips({ pillar, max = 4 }: { pillar: Pillar; max?: number }) {
  const gods = [
    ...(pillar.branch.goodGods ?? []).map((g) => ({ g, cls: "good" })),
    ...(pillar.branch.badGods ?? []).map((g) => ({ g, cls: "bad" })),
  ];
  if (gods.length === 0) return null;
  const shown = gods.slice(0, max);
  const extra = gods.length - shown.length;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "center", marginTop: 4 }}>
      {shown.map((x, i) => (
        <span key={i} style={{
          fontSize: 9, padding: "1px 5px",
          borderRadius: "var(--r-pill)",
          background: x.cls === "good" ? "var(--el-wood-bg)" : "var(--el-fire-bg)",
          color: x.cls === "good" ? "var(--el-wood)" : "var(--el-fire)",
          whiteSpace: "nowrap",
        }}>{x.g}</span>
      ))}
      {extra > 0 && (
        <span style={{ fontSize: 9, color: "var(--ink-disabled)", padding: "1px 3px" }}>
          +{extra}
        </span>
      )}
    </div>
  );
}

function LiunianRow({ dayun }: { dayun: Dayun }) {
  return (
    <div style={{
      padding: "12px 14px",
      background: "var(--bg-warm)",
      borderTop: "1px solid var(--line-subtle)",
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-tertiary)", marginBottom: 8, letterSpacing: 1 }}>
        流年 · {dayun.startYear} — {dayun.startYear + 9}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 6 }}>
        {dayun.subDirect.map((ln, i) => {
          const year = dayun.startYear + i;
          const age = dayun.age + i;
          return (
            <div key={i} style={{
              padding: "8px 4px",
              background: "var(--bg-base)",
              borderRadius: "var(--r-sm)",
              textAlign: "center",
              boxShadow: "var(--shadow-outline)",
            }}>
              <div style={{ fontSize: 10, color: "var(--ink-disabled)", fontFamily: "var(--font-mono)" }}>
                {year}
              </div>
              <div style={{ fontSize: 9, color: "var(--ink-disabled)" }}>
                {age}岁
              </div>
              <div style={{ margin: "6px 0 4px" }}>
                <StemBranchPair stem={ln.stem} branch={ln.branch} compact />
              </div>
              <div style={{ fontSize: 9, color: "var(--ink-tertiary)" }}>
                {ln.stem.relative}
              </div>
              {(ln.branch.goodGods?.length > 0 || ln.branch.badGods?.length > 0) && (
                <div style={{
                  fontSize: 9, color: "var(--ink-tertiary)",
                  marginTop: 3, lineHeight: 1.3,
                  maxHeight: 40, overflow: "hidden",
                }}>
                  {[...(ln.branch.goodGods ?? []), ...(ln.branch.badGods ?? [])].slice(0, 2).join(" ")}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DayunTimeline({ bazi, birthDate }: { bazi: BaziData; birthDate: string }) {
  const directions = bazi.direction;
  const [expanded, setExpanded] = useState<number | null>(null);

  if (!directions || directions.length === 0) return null;

  const currentAge = getCurrentAge(birthDate);
  const activeIdx = directions.findIndex((d) => currentAge >= d.age && currentAge < d.age + 10);

  return (
    <div className="card" style={{ marginTop: 20, overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        padding: "14px 20px",
        borderBottom: "1px solid var(--line-subtle)",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
      }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-primary)", letterSpacing: 1 }}>
          大运
        </div>
        {bazi.directAge != null && (
          <div style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>
            起运{" "}
            <span style={{ fontWeight: 600, color: "var(--ink-secondary)" }}>
              {bazi.directAge.toFixed(2)} 岁
            </span>
            {bazi.directTime && (
              <span style={{ marginLeft: 8, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-disabled)" }}>
                {bazi.directTime.slice(0, 10)}
              </span>
            )}
            {bazi.gender && (
              <span style={{ marginLeft: 10, padding: "2px 8px", fontSize: 11, background: "var(--bg-warm)", borderRadius: "var(--r-pill)" }}>
                {bazi.gender === "Male" ? "乾造" : "坤造"}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Dayun pills — horizontal scroll */}
      <div style={{
        padding: "16px 20px",
        display: "flex", gap: 8, overflowX: "auto",
        scrollbarWidth: "thin",
      }}>
        {directions.map((d, i) => {
          const isActive = i === activeIdx;
          const isExpanded = expanded === i;
          return (
            <button
              key={i}
              onClick={() => setExpanded(isExpanded ? null : i)}
              style={{
                flex: "0 0 auto",
                minWidth: 88,
                padding: "10px 8px",
                background: isExpanded ? "var(--ink-primary)" : isActive ? "var(--bg-warm)" : "var(--bg-base)",
                color: isExpanded ? "var(--bg-base)" : "var(--ink-primary)",
                border: "none",
                borderRadius: "var(--r-md)",
                boxShadow: isExpanded ? "0 2px 8px rgba(0,0,0,0.15)" : "var(--shadow-outline)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                textAlign: "center",
                position: "relative",
              }}
            >
              {isActive && !isExpanded && (
                <div style={{
                  position: "absolute", top: -3, right: 6,
                  width: 6, height: 6, borderRadius: "50%",
                  background: "var(--el-fire)",
                }} />
              )}
              <div style={{ fontSize: 10, color: isExpanded ? "rgba(255,255,255,0.7)" : "var(--ink-disabled)", fontFamily: "var(--font-mono)" }}>
                {d.age}–{d.age + 9}岁
              </div>
              <div style={{ margin: "4px 0" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{
                    fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 300, lineHeight: 1.1,
                    color: isExpanded ? "var(--bg-base)" : `var(--el-${EL_CLS[d.mainDirect.stem.element]?.replace("el-", "") ?? ""})`,
                  }}>{d.mainDirect.stem.cell}</span>
                  <span style={{
                    fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 300, lineHeight: 1.1,
                    color: isExpanded ? "var(--bg-base)" : `var(--el-${EL_CLS[d.mainDirect.branch.element]?.replace("el-", "") ?? ""})`,
                  }}>{d.mainDirect.branch.cell}</span>
                </div>
              </div>
              <div style={{ fontSize: 10, color: isExpanded ? "rgba(255,255,255,0.7)" : "var(--ink-tertiary)" }}>
                {d.mainDirect.stem.relative}
              </div>
              <div style={{ fontSize: 10, color: isExpanded ? "rgba(255,255,255,0.7)" : "var(--ink-disabled)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
                {d.startYear}
              </div>
              <ShenshaChips pillar={d.mainDirect} max={2} />
            </button>
          );
        })}
      </div>

      {/* Expanded liunian panel */}
      {expanded !== null && directions[expanded] && (
        <LiunianRow dayun={directions[expanded]} />
      )}

      {/* Hint */}
      {expanded === null && (
        <div style={{
          padding: "6px 20px 12px",
          fontSize: 11, color: "var(--ink-disabled)", textAlign: "center",
        }}>
          点击大运可展开对应十年流年{activeIdx >= 0 && <span style={{ color: "var(--el-fire)", marginLeft: 8 }}>● 当前</span>}
        </div>
      )}
    </div>
  );
}
