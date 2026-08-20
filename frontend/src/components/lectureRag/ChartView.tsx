import React, { useLayoutEffect, useRef } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPayload, MathFormula, ScatterPoint, TableFootnote } from "./types";

const PALETTE = ["#fde68a", "#93c5fd", "#fca5a5", "#fdba74", "#c4b5fd", "#67e8f9"];
const BIPLOT_ARROW_COLORS = ["#fbbf24", "#f472b6", "#6ee7b7", "#a78bfa"];
const ACCENT = PALETTE[0];
const ACCENT_2 = PALETTE[1];
const MUTED = "rgba(245, 245, 240, 0.24)";
const AXIS = "rgba(245, 245, 240, 0.5)";
const TICK = "rgba(245, 245, 240, 0.88)";
const LABEL = "#f5f5f0";
const EIGEN_LABEL = {
  fill: "#f5f5f0",
  stroke: "#143d31",
  strokeWidth: 0.22,
  fontWeight: 700,
  paintOrder: "stroke" as const,
};
const TOOLTIP = {
  background: "#174636",
  border: "1px solid rgba(245, 245, 240, 0.28)",
  borderRadius: 8,
  color: "#f5f5f0",
};

function useMatrixFitScale(deps: unknown[] = []) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const fit = () => {
      inner.style.transform = "none";
      inner.style.width = "max-content";

      const availW = outer.clientWidth;
      const availH = outer.clientHeight;
      const scaleW = inner.scrollWidth > 0 && availW > 0 ? availW / inner.scrollWidth : 1;
      const scaleH = inner.scrollHeight > 0 && availH > 0 ? availH / inner.scrollHeight : 1;
      const scale = Math.min(1, scaleW, scaleH);

      inner.style.transform = `scale(${scale})`;
      inner.style.transformOrigin = "top left";

      const scaledHeight = inner.getBoundingClientRect().height;
      outer.style.height = `${Math.ceil(scaledHeight) + 4}px`;
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(outer);
    observer.observe(inner);
    window.addEventListener("resize", fit);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, deps);

  return { outerRef, innerRef };
}

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
              <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 18, fontSize: 13 }} />
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
                  title,
                }: {
  points: ScatterPoint[];
  arrows: BiplotArrow[];
  xLabel: string;
  yLabel: string;
  title?: string;
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
  const plotScale = 44;
  const originX = 38;
  const originY = 50;
  const sx = (x: number) => originX + (x / maxAbs) * plotScale;
  const sy = (y: number) => originY - (y / maxAbs) * plotScale;
  const colorOf = (point: ScatterPoint) => {
    if (!point.group || groups.length === 0) return ACCENT;
    return PALETTE[groups.indexOf(point.group) % PALETTE.length];
  };
  const labels = layoutBiplotLabels(arrows, sx, sy);

  return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="biplot-svg" role="img" aria-label="PCA 바이플롯">
        <defs>
          {arrows.map((arrow, index) => (
              <marker
                  key={`${arrow.name}-marker`}
                  id={`biplot-arrow-${index}`}
                  markerWidth="5"
                  markerHeight="5"
                  refX="3.5"
                  refY="2.5"
                  orient="auto"
              >
                <path d="M0,0 L5,2.5 L0,5 Z" fill={BIPLOT_ARROW_COLORS[index % BIPLOT_ARROW_COLORS.length]} />
              </marker>
          ))}
        </defs>
        <line x1="8" y1={originY} x2="88" y2={originY} stroke={AXIS} strokeWidth="0.3" />
        <line x1={originX} y1="8" x2={originX} y2="92" stroke={AXIS} strokeWidth="0.3" />
        <text className="biplot-x-label" x="89" y={originY - 1} fontSize="3.2" fill={TICK}>
          {xLabel}
        </text>
        <text
            className="biplot-y-label"
            x={originX - 3.5}
            y={originY}
            fontSize="3.2"
            fill={TICK}
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(-90 ${originX - 3.5} ${originY})`}
        >
          {yLabel}
        </text>
        {points.map((point, index) => (
            <circle
                key={`${point.x}-${point.y}-${index}`}
                cx={sx(point.x)}
                cy={sy(point.y)}
                r="1.05"
                fill={colorOf(point)}
                opacity="0.85"
            />
        ))}
        {arrows.map((arrow, index) => {
          const arrowColor = BIPLOT_ARROW_COLORS[index % BIPLOT_ARROW_COLORS.length];
          return (
              <line
                  key={`${arrow.name}-arrow`}
                  x1={sx(0)}
                  y1={sy(0)}
                  x2={sx(arrow.x)}
                  y2={sy(arrow.y)}
                  stroke={arrowColor}
                  strokeWidth="0.72"
                  markerEnd={`url(#biplot-arrow-${index})`}
              />
          );
        })}
        {labels.map((item, index) => {
          const arrowColor = BIPLOT_ARROW_COLORS[index % BIPLOT_ARROW_COLORS.length];
          return (
              <g key={`${item.name}-label`}>
                {item.leader ? (
                    <line
                        x1={item.tipX}
                        y1={item.tipY}
                        x2={item.labelX}
                        y2={item.labelY}
                        stroke={arrowColor}
                        strokeWidth="0.22"
                        opacity="0.65"
                    />
                ) : null}
                <text
                    className="biplot-label"
                    x={item.labelX}
                    y={item.labelY}
                    fontSize="3.2"
                    fill={arrowColor}
                    textAnchor={item.labelX >= item.tipX ? "start" : "end"}
                    dominantBaseline="middle"
                >
                  {item.name}
                </text>
              </g>
          );
        })}
        {title ? (
            <text
                className="biplot-caption"
                x={originX}
                y="96.5"
                fontSize="3.6"
                fill={LABEL}
                textAnchor="middle"
                fontWeight="700"
            >
              {title}
            </text>
        ) : null}
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

