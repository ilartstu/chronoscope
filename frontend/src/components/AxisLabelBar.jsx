import React, { useEffect, useState } from "react";
import { useT } from "../i18n";
import { DATE_ORDERS, SEPARATORS, SAMPLE_MS, formatDate } from "../lib/dateTicks";

// Above-the-chart bar: rename the X / Y axes (defaults pre-filled, ✓ to apply,
// ↺ to restore) and pick the date format for the time axis.
export default function AxisLabelBar({ xDefault, yAxes, labels, onApply, hasTime, dateFmt, onDateFmt }) {
  const t = useT();
  const [xVal, setXVal] = useState("");
  const [yVals, setYVals] = useState({});

  // Seed the inputs from the applied overrides, falling back to the defaults.
  useEffect(() => {
    setXVal((labels && labels.x) || xDefault || "");
    const seed = {};
    (yAxes || []).forEach((a) => { seed[a.num] = (labels && labels.y && labels.y[a.num]) || a.title; });
    setYVals(seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xDefault, JSON.stringify(yAxes), JSON.stringify(labels)]);

  const apply = () => {
    const x = (xVal.trim() && xVal.trim() !== (xDefault || "")) ? xVal.trim() : "";
    const y = {};
    (yAxes || []).forEach((a) => {
      const v = (yVals[a.num] ?? "").trim();
      if (v && v !== a.title) y[a.num] = v;
    });
    onApply({ x, y });
  };
  const reset = () => {
    onApply({ x: "", y: {} });
    onDateFmt({ order: "dmy", sep: "/" });
  };

  return (
    <div className="axis-bar">
      <span className="ab-title">{t("Подписи осей и даты")}</span>

      <label className="inline small">{t("Ось X")}
        <input type="text" value={xVal} placeholder={xDefault || ""}
          onChange={(e) => setXVal(e.target.value)} style={{ width: 150 }} />
      </label>

      {(yAxes || []).map((a) => (
        <label key={a.num} className="inline small">{"Y" + a.num}
          <input type="text" value={yVals[a.num] ?? ""} placeholder={a.title}
            onChange={(e) => setYVals((v) => ({ ...v, [a.num]: e.target.value }))} style={{ width: 150 }} />
        </label>
      ))}

      {hasTime && (
        <>
          <label className="inline small">{t("Формат даты")}
            <select value={dateFmt.order} onChange={(e) => onDateFmt({ ...dateFmt, order: e.target.value })}>
              {DATE_ORDERS.map((o) => (
                <option key={o} value={o}>{formatDate(SAMPLE_MS, o, dateFmt.sep)}</option>
              ))}
            </select>
          </label>
          <label className="inline small">{t("Разделитель")}
            <select value={dateFmt.sep} onChange={(e) => onDateFmt({ ...dateFmt, sep: e.target.value })}>
              {SEPARATORS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </>
      )}

      <button className="small primary" onClick={apply} title={t("Применить подписи")}>{t("✓ Применить")}</button>
      <button className="ghost small" onClick={reset} title={t("Сбросить к значениям по умолчанию")}>↺</button>
    </div>
  );
}
