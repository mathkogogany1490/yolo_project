export type SceneId =
  | "live"
  | "intro"
  | "eigen_demo"
  | "iris_data"
  | "iris_cov_eigen"
  | "iris_pca_2d"
  | "iris_lda"
  | "summary";

export type SceneItem = {
  id: SceneId;
  title: string;
  hasChart: boolean;
};

export type ScatterPoint = {
  x: number;
  y: number;
  label?: string;
  group?: string;
};

export type MathFormula = {
  symbol: string;
  numerator?: string;
  denominator?: string;
  expression?: string;
  note?: string;
  radicand?: string;
};

export type TableFootnote = {
  title: string;
  formula: MathFormula;
  extraFormulas?: MathFormula[];
  steps: string[];
};

export type ChartPayload =
  | { type: "none" }
  | {
      type: "scatter";
      title: string;
      xLabel: string;
      yLabel: string;
      points: ScatterPoint[];
    }
  | {
      type: "bar";
      title: string;
      xLabel: string;
      yLabel: string;
      items: { name: string; value: number }[];
    }
  | {
      type: "grouped_bar";
      title: string;
      xLabel: string;
      yLabel: string;
      series: { key: string; name: string }[];
      items: Record<string, string | number>[];
    }
  | {
      type: "biplot";
      title: string;
      xLabel: string;
      yLabel: string;
      points: ScatterPoint[];
      arrows: { name: string; x: number; y: number }[];
      footnote?: string | TableFootnote;
    }
  | {
      type: "heatmap";
      title: string;
      xLabel: string;
      yLabel: string;
      labels: string[];
      values: number[][];
      scale: "covariance" | "correlation";
      footnote?: string | TableFootnote;
    }
  | {
      type: "table";
      title: string;
      columns: string[];
      rows: (string | number | null)[][];
      footnote?: string | TableFootnote;
    }
  | {
      type: "bullets";
      title: string;
      items: string[];
      variant?: "intro" | "compact" | "iris";
    }
  | {
      type: "eigen_scatter";
      title: string;
      xLabel: string;
      yLabel: string;
      points: ScatterPoint[];
      mean: { x: number; y: number; label: string };
      arrows: {
        name: string;
        label: string;
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        eigenvalue: number;
        vector: number[];
      }[];
      eigenvalues: number[];
      explained_ratio_percent: number[];
      n_rows: number;
      normalization?: "minmax";
      xDomain: [number, number];
      yDomain: [number, number];
      xTicks: number[];
      yTicks: number[];
      ellipse: ScatterPoint[];
    };

export type DatasetInfo = {
  source_name: string;
  columns: string[];
  numeric_columns: string[];
  selected_columns: string[];
  n_rows: number;
  preview: Record<string, string | number | null>[];
  pca_ready: boolean;
  explained_variance: number[];
  openai: boolean;
  current_scene: SceneId;
  scenes: SceneItem[];
};

export type TurnResponse = {
  scene: SceneId;
  title: string;
  explanation: string;
  hint: string;
  heard?: string;
  chart: ChartPayload;
  charts?: ChartPayload[];
  scenes: SceneItem[];
  openai: boolean;
  explained_variance: number[];
  source_name?: string;
};
