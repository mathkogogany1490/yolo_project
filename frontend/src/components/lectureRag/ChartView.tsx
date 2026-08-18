import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPayload, MathFormula, ScatterPoint, TableFootnote } from "./types";

const PALETTE = ["#2563eb", "#059669", "#dc2626", "#d97706", "#7c3aed", "#0891b2"];
const ACCENT = PALETTE[0];
const ACCENT_2 = PALETTE[1];
const MUTED = "rgba(148, 163, 184, 0.45)";
const AXIS = "#64748b";
const TICK = "#475569";
const LABEL = "#334155";
const TOOLTIP = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  color: "#1e293b",
};

function ScatterPlot({
  points,
  xLabel,
  yLabel,
}: {
  points: ScatterPoint[];
  xLabel: string;
  yLabel: string;
}) {
  const groups = Array.from(new Set(points.map((point) => point.group).filter(Boolean))) as string[];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 12, right: 20, bottom: 52, left: 8 }}>
        <CartesianGrid stroke={MUTED} />
        <XAxis
          type="number"
          dataKey="x"
          name={xLabel}
          tick={{ fill: TICK, fontSize: 13 }}
          label={{ value: xLabel, position: "insideBottom", offset: -8, fill: LABEL }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name={yLabel}
          tick={{ fill: TICK, fontSize: 13 }}
          label={{ value: yLabel, angle: -90, position: "insideLeft", fill: LABEL }}
        />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          contentStyle={TOOLTIP}
          formatter={(value, name) => [value, name]}
          labelFormatter={() => ""}
        />
        {groups.length > 0 ? (
          <Legend
            verticalAlign="bottom"
            wrapperStyle={{ paddingTop: 22, fontSize: 13 }}
          />
        ) : null}
        {groups.length > 0 ? (
          groups.map((group, index) => (
            <Scatter
              key={group}
              name={group}
              data={points.filter((point) => point.group === group)}
              fill={PALETTE[index % PALETTE.length]}
            />
          ))
        ) : (
          <Scatter data={points} fill={PALETTE[0]} />
        )}
      </ScatterChart>
    </ResponsiveContainer>
  );
}

type BiplotArrow = { name: string; x: number; y: number };

function angleDiff(a: number, b: number) {
  const raw = Math.abs(a - b) % (Math.PI * 2);
  return Math.min(raw, Math.PI * 2 - raw);
}

function layoutBiplotLabels(
  arrows: BiplotArrow[],
  sx: (x: number) => number,
  sy: (y: number) => number,
) {
  const originX = sx(0);
  const originY = sy(0);
  const items = arrows.map((arrow) => {
    const tipX = sx(arrow.x);
    const tipY = sy(arrow.y);
    let vx = tipX - originX;
    let vy = tipY - originY;
    const mag = Math.hypot(vx, vy) || 1;
    vx /= mag;
    vy /= mag;
    return {
      name: arrow.name,
      length: Math.hypot(arrow.x, arrow.y),
      tipX,
      tipY,
      vx,
      vy,
      px: -vy,
      py: vx,
      angle: Math.atan2(vy, vx),
      labelX: tipX + vx * 3.2,
      labelY: tipY + vy * 3.2,
      leader: false,
    };
  });

  const assigned = new Set<number>();
  const similar = (18 * Math.PI) / 180;
  for (let i = 0; i < items.length; i += 1) {
    if (assigned.has(i)) continue;
    const cluster = [i];
    for (let j = i + 1; j < items.length; j += 1) {
      if (assigned.has(j)) continue;
      if (angleDiff(items[i].angle, items[j].angle) < similar) {
        cluster.push(j);
      }
    }
    cluster.forEach((idx) => assigned.add(idx));
    if (cluster.length < 2) continue;

    cluster.sort((a, b) => items[a].length - items[b].length);
    const mid = (cluster.length - 1) / 2;
    cluster.forEach((idx, k) => {
      const item = items[idx];
      const along = 2.8 + k * 5.2;
      const side = (k - mid) * 7.4;
      item.labelX = Math.min(96, Math.max(4, item.tipX + item.vx * along + item.px * side));
      item.labelY = Math.min(97, Math.max(6, item.tipY + item.vy * along + item.py * side));
      item.leader = Math.hypot(item.labelX - item.tipX, item.labelY - item.tipY) > 4;
    });
  }

  return items;
}

