/**
 * ProfileManager — sidebar profile list
 * Shows all saved profiles with switch/edit/delete.
 */
import { useAppStore, type Profile } from "../../stores/appStore";

function ProfileCard({ profile, isActive, onSelect }: {
  profile: Profile;
  isActive: boolean;
  onSelect: () => void;
}) {
  const removeProfile = useAppStore((s) => s.removeProfile);
  const genderIcon = profile.gender === "M" ? "♂" : profile.gender === "F" ? "♀" : "⚥";

  return (
    <div
      onClick={onSelect}
      style={{
        padding: "10px 12px",
        background: isActive ? "rgba(0,0,0,0.04)" : "transparent",
        borderLeft: isActive ? "2px solid var(--ink-primary)" : "2px solid transparent",
        cursor: "pointer",
        transition: "all 0.15s ease",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(0,0,0,0.02)"; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
    >
      {/* Avatar circle */}
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

      {/* Delete */}
      <button
        onClick={(e) => { e.stopPropagation(); removeProfile(profile.id); }}
        style={{
          width: 20, height: 20, borderRadius: "50%",
          border: "none", background: "transparent",
          color: "var(--ink-disabled)", fontSize: 14,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          opacity: 0.5, transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.5"; }}
        title="删除"
      >
        ×
      </button>
    </div>
  );
}

export default function ProfileManager({ onNewProfile }: { onNewProfile: () => void }) {
  const { profiles, activeProfile, setActiveProfile } = useAppStore();

  return (
    <div>
      {/* Header */}
      <div style={{
        padding: "0 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-disabled)", letterSpacing: 1 }}>
          档案
        </span>
        <button
          onClick={onNewProfile}
          style={{
            width: 20, height: 20, borderRadius: "50%",
            border: "none", background: "var(--bg-warm)",
            color: "var(--ink-tertiary)", fontSize: 16, lineHeight: 1,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--ink-primary)"; e.currentTarget.style.color = "var(--bg-base)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-warm)"; e.currentTarget.style.color = "var(--ink-tertiary)"; }}
          title="新建档案"
        >
          +
        </button>
      </div>

      {/* List */}
      {profiles.length === 0 ? (
        <div style={{
          padding: "16px", textAlign: "center",
          fontSize: 12, color: "var(--ink-disabled)",
        }}>
          暂无档案
        </div>
      ) : (
        <div>
          {profiles.map((p) => (
            <ProfileCard
              key={p.id}
              profile={p}
              isActive={activeProfile?.id === p.id}
              onSelect={() => setActiveProfile(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
