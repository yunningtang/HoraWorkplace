import { useAppStore } from "../../stores/appStore";

export default function ConfirmDeleteModal() {
  const { pendingDelete, cancelDelete, removeProfile } = useAppStore();
  if (!pendingDelete) return null;

  return (
    <div
      onClick={cancelDelete}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-base)",
          borderRadius: "var(--r-lg)",
          padding: 24,
          width: 360, maxWidth: "90vw",
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{
          fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500,
          color: "var(--ink-primary)", marginBottom: 12,
        }}>
          删除档案
        </div>
        <div style={{ fontSize: 14, color: "var(--ink-secondary)", lineHeight: 1.6, marginBottom: 20 }}>
          确定要删除档案 <span style={{ fontWeight: 600, color: "var(--ink-primary)" }}>「{pendingDelete.name}」</span> 吗?
          <br />
          该档案下的所有命盘数据(八字/紫微/西占/六爻/奇门/大运)也会一并删除,无法恢复。
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={cancelDelete}
            style={{
              padding: "8px 18px", fontSize: 14, fontWeight: 500,
              color: "var(--ink-secondary)", background: "var(--bg-warm)",
              border: "none", borderRadius: "var(--r-pill)",
              cursor: "pointer", transition: "opacity 0.15s",
            }}
          >
            取消
          </button>
          <button
            onClick={() => removeProfile(pendingDelete.id)}
            style={{
              padding: "8px 18px", fontSize: 14, fontWeight: 500,
              color: "#fff", background: "var(--el-fire)",
              border: "none", borderRadius: "var(--r-pill)",
              cursor: "pointer", transition: "opacity 0.15s",
            }}
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
}
