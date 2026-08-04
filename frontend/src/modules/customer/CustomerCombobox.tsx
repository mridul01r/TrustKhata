import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Customer } from "./types";

interface CustomerComboboxProps {
  customers: Customer[] | undefined;
  value: string;
  onChange: (customerId: string) => void;
  onExitDown?: () => void;
}

export default function CustomerCombobox({
  customers,
  value,
  onChange,
  onExitDown,
}: CustomerComboboxProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCustomer = customers?.find((c) => c.id === value) ?? null;

  const filtered = useMemo(() => {
    if (!customers) return [];
    const term = search.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.phone ?? "").toLowerCase().includes(term)
    );
  }, [customers, search]);

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

  function selectCustomer(customerId: string) {
    onChange(customerId);
    setSearch("");
    setOpen(false);
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
      setHighlightedIndex((prev) => Math.min(prev + 1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex === 0) {
        selectCustomer("");
      } else {
        const target = filtered[highlightedIndex - 1];
        if (target) selectCustomer(target.id);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setSearch("");
      inputRef.current?.blur();
    }
  }

  const displayValue = open ? search : selectedCustomer ? selectedCustomer.name : "";
  const activeOptionId =
    highlightedIndex === 0
      ? "customer-option-walkin"
      : filtered[highlightedIndex - 1] != null
      ? `customer-option-${filtered[highlightedIndex - 1].id}`
      : undefined;

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
          aria-controls="customer-combobox-listbox"
          aria-activedescendant={activeOptionId}
          aria-label="Select customer"
          placeholder="Walk-in customer"
          value={displayValue}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="h-9 pl-9 pr-8 text-sm"
        />
        {selectedCustomer && !open && (
          <button
            type="button"
            aria-label="Clear customer (use walk-in)"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => {
              onChange("");
              setSearch("");
            }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <ul
          id="customer-combobox-listbox"
          role="listbox"
          aria-label="Customers"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-card shadow-md"
        >
          <li
            id="customer-option-walkin"
            role="option"
            aria-selected={value === ""}
            onMouseDown={(e) => {
              e.preventDefault();
              selectCustomer("");
            }}
            onMouseEnter={() => setHighlightedIndex(0)}
            className={`cursor-pointer px-3 py-2 text-sm ${
              highlightedIndex === 0 ? "bg-accent" : "hover:bg-accent"
            }`}
          >
            Walk-in customer
          </li>
          {filtered.map((customer, index) => (
            <li
              key={customer.id}
              id={`customer-option-${customer.id}`}
              role="option"
              aria-selected={index + 1 === highlightedIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                selectCustomer(customer.id);
              }}
              onMouseEnter={() => setHighlightedIndex(index + 1)}
              className={`cursor-pointer px-3 py-2 text-sm ${
                index + 1 === highlightedIndex ? "bg-accent" : "hover:bg-accent"
              }`}
            >
              {customer.name}
              {customer.phone ? (
                <span className="ml-1.5 text-xs text-muted-foreground">{customer.phone}</span>
              ) : null}
              {customer.outstandingBalance > 0 && (
                <span className="ml-1.5 text-xs text-amber-500">
                  owes ₹{customer.outstandingBalance.toFixed(2)}
                </span>
              )}
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">No matching customers</li>
          )}
        </ul>
      )}
    </div>
  );
}