function EigenScatter({ chart }: { chart: Extract<ChartPayload, { type: "eigen_scatter" }> }) {
  const [xMin, xMax] = chart.xDomain;
  const [yMin, yMax] = chart.yDomain;
  const plotBox = { left: 14, right: 4, top: 5, bottom: 13 };
  const { plot, plotW, plotH, dataX, dataY } = buildEigenPlotScales(xMin, xMax, yMin, yMax, plotBox);

  const ellipsePath =
      chart.ellipse.length > 0
          ? chart.ellipse
          .map((point, index) => `${index === 0 ? "M" : "L"} ${dataX(point.x).toFixed(2)} ${dataY(point.y).toFixed(2)}`)
          .join(" ") + " Z"
          : "";

  return (
      <div className="eigen-wrap">
        <div className="eigen-plot">
          <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="eigen-svg" role="img" aria-label={chart.title}>
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
                fill="rgba(0, 0, 0, 0.15)"
                stroke="rgba(245, 245, 240, 0.28)"
                strokeWidth="0.25"
            />

            {chart.yTicks.map((tick) => (
                <g key={`y-grid-${tick}`}>
                  <line x1={plot.left} y1={dataY(tick)} x2={plot.left + plotW} y2={dataY(tick)} stroke={MUTED} strokeWidth="0.2" />
                </g>
            ))}
            {chart.xTicks.map((tick) => (
                <g key={`x-grid-${tick}`}>
                  <line x1={dataX(tick)} y1={plot.top} x2={dataX(tick)} y2={plot.top + plotH} stroke={MUTED} strokeWidth="0.2" />
                </g>
            ))}

            <line x1={plot.left} y1={plot.top + plotH} x2={plot.left + plotW} y2={plot.top + plotH} stroke={AXIS} strokeWidth="0.35" />
            <line x1={plot.left} y1={plot.top} x2={plot.left} y2={plot.top + plotH} stroke={AXIS} strokeWidth="0.35" />

            {chart.xTicks.map((tick) => (
                <g key={`x-tick-${tick}`}>
                  <line x1={dataX(tick)} y1={plot.top + plotH} x2={dataX(tick)} y2={plot.top + plotH + 0.8} stroke={TICK} strokeWidth="0.25" />
                  <text x={dataX(tick)} y={plot.top + plotH + 3.4} fontSize="3.4" fill={TICK} textAnchor="middle">
                    {tick}
                  </text>
                </g>
            ))}
            {chart.yTicks.map((tick) => (
                <g key={`y-tick-${tick}`}>
                  <line x1={plot.left - 0.8} y1={dataY(tick)} x2={plot.left} y2={dataY(tick)} stroke={TICK} strokeWidth="0.25" />
                  <text x={plot.left - 1.6} y={dataY(tick) + 1} fontSize="3.4" fill={TICK} textAnchor="end">
                    {tick}
                  </text>
                </g>
            ))}

            <text x={plot.left + plotW / 2} y={plot.top + plotH + 7.2} fontSize="4" fill={LABEL} textAnchor="middle" fontWeight="600">
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
                <circle key={`${point.x}-${point.y}-${index}`} cx={dataX(point.x)} cy={dataY(point.y)} r="0.45" fill={ACCENT} opacity="0.35" />
            ))}

            <circle cx={dataX(chart.mean.x)} cy={dataY(chart.mean.y)} r="0.75" fill="#fbbf24" />
            <text x={dataX(chart.mean.x) + 1.2} y={dataY(chart.mean.y) - 1.2} fontSize="3.1" {...EIGEN_LABEL}>
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
                      fontSize="3.2"
                      fill={index === 0 ? "#dbeafe" : "#fde68a"}
                      stroke="#143d31"
                      strokeWidth={0.22}
                      fontWeight={700}
                      paintOrder="stroke"
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
            <span>정보량 비율</span>
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

function MathExpression({ text }: { text: string }) {
  const parts = text.split(/(√[A-Za-z₀₁₂₃₄₅₆₇₈₉ᵀ]+)/g);
  return (
      <span className="math-expr">
      {parts.map((part, index) => {
        if (!part.startsWith("√")) {
          return <span key={`${part}-${index}`}>{part}</span>;
        }
        const radicand = part.slice(1);
        return (
            <span key={`${part}-${index}`} className="math-sqrt math-sqrt-inline">
            <span className="math-sqrt-sign" aria-hidden="true">
              √
            </span>
            <span className="math-sqrt-radicand">
              <MathRadicand text={radicand} />
            </span>
          </span>
        );
      })}
    </span>
  );
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
            <MathExpression text={formula.expression} />
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

function hasFormulaContent(formula: MathFormula): boolean {
  return Boolean(
      formula.radicand?.trim() ||
      formula.expression?.trim() ||
      (formula.numerator?.trim() && formula.denominator?.trim()),
  );
}

function TableFootnoteBlock({ footnote }: { footnote: TableFootnote }) {
  return (
      <div className="table-footnote table-footnote-block">
        <p className="table-footnote-title">{footnote.title}</p>
        {hasFormulaContent(footnote.formula) ? (
            <MathFormulaView formula={footnote.formula} />
        ) : footnote.formula.note ? (
            <p className="math-note">{footnote.formula.note}</p>
        ) : null}
        {footnote.extraFormulas && footnote.extraFormulas.length > 0 ? (
            <div className="math-formula-row-group">
              {footnote.extraFormulas.map((item, index) =>
                  hasFormulaContent(item) ? (
                      <MathFormulaView key={`${item.symbol}-${index}`} formula={item} />
                  ) : null,
              )}
            </div>
        ) : null}
        {footnote.steps.length > 0 ? (
            <ol className="table-footnote-steps">
              {footnote.steps.map((step) => (
                  <li key={step}>{step}</li>
              ))}
            </ol>
        ) : null}
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
  const maxAbs = scale === "correlation" ? 1 : Math.max(...values.flat().map((value) => Math.abs(value)), 0.001);
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
                      <td key={colLabel} style={{ background: heatmapColor(value, maxAbs), color: "#f8fafc" }}>
                        {value.toFixed(digits)}
                      </td>
                  );
                })}
              </tr>
          ))}
          </tbody>
        </table>
        <p className="heatmap-legend">{scale === "correlation" ? "파랑 −1 · 빨강 +1" : "파랑 음수 · 빨강 양수"}</p>
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

