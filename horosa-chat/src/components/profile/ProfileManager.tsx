/**
 * ProfileManager — sidebar profile list with edit/delete.
 */
import { useAppStore, type Profile } from "../../stores/appStore";

function ProfileCard({ profile, isActive }: { profile: Profile; isActive: boolean }) {
  const { setActiveProfile, openEditProfile, askDelete } = useAppStore();
  const genderIcon = profile.gender === "M" ? "♂" : profile.gender === "F" ? "♀" : "⚥";

  return (
    <div
      onClick={() => setActiveProfile(profile.id)}
      style={{
        padding: "10px 12px",
        background: isActive ? "rgba(0,0,0,0.04)" : "transparent",
        borderLeft: isActive ? "2px solid var(--ink-primary)" : "2px solid transparent",
        cursor: "pointer",
        transition: "all 0.15s ease",
        display: "flex",
        alignItems: "center",
        gap: 10,
        position: "relative",
      }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(0,0,0,0.02)"; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: isActive ? "var(--ink-primary)" : "var(--bg-warm)",
        color: isActive ? "var(--bg-base)" : "var(--ink-tertiary)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 600, flexShrink: 0,
        fontFamily: "var(--font-display)",
        transition: "all 0.15s ease",
      }}>
        {profile.name.slice(0, 1)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: isActive ? 600 : 400,
          color: "var(--ink-primary)", whiteSpace: "nowrap",
          overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {profile.name} <span style={{ fontSize: 11, color: "var(--ink-disabled)" }}>{genderIcon}</span>
        </div>
        <div style={{
          fontSize: 10, color: "var(--ink-disabled)", marginTop: 1,
          fontFamily: "var(--font-mono)", letterSpacing: 0.3,
        }}>
          {profile.birthDate} · {profile.location}
        </div>
      </div>

      {/* Hover actions */}
      <div className="profile-actions" style={{
        display: "flex", gap: 2, opacity: 0, transition: "opacity 0.15s",
      }}>
        <button
          onClick={(e) => { e.stopPropagation(); openEditProfile(profile); }}
          style={{
            width: 22, height: 22, borderRadius: 4,
            border: "none", background: "transparent",
            color: "var(--ink-tertiary)", fontSize: 12,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-warm)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          title="编辑"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); askDelete(profile); }}
          style={{
            width: 22, height: 22, borderRadius: 4,
            border: "none", background: "transparent",
            color: "var(--ink-tertiary)", fontSize: 14,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--el-fire-bg, #fdf0f0)"; e.currentTarget.style.color = "var(--el-fire)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--ink-tertiary)"; }}
          title="删除"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
          </svg>
        </button>
      </div>

      <style>{`
        .profile-actions { }
        div:hover > .profile-actions { opacity: 1; }
      `}</style>
    </div>
  );
}

export default function ProfileManager() {
  const { profiles, activeProfileId, openNewProfile } = useAppStore();

  return (
    <div>
      <div style={{
        padding: "0 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-disabled)", letterSpacing: 1 }}>
          档案 · {profiles.length}
        </span>
        <button
          onClick={openNewProfile}
          style={{
            width: 22, height: 22, borderRadius: 4,
            border: "none", background: "var(--ink-primary)",
            color: "var(--bg-base)", fontSize: 16, lineHeight: 1,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.8"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          title="新建档案"
        >
          +
        </button>
      </div>

      {profiles.length === 0 ? (
        <div style={{ padding: 16, textAlign: "center", fontSize: 12, color: "var(--ink-disabled)" }}>
          暂无档案
        </div>
      ) : (
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {profiles.map((p) => (
            <ProfileCard key={p.id} profile={p} isActive={activeProfileId === p.id} />
          ))}
        </div>
      )}
    </div>
  );
}
