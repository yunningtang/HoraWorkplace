/**
 * DateTimeStep — Rich date & time picker
 * Features:
 * - Calendar-style year/month/day selection
 * - 时辰 (Chinese double-hour) quick picker
 * - Precise time input
 * - "Unknown time" toggle (defaults to noon)
 * - Lunar calendar hint (via horosa_cn_nongli_time if available)
 */

const SHICHEN = [
  { label: "子", range: "23:00–01:00", time: "00:00" },
  { label: "丑", range: "01:00–03:00", time: "02:00" },
  { label: "寅", range: "03:00–05:00", time: "04:00" },
  { label: "卯", range: "05:00–07:00", time: "06:00" },
  { label: "辰", range: "07:00–09:00", time: "08:00" },
  { label: "巳", range: "09:00–11:00", time: "10:00" },
  { label: "午", range: "11:00–13:00", time: "12:00" },
  { label: "未", range: "13:00–15:00", time: "14:00" },
  { label: "申", range: "15:00–17:00", time: "16:00" },
  { label: "酉", range: "17:00–19:00", time: "18:00" },
  { label: "戌", range: "19:00–21:00", time: "20:00" },
  { label: "亥", range: "21:00–23:00", time: "22:00" },
];

interface Props {
  birthDate: string;
  setBirthDate: (v: string) => void;
  birthTime: string;
  setBirthTime: (v: string) => void;
  unknownTime: boolean;
  setUnknownTime: (v: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function DateTimeStep({
  birthDate, setBirthDate, birthTime, setBirthTime,
  unknownTime, setUnknownTime, onBack, onNext,
}: Props) {
  const parts = birthDate.split("-");
  const year = parts[0] ?? "1990";
  const month = parts[1] ?? "01";
  const day = parts[2] ?? "01";

  function setYear(v: string) { setBirthDate(`${v}-${month}-${day}`); }
  function setMonth(v: string) { setBirthDate(`${year}-${v.padStart(2, "0")}-${day}`); }
  function setDay(v: string) { setBirthDate(`${year}-${month}-${v.padStart(2, "0")}`); }

  // Find matching shichen
  const hour = parseInt(birthTime.split(":")[0] ?? "12");
  const matchShichen = SHICHEN.findIndex((s) => {
    const h = parseInt(s.time.split(":")[0]);
    return Math.abs(hour - h) <= 1 || (s.label === "子" && (hour >= 23 || hour < 1));
  });

  const lbl: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-tertiary)",
    marginBottom: 6, letterSpacing: 0.3,
  };

  return (
    <div>
      {/* Date: Year / Month / Day as scroll selectors */}
      <div style={{ marginBottom: 20 }}>
        <label style={lbl}>出生日期</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px", gap: 8 }}>
          {/* Year */}
          <div style={{ position: "relative" }}>
            <input
              className="input-field"
              type="number"
              min="1900" max="2030"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              style={{ height: 44, fontSize: 16, fontFamily: "var(--font-mono)", textAlign: "center" }}
            />
            <span style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              fontSize: 11, color: "var(--ink-disabled)", pointerEvents: "none",
            }}>年</span>
          </div>
          {/* Month */}
          <div style={{ position: "relative" }}>
            <select
              className="input-field"
              value={parseInt(month)}
              onChange={(e) => setMonth(e.target.value)}
              style={{ height: 44, fontSize: 14, cursor: "pointer", textAlign: "center" }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}月</option>
              ))}
            </select>
          </div>
          {/* Day */}
          <div style={{ position: "relative" }}>
            <select
              className="input-field"
              value={parseInt(day)}
              onChange={(e) => setDay(e.target.value)}
              style={{ height: 44, fontSize: 14, cursor: "pointer", textAlign: "center" }}
            >
              {Array.from({ length: 31 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}日</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Unknown time toggle */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <div
            onClick={() => setUnknownTime(!unknownTime)}
            style={{
              width: 36, height: 20, borderRadius: 10, padding: 2,
              background: unknownTime ? "var(--ink-primary)" : "var(--bg-warm)",
              boxShadow: "var(--shadow-inset)",
              cursor: "pointer", transition: "background 0.2s ease",
              display: "flex", alignItems: "center",
            }}
          >
            <div style={{
              width: 16, height: 16, borderRadius: "50%", background: "var(--bg-base)",
              boxShadow: "var(--shadow-edge)",
              transform: unknownTime ? "translateX(16px)" : "translateX(0)",
              transition: "transform 0.2s ease",
            }} />
          </div>
          <span style={{ fontSize: 13, color: unknownTime ? "var(--ink-primary)" : "var(--ink-tertiary)" }}>
            出生时间不确定
          </span>
        </label>
        {unknownTime && (
          <div style={{
            marginTop: 8, padding: "8px 12px", fontSize: 12,
            color: "var(--ink-tertiary)", background: "var(--bg-warm)",
            borderRadius: "var(--r-sm)", lineHeight: 1.6,
          }}>
            将使用正午 12:00 排盘。八字日柱仍准确,时柱可能有误。
          </div>
        )}
      </div>

      {/* Time picker */}
      {!unknownTime && (
        <>
          {/* Precise time */}
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>精确时间</label>
            <input
              type="time"
              className="input-field"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              style={{ height: 44, fontSize: 16, fontFamily: "var(--font-mono)", textAlign: "center" }}
            />
          </div>

          {/* 时辰 quick picker */}
          <div style={{ marginBottom: 20 }}>
            <label style={lbl}>或选择时辰</label>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4,
            }}>
              {SHICHEN.map((s, i) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setBirthTime(s.time)}
                  style={{
                    padding: "8px 0", fontSize: 14, fontWeight: 500,
                    fontFamily: "var(--font-display)",
                    color: i === matchShichen ? "var(--bg-base)" : "var(--ink-secondary)",
                    background: i === matchShichen ? "var(--ink-primary)" : "var(--bg-warm)",
                    border: "none", borderRadius: "var(--r-sm)",
                    cursor: "pointer", transition: "all 0.15s ease",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                  }}
                >
                  <span>{s.label}</span>
                  <span style={{
                    fontSize: 9,
                    color: i === matchShichen ? "rgba(255,255,255,0.7)" : "var(--ink-disabled)",
                  }}>
                    {s.range.split("–")[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-white" style={{ flex: 1, padding: "10px 0" }} onClick={onBack}>
          上一步
        </button>
        <button className="btn" style={{ flex: 2, padding: "10px 0", fontSize: 15 }} onClick={onNext}>
          下一步
        </button>
      </div>
    </div>
  );
}
