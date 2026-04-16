import { useAppStore } from "../../stores/appStore";

export default function ConfirmDeleteModal() {
  const { pendingDelete, cancelDelete, removeProfile } = useAppStore();
  if (!pendingDelete) return null;

  return (
    <div className="overlay" onClick={cancelDelete}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 380, padding: 28 }}
      >
        <div style={{
          fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 400,
          color: "var(--ink-primary)", marginBottom: 14, letterSpacing: 0.3,
        }}>
          删除档案
        </div>
        <div style={{ fontSize: 14, color: "var(--ink-secondary)", lineHeight: 1.7, marginBottom: 24 }}>
          确定要删除档案{" "}
          <span style={{ fontWeight: 600, color: "var(--ink-primary)" }}>「{pendingDelete.name}」</span>{" "}
          吗?
          <br />
          <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>
            该档案下的所有命盘数据(八字/紫微/西占/六爻/奇门)也会一并删除,无法恢复。
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={cancelDelete}
            style={{
              padding: "8px 18px", fontSize: 14, fontWeight: 500,
              color: "var(--ink-secondary)", background: "var(--bg-warm)",
              border: "none", borderRadius: "var(--r-pill)",
              cursor: "pointer",
              transition: "all var(--dur-fast) var(--ease-out)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--line-subtle)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-warm)"; }}
          >
            取消
          </button>
          <button
            onClick={() => removeProfile(pendingDelete.id)}
            style={{
              padding: "8px 18px", fontSize: 14, fontWeight: 500,
              color: "#fff", background: "var(--el-fire)",
              border: "none", borderRadius: "var(--r-pill)",
              cursor: "pointer",
              transition: "all var(--dur-fast) var(--ease-out)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(0.92)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; e.currentTarget.style.transform = "none"; }}
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
}
