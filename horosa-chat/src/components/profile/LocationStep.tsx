/**
 * LocationStep — City search + lat/lon/tz picker
 * Features:
 * - Fuzzy search over built-in city list
 * - Auto-fill lat/lon/timezone on selection
 * - Manual override for coordinates
 * - Recent/popular cities at top
 */
import { useState, useMemo } from "react";

const CITIES = [
  // China
  { name: "北京", py: "beijing", lat: "39.90", lon: "116.40", tz: "8", country: "中国" },
  { name: "上海", py: "shanghai", lat: "31.23", lon: "121.47", tz: "8", country: "中国" },
  { name: "广州", py: "guangzhou", lat: "23.13", lon: "113.26", tz: "8", country: "中国" },
  { name: "深圳", py: "shenzhen", lat: "22.54", lon: "114.06", tz: "8", country: "中国" },
  { name: "成都", py: "chengdu", lat: "30.57", lon: "104.07", tz: "8", country: "中国" },
  { name: "杭州", py: "hangzhou", lat: "30.27", lon: "120.15", tz: "8", country: "中国" },
  { name: "南京", py: "nanjing", lat: "32.06", lon: "118.80", tz: "8", country: "中国" },
  { name: "武汉", py: "wuhan", lat: "30.59", lon: "114.30", tz: "8", country: "中国" },
  { name: "重庆", py: "chongqing", lat: "29.56", lon: "106.55", tz: "8", country: "中国" },
  { name: "西安", py: "xian", lat: "34.26", lon: "108.94", tz: "8", country: "中国" },
  { name: "长沙", py: "changsha", lat: "28.23", lon: "112.94", tz: "8", country: "中国" },
  { name: "天津", py: "tianjin", lat: "39.08", lon: "117.20", tz: "8", country: "中国" },
  { name: "苏州", py: "suzhou", lat: "31.30", lon: "120.62", tz: "8", country: "中国" },
  { name: "郑州", py: "zhengzhou", lat: "34.75", lon: "113.65", tz: "8", country: "中国" },
  { name: "昆明", py: "kunming", lat: "25.04", lon: "102.68", tz: "8", country: "中国" },
  { name: "哈尔滨", py: "harbin", lat: "45.75", lon: "126.65", tz: "8", country: "中国" },
  { name: "沈阳", py: "shenyang", lat: "41.80", lon: "123.43", tz: "8", country: "中国" },
  { name: "济南", py: "jinan", lat: "36.65", lon: "116.98", tz: "8", country: "中国" },
  { name: "福州", py: "fuzhou", lat: "26.07", lon: "119.30", tz: "8", country: "中国" },
  { name: "厦门", py: "xiamen", lat: "24.48", lon: "118.09", tz: "8", country: "中国" },
  { name: "大连", py: "dalian", lat: "38.91", lon: "121.60", tz: "8", country: "中国" },
  { name: "青岛", py: "qingdao", lat: "36.07", lon: "120.38", tz: "8", country: "中国" },
  { name: "乌鲁木齐", py: "urumqi", lat: "43.83", lon: "87.62", tz: "8", country: "中国" },
  { name: "拉萨", py: "lasa", lat: "29.65", lon: "91.13", tz: "8", country: "中国" },
  // TW/HK/MO
  { name: "台北", py: "taipei", lat: "25.03", lon: "121.56", tz: "8", country: "台湾" },
  { name: "高雄", py: "kaohsiung", lat: "22.63", lon: "120.30", tz: "8", country: "台湾" },
  { name: "香港", py: "hongkong", lat: "22.32", lon: "114.17", tz: "8", country: "香港" },
  { name: "澳门", py: "macau", lat: "22.20", lon: "113.54", tz: "8", country: "澳门" },
  // Asia
  { name: "东京", py: "tokyo", lat: "35.68", lon: "139.69", tz: "9", country: "日本" },
  { name: "大阪", py: "osaka", lat: "34.69", lon: "135.50", tz: "9", country: "日本" },
  { name: "首尔", py: "seoul", lat: "37.57", lon: "126.98", tz: "9", country: "韩国" },
  { name: "新加坡", py: "singapore", lat: "1.35", lon: "103.82", tz: "8", country: "新加坡" },
  { name: "曼谷", py: "bangkok", lat: "13.76", lon: "100.50", tz: "7", country: "泰国" },
  { name: "吉隆坡", py: "kualalumpur", lat: "3.14", lon: "101.69", tz: "8", country: "马来西亚" },
  { name: "新德里", py: "delhi", lat: "28.61", lon: "77.23", tz: "5.5", country: "印度" },
  // West
  { name: "伦敦", py: "london", lat: "51.51", lon: "-0.13", tz: "0", country: "英国" },
  { name: "巴黎", py: "paris", lat: "48.86", lon: "2.35", tz: "1", country: "法国" },
  { name: "柏林", py: "berlin", lat: "52.52", lon: "13.41", tz: "1", country: "德国" },
  { name: "纽约", py: "newyork", lat: "40.71", lon: "-74.01", tz: "-5", country: "美国" },
  { name: "洛杉矶", py: "losangeles", lat: "34.05", lon: "-118.24", tz: "-8", country: "美国" },
  { name: "旧金山", py: "sanfrancisco", lat: "37.77", lon: "-122.42", tz: "-8", country: "美国" },
  { name: "多伦多", py: "toronto", lat: "43.65", lon: "-79.38", tz: "-5", country: "加拿大" },
  { name: "温哥华", py: "vancouver", lat: "49.28", lon: "-123.12", tz: "-8", country: "加拿大" },
  { name: "悉尼", py: "sydney", lat: "-33.87", lon: "151.21", tz: "10", country: "澳大利亚" },
  { name: "墨尔本", py: "melbourne", lat: "-37.81", lon: "144.96", tz: "10", country: "澳大利亚" },
];

