import { useAppStore } from "./stores/appStore";
import { callTool } from "./lib/mcp";
import ProfileForm from "./components/profile/ProfileForm";
import BaziBoard from "./components/charts/BaziBoard";
import type { BaziBirthResponse } from "./types/horosa";

const NAV = [
  { key: "base", label: "基本排盘" },
  { key: "detail", label: "专业细盘" },
  { key: "predict", label: "大运流年" },
  { key: "notes", label: "断事笔记" },
];

function App() {
  const { activeProfile, baziData, loading, error, setBaziData, setLoading, setError } =
    useAppStore();

  async function runBazi() {
    if (!activeProfile) return;
    setLoading(true);
    setError(null);
    try {
      const result = (await callTool("horosa_cn_bazi_birth", {
        date: activeProfile.birthDate,
        time: activeProfile.birthTime,
        zone: activeProfile.zone,
        lat: activeProfile.lat,
        lon: activeProfile.lon,
      })) as unknown as BaziBirthResponse;

      if (!result.ok) {
        setError(result.error?.message ?? "排盘失败");
        return;
      }
      setBaziData(result.data.bazi);
    } catch (e) {
      setError(e instanceof Error ? e.message : "未知错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div style={{
            fontFamily: "var(--font-display)",
            fontSize: 20,
            fontWeight: 300,
            color: "var(--ink-primary)",
            letterSpacing: 2,
            lineHeight: 1.2,
          }}>
            命理工作台
          </div>
          <div style={{
            fontSize: 12,
            fontWeight: 400,
            color: "var(--ink-tertiary)",
            marginTop: 6,
            letterSpacing: 1,
          }}>
            horosa
          </div>
        </div>

        {NAV.map((item) => (
          <button key={item.key} className={`sidebar-item ${item.key === "base" ? "active" : ""}`}>
            {item.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />
        <div style={{ padding: "0 24px" }}>
          <div style={{ fontSize: 11, color: "var(--ink-disabled)", letterSpacing: 0.5 }}>v0.1.0</div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-area">
        <div className="top-bar">
          {activeProfile ? (
            <>
              <span style={{ fontSize: 15, fontWeight: 500, color: "var(--ink-primary)" }}>
                {activeProfile.name}
              </span>
              <span style={{
                fontSize: 13,
                color: "var(--ink-tertiary)",
                fontFamily: "var(--font-mono)",
                letterSpacing: 0.5,
              }}>
                {activeProfile.birthDate} {activeProfile.birthTime}
              </span>
              <span className="info-chip">{activeProfile.location}</span>
              <div style={{ flex: 1 }} />
              <button className="btn" onClick={runBazi} disabled={loading}>
                {loading ? <span className="loading-dots"><span /><span /><span /></span> : "排八字"}
              </button>
              <button className="btn btn-white" disabled>紫微</button>
              <button className="btn btn-white" disabled>西占</button>
              <button className="btn btn-ghost" onClick={() => useAppStore.getState().setActiveProfile(null)}>
                换人
              </button>
            </>
          ) : (
            <span style={{ fontSize: 14, color: "var(--ink-tertiary)", letterSpacing: 0.14 }}>
              创建档案以开始排盘
            </span>
          )}
        </div>

        <div className="content-area">
          {error && (
            <div style={{
              marginBottom: 20, padding: "10px 16px",
              background: "var(--el-fire-bg)", borderRadius: "var(--r-md)",
              fontSize: 13, color: "var(--el-fire)", letterSpacing: 0.14,
              boxShadow: "var(--shadow-edge)",
            }}>
              {error}
            </div>
          )}

          {!activeProfile ? (
            <div style={{ maxWidth: 460 }}>
              <div className="card" style={{ overflow: "hidden" }}>
                <ProfileForm />
              </div>
            </div>
          ) : baziData ? (
            <BaziBoard data={baziData} />
          ) : (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", height: 320, gap: 12,
            }}>
              <div style={{
                fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 200,
                color: "var(--ink-disabled)", lineHeight: 1,
              }}>
                命
              </div>
              <span style={{ fontSize: 13, color: "var(--ink-disabled)", letterSpacing: 0.5 }}>
                点击「排八字」查看命盘
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
