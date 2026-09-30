"use client";

import { useMemo, useState } from "react";

interface Props {
  title: string;
  options: { id: string; label: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
  searchPlaceholder?: string;
  maxVisible?: number;
  minQueryLength?: number;
}

export default function SearchableCheckboxFilter({
  title,
  options,
  selected,
  onChange,
  searchPlaceholder = "Buscar…",
  maxVisible = 50,
  minQueryLength = 2,
}: Props) {
  const [query, setQuery] = useState("");
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const selectedLabels = useMemo(
    () => options.filter((o) => selectedSet.has(o.id)).map((o) => o.label),
    [options, selectedSet]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < minQueryLength) return [];
    return options
      .filter((o) => o.label.toLowerCase().includes(q))
      .slice(0, maxVisible);
  }, [options, query, maxVisible, minQueryLength]);

  function toggle(id: string) {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  }

  const showResults = query.trim().length >= minQueryLength;

  return (
    <div className="filter-panel filter-panel--search-only">
      <div className="filter-panel-head">
        <span className="filter-panel-title">{title}</span>
        {selected.length > 0 && (
          <button type="button" className="filter-panel-clear" onClick={() => onChange([])}>
            Limpiar ({selected.length})
          </button>
        )}
      </div>
      <input
        type="search"
        className="filter-panel-search"
        placeholder={searchPlaceholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label={`Buscar en ${title}`}
      />
      {selected.length > 0 && (
        <p className="filter-panel-selected-hint" title={selectedLabels.join(", ")}>
          {selected.length} seleccionado{selected.length === 1 ? "" : "s"}
        </p>
      )}
      {showResults && (
        <div className="filter-panel-options" role="group" aria-label={title}>
          {filtered.length === 0 ? (
            <p className="filter-panel-empty">Sin coincidencias</p>
          ) : (
            filtered.map((o) => (
              <label key={o.id} className="filter-check">
                <input
                  type="checkbox"
                  checked={selectedSet.has(o.id)}
                  onChange={() => toggle(o.id)}
                />
                <span>{o.label}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}
