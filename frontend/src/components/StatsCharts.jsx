function getMaxValue(values = []) {
  return values.reduce(
    (maxValue, currentValue) => Math.max(maxValue, Number(currentValue) || 0),
    0,
  );
}

function buildPolylinePoints(items = [], getValue) {
  if (!items.length) {
    return "";
  }

  const values = items.map((item) => Number(getValue(item)) || 0);
  const maxValue = Math.max(getMaxValue(values), 1);

  return values
    .map((value, index) => {
      const x = items.length === 1 ? 50 : (index / (items.length - 1)) * 100;
      const y = 100 - (value / maxValue) * 100;
      return `${x},${y}`;
    })
    .join(" ");
}

export function BarTrendChart({
  items = [],
  getValue,
  colorClassName = "bg-[#F8D16A]",
}) {
  if (!items.length) {
    return (
      <div className="flex h-28 items-center justify-center rounded-2xl bg-[#0F131B] text-sm text-[#667085]">
        Пока не хватает данных
      </div>
    );
  }

  const maxValue = Math.max(
    getMaxValue(items.map((item) => getValue(item))),
    1,
  );

  return (
    <div className="space-y-3">
      <div className="flex h-28 items-end gap-2">
        {items.map((item) => {
          const value = Number(getValue(item)) || 0;
          const height = value > 0 ? Math.max((value / maxValue) * 100, 10) : 8;

          return (
            <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-full w-full items-end">
                <div
                  className={`w-full rounded-t-2xl ${colorClassName}`}
                  style={{ height: `${height}%` }}
                />
              </div>
              <span className="text-[10px] uppercase tracking-[0.12em] text-[#667085]">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LineTrendChart({
  items = [],
  getValue,
  stroke = "#7CC7FF",
  fill = "rgba(124, 199, 255, 0.12)",
}) {
  if (!items.length) {
    return (
      <div className="flex h-28 items-center justify-center rounded-2xl bg-[#0F131B] text-sm text-[#667085]">
        Пока не хватает данных
      </div>
    );
  }

  const points = buildPolylinePoints(items, getValue);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-[#0F131B] px-3 py-3">
        <svg viewBox="0 0 100 100" className="h-24 w-full overflow-visible">
          <polyline
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
            points="0,100 100,100"
          />
          <polyline
            fill="none"
            stroke={fill}
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
          <polyline
            fill="none"
            stroke={stroke}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      </div>
      <div className="flex justify-between gap-2 text-[10px] uppercase tracking-[0.12em] text-[#667085]">
        {items.map((item) => (
          <span key={item.label} className="min-w-0 truncate">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function AdaptationTrendChart({ items = [] }) {
  const maxValue = Math.max(
    getMaxValue(
      items.map((item) =>
        (item.progressing ?? 0) +
        (item.stalled ?? 0) +
        (item.manual ?? 0) +
        (item.base ?? 0),
      ),
    ),
    1,
  );

  if (!items.length) {
    return (
      <div className="flex h-28 items-center justify-center rounded-2xl bg-[#0F131B] text-sm text-[#667085]">
        Пока не хватает данных
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex h-28 items-end gap-2">
        {items.map((item) => {
          const total =
            (item.progressing ?? 0) +
            (item.stalled ?? 0) +
            (item.manual ?? 0) +
            (item.base ?? 0);
          const scale = total > 0 ? total / maxValue : 0;

          return (
            <div key={item.id ?? item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div
                className="flex h-full w-full flex-col justify-end overflow-hidden rounded-t-2xl bg-[#0F131B]"
                style={{ minHeight: "1.5rem" }}
              >
                <div
                  className="flex h-full w-full flex-col justify-end"
                  style={{ transform: `scaleY(${scale || 0.08})`, transformOrigin: "bottom" }}
                >
                  {(item.base ?? 0) > 0 ? (
                    <div
                      className="w-full bg-[#546074]"
                      style={{ height: `${((item.base ?? 0) / total) * 100}%` }}
                    />
                  ) : null}
                  {(item.manual ?? 0) > 0 ? (
                    <div
                      className="w-full bg-[#3B82F6]"
                      style={{ height: `${((item.manual ?? 0) / total) * 100}%` }}
                    />
                  ) : null}
                  {(item.stalled ?? 0) > 0 ? (
                    <div
                      className="w-full bg-[#EAB308]"
                      style={{ height: `${((item.stalled ?? 0) / total) * 100}%` }}
                    />
                  ) : null}
                  {(item.progressing ?? 0) > 0 ? (
                    <div
                      className="w-full bg-[#22C55E]"
                      style={{ height: `${((item.progressing ?? 0) / total) * 100}%` }}
                    />
                  ) : null}
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-[0.12em] text-[#667085]">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
