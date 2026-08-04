import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";

type SortDirection = "asc" | "desc";

/**
 * Generic client-side sort for a table's rows. `initialKey`/`initialDirection` set the
 * default sort (e.g. lowest margin first) so a table's existing sensible default is preserved
 * until the user clicks a header themselves.
 */
export function useSortableRows<T, K extends string>(
  rows: T[],
  getValue: (row: T, key: K) => string | number,
  initialKey: K,
  initialDirection: SortDirection = "asc"
) {
  const [sortKey, setSortKey] = useState<K>(initialKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialDirection);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const va = getValue(a, sortKey);
      const vb = getValue(b, sortKey);
      let cmp: number;
      if (typeof va === "number" && typeof vb === "number") {
        cmp = va - vb;
      } else {
        cmp = String(va).localeCompare(String(vb));
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return copy;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sortKey, sortDirection]);

  function toggleSort(key: K) {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  return { sorted, sortKey, sortDirection, toggleSort };
}

export function SortableHead<K extends string>({
  label,
  sortKeyValue,
  currentKey,
  currentDirection,
  onSort,
  align = "left",
}: {
  label: string;
  sortKeyValue: K;
  currentKey: K;
  currentDirection: SortDirection;
  onSort: (key: K) => void;
  align?: "left" | "right";
}) {
  const isActive = sortKeyValue === currentKey;
  return (
    <TableHead className={align === "right" ? "text-right" : undefined}>
      <button
        type="button"
        onClick={() => onSort(sortKeyValue)}
        className={`inline-flex items-center gap-1 hover:text-foreground ${
          align === "right" ? "flex-row-reverse" : ""
        } ${isActive ? "text-foreground" : "text-muted-foreground"}`}
      >
        <span>{label}</span>
        {isActive ? (
          currentDirection === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </TableHead>
  );
}