function MatrixGrid({
                      label,
                      rowLabels,
                      colLabels,
                      values,
                      diagonal,
                      isDiagonal,
                    }: {
  label: string;
  rowLabels: string[];
  colLabels: string[];
  values?: string[][];
  diagonal?: string[];
  isDiagonal?: boolean;
}) {
  const k = colLabels.length;

  if (isDiagonal && diagonal) {
    return (
        <div className="matrix-block">
          <p className="matrix-label">{label}</p>
          <div className="matrix-bracket-wrap">
            <span className="matrix-bracket matrix-bracket-left">[</span>
            <table className="matrix-inner matrix-diag-table">
              <tbody>
              {Array.from({ length: k }).map((_, r) => (
                  <tr key={r}>
                    {Array.from({ length: k }).map((_, c) => (
                        <td key={c} className={r === c ? "matrix-cell matrix-diag" : "matrix-cell matrix-zero"}>
                          {r === c ? diagonal[r] : "·"}
                        </td>
                    ))}
                  </tr>
              ))}
              </tbody>
            </table>
            <span className="matrix-bracket matrix-bracket-right">]</span>
          </div>
        </div>
    );
  }

  return (
      <div className="matrix-block">
        <p className="matrix-label">{label}</p>
        <div className="matrix-bracket-wrap">
          <span className="matrix-bracket matrix-bracket-left">[</span>
          <table className="matrix-inner">
            <tbody>
            {rowLabels.map((rl, r) => (
                <tr key={rl}>
                  {colLabels.map((_, c) => {
                    const val = values?.[r]?.[c] ?? "—";
                    return (
                        <td key={c} className="matrix-cell">
                          {val}
                        </td>
                    );
                  })}
                </tr>
            ))}
            </tbody>
          </table>
          <span className="matrix-bracket matrix-bracket-right">]</span>
        </div>
      </div>
  );
}

function MatrixValueTable({
                          rowLabels,
                          colLabels,
                          values,
                          cellClass,
                        }: {
  rowLabels: string[];
  colLabels: string[];
  values: string[][];
  cellClass?: (row: number, col: number) => string;
}) {
  const showHeaders = colLabels.length > 0;

  return (
      <table className="matrix-inner">
        {showHeaders ? (
            <thead>
            <tr>
              <th className="matrix-corner" />
              {colLabels.map((label) => (
                  <th key={label} className="matrix-col-head">
                    {label}
                  </th>
              ))}
            </tr>
            </thead>
        ) : null}
        <tbody>
        {rowLabels.map((rowLabel, row) => (
            <tr key={rowLabel}>
              {showHeaders ? <th className="matrix-row-head">{rowLabel}</th> : null}
              {colLabels.map((_, col) => (
                  <td key={col} className={cellClass?.(row, col) ?? "matrix-cell"}>
                    {values[row]?.[col] ?? "—"}
                  </td>
              ))}
            </tr>
        ))}
        </tbody>
      </table>
  );
}

function MatrixProductView({ chart }: { chart: Extract<ChartPayload, { type: "matrix_product" }> }) {
  const { outerRef, innerRef } = useMatrixFitScale([chart]);
  const highlightSet = new Set(
    (chart.result.highlight_cells ?? []).map(([row, col]) => `${row}-${col}`),
  );
  const matchAll = highlightSet.size === 0 && chart.variant !== "center";

  return (
      <div className="matrix-pair-wrap">
        <h3 className="matrix-pair-title">{chart.title}</h3>
        <div ref={outerRef} className="matrix-fit-outer">
          <div ref={innerRef} className="matrix-fit-inner">
            <div className="matrix-product-row">
              {chart.matrices.map((m, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && chart.operators?.[idx - 1] ? (
                        <span className="matrix-eq-sign">{chart.operators[idx - 1]}</span>
                    ) : null}
                    {m.is_diagonal && m.diagonal ? (
                        <div className="matrix-block">
                          <p className="matrix-label">{m.label}</p>
                          <div className="matrix-bracket-wrap">
                            <span className="matrix-bracket matrix-bracket-left">[</span>
                            <table className="matrix-inner">
                              <tbody>
                              {Array.from({ length: m.size ?? m.diagonal.length }).map((_, r) => (
                                  <tr key={r}>
                                    {Array.from({ length: m.size ?? m.diagonal.length }).map((_, c) => (
                                        <td key={c} className={r === c ? "matrix-cell matrix-diag" : "matrix-cell matrix-zero"}>
                                          {r === c ? m.diagonal![r] : "·"}
                                        </td>
                                    ))}
                                  </tr>
                              ))}
                              </tbody>
                            </table>
                            <span className="matrix-bracket matrix-bracket-right">]</span>
                          </div>
                        </div>
                    ) : (
                        <div className="matrix-block">
                          <p className="matrix-label">{m.label}</p>
                          <div className="matrix-bracket-wrap">
                            <span className="matrix-bracket matrix-bracket-left">[</span>
                            <MatrixValueTable
                                rowLabels={m.row_labels ?? []}
                                colLabels={m.col_labels ?? []}
                                values={m.values ?? []}
                            />
                            <span className="matrix-bracket matrix-bracket-right">]</span>
                          </div>
                        </div>
                    )}
                  </React.Fragment>
              ))}
              <span className="matrix-eq-sign">=</span>
              <div className="matrix-block matrix-block-result">
                <p className="matrix-label">{chart.result.label}</p>
                <div className="matrix-bracket-wrap">
                  <span className="matrix-bracket matrix-bracket-left">[</span>
                  <MatrixValueTable
                      rowLabels={chart.result.row_labels}
                      colLabels={chart.result.col_labels}
                      values={chart.result.values}
                      cellClass={(row, col) =>
                          highlightSet.has(`${row}-${col}`)
                            ? "matrix-cell matrix-predict"
                            : matchAll
                              ? "matrix-cell matrix-match"
                              : "matrix-cell"
                      }
                  />
                  <span className="matrix-bracket matrix-bracket-right">]</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {chart.footnote ? <p className="matrix-footnote">{chart.footnote}</p> : null}
      </div>
  );
}

