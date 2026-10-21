import React, { useEffect } from "react";
import { useT } from "../i18n";

const UNITS = ["points", "hour", "day", "month", "year"];

function fmt(iso) {
  if (iso == null) return "—";
  const s = String(iso).replace("T", " ");
  return s.length >= 16 ? s.slice(0, 16) : s;
}

// Configure how much context to show on each side of a flagged period, then
// open the inspection chart. Left and right can use different amounts & units.
export default function PeriodShowDialog({ open, period, pad, onPad, onApply, onClose }) {
  const t = useT();
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !period) return null;
  const unitLabel = {
    points: t("точки"), hour: t("часы"), day: t("дни"), month: t("месяцы"), year: t("годы"),
  };
  const setSide = (side, patch) => onPad({ ...pad, [side]: { ...pad[side], ...patch } });
  const unitSel = (side) => (
    <select value={pad[side].unit} onChange={(e) => setSide(side, { unit: e.target.value })} style={{ width: "auto" }}>
      {UNITS.map((u) => <option key={u} value={u}>{unitLabel[u]}</option>)}
    </select>
  );
  const numIn = (side) => (
    <input type="number" min="0" step="1" style={{ width: 70 }} value={pad[side].n}
      onChange={(e) => setSide(side, { n: Math.max(0, Number(e.target.value) || 0) })} />
  );

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 640 }} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>{t("Показать период с контекстом")}</h3>
          <button className="modal-x" onClick={onClose} title={t("Закрыть")}>×</button>
        </div>

        <div className="context-pad">
          <div className="cp-side">
            <span className="small muted">{t("слева")}</span>
            {unitSel("left")}
            {numIn("left")}
          </div>

          <div className="cp-core">
            <div className="small muted">{period.parameter}</div>
            <div className="cp-box">{fmt(period.start)} … {fmt(period.end)}</div>
          </div>

          <div className="cp-side">
            {numIn("right")}
            {unitSel("right")}
            <span className="small muted">{t("справа")}</span>
          </div>
        </div>

        <div className="hint">{t("Укажите, сколько точек/времени добавить по краям периода — ниже откроется график с этим периодом и его окрестностями.")}</div>

        <div className="modal-foot">
          <button className="ghost" onClick={onClose}>{t("Отмена")}</button>
          <button className="primary" onClick={onApply}>{t("✓ Применить")}</button>
        </div>
      </div>
    </div>
  );
}
