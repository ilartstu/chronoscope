import React, { useState } from "react";
import { useT, useNum } from "../i18n";

const keyOf = (b) => `${b.parameter}|${b.start_idx}|${b.end_idx}`;

export default function LimitsView({
  data, busy, columns, limits, onLimit, minLen, onMinLen, onShow,
  isDeleted, onToggleDeletion, onBatchDelete, deletionsCount, onExportCleaned, busyExport,
}) {
  const t = useT();
  const nf = useNum();
  const [selected, setSelected] = useState(() => new Set());
  const blocks = data?.blocks || [];
  const allSelected = blocks.length > 0 && blocks.every((b) => selected.has(keyOf(b)));
  const toggleOne = (b) => setSelected((prev) => {
    const n = new Set(prev); const k = keyOf(b); n.has(k) ? n.delete(k) : n.add(k); return n;
  });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(blocks.map(keyOf)));
  const selItems = blocks.filter((b) => selected.has(keyOf(b)));
  const has = (c, f) => (limits[c] && limits[c][f] != null ? limits[c][f] : "");

  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="inline" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
          <div className="section-title" style={{ margin: 0 }}>{t("Допустимые диапазоны (мин / макс на параметр)")}</div>
          <label className="inline small" style={{ flex: "0 0 auto" }}>{t("Мин. длина (подряд ≥)")}
            <input type="number" min="1" step="1" value={minLen} style={{ width: 70 }}
              onChange={(e) => onMinLen(Math.max(1, Number(e.target.value) || 1))} /></label>
        </div>
        <div className="limits-grid">
          {columns.map((c) => (
            <div className="limit-row" key={c}>
              <span className="limit-name" title={c}>{c}</span>
              <input type="number" step="any" className="limit-in" placeholder={t("Мин.")}
                value={has(c, "min")}
                onChange={(e) => onLimit(c, { min: e.target.value })} />
              <input type="number" step="any" className="limit-in" placeholder={t("Макс.")}
                value={has(c, "max")}
                onChange={(e) => onLimit(c, { max: e.target.value })} />
            </div>
          ))}
        </div>
        {busy && <div className="small muted" style={{ marginTop: 6 }}><span className="spinner" /></div>}
      </div>

      <div className="inline" style={{ justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
        <div className="section-title" style={{ margin: 0 }}>
          {t("Найдено периодов: {n}", { n: blocks.length })}
          {data ? t(" · всего строк: {n}", { n: nf(data.total_rows) }) : ""}
        </div>
        <div className="btn-row">
          <span className="small muted" style={{ alignSelf: "center" }}>
            {t("К удалению:")} <b style={{ color: "var(--danger)" }}>{deletionsCount}</b>
          </span>
          <button className="primary" onClick={() => onExportCleaned("csv")} disabled={busyExport || !deletionsCount}>{t("⬇ Очищенные CSV")}</button>
          <button onClick={() => onExportCleaned("xlsx")} disabled={busyExport || !deletionsCount}>{t("⬇ Очищенные Excel")}</button>
        </div>
      </div>

      {selItems.length > 0 && (
        <div className="batch-bar">
          <span>{t("С выбранными ({n}):", { n: selItems.length })}</span>
          <button className="danger" onClick={() => { onBatchDelete(selItems); setSelected(new Set()); }}>{t("🗑 Удалить")}</button>
          <button onClick={() => onShow && onShow(selItems[0])} title={t("Показать период на графике с контекстом")}>👁 {t("Показать")}</button>
        </div>
      )}

      <div className="card" style={{ overflowX: "auto" }}>
        {blocks.length === 0 ? (
          <div className="small muted">{t("Нарушений не найдено. Задайте границы для параметров выше.")}</div>
        ) : (
          <table className="stats blocks-table">
            <thead>
              <tr>
                <th style={{ width: 28 }}><input type="checkbox" checked={allSelected} onChange={toggleAll} title={t("выбрать все")} /></th>
                <th>{t("Параметр")}</th><th>{t("Начало периода")}</th><th>{t("Конец периода")}</th>
                <th>{t("Длина, точек")}</th><th>{t("Ниже мин.")}</th><th>{t("Выше макс.")}</th>
                <th>{t("min периода")}</th><th>{t("max периода")}</th><th></th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((b) => {
                const del = isDeleted(b);
                const sel = selected.has(keyOf(b));
                return (
                  <tr key={keyOf(b)} className={sel ? "row-selected" : ""}
                    style={del ? { opacity: 0.45, textDecoration: "line-through" } : undefined}>
                    <td style={{ textAlign: "center" }}>
                      <input type="checkbox" checked={sel} onChange={() => toggleOne(b)} />
                    </td>
                    <td style={{ textAlign: "left" }}>{b.parameter}</td>
                    <td>{String(b.start)}</td>
                    <td>{String(b.end)}</td>
                    <td>{b.length}</td>
                    <td style={{ color: b.n_below ? "var(--accent)" : "inherit" }}>{b.n_below}</td>
                    <td style={{ color: b.n_above ? "var(--danger)" : "inherit" }}>{b.n_above}</td>
                    <td>{b.min_val ?? "—"}</td>
                    <td>{b.max_val ?? "—"}</td>
                    <td style={{ textAlign: "center" }}>
                      <button className="trash" title={t("удалить")}
                        onClick={() => onToggleDeletion(b)}
                        style={del ? { color: "var(--accent)" } : undefined}>
                        {del ? "↩" : "🗑"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <div className="small muted" style={{ marginTop: 8 }}>
        {t("Периоды, где параметр выходит за заданные физические границы. «↩» — вернуть. Удаление очищает значения (→ NaN) в скачиваемом файле.")}
      </div>
    </div>
  );
}