function MatrixSimple({
                        label,
                        rowLabels,
                        colLabels,
                        values,
                        highlightEqual,
                        compareValues,
                      }: {
  label: string;
  rowLabels: string[];
  colLabels: string[];
  values: string[][];
  highlightEqual?: boolean;
  compareValues?: string[][];
}) {
  return (
      <div className="matrix-block">
        <p className="matrix-label">{label}</p>
        <div className="matrix-bracket-wrap">
          <span className="matrix-bracket matrix-bracket-left">[</span>
          <table className="matrix-inner">
            <thead>
            <tr>
              <th className="matrix-corner" />
              {colLabels.map((c) => (
                  <th key={c} className="matrix-col-head">
                    {c}
                  </th>
              ))}
            </tr>
            </thead>
            <tbody>
            {rowLabels.map((rl, r) => (
                <tr key={rl}>
                  <th className="matrix-row-head">{rl}</th>
                  {colLabels.map((_, c) => {
                    const val = values[r]?.[c] ?? "—";
                    const cmpVal = compareValues?.[r]?.[c];
                    const isMatch = highlightEqual && cmpVal !== undefined && val === cmpVal;
                    return (
                        <td key={c} className={isMatch ? "matrix-cell matrix-match" : "matrix-cell"}>
                          {val}
                        </td>
                    );
                  })}
                </tr>
            ))}
            </tbody>
          </table>
          <span className="matrix-bracket matrix-bracket-right">]</span>
        </div>
      </div>
  );
}

function MatrixEquationView({ chart }: { chart: Extract<ChartPayload, { type: "matrix_equation" }> }) {
  return (
      <div className="matrix-equation-wrap">
        <h3 className="matrix-pair-title">{chart.title}</h3>
        <div className="matrix-equation-row">
          <MatrixSimple
              label={chart.original.label}
              rowLabels={chart.original.row_labels}
              colLabels={chart.original.col_labels}
              values={chart.original.values}
              highlightEqual
              compareValues={chart.reconstructed.values}
          />
          <span className="matrix-eq-sign">=</span>
          <MatrixSimple
              label={chart.reconstructed.label}
              rowLabels={chart.reconstructed.row_labels}
              colLabels={chart.reconstructed.col_labels}
              values={chart.reconstructed.values}
              highlightEqual
              compareValues={chart.original.values}
          />
        </div>
        {chart.footnote ? <p className="matrix-footnote">{chart.footnote}</p> : null}
      </div>
  );
}

function MatrixPairView({ chart }: { chart: Extract<ChartPayload, { type: "matrix_pair" }> }) {
  const { outerRef, innerRef } = useMatrixFitScale([chart]);

  return (
      <div className="matrix-pair-wrap">
        <h3 className="matrix-pair-title">{chart.title}</h3>
        <div ref={outerRef} className="matrix-fit-outer matrix-pair-fit-outer">
          <div ref={innerRef} className="matrix-fit-inner">
            <div className="matrix-pair-row">
              <MatrixGrid
                  label={chart.left.label}
                  rowLabels={chart.left.row_labels}
                  colLabels={chart.left.col_labels}
                  diagonal={chart.left.diagonal}
                  isDiagonal={chart.left.is_diagonal}
                  values={chart.left.values}
              />
              <MatrixGrid
                  label={chart.right.label}
                  rowLabels={chart.right.row_labels}
                  colLabels={chart.right.col_labels}
                  diagonal={chart.right.diagonal}
                  isDiagonal={chart.right.is_diagonal}
                  values={chart.right.values}
              />
            </div>
          </div>
        </div>
        {chart.footnote ? <p className="matrix-footnote">{chart.footnote}</p> : null}
      </div>
  );
}

function fmtNet(value: number) {
  return Number(value).toFixed(2);
}

