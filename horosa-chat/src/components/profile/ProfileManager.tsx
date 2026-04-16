/**
 * ProfileManager — sidebar profile list.
 * No colored side-borders. Active = subtle bg fill + stronger avatar.
 */
import { useAppStore, type Profile } from "../../stores/appStore";

/** Generate a stable color from a name string */
function nameColor(name: string): { bg: string; fg: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash << 5) - hash + name.charCodeAt(i);
  const hue = Math.abs(hash) % 360;
  return {
    bg: `hsl(${hue}, 32%, 92%)`,
    fg: `hsl(${hue}, 42%, 32%)`,
  };
}

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </svg>
  );
}

function ProfileCard({ profile, isActive }: { profile: Profile; isActive: boolean }) {
  const { setActiveProfile, openEditProfile, askDelete } = useAppStore();
  const genderIcon = profile.gender === "M" ? "♂" : profile.gender === "F" ? "♀" : "⚥";
  const avatarColor = nameColor(profile.name);

  return (
    <div
      onClick={() => setActiveProfile(profile.id)}
      className={`profile-row ${isActive ? "active" : ""}`}
    >
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: isActive ? "var(--ink-primary)" : avatarColor.bg,
        color: isActive ? "var(--bg-base)" : avatarColor.fg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 600, flexShrink: 0,
        fontFamily: "var(--font-display)",
        transition: "background var(--dur-normal) var(--ease-out), color var(--dur-normal) var(--ease-out)",
      }}>
        {profile.name.slice(0, 1)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: isActive ? 600 : 500,
          color: "var(--ink-primary)", whiteSpace: "nowrap",
          overflow: "hidden", textOverflow: "ellipsis",
          letterSpacing: 0.1,
        }}>
          {profile.name}
          <span style={{ marginLeft: 4, fontSize: 11, color: "var(--ink-disabled)", fontWeight: 400 }}>
            {genderIcon}
          </span>
        </div>
        <div style={{
          fontSize: 10, color: "var(--ink-disabled)", marginTop: 1,
          fontFamily: "var(--font-mono)", letterSpacing: 0.2,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {profile.birthDate.slice(0, 7)} · {profile.location}
        </div>
      </div>

      <div className="actions" style={{ display: "flex", gap: 2 }}>
        <button
          onClick={(e) => { e.stopPropagation(); openEditProfile(profile); }}
          className="icon-btn"
          title="编辑"
          style={{ width: 22, height: 22 }}
        >
          <EditIcon />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); askDelete(profile); }}
          className="icon-btn"
          title="删除"
          style={{ width: 22, height: 22 }}
        >
          <DeleteIcon />
        </button>
      </div>
    </div>
  );
}

export default function ProfileManager() {
  const { profiles, activeProfileId, openNewProfile } = useAppStore();

  return (
    <div>
      <div style={{
        padding: "4px 16px 10px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{
          fontSize: 10, fontWeight: 600, color: "var(--ink-disabled)",
          letterSpacing: 1.5, textTransform: "uppercase" as const,
        }}>
          档案 · {profiles.length}
        </span>
        <button
          onClick={openNewProfile}
          className="icon-btn"
          style={{ width: 22, height: 22, color: "var(--ink-secondary)" }}
          title="新建档案 (⌘N)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {profiles.length === 0 ? (
        <div style={{
          margin: "0 16px", padding: "14px 12px",
          textAlign: "center", fontSize: 12, color: "var(--ink-disabled)",
          background: "var(--bg-base)", borderRadius: "var(--r-md)",
          border: "1px dashed var(--line-default)",
        }}>
          暂无档案
        </div>
      ) : (
        <div style={{ maxHeight: 420, overflowY: "auto", paddingBottom: 4 }}>
          {profiles.map((p) => (
            <ProfileCard key={p.id} profile={p} isActive={activeProfileId === p.id} />
          ))}
        </div>
      )}
    </div>
  );
}
