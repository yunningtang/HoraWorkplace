import { useEffect, useState } from "react";
import { useAppStore, useActiveProfile, useCachedChart, type TabKey } from "./stores/appStore";
import { callTool } from "./lib/mcp";
import ProfileForm from "./components/profile/ProfileForm";
import ProfileManager from "./components/profile/ProfileManager";
import ConfirmDeleteModal from "./components/profile/ConfirmDeleteModal";
import BaziBoard from "./components/charts/BaziBoard";
import InteractionDiagram from "./components/charts/InteractionDiagram";
import ZiweiBoard from "./components/charts/ZiweiBoard";
import AstroChart from "./components/charts/AstroChart";
import SixYaoView from "./components/charts/SixYaoView";
import QimenGrid from "./components/charts/QimenGrid";
import DecennialTimeline from "./components/charts/DecennialTimeline";
import type { BaziBirthResponse, BaziData } from "./types/horosa";

const TABS: { key: TabKey; label: string; tool: string; btnLabel: string }[] = [
  { key: "bazi", label: "八字", tool: "horosa_cn_bazi_birth", btnLabel: "排八字" },
  { key: "ziwei", label: "紫微", tool: "horosa_cn_ziwei_birth", btnLabel: "排紫微" },
  { key: "astro", label: "西占", tool: "horosa_astro_chart", btnLabel: "排星盘" },
  { key: "sixyao", label: "六爻", tool: "horosa_cn_sixyao", btnLabel: "起卦" },
  { key: "qimen", label: "奇门", tool: "horosa_cn_qimen", btnLabel: "排奇门" },
  { key: "predict", label: "大运", tool: "horosa_predict_decennials", btnLabel: "排大运" },
];

function ErrorToast() {
  const { error, setError } = useAppStore();
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [error, setError]);
  if (!error) return null;
  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 50,
      padding: "12px 18px", maxWidth: 380,
      background: "var(--bg-base)", borderRadius: "var(--r-md)",
      boxShadow: "0 4px 20px rgba(0,0,0,0.1), 0 0 0 1px var(--el-fire)",
      fontSize: 13, color: "var(--ink-primary)",
      display: "flex", alignItems: "flex-start", gap: 10,
      animation: "toast-in 0.2s ease",
    }}>
      <span style={{ color: "var(--el-fire)", fontSize: 16, lineHeight: 1 }}>!</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, marginBottom: 2 }}>调用失败</div>
        <div style={{ color: "var(--ink-tertiary)", fontSize: 12 }}>{error}</div>
      </div>
      <button onClick={() => setError(null)} style={{
        border: "none", background: "transparent", cursor: "pointer",
        color: "var(--ink-disabled)", fontSize: 14, padding: 0, lineHeight: 1,
      }}>×</button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 8 }}>
      {[180, 120, 200].map((h, i) => (
        <div key={i} style={{
          height: h, background: "var(--bg-warm)",
          borderRadius: "var(--r-md)",
          animation: `pulse 1.5s ease-in-out infinite ${i * 0.15}s`,
        }} />
      ))}
      <style>{`@keyframes pulse { 0%,100% { opacity: 0.6 } 50% { opacity: 1 } }`}</style>
    </div>
  );
}