function MfNetworkDiagram({ chart }: { chart: Extract<ChartPayload, { type: "mf_network" }> }) {
  const n = chart.dims.length;
  const gap = 50;
  const embedX0 = 108;
  const weightX0 = 328;
  const termX0 = 558;
  const movieY = 78;
  const userY = 198;
  const midY = 138;
  const sumX = 792;
  const outX = 948;
  const movieFill = "rgba(147, 197, 253, 0.28)";
  const userFill = "rgba(110, 231, 183, 0.28)";
  const termFill = "rgba(253, 230, 138, 0.28)";
  const outStroke = "rgba(245, 245, 240, 0.35)";
  const backYMovie = 34;
  const backYUser = 248;
  const xs = (start: number) => Array.from({ length: n }, (_, i) => start + i * gap);
  const embedXs = xs(embedX0);
  const weightXs = xs(weightX0);
  const termXs = xs(termX0);

  return (
    <div className="mf-net-wrap">
      <svg viewBox="0 0 1120 310" className="mf-net-svg" role="img" aria-label={chart.title}>
        <defs>
          <marker id="mf-net-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <polygon points="0 0, 7 3.5, 0 7" fill="rgba(245,245,240,0.75)" />
          </marker>
          <marker id="mf-net-back-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <polygon points="0 0, 7 3.5, 0 7" fill="#fb7185" />
          </marker>
        </defs>

        <text x="18" y="18" className="mf-net-layer">임베딩</text>
        <text x="328" y="18" className="mf-net-layer">× W</text>
        <text x="558" y="18" className="mf-net-layer">항별 곱</text>
        <text x="768" y="18" className="mf-net-layer">내적</text>
        <text x="900" y="18" className="mf-net-layer">손실 · 역전파</text>
        <text x="18" y="32" className="mf-net-fwd-label">순전파 →</text>

        <text x="6" y={movieY + 4} className="mf-net-branch mf-net-branch-movie">{chart.movie.name}</text>
        <text x="6" y={userY + 4} className="mf-net-branch mf-net-branch-user">{chart.user.name}</text>

        {chart.dims.map((dim, i) => (
          <g key={`emb-m-${dim}`}>
            <text x={embedXs[i]} y={movieY - 22} textAnchor="middle" className="mf-net-dim">{dim}</text>
            <circle cx={embedXs[i]} cy={movieY} r="17" fill={movieFill} stroke={outStroke} />
            <text x={embedXs[i]} y={movieY + 4} textAnchor="middle" className="mf-net-val">{fmtNet(chart.movie.embedding[i])}</text>
          </g>
        ))}
        {chart.dims.map((dim, i) => (
          <g key={`emb-u-${dim}`}>
            <text x={embedXs[i]} y={userY - 22} textAnchor="middle" className="mf-net-dim">{dim}</text>
            <circle cx={embedXs[i]} cy={userY} r="17" fill={userFill} stroke={outStroke} />
            <text x={embedXs[i]} y={userY + 4} textAnchor="middle" className="mf-net-val">{fmtNet(chart.user.embedding[i])}</text>
          </g>
        ))}

        {chart.dims.map((dim, i) => (
          <g key={`w-${dim}`}>
            <line x1={embedXs[i] + 17} y1={movieY} x2={weightXs[i] - 17} y2={movieY} className="mf-net-edge" markerEnd="url(#mf-net-arrow)" />
            <text x={(embedXs[i] + weightXs[i]) / 2} y={movieY - 8} textAnchor="middle" className="mf-net-w">
              ×{fmtNet(chart.movie.weights[i])}
            </text>
            <circle cx={weightXs[i]} cy={movieY} r="17" fill={movieFill} stroke={outStroke} />
            <text x={weightXs[i]} y={movieY + 4} textAnchor="middle" className="mf-net-val">{fmtNet(chart.movie.weighted[i])}</text>
            <line x1={embedXs[i] + 17} y1={userY} x2={weightXs[i] - 17} y2={userY} className="mf-net-edge" markerEnd="url(#mf-net-arrow)" />
            <text x={(embedXs[i] + weightXs[i]) / 2} y={userY - 8} textAnchor="middle" className="mf-net-w">
              ×{fmtNet(chart.user.weights[i])}
            </text>
            <circle cx={weightXs[i]} cy={userY} r="17" fill={userFill} stroke={outStroke} />
            <text x={weightXs[i]} y={userY + 4} textAnchor="middle" className="mf-net-val">{fmtNet(chart.user.weighted[i])}</text>
          </g>
        ))}

        {chart.dims.map((dim, i) => (
          <g key={`term-${dim}`}>
            <line x1={weightXs[i] + 17} y1={movieY} x2={termXs[i]} y2={midY - 17} className="mf-net-edge" markerEnd="url(#mf-net-arrow)" />
            <line x1={weightXs[i] + 17} y1={userY} x2={termXs[i]} y2={midY + 17} className="mf-net-edge" markerEnd="url(#mf-net-arrow)" />
            <circle cx={termXs[i]} cy={midY} r="17" fill={termFill} stroke={outStroke} />
            <text x={termXs[i]} y={midY + 4} textAnchor="middle" className="mf-net-val">{fmtNet(chart.terms[i])}</text>
          </g>
        ))}

        {termXs.map((x) => (
          <line key={`to-sum-${x}`} x1={x + 17} y1={midY} x2={sumX - 22} y2={midY} className="mf-net-edge" />
        ))}
        <circle cx={sumX} cy={midY} r="24" fill="rgba(253, 230, 138, 0.4)" stroke={ACCENT} />
        <text x={sumX} y={midY - 4} textAnchor="middle" className="mf-net-sum-label">Σ 내적</text>
        <text x={sumX} y={midY + 14} textAnchor="middle" className="mf-net-val">{fmtNet(chart.predicted)}</text>

        <line x1={sumX + 24} y1={midY} x2={outX - 64} y2={58} className="mf-net-edge" markerEnd="url(#mf-net-arrow)" />
        <line x1={sumX + 24} y1={midY} x2={outX - 64} y2={108} className="mf-net-edge" markerEnd="url(#mf-net-arrow)" />
        <line x1={sumX + 24} y1={midY} x2={outX - 64} y2={158} className="mf-net-edge" markerEnd="url(#mf-net-arrow)" />
        <line x1={sumX + 24} y1={midY} x2={outX - 64} y2={214} className="mf-net-edge" markerEnd="url(#mf-net-arrow)" />

        <rect x={outX - 60} y={40} width="128" height="32" rx="6" fill="rgba(0,0,0,0.18)" stroke={outStroke} />
        <text x={outX + 4} y={60} textAnchor="middle" className="mf-net-out">예측 R̂  {fmtNet(chart.predicted)}</text>
        <rect x={outX - 60} y={90} width="128" height="32" rx="6" fill="rgba(0,0,0,0.18)" stroke={outStroke} />
        <text x={outX + 4} y={110} textAnchor="middle" className="mf-net-out">실제 R  {fmtNet(chart.actual)}</text>
        <rect x={outX - 60} y={140} width="128" height="34" rx="6" fill="rgba(110, 231, 183, 0.22)" stroke="#6ee7b7" />
        <text x={outX + 4} y={161} textAnchor="middle" className="mf-net-out-error">오차 e={fmtNet(chart.error)}</text>
        <rect x={outX - 60} y={196} width="128" height="36" rx="6" fill="rgba(251, 113, 133, 0.22)" stroke="#fb7185" />
        <text x={outX + 4} y={218} textAnchor="middle" className="mf-net-out-error">L=(R−R̂)²  {fmtNet(chart.loss)}</text>

        <path
          d={`M ${outX - 60} 214 H ${sumX + 28} V ${backYMovie} H ${weightXs[n - 1]}`}
          className="mf-net-back"
        />
        <text x={(sumX + outX) / 2} y={backYMovie - 6} textAnchor="middle" className="mf-net-back-label">
          역전파  ∂L/∂R̂ = {fmtNet(chart.dL_dPred)}
        </text>

        {weightXs.map((x, i) => (
          <g key={`back-m-${chart.dims[i]}`}>
            <line x1={x} y1={backYMovie} x2={x} y2={movieY - 17} className="mf-net-back" markerEnd="url(#mf-net-back-arrow)" />
            <text x={x} y={movieY + 32} textAnchor="middle" className="mf-net-back-w">
              ∂L/∂W {fmtNet(chart.dL_dW_movie[i])}
            </text>
          </g>
        ))}

        <path
          d={`M ${outX - 60} 214 H ${sumX + 28} V ${backYUser} H ${weightXs[n - 1]}`}
          className="mf-net-back"
        />
        {weightXs.map((x, i) => (
          <g key={`back-u-${chart.dims[i]}`}>
            <line x1={x} y1={backYUser} x2={x} y2={userY + 17} className="mf-net-back" markerEnd="url(#mf-net-back-arrow)" />
            <text x={x} y={userY + 36} textAnchor="middle" className="mf-net-back-w">
              ∂L/∂W {fmtNet(chart.dL_dW_user[i])}
            </text>
          </g>
        ))}

        {termXs.map((x) => (
          <line key={`back-term-${x}`} x1={sumX - 24} y1={midY} x2={x + 17} y2={midY} className="mf-net-back" markerEnd="url(#mf-net-back-arrow)" />
        ))}

        <text x="18" y="292" className="mf-net-legend-fwd">실선 화살표 : 순전파 (임베딩 → ×W → 내적 → 예측)</text>
        <text x="560" y="292" className="mf-net-legend-back">점선 화살표 : 역전파 미분 (손실 L → W 갱신)</text>
      </svg>
    </div>
  );
}

