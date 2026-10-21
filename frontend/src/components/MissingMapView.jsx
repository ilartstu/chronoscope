import React, { useMemo } from "react";
import createPlotlyComponent from "react-plotly.js/factory";
import Plotly from "plotly.js-dist-min";
import { useT } from "../i18n";
import { niceDateTicks, toNaiveISO, formatDate } from "../lib/dateTicks";

const Plot = createPlotlyComponent(Plotly);

const SCALE = [[0, "#f4f7fb"], [0.0001, "#fde9e7"], [0.5, "#ef8b80"], [1, "#c0392b"]];

export default function MissingMapView({ missing, onGraphDiv, dateFmt }) {
  const t = useT();
  const fmt = dateFmt || { order: "dmy", sep: "/" };
  const { traces, layout } = useMemo(() => {
    if (!missing) return { traces: [], layout: {} };
    const n = missing.columns.length;
    const traces = [{
      type: "heatmap", z: missing.z, x: missing.x, y: missing.columns,
      zmin: 0, zmax: 1, colorscale: SCALE,
      hovertemplate: `%{y}<br>%{x}<br>${t("доля")}: %{z:.0%}<extra></extra>`,
      colorbar: { title: { text: t("доля"), side: "right" }, thickness: 12, tickformat: ".0%" },
    }];
    const xaxis = { type: missing.x_is_time ? "date" : "linear", automargin: true };
    if (missing.x_is_time) {
      let mn = Infinity, mx = -Infinity;
      for (const v of missing.x) {
        const ms = Date.parse(v);
        if (isFinite(ms)) { if (ms < mn) mn = ms; if (ms > mx) mx = ms; }
      }
      if (isFinite(mn) && isFinite(mx)) {
        const ticks = niceDateTicks(mn, mx);
        xaxis.tickmode = "array";
        xaxis.tickvals = ticks.map((ms) => toNaiveISO(ms));
        xaxis.ticktext = ticks.map((ms) => formatDate(ms, fmt.order, fmt.sep));
        xaxis.tickangle = ticks.length > 6 ? -35 : 0;
      }
    }
    const layout = {
      margin: { l: 150, r: 20, t: 10, b: 60 },
      height: Math.max(220, 34 * n + 120),
      xaxis,
      yaxis: { autorange: "reversed", automargin: true },
      paper_bgcolor: "white", plot_bgcolor: "white", uirevision: "missing",
      font: { family: "-apple-system, Segoe UI, Roboto, sans-serif", size: 11, color: "#1c2530" },
    };
    return { traces, layout };
  }, [missing, t, JSON.stringify(fmt)]);

  if (!missing) return null;
  return (
    <div className="card">
      <Plot data={traces} layout={layout} style={{ width: "100%" }} useResizeHandler
        onInitialized={(_f, gd) => onGraphDiv?.(gd)} onUpdate={(_f, gd) => onGraphDiv?.(gd)}
        config={{ responsive: true, displaylogo: false,
          toImageButtonOptions: { format: "png", filename: "missing_map", scale: 2 },
          modeBarButtonsToRemove: ["lasso2d", "select2d"] }} />
      <div className="small muted" style={{ marginTop: 6 }}>
        {t("Каждая строка — колонка, цвет — доля пропусков в интервале времени. Охватывает все колонки файла.")}
      </div>
    </div>
  );
}
