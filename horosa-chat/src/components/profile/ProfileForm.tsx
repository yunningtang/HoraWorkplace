import { useState, type FormEvent } from "react";
import { useAppStore } from "../../stores/appStore";

const PRESETS = [
  { label: "北京", lat: "39.90", lon: "116.40", zone: "8" },
  { label: "上海", lat: "31.23", lon: "121.47", zone: "8" },
  { label: "广州", lat: "23.13", lon: "113.26", zone: "8" },
  { label: "台北", lat: "25.03", lon: "121.56", zone: "8" },
  { label: "香港", lat: "22.32", lon: "114.17", zone: "8" },
  { label: "东京", lat: "35.68", lon: "139.69", zone: "9" },
  { label: "伦敦", lat: "51.51", lon: "-0.13", zone: "0" },
  { label: "纽约", lat: "40.71", lon: "-74.01", zone: "-5" },
];

export default function ProfileForm() {
  const addProfile = useAppStore((s) => s.addProfile);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"M" | "F" | "X">("M");
  const [birthDate, setBirthDate] = useState("1990-06-15");
  const [birthTime, setBirthTime] = useState("14:30");
  const [lat, setLat] = useState("31.23");
  const [lon, setLon] = useState("121.47");
  const [zone, setZone] = useState("8");
  const [location, setLocation] = useState("上海");

  function applyPreset(i: number) {
    const p = PRESETS[i];
    setLat(p.lat); setLon(p.lon); setZone(p.zone); setLocation(p.label);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    addProfile({ id: crypto.randomUUID(), name: name || "未命名", gender, birthDate, birthTime, zone, lat, lon, location });
  }

  const lbl: React.CSSProperties = {
    display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink-tertiary)",
    marginBottom: 6, letterSpacing: 0.14,
  };

  return (
    <form onSubmit={onSubmit} style={{ padding: 24 }}>
      <div style={{
        fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 300,
        color: "var(--ink-primary)", marginBottom: 24, letterSpacing: 1,
      }}>
        新建档案
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 12, marginBottom: 16 }}>
        <div>
          <label style={lbl}>姓名</label>
          <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="输入姓名" />
        </div>
        <div>
          <label style={lbl}>性别</label>
          <select className="input-field" value={gender} onChange={(e) => setGender(e.target.value as "M" | "F" | "X")} style={{ cursor: "pointer" }}>
            <option value="M">男</option>
            <option value="F">女</option>
            <option value="X">其他</option>
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <label style={lbl}>出生日期</label>
          <input type="date" className="input-field" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        </div>
        <div>
          <label style={lbl}>出生时间</label>
          <input type="time" className="input-field" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={lbl}>城市</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {PRESETS.map((p, i) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(i)}
              style={{
                padding: "4px 12px", fontSize: 13, fontWeight: 400,
                color: location === p.label ? "var(--ink-primary)" : "var(--ink-tertiary)",
                background: location === p.label ? "var(--bg-stone-alpha)" : "transparent",
                border: "none", borderRadius: "var(--r-pill)",
                boxShadow: location === p.label ? "var(--shadow-edge)" : "none",
                cursor: "pointer", transition: "all 0.2s ease",
                letterSpacing: 0.14,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 72px", gap: 12, marginBottom: 24 }}>
        <div><label style={lbl}>纬度</label><input className="input-field" value={lat} onChange={(e) => setLat(e.target.value)} /></div>
        <div><label style={lbl}>经度</label><input className="input-field" value={lon} onChange={(e) => setLon(e.target.value)} /></div>
        <div><label style={lbl}>时区</label><input className="input-field" value={zone} onChange={(e) => setZone(e.target.value)} /></div>
      </div>

      <button type="submit" className="btn" style={{ width: "100%", padding: "10px 24px", fontSize: 15 }}>
        创建档案
      </button>
    </form>
  );
}