function TfNetworkDiagram({ chart }: { chart: Extract<ChartPayload, { type: "tf_network" }> }) {
  const n = chart.dims.length;
  const gap = 52;
  const embedX0 = 124;
  const weightX0 = 354;
  const scoreX = 632;
  const attnX = 790;
  const valueX = 900;
  const queryY = 66;
  const keyYs = [142, 214, 286];
  const queryFill = "rgba(147, 197, 253, 0.28)";
  const keyFill = "rgba(110, 231, 183, 0.28)";
  const valueFill = "rgba(253, 230, 138, 0.28)";
  const outStroke = "rgba(245, 245, 240, 0.35)";
  const backY = 356;
  const xs = (start: number) => Array.from({ length: n }, (_, i) => start + i * gap);
  const embedXs = xs(embedX0);
  const weightXs = xs(weightX0);

  return (
    <div className="mf-net-wrap">
      <svg viewBox="0 0 1120 405" className="mf-net-svg" role="img" aria-label={chart.title}>
        <defs>
          <marker id="tf-net-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <polygon points="0 0, 7 3.5, 0 7" fill="rgba(245,245,240,0.75)" />
          </marker>
          <marker id="tf-net-back-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <polygon points="0 0, 7 3.5, 0 7" fill="#fb7185" />
          </marker>
        </defs>

        <text x="16" y="18" className="mf-net-layer">Query (홍길동)</text>
        <text x="16" y="94" className="mf-net-layer">Key / Value (이순신 · 장보고 · 허준)</text>
        <text x="16" y="32" className="mf-net-fwd-label">순전파 →</text>
        <text x={embedX0} y="18" className="mf-net-layer">임베딩</text>
        <text x={weightX0} y="18" className="mf-net-layer">× W</text>
        <text x={scoreX - 26} y="18" className="mf-net-layer">Q·K</text>
        <text x={attnX - 38} y="18" className="mf-net-layer">softmax</text>
        <text x={valueX - 60} y="18" className="mf-net-layer">Value · 기댓값</text>

        <text x="12" y={queryY + 4} className="mf-net-branch mf-net-branch-movie">{chart.query.name}</text>
        {chart.dims.map((dim, i) => (
          <g key={`tf-q-${dim}`}>
            <text x={embedXs[i]} y={queryY - 22} textAnchor="middle" className="mf-net-dim">{dim}</text>
            <circle cx={embedXs[i]} cy={queryY} r="17" fill={queryFill} stroke={outStroke} />
            <text x={embedXs[i]} y={queryY + 4} textAnchor="middle" className="mf-net-val">{fmtNet(chart.query.embedding[i])}</text>
            <line x1={embedXs[i] + 17} y1={queryY} x2={weightXs[i] - 17} y2={queryY} className="mf-net-edge" markerEnd="url(#tf-net-arrow)" />
            <text x={(embedXs[i] + weightXs[i]) / 2} y={queryY - 8} textAnchor="middle" className="mf-net-w">
              ×{fmtNet(chart.query.weights[i])}
            </text>
            <circle cx={weightXs[i]} cy={queryY} r="17" fill={queryFill} stroke={outStroke} />
            <text x={weightXs[i]} y={queryY + 4} textAnchor="middle" className="mf-net-val">{fmtNet(chart.query.weighted[i])}</text>
          </g>
        ))}

        {chart.keys.map((item, rowIdx) => (
          <g key={item.name}>
            <text x="12" y={keyYs[rowIdx] + 4} className="mf-net-branch mf-net-branch-user">{item.name}</text>
            {chart.dims.map((dim, i) => (
              <g key={`${item.name}-${dim}`}>
                <circle cx={embedXs[i]} cy={keyYs[rowIdx]} r="17" fill={keyFill} stroke={outStroke} />
                <text x={embedXs[i]} y={keyYs[rowIdx] + 4} textAnchor="middle" className="mf-net-val">{fmtNet(item.embedding[i])}</text>
                <line x1={embedXs[i] + 17} y1={keyYs[rowIdx]} x2={weightXs[i] - 17} y2={keyYs[rowIdx]} className="mf-net-edge" markerEnd="url(#tf-net-arrow)" />
                <text x={(embedXs[i] + weightXs[i]) / 2} y={keyYs[rowIdx] - 8} textAnchor="middle" className="mf-net-w">
                  ×{fmtNet(item.weights[i])}
                </text>
                <circle cx={weightXs[i]} cy={keyYs[rowIdx]} r="17" fill={keyFill} stroke={outStroke} />
                <text x={weightXs[i]} y={keyYs[rowIdx] + 4} textAnchor="middle" className="mf-net-val">{fmtNet(item.weighted[i])}</text>
              </g>
            ))}
            <line x1={weightXs[n - 1] + 24} y1={queryY} x2={scoreX - 22} y2={keyYs[rowIdx] - 10} className="mf-net-edge" markerEnd="url(#tf-net-arrow)" />
            <line x1={weightXs[n - 1] + 24} y1={keyYs[rowIdx]} x2={scoreX - 22} y2={keyYs[rowIdx] + 10} className="mf-net-edge" markerEnd="url(#tf-net-arrow)" />
            <rect x={scoreX - 18} y={keyYs[rowIdx] - 18} width="84" height="36" rx="8" fill="rgba(0,0,0,0.18)" stroke={outStroke} />
            <text x={scoreX + 24} y={keyYs[rowIdx] - 2} textAnchor="middle" className="mf-net-sum-label">Q·K</text>
            <text x={scoreX + 24} y={keyYs[rowIdx] + 13} textAnchor="middle" className="mf-net-val">{fmtNet(item.score)}</text>
            <line x1={scoreX + 66} y1={keyYs[rowIdx]} x2={attnX - 24} y2={keyYs[rowIdx]} className="mf-net-edge" markerEnd="url(#tf-net-arrow)" />
            <rect x={attnX - 18} y={keyYs[rowIdx] - 18} width="88" height="36" rx="8" fill="rgba(147, 197, 253, 0.2)" stroke="#93c5fd" />
            <text x={attnX + 28} y={keyYs[rowIdx] - 2} textAnchor="middle" className="mf-net-sum-label">α</text>
            <text x={attnX + 28} y={keyYs[rowIdx] + 13} textAnchor="middle" className="mf-net-val">{item.attention.toFixed(3)}</text>
            <line x1={attnX + 70} y1={keyYs[rowIdx]} x2={valueX - 26} y2={keyYs[rowIdx]} className="mf-net-edge" markerEnd="url(#tf-net-arrow)" />
            <rect x={valueX - 22} y={keyYs[rowIdx] - 18} width="108" height="36" rx="8" fill={valueFill} stroke={ACCENT} />
            <text x={valueX + 32} y={keyYs[rowIdx] - 2} textAnchor="middle" className="mf-net-sum-label">V {fmtNet(item.value)}</text>
            <text x={valueX + 32} y={keyYs[rowIdx] + 13} textAnchor="middle" className="mf-net-val">α×V {item.weightedValue.toFixed(3)}</text>
          </g>
        ))}

        <line x1={valueX + 86} y1={keyYs[0]} x2={valueX + 126} y2={176} className="mf-net-edge" />
        <line x1={valueX + 86} y1={keyYs[1]} x2={valueX + 126} y2={176} className="mf-net-edge" />
        <line x1={valueX + 86} y1={keyYs[2]} x2={valueX + 126} y2={176} className="mf-net-edge" />
        <circle cx={valueX + 154} cy={176} r="24" fill="rgba(253, 230, 138, 0.35)" stroke={ACCENT} />
        <text x={valueX + 154} y={170} textAnchor="middle" className="mf-net-sum-label">Σ αV</text>
        <text x={valueX + 154} y={186} textAnchor="middle" className="mf-net-val">{chart.predicted.toFixed(3)}</text>
        <rect x={852} y={320} width="148" height="54" rx="8" fill="rgba(251, 113, 133, 0.18)" stroke="#fb7185" />
        <text x={926} y={342} textAnchor="middle" className="mf-net-out-error">홍길동 영화 E 예측</text>
        <text x={926} y={362} textAnchor="middle" className="mf-net-out">{chart.predicted.toFixed(3)}</text>

        <path d={`M 852 374 H 760 V ${backY} H ${weightXs[0] - 18}`} className="mf-net-back" />
        <text x="726" y={backY - 8} textAnchor="middle" className="mf-net-back-label">
          역전파 : Loss → W_q · W_k · W_v 갱신
        </text>

        {weightXs.map((x, i) => (
          <g key={`tf-back-q-${chart.dims[i]}`}>
            <line x1={x} y1={backY} x2={x} y2={queryY + 18} className="mf-net-back" markerEnd="url(#tf-net-back-arrow)" />
            <text x={x} y={queryY + 36} textAnchor="middle" className="mf-net-back-w">
              Wq
            </text>
          </g>
        ))}

        {chart.keys.map((item, rowIdx) => (
          <g key={`tf-back-${item.name}`}>
            <line x1={weightXs[n - 1] + 26} y1={backY} x2={weightXs[n - 1] + 56} y2={backY} className="mf-net-back" />
            {weightXs.map((x, i) => (
              <line
                key={`tf-back-k-${item.name}-${chart.dims[i]}`}
                x1={x}
                y1={backY}
                x2={x}
                y2={keyYs[rowIdx] + 18}
                className="mf-net-back"
                markerEnd="url(#tf-net-back-arrow)"
              />
            ))}
            <text x={weightXs[n - 1] + 52} y={keyYs[rowIdx] + 34} textAnchor="start" className="mf-net-back-w">
              {item.name} : Wk / Wv
            </text>
          </g>
        ))}
        <text x="18" y="394" className="mf-net-legend-fwd">실선 화살표 : Query → Key → softmax → Value → 기댓값</text>
        <text x="640" y="394" className="mf-net-legend-back">점선 화살표 : Loss → Query · Key · Value 가중치 갱신</text>
      </svg>
    </div>
  );
}

