import React, { useEffect, useState } from "react";
import { useT } from "../i18n";
import Chart from "./Chart";

function short(iso) {
  if (iso == null) return "—";
  const s = String(iso).replace("T", " ");
  return s.length >= 19 ? s.slice(0, 19) : s;
}

// Inspection chart for a flagged period + context. In "delete mode" the drag
// becomes a range-select (no zoom clash); the selected range is highlighted and
// the rest dimmed, with editable boundary dates that snap to the nearest real
// timestamp. Confirming deletes those rows entirely (by time, all parameters).
export default function PeriodInspector({ data, busy, param, styles, dateFmt, onDropTime, onClose }) {
  const t = useT();
  const [delMode, setDelMode] = useState(false);
  const [sel, setSel] = useState(null);       // { start, end, startExact, endExact }
  const [draft, setDraft] = useState({ start: "", end: "" });

  useEffect(() => {
    if (sel) setDraft({ start: short(sel.start), end: short(sel.end) });
  }, [sel]);

  if (!data && !busy) return null;
  const band = data?.band ? [{ x0: data.band.x0, x1: data.band.x1, color: "#e0564d" }] : [];

  // Nearest real timestamp in the shown window to a typed/selected time.
  const snap = (val) => {
    const ms = Date.parse(val);
    if (!isFinite(ms) || !data?.x?.length) return null;
    let best = data.x[0], bestD = Infinity;
    for (const xs of data.x) {
      const tt = Date.parse(xs);
      if (!isFinite(tt)) continue;
      const d = Math.abs(tt - ms);
      if (d < bestD) { bestD = d; best = xs; }
    }
    return { value: best, exact: bestD === 0 };
  };

  const onSelectRange = (r) => {
    if (!r) { setSel(null); return; }
    const s = snap(r.x0), e = snap(r.x1);
    if (!s || !e) return;
    let a = s, b = e;
    if (Date.parse(a.value) > Date.parse(b.value)) [a, b] = [b, a];
    setSel({ start: a.value, end: b.value, startExact: a.exact, endExact: b.exact });
  };
  const commit = (which) => {
    const snapped = snap(draft[which]);
    if (!snapped) { setDraft((d) => ({ ...d, [which]: short(sel[which]) })); return; }
    setSel((prev) => {
      const next = { ...prev, [which]: snapped.value, [which + "Exact"]: snapped.exact };
      if (Date.parse(next.start) > Date.parse(next.end)) {
        return { start: next.end, end: next.start,
          startExact: next.endExact, endExact: next.startExact };
      }
      return next;
    });
  };
  const confirmDelete = () => {
    if (sel && onDropTime) onDropTime([sel.start, sel.end]);
    setSel(null);
  };

  const snappedNote = sel && (!sel.startExact || !sel.endExact);

  return (
    <div className="section" style={{ marginTop: 18 }}>
      <div className="inline" style={{ justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
        <div className="section-title" style={{ margin: 0 }}>
          {t("Период с контекстом")}{param ? ` · ${param}` : ""}
          {busy && <>&nbsp;<span className="spinner" /></>}
        </div>
        <div className="btn-row" style={{ alignItems: "center" }}>
          <label className="inline small" title={t("Выделять период мышью для удаления (вместо зума)")}>
            <input type="checkbox" checked={delMode}
              onChange={(e) => { setDelMode(e.target.checked); setSel(null); }} />
            {t("🗑 Режим удаления")}
          </label>
          <button className="ghost small" onClick={onClose}>{t("Скрыть")}</button>
        </div>
      </div>

      {delMode && !sel && (
        <div className="small muted" style={{ marginBottom: 6 }}>
          {t("Зажмите ЛКМ и проведите по графику, чтобы выделить период для удаления.")}
        </div>
      )}

      {sel && (
        <div className="del-bar">
          <span className="small muted">{t("Удалить строки от")}</span>
          <input type="text" className="del-date" value={draft.start}
            onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))}
            onBlur={() => commit("start")}
            onKeyDown={(e) => { if (e.key === "Enter") commit("start"); }} />
          <span className="small muted">{t("до")}</span>
          <input type="text" className="del-date" value={draft.end}
            onChange={(e) => setDraft((d) => ({ ...d, end: e.target.value }))}
            onBlur={() => commit("end")}
            onKeyDown={(e) => { if (e.key === "Enter") commit("end"); }} />
          <button className="danger" onClick={confirmDelete}>🗑 {t("Удалить строки")}</button>
          <button className="ghost small" onClick={() => setSel(null)}>{t("Отмена")}</button>
        </div>
      )}
      {snappedNote && (
        <div className="small muted" style={{ marginBottom: 6, color: "var(--warn)" }}>
          {t("Точной даты/времени нет в данных — взята ближайшая.")}
        </div>
      )}

      <div className="card">
        {data ? (
          <Chart
            key={delMode ? "insp-sel" : "insp-zoom"}
            data={data} styles={styles}
            flags={{ showNan: false, detectZeros: false, showAnnotations: false, alignZero: false }}
            anomalyStyle={{ mode: "dot", color: "#111", size: 5 }}
            rolling={{ enabled: false }} annotations={[]}
            dateFmt={dateFmt}
            highlightBands={band}
            dragMode={delMode ? "select" : "zoom"}
            onRangeSelect={delMode ? onSelectRange : undefined}
            dimRange={sel ? { x0: sel.start, x1: sel.end } : null}
          />
        ) : <div className="small muted" style={{ padding: 20 }}><span className="spinner" /></div>}
      </div>
    </div>
  );
}
