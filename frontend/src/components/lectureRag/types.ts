export type SceneId =
  | "live"
  | "intro"
  | "eigen_demo"
  | "iris_data"
  | "iris_cov_eigen"
  | "iris_pca_2d"
  | "iris_lda"
  | "summary"
  | "svd_intro"
  | "svd_ratings"
  | "svd_decompose"
  | "svd_summary"
  | "mf_intro"
  | "mf_embedding"
  | "mf_ratings"
  | "mf_model"
  | "mf_training"
  | "mf_summary"
  | "tf_intro"
  | "tf_attention"
  | "tf_multihead"
  | "tf_encoder"
  | "tf_diagram"
  | "tf_summary";

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
      highlight_cells?: [number, number][];
      summary_rows?: number[];
    }
  | {
      type: "bullets";
      title: string;
      items: string[];
      variant?: "intro" | "compact" | "iris";
      footnote?: string | TableFootnote;
      extraFootnotes?: TableFootnote[];
    }
  | {
      type: "matrix_pair";
      title: string;
      left: {
        label: string;
        row_labels: string[];
        col_labels: string[];
        diagonal?: string[];
        is_diagonal?: boolean;
        values?: string[][];
      };
      right: {
        label: string;
        row_labels: string[];
        col_labels: string[];
        diagonal?: string[];
        is_diagonal?: boolean;
        values?: string[][];
      };
      footnote?: string;
    }
  | {
      type: "matrix_product";
      title: string;
      variant?: "verify" | "predict" | "center";
      operators?: string[];
      matrices: {
        label: string;
        row_labels?: string[];
        col_labels?: string[];
        values?: string[][];
        diagonal?: string[];
        is_diagonal?: boolean;
        size?: number;
      }[];
      result: {
        label: string;
        row_labels: string[];
        col_labels: string[];
        values: string[][];
        highlight_cells?: [number, number][];
      };
      footnote?: string;
    }
  | {
      type: "matrix_equation";
      title: string;
      equation: string;
      original: {
        label: string;
        row_labels: string[];
        col_labels: string[];
        values: string[][];
      };
      reconstructed: {
        label: string;
        row_labels: string[];
        col_labels: string[];
        values: string[][];
      };
      footnote?: string;
    }
  | {
      type: "distribution_line";
      title: string;
      caption?: string;
      variant: "pdf" | "cdf";
      xLabel: string;
      yLabel: string;
      points: { x: number; y: number }[];
    }
  | {
      type: "mf_network";
      title: string;
      dims: string[];
      movie: {
        name: string;
        embedding: number[];
        weights: number[];
        weighted: number[];
      };
      user: {
        name: string;
        embedding: number[];
        weights: number[];
        weighted: number[];
      };
      terms: number[];
      predicted: number;
      actual: number;
      error: number;
      loss: number;
      dL_dPred: number;
      dL_dW_movie: number[];
      dL_dW_user: number[];
    }
  | {
      type: "tf_network";
      title: string;
      dims: string[];
      query: {
        name: string;
        embedding: number[];
        weights: number[];
        weighted: number[];
      };
      keys: {
        name: string;
        embedding: number[];
        weights: number[];
        weighted: number[];
        score: number;
        value: number;
        attention: number;
        weightedValue: number;
      }[];
      predicted: number;
    }
  | {
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