function DistributionLineChart({
  chart,
}: {
  chart: Extract<ChartPayload, { type: "distribution_line" }>;
}) {
  const yDomain = chart.variant === "pdf" ? [0, 0.45] : [0, 1];
  const stroke = chart.variant === "pdf" ? ACCENT : ACCENT_2;

  return (
      <div className="distribution-wrap">
        {chart.caption ? <p className="distribution-caption">{chart.caption}</p> : null}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chart.points} margin={{ top: 8, right: 16, bottom: 28, left: 4 }}>
            <CartesianGrid stroke={MUTED} />
            <XAxis
                type="number"
                dataKey="x"
                domain={[-4, 4]}
                tick={{ fill: TICK, fontSize: 12 }}
                label={{ value: chart.xLabel, position: "insideBottom", offset: -6, fill: LABEL, fontSize: 12 }}
            />
            <YAxis
                domain={yDomain}
                tick={{ fill: TICK, fontSize: 12 }}
                label={{ value: chart.yLabel, angle: -90, position: "insideLeft", fill: LABEL, fontSize: 12 }}
            />
            <Tooltip
                contentStyle={TOOLTIP}
                formatter={(value) => [Number(value).toFixed(4), chart.yLabel]}
                labelFormatter={(label) => `${chart.xLabel} = ${label}`}
            />
            <Line
                type="monotone"
                dataKey="y"
                stroke={stroke}
                strokeWidth={2.2}
                dot={false}
                isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
  );
}

