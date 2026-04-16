export type Element = "Metal" | "Wood" | "Water" | "Fire" | "Earth";
export type Polar = "Positive" | "Negative";
export type PillarKey = "year" | "month" | "day" | "time";
export type SanyuanKey = "tai" | "ming" | "shen";
export type ZhuLabel = "年" | "月" | "日" | "时";

export interface BaziBirthResponse {
  ok: boolean;
  tool: "bazi_birth";
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
  zhu: ZhuLabel;
  xunEmpty: string;
}

export interface StemBranchCell {
  cell: string;
  relative: string;
  element: Element;
  polar: Polar;
  goodGods: string[];
  badGods: string[];
  neutralGods: string[];
  taisuiGods: string[];
}

export interface GanZhiRef {
  zhu: ZhuLabel;
  cell: string;
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
  Metal: "var(--color-metal)",
  Wood: "var(--color-wood)",
  Water: "var(--color-water)",
  Fire: "var(--color-fire)",
  Earth: "var(--color-earth)",
};

export const ELEMENT_CN: Record<string, string> = {
  Metal: "金",
  Wood: "木",
  Water: "水",
  Fire: "火",
  Earth: "土",
};
