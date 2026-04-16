/**
 * ProfileForm — 3-step wizard for creating a profile
 * Step 1: Name + Gender
 * Step 2: Date + Time (with 时辰 / unknown-time support)
 * Step 3: Location (city search + lat/lon/tz)
 */
import { useState, type FormEvent } from "react";
import { useAppStore } from "../../stores/appStore";
import DateTimeStep from "./DateTimeStep";
import LocationStep from "./LocationStep";

export default function ProfileForm({ onDone }: { onDone?: () => void }) {
  const addProfile = useAppStore((s) => s.addProfile);
  const [step, setStep] = useState(0);

  // Step 1
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"M" | "F" | "X">("M");

  // Step 2
  const [birthDate, setBirthDate] = useState("1990-06-15");
  const [birthTime, setBirthTime] = useState("12:00");
  const [unknownTime, setUnknownTime] = useState(false);

  // Step 3
  const [lat, setLat] = useState("39.90");
  const [lon, setLon] = useState("116.40");
  const [zone, setZone] = useState("8");
  const [location, setLocation] = useState("北京");

  function submit() {
    addProfile({
      id: crypto.randomUUID(),
      name: name || "未命名",
      gender,
      birthDate,
      birthTime: unknownTime ? "12:00" : birthTime,
      zone,
      lat,
      lon,
      location,
    });
    onDone?.();
  }

  const lbl: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-tertiary)",
    marginBottom: 6, letterSpacing: 0.3,
  };

  const steps = ["基本信息", "出生时间", "出生地点"];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 300,
          color: "var(--ink-primary)", letterSpacing: 1,
        }}>
          新建档案
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: 4, marginTop: 16, alignItems: "center" }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div
                onClick={() => i < step && setStep(i)}
                style={{
                  width: 24, height: 24, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 600,
                  background: i <= step ? "var(--ink-primary)" : "var(--bg-warm)",
                  color: i <= step ? "var(--bg-base)" : "var(--ink-disabled)",
                  cursor: i < step ? "pointer" : "default",
                  transition: "all 0.2s ease",
                }}
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span style={{
                fontSize: 12, color: i === step ? "var(--ink-primary)" : "var(--ink-disabled)",
                fontWeight: i === step ? 500 : 400, letterSpacing: 0.14,
              }}>
                {s}
              </span>
              {i < steps.length - 1 && (
                <div style={{
                  width: 24, height: 1,
                  background: i < step ? "var(--ink-primary)" : "var(--bg-warm)",
                  margin: "0 4px",
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Name + Gender */}
      {step === 0 && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>姓名</label>
            <input
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入姓名"
              autoFocus
              style={{ height: 44, fontSize: 15 }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={lbl}>性别</label>
            <div style={{ display: "flex", gap: 8 }}>
              {([["M", "男"], ["F", "女"], ["X", "其他"]] as const).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setGender(val)}
                  style={{
                    flex: 1, padding: "10px 0", fontSize: 14, fontWeight: 500,
                    color: gender === val ? "var(--bg-base)" : "var(--ink-secondary)",
                    background: gender === val ? "var(--ink-primary)" : "var(--bg-warm)",
                    border: "none", borderRadius: "var(--r-md)",
                    cursor: "pointer", transition: "all 0.2s ease",
                    boxShadow: gender === val ? "var(--shadow-warm)" : "none",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button className="btn" style={{ width: "100%", padding: "10px 24px", fontSize: 15 }}
            onClick={() => setStep(1)}>
            下一步
          </button>
        </div>
      )}

      {/* Step 2: Date + Time */}
      {step === 1 && (
        <DateTimeStep
          birthDate={birthDate}
          setBirthDate={setBirthDate}
          birthTime={birthTime}
          setBirthTime={setBirthTime}
          unknownTime={unknownTime}
          setUnknownTime={setUnknownTime}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
        />
      )}

      {/* Step 3: Location */}
      {step === 2 && (
        <LocationStep
          lat={lat} setLat={setLat}
          lon={lon} setLon={setLon}
          zone={zone} setZone={setZone}
          location={location} setLocation={setLocation}
          onBack={() => setStep(1)}
          onSubmit={submit}
        />
      )}
    </div>
  );
}