function App() {
  const store = useAppStore();
  const activeProfile = useActiveProfile();
  const activeTab = useAppStore((s) => s.activeTab);
  const loading = useAppStore((s) => s.loading);
  const hydrated = useAppStore((s) => s.hydrated);
  const profileDraft = useAppStore((s) => s.profileDraft);
  const cachedData = useCachedChart(activeProfile?.id ?? null, activeTab);
  const [fetchAttempted, setFetchAttempted] = useState<Record<string, boolean>>({});

  // Hydrate store from IndexedDB on mount
  useEffect(() => {
    store.hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fetch: when active profile+tab has no cached data and we haven't tried yet
  useEffect(() => {
    if (!activeProfile || !hydrated) return;
    const key = `${activeProfile.id}:${activeTab}`;
    if (cachedData || fetchAttempted[key] || loading) return;
    runTool(activeTab);
    setFetchAttempted((s) => ({ ...s, [key]: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfile?.id, activeTab, cachedData, hydrated]);

  async function runTool(tab: TabKey) {
    if (!activeProfile) return;
    const tabDef = TABS.find((t) => t.key === tab);
    if (!tabDef) return;

    store.setLoading(true);
    store.setError(null);

    try {
      const result = await callTool(tabDef.tool, {
        date: activeProfile.birthDate,
        time: activeProfile.birthTime,
        zone: activeProfile.zone,
        lat: activeProfile.lat,
        lon: activeProfile.lon,
      });
      const typed = result as Record<string, unknown>;

      if (typed.ok === false) {
        const err = typed.error as Record<string, string> | undefined;
        store.setError(err?.message ?? "调用失败");
        return;
      }

      const typedData = typed.data as Record<string, unknown> | undefined;
      let payload: unknown = typedData ?? typed;
      if (tab === "bazi") {
        payload = (typed as unknown as BaziBirthResponse).data?.bazi ?? null;
      }
      if (payload) {
        await store.setChart(activeProfile.id, tab, payload);
      }
    } catch (e) {
      store.setError(e instanceof Error ? e.message : "未知错误");
    } finally {
      store.setLoading(false);
    }
  }

  function renderChart() {
    if (!cachedData) return null;
    switch (activeTab) {
      case "bazi":
        return (
          <>
            <BaziBoard data={cachedData as BaziData} />
            <InteractionDiagram data={cachedData as BaziData} />
          </>
        );
      case "ziwei": return <ZiweiBoard data={cachedData as Record<string, unknown>} />;
      case "astro": return <AstroChart data={cachedData as Record<string, unknown>} />;
      case "sixyao": return <SixYaoView data={cachedData as Record<string, unknown>} />;
      case "qimen": return <QimenGrid data={cachedData as Record<string, unknown>} />;
      case "predict": return <DecennialTimeline data={cachedData as Record<string, unknown>} />;
    }
  }

  const currentTab = TABS.find((t) => t.key === activeTab)!;
  const showWizard = profileDraft !== null || (hydrated && store.profiles.length === 0 && !activeProfile);

  if (!hydrated) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--ink-disabled)", fontSize: 13 }}>
        加载中...
      </div>
    );
  }

  return (
    <>
      <div className="layout">
        {/* ═══ Sidebar ═══ */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div style={{
              fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 300,
              color: "var(--ink-primary)", letterSpacing: 2, lineHeight: 1.2,
            }}>
              命理工作台
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-tertiary)", marginTop: 4, letterSpacing: 1 }}>
              horosa
            </div>
          </div>

          <ProfileManager />

          <div style={{ flex: 1 }} />
          <div style={{ padding: "8px 24px", borderTop: "1px solid var(--line-subtle)" }}>
            <div style={{ fontSize: 10, color: "var(--ink-disabled)", letterSpacing: 0.5 }}>v0.3.0 · local</div>
          </div>
        </aside>

        {/* ═══ Main ═══ */}
        <div className="main-area">
          {activeProfile ? (
            <>
              {/* Profile strip */}
              <div style={{
                padding: "16px 28px",
                borderBottom: "1px solid var(--line-subtle)",
                background: "var(--bg-base)",
                display: "flex", alignItems: "center", gap: 16,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "var(--ink-primary)", color: "var(--bg-base)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 600, fontFamily: "var(--font-display)",
                }}>
                  {activeProfile.name.slice(0, 1)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink-primary)" }}>
                    {activeProfile.name}
                    <span style={{ marginLeft: 8, fontSize: 12, color: "var(--ink-disabled)", fontWeight: 400 }}>
                      {activeProfile.gender === "M" ? "♂ 男" : activeProfile.gender === "F" ? "♀ 女" : "⚥"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-tertiary)", marginTop: 2, fontFamily: "var(--font-mono)", letterSpacing: 0.3 }}>
                    {activeProfile.birthDate} {activeProfile.birthTime} · {activeProfile.location} · UTC{Number(activeProfile.zone) >= 0 ? "+" : ""}{activeProfile.zone}
                  </div>
                </div>
              </div>

              {/* Tab bar */}
              <div style={{
                padding: "0 28px",
                borderBottom: "1px solid var(--line-subtle)",
                background: "var(--bg-warm)",
                display: "flex", alignItems: "center", gap: 0,
                position: "relative",
              }}>
                {TABS.map((tab) => {
                  const isActive = tab.key === activeTab;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => store.setActiveTab(tab.key)}
                      style={{
                        padding: "12px 20px",
                        fontSize: 14, fontWeight: isActive ? 600 : 400,
                        color: isActive ? "var(--ink-primary)" : "var(--ink-tertiary)",
                        background: "transparent",
                        border: "none", cursor: "pointer",
                        position: "relative",
                        transition: "color 0.15s",
                      }}
                    >
                      {tab.label}
                      {isActive && (
                        <div style={{
                          position: "absolute", bottom: -1, left: "20%", right: "20%",
                          height: 2, background: "var(--ink-primary)",
                        }} />
                      )}
                    </button>
                  );
                })}
                <div style={{ flex: 1 }} />
                {cachedData && !loading && (
                  <button
                    onClick={() => runTool(activeTab)}
                    style={{
                      padding: "4px 12px", fontSize: 12, fontWeight: 500,
                      color: "var(--ink-tertiary)", background: "transparent",
                      border: "none", cursor: "pointer",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--ink-primary)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ink-tertiary)"; }}
                    title="重新排盘"
                  >
                    ↻ 刷新
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="content-area">
                {loading ? (
                  <LoadingSkeleton />
                ) : cachedData ? (
                  renderChart()
                ) : (
                  <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", padding: 80, gap: 16,
                  }}>
                    <div style={{
                      fontFamily: "var(--font-display)", fontSize: 56, fontWeight: 200,
                      color: "var(--ink-disabled)", lineHeight: 1,
                    }}>
                      {activeTab === "bazi" ? "命" : activeTab === "ziwei" ? "微" : activeTab === "astro" ? "☉" : activeTab === "sixyao" ? "卦" : activeTab === "qimen" ? "奇" : "运"}
                    </div>
                    <button
                      className="btn"
                      onClick={() => runTool(activeTab)}
                      style={{ padding: "10px 24px", fontSize: 14 }}
                    >
                      {currentTab.btnLabel}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", height: "100%", gap: 20, padding: 40,
            }}>
              <div style={{
                fontFamily: "var(--font-display)", fontSize: 56, fontWeight: 200,
                color: "var(--ink-disabled)", lineHeight: 1,
              }}>
                档
              </div>
              <div style={{ textAlign: "center", maxWidth: 320 }}>
                <div style={{ fontSize: 15, color: "var(--ink-secondary)", marginBottom: 8 }}>
                  {store.profiles.length > 0 ? "选择左侧档案以开始" : "还没有档案"}
                </div>
                {store.profiles.length === 0 && (
                  <div style={{ fontSize: 12, color: "var(--ink-tertiary)", lineHeight: 1.6, marginBottom: 20 }}>
                    档案是一个人的生辰信息,用于排八字、紫微、西占等命盘。
                    所有数据保存在本地浏览器,不上传。
                  </div>
                )}
                {store.profiles.length === 0 && (
                  <button className="btn" onClick={store.openNewProfile} style={{ padding: "10px 24px" }}>
                    创建第一个档案
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Wizard overlay */}
      {showWizard && (
        <div
          onClick={() => store.closeProfileDraft()}
          style={{
            position: "fixed", inset: 0, zIndex: 90,
            background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-base)", borderRadius: "var(--r-lg)",
              width: 480, maxWidth: "90vw", maxHeight: "90vh", overflowY: "auto",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            }}
          >
            <ProfileForm
              initial={profileDraft && profileDraft.id ? profileDraft : undefined}
              onDone={() => store.closeProfileDraft()}
            />
          </div>
        </div>
      )}

      <ConfirmDeleteModal />
      <ErrorToast />
    </>
  );
}

export default App;