function Biplot({
  points,
  arrows,
  xLabel,
  yLabel,
}: {
  points: ScatterPoint[];
  arrows: BiplotArrow[];
  xLabel: string;
  yLabel: string;
}) {
  const groups = Array.from(new Set(points.map((point) => point.group).filter(Boolean))) as string[];
  const maxAbs =
    Math.max(
      ...points.map((p) => Math.abs(p.x)),
      ...points.map((p) => Math.abs(p.y)),
      ...arrows.map((a) => Math.abs(a.x)),
      ...arrows.map((a) => Math.abs(a.y)),
      1,
    ) * 1.2;
  const sx = (x: number) => 50 + (x / maxAbs) * 38;
  const sy = (y: number) => 50 - (y / maxAbs) * 38;
  const colorOf = (point: ScatterPoint) => {
    if (!point.group || groups.length === 0) return ACCENT;
    return PALETTE[groups.indexOf(point.group) % PALETTE.length];
  };
  const labels = layoutBiplotLabels(arrows, sx, sy);

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="biplot-svg" role="img" aria-label="PCA 바이플롯">
      <defs>
        <marker id="arrowhead" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
          <path d="M0,0 L4,2 L0,4 Z" fill={ACCENT_2} />
        </marker>
      </defs>
      <line x1="10" y1="50" x2="90" y2="50" stroke={AXIS} strokeWidth="0.3" />
      <line x1="50" y1="10" x2="50" y2="90" stroke={AXIS} strokeWidth="0.3" />
      <text className="biplot-x-label" x="91" y="49" fontSize="3" fill={TICK}>
        {xLabel}
      </text>
      <text x="51" y="9" fontSize="3" fill={TICK}>
        {yLabel}
      </text>
      {points.map((point, index) => (
        <circle
          key={`${point.x}-${point.y}-${index}`}
          cx={sx(point.x)}
          cy={sy(point.y)}
          r="0.85"
          fill={colorOf(point)}
          opacity="0.85"
        />
      ))}
      {arrows.map((arrow) => (
        <line
          key={`${arrow.name}-arrow`}
          x1={sx(0)}
          y1={sy(0)}
          x2={sx(arrow.x)}
          y2={sy(arrow.y)}
          stroke={ACCENT_2}
          strokeWidth="0.45"
          markerEnd="url(#arrowhead)"
        />
      ))}
      {labels.map((item) => (
        <g key={`${item.name}-label`}>
          {item.leader ? (
            <line
              x1={item.tipX}
              y1={item.tipY}
              x2={item.labelX}
              y2={item.labelY}
              stroke="#047857"
              strokeWidth="0.22"
              opacity="0.55"
            />
          ) : null}
          <text
            className="biplot-label"
            x={item.labelX}
            y={item.labelY}
            fontSize="3"
            fill="#047857"
            textAnchor={item.labelX >= item.tipX ? "start" : "end"}
            dominantBaseline="middle"
          >
            {item.name}
          </text>
        </g>
      ))}
    </svg>
  );
}

function buildEigenPlotScales(
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  plot: { left: number; right: number; top: number; bottom: number },
) {
  const plotW = 100 - plot.left - plot.right;
  const plotH = 100 - plot.top - plot.bottom;
  const xSpan = xMax - xMin || 1;
  const ySpan = yMax - yMin || 1;
  const xStretch = Math.min(1.85, Math.max(1.35, (ySpan / xSpan) * 0.95));
  const baseScale = Math.min(plotW / xSpan, plotH / ySpan);
  const scaleX = baseScale * xStretch;
  const scaleY = baseScale;
  const drawW = xSpan * scaleX;
  const drawH = ySpan * scaleY;
  const offX = plot.left + (plotW - drawW) / 2;
  const offY = plot.top + (plotH - drawH) / 2;

  return {
    plot,
    plotW,
    plotH,
    dataX: (x: number) => offX + (x - xMin) * scaleX,
    dataY: (y: number) => offY + drawH - (y - yMin) * scaleY,
  };
}

