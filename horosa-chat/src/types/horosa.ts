export type Element = "Metal" | "Wood" | "Water" | "Fire" | "Earth";
export type Polar = "Positive" | "Negative";
export type PillarKey = "year" | "month" | "day" | "time";
export type SanyuanKey = "tai" | "ming" | "shen";
export type ZhuLabel = "年" | "月" | "日" | "时";

export interface BaziBirthResponse {
  ok: boolean;
  tool: string;
  version: string;
  data: {
    bazi: BaziData;
    export_snapshot?: ExportBundle;
    snapshot_text?: string;
  };
  summary: string[];
  warnings: string[];
  error: null | { code: string; message: string };
}

/**
 * BaZi main payload — works for both bazi_birth and bazi_direct.
 * bazi_direct adds: direction[], smallDirection[], directAge, directTime, gender
 */
export interface BaziData {
  timeOffset: number;
  nongli: Nongli;
  season: Record<string, string>;
  fourColumns: Record<PillarKey | SanyuanKey, Pillar>;
  tiaohou: string[];
  ganHe: Record<string, GanZhiRef[]>;
  ziHe6: Record<string, GanZhiRef[]>;
  ziHe3: Record<string, GanZhiRef[]>;
  ziHui: Record<string, GanZhiRef[]>;
  ziXing: Record<string, GanZhiRef[]>;
  ziCong: Record<string, GanZhiRef[]>;
  ziPo: Record<string, GanZhiRef[]>;
  ganCong: Record<string, GanZhiRef[]>;
  ziCuan: Record<string, GanZhiRef[]>;

  // bazi_direct extras
  gender?: "Male" | "Female";
  directAge?: number;        // e.g. 7.36 (起运岁数, fractional)
  directTime?: string;       // e.g. "1997-10-27 14:07:24"
  directTimeJdn?: number;
  direction?: Dayun[];        // 9 decennial periods
  smallDirection?: SmallDirection[]; // year-by-year pillars from birth
}

export interface Nongli {
  date: string;
  birth: string;
  year: string;
  month: string;
  monthInt: number;
  day: string;
  dayInt: number;
  time: string;
  dayGanZi: string;
  monthGanZi: string;
  yearNaying: string;
  yearNayingElement: string;
  jieqi: string | null;
  leap: boolean;
}

export interface Pillar {
  goodGods: string[];
  badGods: string[];
  neutralGods: string[];
  stem: StemBranchCell;
  branch: StemBranchCell;
  stemInBranch: StemBranchCell[];
  ganzi: string;
  naying: string;
  nayingElement: string;
  ganziPhase: string;
  nayingPhase: string;
  zhu: ZhuLabel | null;
  xunEmpty: string | null;
}

export interface StemBranchCell {
  cell: string;
  relative: string;
  element: Element;
  polar: Polar;
  goodGods: string[];
  badGods: string[];
  neutralGods: string[];
  taisuiGods: string[];  // extra — 太岁神煞
}

export interface GanZhiRef {
  zhu: ZhuLabel;
  cell: string;
}

/** 大运 — one 10-year period */
export interface Dayun {
  age: number;              // start age of this period (7, 17, 27, ...)
  startYear: number;        // calendar year
  mainDirect: Pillar;       // the dayun pillar itself (干支/纳音/神煞)
  subDirect: Pillar[];      // 10 流年 pillars within this dayun
}

/** 小运 / liunian from birth — separate array */
export interface SmallDirection {
  age: number;
  year: number;
  direct: Pillar;           // 小运 pillar
  yearGanzi: Pillar;        // calendar 流年 pillar
}

export interface ExportBundle {
  sections: ExportSection[];
}

export interface ExportSection {
  title: string;
  body: string;
  included: boolean;
}

export const ELEMENT_COLORS: Record<string, string> = {
  Metal: "var(--el-metal)",
  Wood: "var(--el-wood)",
  Water: "var(--el-water)",
  Fire: "var(--el-fire)",
  Earth: "var(--el-earth)",
};

export const ELEMENT_CN: Record<string, string> = {
  Metal: "金",
  Wood: "木",
  Water: "水",
  Fire: "火",
  Earth: "土",
};
