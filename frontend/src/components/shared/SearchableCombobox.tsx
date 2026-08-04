import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface ComboboxOption {
  id: string;
  name: string;
  sublabel?: string;
}

interface SearchableComboboxProps {
  options: ComboboxOption[] | undefined;
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  // If provided, shows a clearable "none" row at the top (e.g. "No category").
  emptyOptionLabel?: string;
  // If provided, shows a pinned, distinctly-styled row above everything else,
  // e.g. "+ Add new product" - selecting it fires onChange with pinnedOption.id
  // so the caller can detect the sentinel and open its own create-new flow.
  pinnedOption?: { id: string; label: string };
  onExitDown?: () => void;
  ariaLabel?: string;
  // Lets call sites match sibling field heights (e.g. "h-11" next to other
  // h-11 inputs in a row) instead of always using the default h-9.
  inputClassName?: string;
}

export default function SearchableCombobox({
  options,
  value,
  onChange,
  placeholder = "Search…",
  emptyOptionLabel,
  pinnedOption,
  onExitDown,
  ariaLabel = "Select option",
  inputClassName,
}: SearchableComboboxProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options?.find((o) => o.id === value) ?? null;

  const filtered = useMemo(() => {
    if (!options) return [];
    const term = search.trim().toLowerCase();
    if (!term) return options;
    return options.filter((o) => o.name.toLowerCase().includes(term));
  }, [options, search]);

  // Row layout, in order: [pinnedOption?] [emptyOption?] [...filtered]
  const leadingCount = (pinnedOption ? 1 : 0) + (emptyOptionLabel !== undefined ? 1 : 0);
  const totalRows = leadingCount + filtered.length;

  useEffect(() => {
    setHighlightedIndex(0);
  }, [search, open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectId(id: string) {
    onChange(id);
    setSearch("");
    setOpen(false);
  }

  function selectByIndex(index: number) {
    let cursor = index;
    if (pinnedOption) {
      if (cursor === 0) {
        selectId(pinnedOption.id);
        return;
      }
      cursor -= 1;
    }
    if (emptyOptionLabel !== undefined) {
      if (cursor === 0) {
        selectId("");
        return;
      }
      cursor -= 1;
    }
    const target = filtered[cursor];
    if (target) selectId(target.id);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      if (!open && onExitDown) {
        e.preventDefault();
        onExitDown();
        return;
      }
      e.preventDefault();
      setOpen(true);
      setHighlightedIndex((prev) => Math.min(prev + 1, Math.max(totalRows - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectByIndex(highlightedIndex);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setSearch("");
      inputRef.current?.blur();
    }
  }

  const displayValue = open ? search : selected ? selected.name : "";

  return (
    <div
      ref={containerRef}
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setOpen(false);
          setSearch("");
        }
      }}
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          placeholder={placeholder}
          value={displayValue}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className={inputClassName ?? "h-9 pl-9 pr-8 text-sm"}
        />
        {selected && !open && (
          <button
            type="button"
            aria-label="Clear selection"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => onChange("")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className="absolute z-20 mt-1.5 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-card shadow-lg"
        >
          {pinnedOption && (
            <li
              role="option"
              aria-selected={false}
              onMouseDown={(e) => {
                e.preventDefault();
                selectId(pinnedOption.id);
              }}
              onMouseEnter={() => setHighlightedIndex(0)}
              className={`cursor-pointer px-3 py-2.5 text-sm font-medium text-primary border-b border-border ${
                highlightedIndex === 0 ? "bg-accent" : "hover:bg-accent"
              }`}
            >
              {pinnedOption.label}
            </li>
          )}
          {emptyOptionLabel !== undefined && (
            <li
              role="option"
              aria-selected={value === ""}
              onMouseDown={(e) => {
                e.preventDefault();
                selectId("");
              }}
              onMouseEnter={() => setHighlightedIndex(pinnedOption ? 1 : 0)}
              className={`cursor-pointer px-3 py-2.5 text-sm ${
                highlightedIndex === (pinnedOption ? 1 : 0) ? "bg-accent" : "hover:bg-accent"
              }`}
            >
              {emptyOptionLabel}
            </li>
          )}
          {filtered.map((option, index) => {
            const absoluteIndex = leadingCount + index;
            return (
              <li
                key={option.id}
                role="option"
                aria-selected={value === option.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectId(option.id);
                }}
                onMouseEnter={() => setHighlightedIndex(absoluteIndex)}
                className={`cursor-pointer px-3 py-2.5 text-sm ${
                  absoluteIndex === highlightedIndex ? "bg-accent" : "hover:bg-accent"
                }`}
              >
                {option.name}
                {option.sublabel && (
                  <span className="ml-1.5 text-xs text-muted-foreground">{option.sublabel}</span>
                )}
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="px-3 py-2.5 text-sm text-muted-foreground">No matches</li>
          )}
        </ul>
      )}
    </div>
  );
}