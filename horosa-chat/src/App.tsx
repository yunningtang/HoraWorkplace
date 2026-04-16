import { useState } from "react";
import { useAppStore, type TabKey } from "./stores/appStore";
import { callTool } from "./lib/mcp";
import ProfileForm from "./components/profile/ProfileForm";
import ProfileManager from "./components/profile/ProfileManager";
import BaziBoard from "./components/charts/BaziBoard";
import InteractionDiagram from "./components/charts/InteractionDiagram";
import ZiweiBoard from "./components/charts/ZiweiBoard";

import SixYaoView from "./components/charts/SixYaoView";
import QimenGrid from "./components/charts/QimenGrid";

import type { BaziBirthResponse } from "./types/horosa";

const TABS: { key: TabKey; label: string; tool: string; btnLabel: string }[] = [
  { key: "bazi", label: "八字排盘", tool: "horosa_cn_bazi_birth", btnLabel: "排八字" },
  { key: "ziwei", label: "紫微斗数", tool: "horosa_cn_ziwei_birth", btnLabel: "排紫微" },
  { key: "sixyao", label: "六爻起卦", tool: "horosa_cn_sixyao", btnLabel: "起卦" },
  { key: "qimen", label: "奇门遁甲", tool: "horosa_cn_qimen", btnLabel: "排奇门" },
];

function App() {
  const store = useAppStore();
  const { activeProfile, activeTab, loading, error, profiles } = store;
  const [showNewProfile, setShowNewProfile] = useState(false);

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
        store.setError((typed.error as Record<string, string>)?.message ?? "调用失败");
        return;
      }

      const typedData = typed.data as Record<string, unknown> | undefined;
      switch (tab) {
        case "bazi":
          store.setBaziData((typed as unknown as BaziBirthResponse).data?.bazi ?? null);
          break;
        case "ziwei":
          // ziwei data has chart.houses - pass the whole data.chart level
          store.setZiweiData(typedData ?? typed);
          break;
        case "sixyao":
          // sixyao data has lines, current_code, descriptions at data level
          store.setSixyaoData(typedData ?? typed);
          break;
        case "qimen":
          // qimen data has pan.cells at data level
          store.setQimenData(typedData ?? typed);
          break;
      }
    } catch (e) {
      store.setError(e instanceof Error ? e.message : "未知错误");
    } finally {
      store.setLoading(false);
    }
  }

  const currentTab = TABS.find((t) => t.key === activeTab)!;

  const hasData = (() => {
    const map: Record<TabKey, unknown> = {
      bazi: store.baziData, ziwei: store.ziweiData,
      sixyao: store.sixyaoData, qimen: store.qimenData,
      astro: null, predict: null,
    };
    return !!map[activeTab];
  })();

  function renderContent() {
    switch (activeTab) {
      case "bazi":
        return store.baziData ? <><BaziBoard data={store.baziData} /><InteractionDiagram data={store.baziData} /></> : null;
      case "ziwei":
        return store.ziweiData ? <ZiweiBoard data={store.ziweiData} /> : null;

      case "sixyao":
        return store.sixyaoData ? <SixYaoView data={store.sixyaoData} /> : null;
      case "qimen":
        return store.qimenData ? <QimenGrid data={store.qimenData} /> : null;

    }
  }

  // Show profile wizard when no profiles exist or explicitly creating
  const showWizard = showNewProfile || (profiles.length === 0 && !activeProfile);

  return (
    <div className="layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div style={{
            fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 300,
            color: "var(--ink-primary)", letterSpacing: 2, lineHeight: 1.2,
          }}>
            命理工作台
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-tertiary)", marginTop: 6, letterSpacing: 1 }}>
            horosa
          </div>
        </div>

        {/* Profile Manager */}
        <div style={{ borderBottom: "1px solid var(--line-subtle)", paddingBottom: 12, marginBottom: 8 }}>
          <ProfileManager onNewProfile={() => setShowNewProfile(true)} />
        </div>

        {/* Tab navigation */}
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`sidebar-item ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => store.setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />
        <div style={{ padding: "0 24px" }}>
          <div style={{ fontSize: 11, color: "var(--ink-disabled)", letterSpacing: 0.5 }}>v0.2.0</div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-area">
        {/* Top bar */}
        <div className="top-bar">
          {activeProfile ? (
            <>
              <span style={{ fontSize: 15, fontWeight: 500, color: "var(--ink-primary)" }}>
                {activeProfile.name}
              </span>
              <span style={{
                fontSize: 12, color: "var(--ink-tertiary)",
                fontFamily: "var(--font-mono)", letterSpacing: 0.5,
              }}>
                {activeProfile.birthDate} {activeProfile.birthTime}
              </span>
              <span className="info-chip">{activeProfile.location}</span>
              <div style={{ flex: 1 }} />
              <button className="btn" onClick={() => runTool(activeTab)} disabled={loading}>
                {loading ? (
                  <span className="loading-dots"><span /><span /><span /></span>
                ) : currentTab.btnLabel}
              </button>
            </>
          ) : (
            <span style={{ fontSize: 14, color: "var(--ink-tertiary)", letterSpacing: 0.14 }}>
              {profiles.length > 0 ? "选择一个档案" : "创建档案以开始"}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="content-area" style={{ scrollbarWidth: "thin" }}>
          {error && (
            <div style={{
              marginBottom: 20, padding: "10px 16px",
              background: "rgba(197,48,48,0.06)", borderRadius: "var(--r-md)",
              fontSize: 13, color: "var(--el-fire)", boxShadow: "var(--shadow-edge)",
            }}>
              {error}
            </div>
          )}

          {showWizard ? (
            <div style={{ maxWidth: 460 }}>
              <div className="card" style={{ overflow: "hidden" }}>
                <ProfileForm onDone={() => setShowNewProfile(false)} />
              </div>
            </div>
          ) : !activeProfile ? (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", height: 320, gap: 16,
            }}>
              <div style={{
                fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 200,
                color: "var(--ink-disabled)", lineHeight: 1,
              }}>
                档
              </div>
              <span style={{ fontSize: 13, color: "var(--ink-disabled)", letterSpacing: 0.5 }}>
                在左侧选择或创建一个档案
              </span>
            </div>
          ) : hasData ? (
            renderContent()
          ) : (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", height: 320, gap: 12,
            }}>
              <div style={{
                fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 200,
                color: "var(--ink-disabled)", lineHeight: 1,
              }}>
                {activeTab === "bazi" ? "命" : activeTab === "ziwei" ? "微" : activeTab === "sixyao" ? "卦" : "奇"}
              </div>
              <span style={{ fontSize: 13, color: "var(--ink-disabled)", letterSpacing: 0.5 }}>
                点击上方「{currentTab.btnLabel}」
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