function EigenScatter({
  chart,
}: {
  chart: Extract<ChartPayload, { type: "eigen_scatter" }>;
}) {
  const [xMin, xMax] = chart.xDomain;
  const [yMin, yMax] = chart.yDomain;
  const plotBox = { left: 14, right: 4, top: 5, bottom: 13 };
  const { plot, plotW, plotH, dataX, dataY } = buildEigenPlotScales(
    xMin,
    xMax,
    yMin,
    yMax,
    plotBox,
  );

  const ellipsePath =
    chart.ellipse.length > 0
      ? chart.ellipse
          .map((point, index) => `${index === 0 ? "M" : "L"} ${dataX(point.x).toFixed(2)} ${dataY(point.y).toFixed(2)}`)
          .join(" ") + " Z"
      : "";

  return (
    <div className="eigen-wrap">
      <div className="eigen-plot">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          className="eigen-svg"
          role="img"
          aria-label={chart.title}
        >
        <defs>
          <marker id="eigen-arrow-v1" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
            <path d="M0,0 L4,2 L0,4 Z" fill={ACCENT} />
          </marker>
          <marker id="eigen-arrow-v2" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
            <path d="M0,0 L4,2 L0,4 Z" fill={ACCENT_2} />
          </marker>
        </defs>

        <rect
          x={plot.left}
          y={plot.top}
          width={plotW}
          height={plotH}
          fill="#ffffff"
          stroke="rgba(148, 163, 184, 0.35)"
          strokeWidth="0.25"
        />

        {chart.yTicks.map((tick) => (
          <g key={`y-grid-${tick}`}>
            <line
              x1={plot.left}
              y1={dataY(tick)}
              x2={plot.left + plotW}
              y2={dataY(tick)}
              stroke="rgba(148, 163, 184, 0.12)"
              strokeWidth="0.2"
            />
          </g>
        ))}
        {chart.xTicks.map((tick) => (
          <g key={`x-grid-${tick}`}>
            <line
              x1={dataX(tick)}
              y1={plot.top}
              x2={dataX(tick)}
              y2={plot.top + plotH}
              stroke="rgba(148, 163, 184, 0.12)"
              strokeWidth="0.2"
            />
          </g>
        ))}

        <line
          x1={plot.left}
          y1={plot.top + plotH}
          x2={plot.left + plotW}
          y2={plot.top + plotH}
          stroke={AXIS}
          strokeWidth="0.35"
        />
        <line
          x1={plot.left}
          y1={plot.top}
          x2={plot.left}
          y2={plot.top + plotH}
          stroke={AXIS}
          strokeWidth="0.35"
        />

        {chart.xTicks.map((tick) => (
          <g key={`x-tick-${tick}`}>
            <line
              x1={dataX(tick)}
              y1={plot.top + plotH}
              x2={dataX(tick)}
              y2={plot.top + plotH + 0.8}
              stroke={TICK}
              strokeWidth="0.25"
            />
            <text x={dataX(tick)} y={plot.top + plotH + 3.4} fontSize="3.4" fill={TICK} textAnchor="middle">
              {tick}
            </text>
          </g>
        ))}
        {chart.yTicks.map((tick) => (
          <g key={`y-tick-${tick}`}>
            <line
              x1={plot.left - 0.8}
              y1={dataY(tick)}
              x2={plot.left}
              y2={dataY(tick)}
              stroke={TICK}
              strokeWidth="0.25"
            />
            <text x={plot.left - 1.6} y={dataY(tick) + 1} fontSize="3.4" fill={TICK} textAnchor="end">
              {tick}
            </text>
          </g>
        ))}

        <text
          x={plot.left + plotW / 2}
          y={plot.top + plotH + 7.2}
          fontSize="4"
          fill={LABEL}
          textAnchor="middle"
          fontWeight="600"
        >
          {chart.xLabel}
        </text>
        <text
          x={3.8}
          y={plot.top + plotH / 2}
          fontSize="4"
          fill={LABEL}
          textAnchor="middle"
          fontWeight="600"
          transform={`rotate(-90 3.8 ${plot.top + plotH / 2})`}
        >
          {chart.yLabel}
        </text>

        {ellipsePath ? (
          <path d={ellipsePath} fill="none" stroke="rgba(251, 191, 36, 0.35)" strokeWidth="0.35" strokeDasharray="1.2 0.8" />
        ) : null}

        {chart.points.map((point, index) => (
          <circle
            key={`${point.x}-${point.y}-${index}`}
            cx={dataX(point.x)}
            cy={dataY(point.y)}
            r="0.45"
            fill={ACCENT}
            opacity="0.35"
          />
        ))}

        <circle cx={dataX(chart.mean.x)} cy={dataY(chart.mean.y)} r="0.75" fill="#fbbf24" />
        <text
          x={dataX(chart.mean.x) + 1.2}
          y={dataY(chart.mean.y) - 1.2}
          fontSize="2.5"
          fill="#b45309"
        >
          {chart.mean.label}
        </text>

        {chart.arrows.map((arrow, index) => (
          <g key={arrow.name}>
            <line
              x1={dataX(chart.mean.x)}
              y1={dataY(chart.mean.y)}
              x2={dataX(arrow.x2)}
              y2={dataY(arrow.y2)}
              stroke={index === 0 ? ACCENT : ACCENT_2}
              strokeWidth="0.65"
              markerEnd={`url(#eigen-arrow-v${index + 1})`}
            />
            <line
              x1={dataX(chart.mean.x)}
              y1={dataY(chart.mean.y)}
              x2={dataX(arrow.x1)}
              y2={dataY(arrow.y1)}
              stroke={index === 0 ? ACCENT : ACCENT_2}
              strokeWidth="0.65"
              markerEnd={`url(#eigen-arrow-v${index + 1})`}
            />
            <text
              x={dataX(arrow.x2) + 1}
              y={dataY(arrow.y2) - 1}
              fontSize="2.6"
              fill={index === 0 ? "#1d4ed8" : "#047857"}
            >
              {arrow.label}
            </text>
          </g>
        ))}
      </svg>
      </div>
      <ul className="arrow-legend">
        {chart.arrows.map((arrow) => (
          <li key={arrow.name}>
            <span>{arrow.label}</span>
            <em>
              [{arrow.vector[0]}, {arrow.vector[1]}]
            </em>
          </li>
        ))}
        <li>
          <span>설명 비율</span>
          <em>{chart.explained_ratio_percent.join("%, ")}%</em>
        </li>
        {chart.normalization === "minmax" ? (
          <li>
            <span>정규화</span>
            <em>Min-Max (0~1, 단위·범위 맞춤)</em>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function MathRadicand({ text }: { text: string }) {
  if (text === "w1^2 + w2^2") {
    return (
      <>
        <i>w</i>
        <sub>1</sub>
        <sup>2</sup>
        {" + "}
        <i>w</i>
        <sub>2</sub>
        <sup>2</sup>
      </>
    );
  }
  return <>{text}</>;
}

function MathFormulaView({ formula }: { formula: MathFormula }) {
  if (formula.radicand) {
    return (
      <div className="math-formula">
        <span className="math-symbol">{formula.symbol}</span>
        <span className="math-eq">=</span>
        <span className="math-sqrt" aria-label={`${formula.symbol} = sqrt(${formula.radicand})`}>
          <span className="math-sqrt-sign" aria-hidden="true">
            √
          </span>
          <span className="math-sqrt-radicand">
            <MathRadicand text={formula.radicand} />
          </span>
        </span>
      </div>
    );
  }

  if (formula.expression) {
    return (
      <div className="math-formula math-formula-stack">
        <div className="math-formula-row">
          <span className="math-symbol">{formula.symbol}</span>
          <span className="math-eq">=</span>
          <span className="math-expr">{formula.expression}</span>
        </div>
        {formula.note ? <p className="math-note">{formula.note}</p> : null}
      </div>
    );
  }

  return (
    <div className="math-formula math-formula-stack">
      <div className="math-formula-row">
        <span className="math-symbol">{formula.symbol}</span>
        <span className="math-eq">=</span>
        <span className="math-fraction">
          <span className="math-num">{formula.numerator}</span>
          <span className="math-den">{formula.denominator}</span>
        </span>
      </div>
      {formula.note ? <p className="math-note">{formula.note}</p> : null}
    </div>
  );
}

function TableFootnoteBlock({ footnote }: { footnote: TableFootnote }) {
  return (
    <div className="table-footnote table-footnote-block">
      <p className="table-footnote-title">{footnote.title}</p>
      <MathFormulaView formula={footnote.formula} />
      {footnote.extraFormulas?.map((item, index) => (
        <MathFormulaView key={`${item.symbol}-${index}`} formula={item} />
      ))}
      <ol className="table-footnote-steps">
        {footnote.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
  );
}

function isTableFootnote(value: string | TableFootnote): value is TableFootnote {
  return typeof value === "object" && value !== null && "formula" in value;
}

function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t;
}

function heatmapColor(value: number, maxAbs: number) {
  const t = maxAbs === 0 ? 0 : Math.max(-1, Math.min(1, value / maxAbs));
  if (t >= 0) {
    return `rgb(${lerp(30, 248, t)}, ${lerp(41, 113, t)}, ${lerp(59, 113, t)})`;
  }
  const u = -t;
  return `rgb(${lerp(30, 79, u)}, ${lerp(41, 140, u)}, ${lerp(59, 255, u)})`;
}

function HeatmapChart({
  labels,
  values,
  scale,
  footnote,
}: {
  labels: string[];
  values: number[][];
  scale: "covariance" | "correlation";
  footnote?: string | TableFootnote;
}) {
  const maxAbs =
    scale === "correlation"
      ? 1
      : Math.max(...values.flat().map((value) => Math.abs(value)), 0.001);
  const digits = scale === "covariance" && maxAbs < 0.5 ? 4 : 2;
  return (
    <div className="heatmap-wrap">
      <table className="heatmap-table">
        <thead>
          <tr>
            <th />
            {labels.map((label) => (
              <th key={label}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((rowLabel, row) => (
            <tr key={rowLabel}>
              <th>{rowLabel}</th>
              {labels.map((colLabel, col) => {
                const value = values[row]?.[col] ?? 0;
                return (
                  <td
                    key={colLabel}
                    style={{ background: heatmapColor(value, maxAbs), color: "#f8fafc" }}
                  >
                    {value.toFixed(digits)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="heatmap-legend">
        {scale === "correlation" ? "파랑 −1 · 빨강 +1" : "파랑 음수 · 빨강 양수"}
      </p>
      {footnote ? (
        isTableFootnote(footnote) ? (
          <TableFootnoteBlock footnote={footnote} />
        ) : (
          <p className="table-footnote">{footnote}</p>
        )
      ) : null}
    </div>
  );
}

export default function ChartView({ chart }: { chart: ChartPayload }) {
  if (chart.type === "none") {
    return null;
  }

  if (chart.type === "scatter") {
    return (
      <div className="scatter-wrap">
        <ScatterPlot points={chart.points} xLabel={chart.xLabel} yLabel={chart.yLabel} />
      </div>
    );
  }

  if (chart.type === "bar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chart.items} margin={{ top: 12, right: 16, bottom: 12, left: 8 }}>
          <CartesianGrid stroke={MUTED} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: TICK }} />
          <YAxis
            tick={{ fill: TICK }}
            label={{ value: chart.yLabel, angle: -90, position: "insideLeft", fill: LABEL }}
          />
          <Tooltip
            contentStyle={TOOLTIP}
            formatter={(value) => [`${value ?? 0}`, chart.yLabel]}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {chart.items.map((item) => (
              <Cell key={item.name} fill={item.name === "PC1" ? ACCENT : ACCENT_2} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "grouped_bar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chart.items} margin={{ top: 12, right: 16, bottom: 12, left: 8 }}>
          <CartesianGrid stroke={MUTED} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: TICK }} />
          <YAxis tick={{ fill: TICK }} />
          <Legend />
          <Tooltip
            contentStyle={TOOLTIP}
          />
          {chart.series.map((series, index) => (
            <Bar
              key={series.key}
              dataKey={series.key}
              name={series.name}
              fill={index === 0 ? ACCENT : ACCENT_2}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "eigen_scatter") {
    return <EigenScatter chart={chart} />;
  }

  if (chart.type === "heatmap") {
    return (
      <HeatmapChart
        labels={chart.labels}
        values={chart.values}
        scale={chart.scale}
        footnote={chart.footnote}
      />
    );
  }

  if (chart.type === "table") {
    const footnoteBlock = chart.footnote ? (
      isTableFootnote(chart.footnote) ? (
        <TableFootnoteBlock footnote={chart.footnote} />
      ) : (
        <p className="table-footnote">{chart.footnote}</p>
      )
    ) : null;

    return (
      <div className={footnoteBlock ? "table-panel" : "table-wrap"}>
        <div className="table-wrap table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                {chart.columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chart.rows.map((row, index) => (
                <tr key={index}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${index}-${cellIndex}`}>{cell ?? ""}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {footnoteBlock}
      </div>
    );
  }

  if (chart.type === "bullets") {
    if (chart.variant === "intro") {
      return (
        <div className="lecture-points intro-summary">
          <h2 className="intro-summary-title">{chart.title}</h2>
          <ul className="intro-summary-list">
            {chart.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      );
    }
    if (chart.variant === "iris") {
      return (
        <div className="lecture-points iris-summary">
          <ul>
            {chart.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      );
    }
    return (
      <div className="lecture-points">
        <ul>
          {chart.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (chart.type === "biplot") {
    return (
      <div className="biplot-wrap">
        <Biplot
          points={chart.points}
          arrows={chart.arrows}
          xLabel={chart.xLabel}
          yLabel={chart.yLabel}
        />
      </div>
    );
  }

  return null;
}