export default function ChartView({ chart }: { chart: ChartPayload }) {
  if (chart.type === "none") {
    return null;
  }

  if (chart.type === "distribution_line") {
    return <DistributionLineChart chart={chart} />;
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
            <YAxis tick={{ fill: TICK }} label={{ value: chart.yLabel, angle: -90, position: "insideLeft", fill: LABEL }} />
            <Tooltip contentStyle={TOOLTIP} formatter={(value) => [`${value ?? 0}`, chart.yLabel]} />
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
            <Tooltip contentStyle={TOOLTIP} />
            {chart.series.map((series, index) => (
                <Bar key={series.key} dataKey={series.key} name={series.name} fill={index === 0 ? ACCENT : ACCENT_2} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
    );
  }

  if (chart.type === "eigen_scatter") {
    return <EigenScatter chart={chart} />;
  }

  if (chart.type === "heatmap") {
    return <HeatmapChart labels={chart.labels} values={chart.values} scale={chart.scale} footnote={chart.footnote} />;
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
              {chart.rows.map((row, index) => {
                const isSummary = chart.summary_rows?.includes(index);
                return (
                  <tr key={index} className={isSummary ? "table-summary-row" : undefined}>
                    {row.map((cell, cellIndex) => {
                      const highlighted = (chart.highlight_cells ?? []).some(
                        ([rowIdx, colIdx]) => rowIdx === index && colIdx === cellIndex,
                      );
                      return (
                        <td
                          key={`${index}-${cellIndex}`}
                          className={highlighted ? "table-predict-cell" : undefined}
                        >
                          {cell ?? ""}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
          {footnoteBlock}
        </div>
    );
  }

  if (chart.type === "bullets") {
    const footnoteBlock =
        chart.footnote && isTableFootnote(chart.footnote) ? (
            <TableFootnoteBlock footnote={chart.footnote} />
        ) : chart.footnote ? (
            <p className="table-footnote">{chart.footnote}</p>
        ) : null;

    if (chart.variant === "intro") {
      return (
          <div className="lecture-points intro-summary">
            {chart.title?.trim() ? <h2 className="intro-summary-title">{chart.title}</h2> : null}
            {chart.items.length > 0 ? (
                <ul className="intro-summary-list">
                  {chart.items.map((item) => (
                      <li key={item}>{item}</li>
                  ))}
                </ul>
            ) : null}
            {footnoteBlock}
            {chart.extraFootnotes?.map((item, index) => (
                <TableFootnoteBlock key={`${item.title}-${index}`} footnote={item} />
            ))}
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

  if (chart.type === "matrix_pair") {
    return <MatrixPairView chart={chart} />;
  }

  if (chart.type === "matrix_product") {
    return <MatrixProductView chart={chart} />;
  }

  if (chart.type === "matrix_equation") {
    return <MatrixEquationView chart={chart} />;
  }

  if (chart.type === "biplot") {
    return (
        <div className="biplot-wrap">
          <Biplot points={chart.points} arrows={chart.arrows} xLabel={chart.xLabel} yLabel={chart.yLabel} title={chart.title} />
        </div>
    );
  }

  if (chart.type === "mf_network") {
    return <MfNetworkDiagram chart={chart} />;
  }

  if (chart.type === "tf_network") {
    return <TfNetworkDiagram chart={chart} />;
  }

  return null;
}