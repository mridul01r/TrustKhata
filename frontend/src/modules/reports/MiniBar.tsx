/**
 * A small horizontal bar scaled to `value / maxValue`, meant to sit next to a revenue figure
 * in a table cell so relative size is visible at a glance without a full chart.
 */
export function MiniBar({ value, maxValue }: { value: number; maxValue: number }) {
  const pct = maxValue > 0 ? Math.max(0, Math.min(100, (value / maxValue) * 100)) : 0;
  return (
    <div className="h-1.5 w-full max-w-[80px] overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
    </div>
  );
}