interface Props {
  lat: string; setLat: (v: string) => void;
  lon: string; setLon: (v: string) => void;
  zone: string; setZone: (v: string) => void;
  location: string; setLocation: (v: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export default function LocationStep({
  lat, setLat, lon, setLon, zone, setZone, location, setLocation,
  onBack, onSubmit,
}: Props) {
  const [query, setQuery] = useState("");
  const [showManual, setShowManual] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return CITIES.slice(0, 12); // Show popular
    const q = query.toLowerCase();
    return CITIES.filter(
      (c) => c.name.includes(q) || c.py.includes(q) || c.country.includes(q)
    ).slice(0, 12);
  }, [query]);

  function selectCity(c: typeof CITIES[0]) {
    setLat(c.lat); setLon(c.lon); setZone(c.tz);
    setLocation(c.name); setQuery("");
  }

  const lbl: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-tertiary)",
    marginBottom: 6, letterSpacing: 0.3,
  };

  return (
    <div>
      {/* Selected city display */}
      {location && (
        <div style={{
          marginBottom: 16, padding: "10px 14px",
          background: "var(--bg-warm)", borderRadius: "var(--r-md)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <span style={{ fontSize: 15, fontWeight: 500, color: "var(--ink-primary)" }}>{location}</span>
            <span style={{ fontSize: 12, color: "var(--ink-tertiary)", marginLeft: 8, fontFamily: "var(--font-mono)" }}>
              {lat}°N {lon}°E · UTC{Number(zone) >= 0 ? "+" : ""}{zone}
            </span>
          </div>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 12, padding: "4px 8px" }}
            onClick={() => { setLocation(""); setQuery(""); }}
          >
            更换
          </button>
        </div>
      )}

      {/* Search */}
      {!location && (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>搜索城市</label>
            <div style={{ position: "relative" }}>
              <input
                className="input-field"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="输入城市名或拼音…"
                autoFocus
                style={{ height: 44, fontSize: 15, paddingLeft: 36 }}
              />
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="var(--ink-disabled)" strokeWidth="2" strokeLinecap="round"
                style={{ position: "absolute", left: 12, top: 14 }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>

          {/* City grid */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6,
            marginBottom: 16, maxHeight: 240, overflowY: "auto",
            scrollbarWidth: "thin",
          }}>
            {filtered.map((c) => (
              <button
                key={c.py}
                type="button"
                onClick={() => selectCity(c)}
                style={{
                  padding: "10px 8px", textAlign: "center",
                  background: "var(--bg-base)", border: "none",
                  borderRadius: "var(--r-md)",
                  boxShadow: "var(--shadow-outline)",
                  cursor: "pointer", transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--bg-warm)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--bg-base)";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-primary)" }}>{c.name}</div>
                <div style={{ fontSize: 10, color: "var(--ink-disabled)", marginTop: 2 }}>{c.country}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Manual toggle */}
      <div style={{ marginBottom: 16 }}>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ fontSize: 12, padding: "4px 0", color: "var(--ink-tertiary)" }}
          onClick={() => setShowManual(!showManual)}
        >
          {showManual ? "收起" : "手动输入坐标"}
        </button>

        {showManual && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px", gap: 8, marginTop: 8 }}>
            <div>
              <label style={{ ...lbl, fontSize: 11 }}>纬度</label>
              <input className="input-field" value={lat} onChange={(e) => setLat(e.target.value)}
                style={{ fontFamily: "var(--font-mono)", fontSize: 13 }} />
            </div>
            <div>
              <label style={{ ...lbl, fontSize: 11 }}>经度</label>
              <input className="input-field" value={lon} onChange={(e) => setLon(e.target.value)}
                style={{ fontFamily: "var(--font-mono)", fontSize: 13 }} />
            </div>
            <div>
              <label style={{ ...lbl, fontSize: 11 }}>时区</label>
              <input className="input-field" value={zone} onChange={(e) => setZone(e.target.value)}
                style={{ fontFamily: "var(--font-mono)", fontSize: 13 }} />
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-white" style={{ flex: 1, padding: "10px 0" }} onClick={onBack}>
          上一步
        </button>
        <button
          className="btn"
          style={{ flex: 2, padding: "10px 0", fontSize: 15 }}
          onClick={onSubmit}
          disabled={!location && !lat}
        >
          创建档案
        </button>
      </div>
    </div>
  );
}
