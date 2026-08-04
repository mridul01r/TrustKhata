import { useEffect, useMemo, useRef, useState } from "react";

import {
  Check,
  CreditCard,
  Keyboard,
  Minus,
  Pause,
  PlayCircle,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Smartphone,
  Trash2,
  User,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProducts } from "@/modules/inventory/useProducts";
import { useCustomers } from "@/modules/customer/useCustomers";
import { useBusinessSettings } from "@/modules/settings/useBusinessSettings";
import { useCheckout } from "./useSales";
import ReceiptDialog from "./ReceiptDialog";
import type { CheckoutPaymentRequest, PaymentMethod, SaleResponse } from "./types";
import CustomerCombobox from "@/modules/customer/CustomerCombobox";
import { useHeldSales, useHoldSale, useDeleteHeldSale } from "./useHeldSales";

interface CartLine {
  productId: string;
  productName: string;
  unit: string;
  unitPrice: number;
  gstRate: number;
  quantity: number;
  availableStock: number;
}

const paymentMethods: { value: PaymentMethod; label: string; icon: typeof Wallet }[] = [
  { value: "CASH", label: "Cash", icon: Wallet },
  { value: "CARD", label: "Card", icon: CreditCard },
  { value: "UPI", label: "UPI", icon: Smartphone },
  { value: "CREDIT", label: "Credit", icon: User },
];

const shortcuts: { keys: string[]; description: string }[] = [
  { keys: ["↑", "↓"], description: "Move through product results" },
  { keys: ["Enter"], description: "Add highlighted product to cart" },
  { keys: ["Esc"], description: "Clear search / close panel" },
  { keys: ["+"], description: "Add one more of the last item you added" },
  { keys: ["-"], description: "Remove one of the last item you added" },
  { keys: ["Delete"], description: "Remove the last item you added" },
  { keys: ["c"], description: "From search: jump to Customer field" },
  { keys: ["→"], description: "From search: go to payment, then Charge" },
  { keys: ["←"], description: "From Charge: back to payment, then search" },
  { keys: ["F7"], description: "Open / close held bills (use Ctrl+B if F7 doesn't work on your keyboard)" },
  { keys: ["F8"], description: "Hold current sale (use Ctrl+H if F8 doesn't work on your keyboard)" },
  { keys: ["F9"], description: "Charge / complete sale" },
  { keys: ["Ctrl", "Enter"], description: "Charge / complete sale" },
  { keys: ["?"], description: "Show or hide this list" },
];

export default function PosPage() {
  const { data: heldSales } = useHeldSales();
  const holdSale = useHoldSale();
  const deleteHeldSale = useDeleteHeldSale();
  const [showHeldPanel, setShowHeldPanel] = useState(false);
  const [showHoldDialog, setShowHoldDialog] = useState(false);
  const [holdLabel, setHoldLabel] = useState("");
  // Remembers the label of a hold that was just resumed, so if you add
  // items and hold again, the dialog pre-fills the same label instead of
  // making you retype it. Cleared as soon as that hold (or a checkout)
  // completes, so it never leaks into an unrelated new bill afterward.
  const [resumedHoldLabel, setResumedHoldLabel] = useState<string | null>(null);
  const { data: products } = useProducts(true);
  const { data: customers } = useCustomers();
  const { data: businessSettings } = useBusinessSettings();
  const trackInventory = businessSettings?.trackInventory ?? true;
  const checkout = useCheckout();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const checkoutButtonRef = useRef<HTMLButtonElement>(null);
  const fillButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const paymentSectionRef = useRef<HTMLDivElement>(null);
  const customerSectionRef = useRef<HTMLDivElement>(null);
  const productOptionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const heldItemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const heldPanelRef = useRef<HTMLDivElement>(null);
  const heldTriggerRef = useRef<HTMLButtonElement>(null);
  const holdLabelInputRef = useRef<HTMLInputElement>(null);
  const cartLineRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const interstateCheckboxRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [lastAddedProductId, setLastAddedProductId] = useState<string | null>(null);
  const [payments, setPayments] = useState<CheckoutPaymentRequest[]>([
    { method: "CASH", amount: 0 },
  ]);
  const [isInterstate, setIsInterstate] = useState(false);
  const [customerId, setCustomerId] = useState<string>("");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [completedSale, setCompletedSale] = useState<SaleResponse | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [heldHighlightedIndex, setHeldHighlightedIndex] = useState(0);
  const [focusZone, setFocusZone] = useState<"browse" | "sale">("browse");
  const [cartHighlightedIndex, setCartHighlightedIndex] = useState(0);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)
    );
  }, [products, search]);

  useEffect(() => {
    setHighlightedIndex((prev) => Math.min(prev, Math.max(filteredProducts.length - 1, 0)));
  }, [filteredProducts.length]);

  useEffect(() => {
    productOptionRefs.current[highlightedIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  useEffect(() => {
    searchInputRef.current?.focus();
    // Defensive re-assert: if any outer layout/router focus-management
    // runs after this component mounts and steals focus (e.g. an
    // accessibility "focus main content on navigate" pattern), this
    // catches it a tick later rather than leaving focus stranded.
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const isFirstHeldPanelRender = useRef(true);
  useEffect(() => {
    if (showHeldPanel) {
      setHeldHighlightedIndex(0);
      heldPanelRef.current?.focus();
    } else if (!isFirstHeldPanelRender.current) {
      // Only return focus to the trigger when the panel actually CLOSES.
      // Without this guard, this effect also fires on initial mount (since
      // showHeldPanel starts false), stealing focus away from the search
      // bar right after it was set - which is why keyboard nav appeared
      // "stuck" until you clicked into the page manually.
      heldTriggerRef.current?.focus();
    }
    isFirstHeldPanelRender.current = false;
  }, [showHeldPanel]);

  useEffect(() => {
    if (!showHeldPanel) return;
    heldItemRefs.current[heldHighlightedIndex]?.scrollIntoView({ block: "nearest" });
  }, [heldHighlightedIndex, showHeldPanel]);

  useEffect(() => {
    const count = heldSales?.length ?? 0;
    setHeldHighlightedIndex((prev) => Math.min(prev, Math.max(count - 1, 0)));
  }, [heldSales?.length]);

  useEffect(() => {
    if (!lastAddedProductId) return;
    cartLineRefs.current.get(lastAddedProductId)?.scrollIntoView({ block: "nearest" });
  }, [lastAddedProductId, cart.length]);

  useEffect(() => {
    const line = cart[cartHighlightedIndex];
    if (line) cartLineRefs.current.get(line.productId)?.scrollIntoView({ block: "nearest" });
  }, [cartHighlightedIndex]);

  useEffect(() => {
    const clamped = Math.min(cartHighlightedIndex, Math.max(cart.length - 1, 0));
    if (clamped !== cartHighlightedIndex) setCartHighlightedIndex(clamped);
    if (focusZone === "sale") {
      const line = cart[clamped];
      if (line) {
        cartLineRefs.current.get(line.productId)?.focus();
      } else {
        interstateCheckboxRef.current?.focus();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.length]);

  useEffect(() => {
    if (showHoldDialog) {
      holdLabelInputRef.current?.focus();
    }
  }, [showHoldDialog]);

  const addToCart = (productId: string) => {
    const product = products?.find((p) => p.id === productId);
    if (!product) return;

    setCart((prev) => {
      const existing = prev.find((line) => line.productId === productId);
      if (existing) {
        return prev.map((line) =>
          line.productId === productId ? { ...line, quantity: line.quantity + 1 } : line
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          unit: product.unit,
          unitPrice: product.sellingPrice,
          gstRate: product.gstRate,
          quantity: 1,
          availableStock: product.stockQuantity,
        },
      ];
    });
    setLastAddedProductId(productId);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCart((prev) =>
      prev.map((line) =>
        line.productId === productId ? { ...line, quantity: Math.max(0, quantity) } : line
      )
    );
  };

  const removeLine = (productId: string) => {
    setCart((prev) => prev.filter((line) => line.productId !== productId));
    setLastAddedProductId((prev) => (prev === productId ? null : prev));
  };

  const adjustLastAdded = (delta: number) => {
    if (!lastAddedProductId) return;
    setCart((prev) =>
      prev
        .map((line) =>
          line.productId === lastAddedProductId
            ? { ...line, quantity: Math.max(0, line.quantity + delta) }
            : line
        )
        .filter((line) => line.quantity > 0)
    );
  };

  const removeLastAdded = () => {
    if (!lastAddedProductId) return;
    removeLine(lastAddedProductId);
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    for (const line of cart) {
      const lineSubtotal = line.unitPrice * line.quantity;
      const lineTax = (lineSubtotal * line.gstRate) / 100;
      subtotal += lineSubtotal;
      tax += lineTax;
    }
    return { subtotal, tax, total: subtotal + tax };
  }, [cart]);

  const paidAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const remaining = totals.total - paidAmount;
  const hasCreditPayment = payments.some((p) => p.method === "CREDIT" && p.amount > 0);

  const updatePaymentAmount = (index: number, amount: number) => {
    setPayments((prev) => prev.map((p, i) => (i === index ? { ...p, amount } : p)));
  };

  const updatePaymentMethod = (index: number, method: PaymentMethod) => {
    setPayments((prev) => prev.map((p, i) => (i === index ? { ...p, method } : p)));
  };

  const addPaymentRow = () => {
    setPayments((prev) => [...prev, { method: "CASH", amount: 0 }]);
  };

  const removePaymentRow = (index: number) => {
    setPayments((prev) => prev.filter((_, i) => i !== index));
  };

  const fillRemaining = (index: number) => {
    setPayments((prev) =>
      prev.map((p, i) => (i === index ? { ...p, amount: Math.max(0, remaining + p.amount) } : p))
    );
  };

  /**
   * Collapses the common single-payment case (pick Cash, type the amount,
   * click Fill) into one click: sets a single Cash payment for the full
   * total and moves focus straight to Charge.
   */
  const quickCashFullAmount = () => {
    if (cart.length === 0) return;
    setPayments([{ method: "CASH", amount: totals.total }]);
    checkoutButtonRef.current?.focus();
  };

  const canCheckout =
    cart.length > 0 &&
    cart.every((line) => line.quantity > 0) &&
    Math.abs(remaining) < 0.005 &&
    !checkout.isPending &&
    (!hasCreditPayment || customerId !== "");

  const handleCheckout = async () => {
    if (!canCheckout) return;
    setCheckoutError(null);
    try {
      const sale = await checkout.mutateAsync({
        items: cart.map((line) => ({ productId: line.productId, quantity: line.quantity })),
        payments: payments.filter((p) => p.amount > 0),
        isInterstate,
        customerId: customerId || undefined,
      });
      setCompletedSale(sale);
      setCart([]);
      setLastAddedProductId(null);
      setPayments([{ method: "CASH", amount: 0 }]);
      setIsInterstate(false);
      setCustomerId("");
      setResumedHoldLabel(null);
      searchInputRef.current?.focus();
    } catch (err: any) {
      setCheckoutError(err?.response?.data?.message ?? "Checkout failed. Please try again.");
    }
  };

  const openHoldDialog = () => {
    if (cart.length === 0 || showHoldDialog) return;
    setHoldLabel(resumedHoldLabel ?? "");
    setShowHoldDialog(true);
  };

  const handleHold = async () => {
    if (cart.length === 0) return;
    await holdSale.mutateAsync({
      items: cart.map((line) => ({ productId: line.productId, quantity: line.quantity })),
      customerId: customerId || undefined,
      isInterstate,
      label: holdLabel.trim() || undefined,
    });
    setCart([]);
    setLastAddedProductId(null);
    setCustomerId("");
    setIsInterstate(false);
    setShowHoldDialog(false);
    setHoldLabel("");
    setResumedHoldLabel(null);
    searchInputRef.current?.focus();
  };

  const handleResume = async (heldSaleId: string) => {
    const held = heldSales?.find((h) => h.id === heldSaleId);
    if (!held || !products) return;

    const restoredCart: CartLine[] = held.items
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;
        return {
          productId: product.id,
          productName: product.name,
          unit: product.unit,
          unitPrice: product.sellingPrice,
          gstRate: product.gstRate,
          quantity: item.quantity,
          availableStock: product.stockQuantity,
        };
      })
      .filter((line): line is CartLine => line !== null);

    setCart(restoredCart);
    setCustomerId(held.customerId ?? "");
    setIsInterstate(held.isInterstate);
    setResumedHoldLabel(held.label);
    setShowHeldPanel(false);
    await deleteHeldSale.mutateAsync(heldSaleId);
    searchInputRef.current?.focus();
  };

  const handleHeldPanelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const count = heldSales?.length ?? 0;
    if (count === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHeldHighlightedIndex((prev) => Math.min(prev + 1, count - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHeldHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = heldSales?.[heldHighlightedIndex];
      if (target) handleResume(target.id);
    } else if (e.key === "Delete") {
      e.preventDefault();
      const target = heldSales?.[heldHighlightedIndex];
      if (target) deleteHeldSale.mutate(target.id);
    }
  };

  const handleHoldDialogKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleHold();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowHoldDialog(false);
    }
  };

  const focusActivePaymentMethod = () => {
    const activeMethodButton = paymentSectionRef.current?.querySelector<HTMLButtonElement>(
      '[role="radio"][aria-checked="true"]'
    );
    activeMethodButton?.focus();
  };

  const focusCustomerField = () => {
    const focusable = customerSectionRef.current?.querySelector<HTMLElement>(
      'input, button, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
  };

  const focusCartLine = (index: number) => {
    const line = cart[index];
    if (line) {
      cartLineRefs.current.get(line.productId)?.focus();
    } else {
      interstateCheckboxRef.current?.focus();
    }
  };

  const handleCartLineKeyDown = (e: React.KeyboardEvent<HTMLLIElement>, index: number) => {
    if (e.target !== e.currentTarget) return; // let child buttons/inputs handle their own keys
    const line = cart[index];
    if (!line) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (index === cart.length - 1) {
        interstateCheckboxRef.current?.focus();
      } else {
        setCartHighlightedIndex(index + 1);
        focusCartLine(index + 1);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (index === 0) {
        searchInputRef.current?.focus();
      } else {
        setCartHighlightedIndex(index - 1);
        focusCartLine(index - 1);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      searchInputRef.current?.focus();
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      updateQuantity(line.productId, line.quantity + 1);
    } else if (e.key === "-") {
      e.preventDefault();
      updateQuantity(line.productId, line.quantity - 1);
    } else if (e.key === "Delete") {
      e.preventDefault();
      removeLine(line.productId);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, filteredProducts.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = filteredProducts[highlightedIndex] ?? filteredProducts[0];
      if (target) {
        addToCart(target.id);
        setSearch("");
        setHighlightedIndex(0);
      }
    } else if (e.key === "Escape") {
      setSearch("");
    } else if (search === "" && (e.key === "+" || e.key === "=")) {
      e.preventDefault();
      adjustLastAdded(1);
    } else if (search === "" && e.key === "-") {
      e.preventDefault();
      adjustLastAdded(-1);
    } else if (search === "" && e.key === "Delete") {
      e.preventDefault();
      removeLastAdded();
    } else if (search === "" && e.key === "?") {
      e.preventDefault();
      setShowShortcuts((prev) => !prev);
    } else if (search === "" && (e.key === "c" || e.key === "C")) {
      e.preventDefault();
      focusCustomerField();
    } else if (search === "" && e.key === "ArrowRight") {
      e.preventDefault();
      focusCartLine(cartHighlightedIndex);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F9" || (e.ctrlKey && e.key === "Enter")) {
        e.preventDefault();
        handleCheckout();
      }
      // F7 also commonly gets intercepted by laptop hardware before the
      // browser sees it - Ctrl+B ("Bills") is a reliable fallback.
      if (e.key === "F7" || (e.ctrlKey && (e.key === "b" || e.key === "B"))) {
        e.preventDefault();
        setShowHeldPanel((prev) => !prev);
      }
      // F8 is the primary Hold shortcut, but many laptops route F-keys to
      // hardware controls (volume/brightness) before the browser ever sees
      // them. Ctrl+H is a reliable fallback that always reaches the page.
      if (e.key === "F8" || (e.ctrlKey && (e.key === "h" || e.key === "H"))) {
        e.preventDefault();
        openHoldDialog();
      }
      if (e.key === "Escape") {
        if (showShortcuts) setShowShortcuts(false);
        if (showHeldPanel) setShowHeldPanel(false);
        if (showHoldDialog) setShowHoldDialog(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const activeOptionId =
    filteredProducts[highlightedIndex] != null
      ? `product-option-${filteredProducts[highlightedIndex].id}`
      : undefined;

  const isFullyPaid = Math.abs(remaining) < 0.005;

  return (
    <div className="flex h-screen flex-col bg-muted/20 md:flex-row">
      {/* Product picker */}
      <div
        className="flex w-full flex-col border-b border-border bg-background p-4 md:h-full md:w-[38%] md:border-b-0 md:border-r md:p-5"
        onFocus={() => setFocusZone("browse")}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Billing</h1>
            <p className="text-xs text-muted-foreground">Search, then press Enter to add</p>
          </div>
          <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/30 p-0.5">
            <Button
              variant="ghost"
              size="sm"
              tabIndex={-1}
              className="h-8 gap-1.5 px-2 hover:bg-background hover:shadow-sm"
              disabled={cart.length === 0 || holdSale.isPending}
              onClick={openHoldDialog}
              title="Hold (F8 or Ctrl+H)"
            >
              <Pause className="h-3.5 w-3.5" />
            </Button>
            <Button
              ref={heldTriggerRef}
              variant="ghost"
              size="sm"
              tabIndex={-1}
              className="h-8 gap-1.5 px-2 hover:bg-background hover:shadow-sm"
              onClick={() => setShowHeldPanel(true)}
              title="Held bills (F7 or Ctrl+B)"
            >
              <PlayCircle className="h-3.5 w-3.5" />
              {heldSales && heldSales.length > 0 ? heldSales.length : ""}
            </Button>
            <div className="mx-0.5 h-4 w-px bg-border" />
            <Button
              variant="ghost"
              size="sm"
              tabIndex={-1}
              className="h-8 w-8 p-0 text-muted-foreground hover:bg-background hover:shadow-sm"
              aria-keyshortcuts="?"
              onClick={() => setShowShortcuts(true)}
              title="Shortcuts (?)"
            >
              <Keyboard className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            role="combobox"
            aria-expanded={filteredProducts.length > 0}
            aria-controls="pos-product-listbox"
            aria-activedescendant={activeOptionId}
            aria-label="Search products by name or SKU"
            placeholder="Search or scan by name / SKU…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setHighlightedIndex(0);
            }}
            onKeyDown={handleSearchKeyDown}
            className="h-10 pl-9 text-sm"
          />
        </div>

        <div
          id="pos-product-listbox"
          role="listbox"
          aria-label="Products"
          className={`flex-1 overflow-y-auto rounded-lg border border-border bg-card shadow-sm transition-opacity duration-200 ${
            focusZone === "sale" ? "opacity-40" : "opacity-100"
          }`}
        >
          {filteredProducts.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
              <Search className="h-7 w-7 opacity-40" />
              <p className="text-sm font-medium text-foreground">No matches for "{search}"</p>
              <p className="text-xs">Try a different name or SKU</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filteredProducts.map((product, index) => {
                const isHighlighted = index === highlightedIndex;
                const outOfStock = trackInventory && product.stockQuantity === 0;
                return (
                  <li key={product.id}>
                    <button
                      ref={(el) => {
                        productOptionRefs.current[index] = el;
                      }}
                      id={`product-option-${product.id}`}
                      role="option"
                      aria-selected={isHighlighted}
                      tabIndex={-1}
                      onClick={() => {
                        addToCart(product.id);
                        searchInputRef.current?.focus();
                      }}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-sm transition-all duration-150 focus-visible:outline-none ${
                        isHighlighted
                          ? "bg-primary/[0.06] shadow-[inset_2px_0_0_0] shadow-primary"
                          : "hover:bg-accent/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="min-w-0 flex-1 truncate font-medium leading-snug">
                          {product.name}
                        </span>
                        <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                          ₹{product.sellingPrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                          {product.sku}
                        </span>
                        {trackInventory && (
                          <span
                            className={`shrink-0 text-right text-xs ${
                              outOfStock ? "font-medium text-destructive" : "text-muted-foreground"
                            }`}
                          >
                            {product.stockQuantity > 0
                              ? `${product.stockQuantity} ${product.unit}`
                              : "Out of stock"}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Cart + payment */}
      <div
        className="flex w-full flex-1 flex-col p-4 md:h-full md:w-[62%] md:p-5"
        onFocus={() => setFocusZone("sale")}
      >
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-base font-semibold tracking-tight">Current sale</h2>
          {cart.length > 0 && (
            <span
              className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
              aria-live="polite"
            >
              {cart.length} {cart.length === 1 ? "item" : "items"}
            </span>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-card shadow-sm">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
              <ShoppingCart className="h-7 w-7 opacity-40" />
              <p className="text-sm font-medium text-foreground">Nothing added yet</p>
              <p className="text-xs">Search a product and press Enter to add it</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {cart.map((line, index) => {
                const lineSubtotal = line.unitPrice * line.quantity;
                const lineTax = (lineSubtotal * line.gstRate) / 100;
                const overStock =
                  trackInventory && line.availableStock > 0 && line.quantity > line.availableStock;
                const isLastAdded = line.productId === lastAddedProductId;
                const isHighlighted = index === cartHighlightedIndex;
                return (
                  <li
                    key={line.productId}
                    ref={(el) => {
                      if (el) cartLineRefs.current.set(line.productId, el);
                      else cartLineRefs.current.delete(line.productId);
                    }}
                    tabIndex={isHighlighted ? 0 : -1}
                    onFocus={() => setCartHighlightedIndex(index)}
                    onKeyDown={(e) => handleCartLineKeyDown(e, index)}
                    className={`flex items-center gap-3 p-3 transition-all motion-safe:duration-300 focus:outline-none ${
                      isHighlighted ? "bg-primary/[0.06] shadow-[inset_2px_0_0_0] shadow-primary" : ""
                    } ${isLastAdded ? "bg-primary/5" : ""}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{line.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        ₹{line.unitPrice.toFixed(2)} / {line.unit}
                      </p>
                      {overStock && (
                        <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                          Only {line.availableStock} in stock
                        </p>
                      )}
                    </div>

                    <div className="flex items-center overflow-hidden rounded-lg border border-border bg-background">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-none hover:bg-muted"
                        aria-label={`Decrease quantity of ${line.productName}`}
                        onClick={() => updateQuantity(line.productId, line.quantity - 1)}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <Input
                        type="number"
                        value={line.quantity === 0 ? "" : line.quantity}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) =>
                          updateQuantity(
                            line.productId,
                            e.target.value === "" ? 0 : Number(e.target.value)
                          )
                        }
                        placeholder="0"
                        aria-label={`Quantity of ${line.productName}`}
                        className="h-7 w-12 rounded-none border-0 border-x border-border px-1 text-center text-sm tabular-nums focus-visible:ring-0"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-none hover:bg-muted"
                        aria-label={`Increase quantity of ${line.productName}`}
                        onClick={() => updateQuantity(line.productId, line.quantity + 1)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <p className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums">
                      ₹{(lineSubtotal + lineTax).toFixed(2)}
                    </p>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Remove ${line.productName} from cart`}
                      onClick={() => removeLine(line.productId)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div
          className="mt-3 space-y-1.5 rounded-xl bg-muted/50 p-4"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums">₹{totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>GST</span>
            <span className="tabular-nums">₹{totals.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-1.5 text-xl font-bold">
            <span>Total</span>
            <span className="tabular-nums">₹{totals.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
            <input
              ref={interstateCheckboxRef}
              type="checkbox"
              checked={isInterstate}
              onChange={(e) => setIsInterstate(e.target.checked)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  // Native checkboxes only toggle on Space, not Enter - but
                  // Enter is the confirm key everywhere else in this POS,
                  // so make it consistent here too.
                  e.preventDefault();
                  setIsInterstate((prev) => !prev);
                } else if (e.key === "ArrowRight") {
                  e.preventDefault();
                  focusCustomerField();
                } else if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  searchInputRef.current?.focus();
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  focusActivePaymentMethod();
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  focusCartLine(cart.length - 1);
                }
              }}
              className="h-3.5 w-3.5 rounded border-border accent-primary"
            />
            <span>
              Inter-state <span className="text-muted-foreground">(IGST)</span>
            </span>
          </label>

          <div ref={customerSectionRef} className="min-w-[200px] flex-1">
            <CustomerCombobox
              customers={customers}
              value={customerId}
              onChange={setCustomerId}
              onExitDown={focusActivePaymentMethod}
            />
          </div>
        </div>
        {hasCreditPayment && customerId === "" && (
          <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
            A customer must be selected to use Credit as a payment method.
          </p>
        )}

        <div ref={paymentSectionRef} className="mt-2 space-y-2.5 rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment</Label>
              <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
                <Kbd>←</Kbd>
                <Kbd>→</Kbd>
                <span>choose method</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={quickCashFullAmount}
                title="Set full amount as Cash"
              >
                <Wallet className="h-3 w-3" />
                Full cash
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addPaymentRow}>
                Split payment
              </Button>
            </div>
          </div>

          {payments.map((payment, index) => (
            <div key={index} className="flex items-center gap-2">
              <PaymentMethodToggle
                value={payment.method}
                onChange={(method) => updatePaymentMethod(index, method)}
                onConfirm={() => fillButtonRefs.current[index]?.focus()}
                onExitLeft={index === 0 ? () => searchInputRef.current?.focus() : undefined}
                onExitRight={index === 0 ? () => fillButtonRefs.current[0]?.focus() : undefined}
                onExitUp={index === 0 ? () => interstateCheckboxRef.current?.focus() : undefined}
              />
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  ₹
                </span>
                <Input
                  type="number"
                  value={payment.amount === 0 ? "" : payment.amount}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => updatePaymentAmount(index, Number(e.target.value) || 0)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      fillButtonRefs.current[index]?.focus();
                    }
                  }}
                  placeholder="0"
                  aria-label={`Amount for payment ${index + 1}`}
                  className="h-8 pl-6 text-sm tabular-nums"
                />
              </div>
              <Button
                ref={(el) => {
                  fillButtonRefs.current[index] = el;
                }}
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  fillRemaining(index);
                  checkoutButtonRef.current?.focus();
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    focusActivePaymentMethod();
                  }
                }}
              >
                Fill
              </Button>
              {payments.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Remove payment row ${index + 1}`}
                  onClick={() => removePaymentRow(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          <p
            className={`flex items-center justify-end gap-1.5 text-right text-sm font-medium ${
              isFullyPaid
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-400"
            }`}
            aria-live="polite"
          >
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
                isFullyPaid ? "bg-emerald-500/10" : "bg-amber-500/10"
              }`}
            >
              {isFullyPaid && <Check className="h-3.5 w-3.5" />}
              {isFullyPaid
                ? "Fully paid"
                : remaining > 0
                ? `₹${remaining.toFixed(2)} remaining`
                : `₹${Math.abs(remaining).toFixed(2)} overpaid`}
            </span>
          </p>

          {checkoutError && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {checkoutError}
            </p>
          )}

          <Button
            ref={checkoutButtonRef}
            className="w-full gap-2"
            size="lg"
            disabled={!canCheckout}
            onClick={handleCheckout}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                focusActivePaymentMethod();
              }
            }}
          >
            <Receipt className="h-4 w-4" />
            {checkout.isPending ? "Processing…" : `Charge ₹${totals.total.toFixed(2)}`}
            <Kbd className="ml-1 border-primary-foreground/30 text-primary-foreground/70">
              F9
            </Kbd>
          </Button>
        </div>
      </div>

      <ReceiptDialog sale={completedSale} onClose={() => setCompletedSale(null)} />

      {showShortcuts && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 id="shortcuts-title" className="text-base font-semibold">
                Keyboard shortcuts
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Close keyboard shortcuts"
                onClick={() => setShowShortcuts(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ul className="space-y-2">
              {shortcuts.map((s) => (
                <li key={s.description} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{s.description}</span>
                  <span className="flex shrink-0 gap-1">
                    {s.keys.map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {showHoldDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="hold-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowHoldDialog(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3">
              <h2 id="hold-dialog-title" className="text-base font-semibold">
                Hold this sale
              </h2>
              <p className="text-xs text-muted-foreground">
                Add a label like a table number so it's easy to find later. Optional.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hold-label" className="text-xs">
                Label
              </Label>
              <Input
                ref={holdLabelInputRef}
                id="hold-label"
                value={holdLabel}
                onChange={(e) => setHoldLabel(e.target.value)}
                onKeyDown={handleHoldDialogKeyDown}
                placeholder="e.g. Table 4"
                maxLength={200}
                className="h-9 text-sm"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowHoldDialog(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleHold} disabled={holdSale.isPending}>
                {holdSale.isPending ? "Holding…" : "Hold"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showHeldPanel && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40"
          onClick={() => setShowHeldPanel(false)}
        >
          <div
            ref={heldPanelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="held-bills-title"
            tabIndex={-1}
            onKeyDown={handleHeldPanelKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-lg focus:outline-none"
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <div>
                <h2 id="held-bills-title" className="text-base font-semibold">
                  Held bills
                </h2>
                <p className="text-xs text-muted-foreground">
                  <Kbd>↑</Kbd> <Kbd>↓</Kbd> select · <Kbd>Enter</Kbd> resume ·{" "}
                  <Kbd>Delete</Kbd> void
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Close held bills"
                onClick={() => setShowHeldPanel(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {(!heldSales || heldSales.length === 0) && (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No held bills right now.
                </p>
              )}
              <ul role="listbox" aria-label="Held bills" className="space-y-2">
                {heldSales?.map((held, index) => {
                  const isHighlighted = index === heldHighlightedIndex;
                  return (
                    <li
                      key={held.id}
                      ref={(el) => {
                        heldItemRefs.current[index] = el;
                      }}
                      role="option"
                      aria-selected={isHighlighted}
                      onMouseEnter={() => setHeldHighlightedIndex(index)}
                      className={`flex items-center justify-between gap-3 rounded-lg border p-3 transition-all ${
                        isHighlighted
                          ? "border-primary bg-primary/[0.06] shadow-sm"
                          : "border-border"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{held.label ?? "Untitled"}</p>
                        <p className="text-xs text-muted-foreground">
                          {held.items.length} {held.items.length === 1 ? "item" : "items"} ·{" "}
                          {new Date(held.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <Button size="sm" onClick={() => handleResume(held.id)}>
                          Resume
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Void hold: ${held.label ?? "Untitled"}`}
                          onClick={() => deleteHeldSale.mutate(held.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Kbd({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={`rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium ${className}`}
    >
      {children}
    </kbd>
  );
}

function PaymentMethodToggle({
  value,
  onChange,
  onConfirm,
  onExitLeft,
  onExitRight,
  onExitUp,
}: {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  onConfirm?: () => void;
  onExitLeft?: () => void;
  onExitRight?: () => void;
  onExitUp?: () => void;
}) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusAndSelect = (index: number) => {
    const wrapped = (index + paymentMethods.length) % paymentMethods.length;
    onChange(paymentMethods[wrapped].value);
    buttonRefs.current[wrapped]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (index === paymentMethods.length - 1 && onExitRight) {
        onExitRight();
      } else {
        focusAndSelect(index + 1);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (index === 0 && onExitLeft) {
        onExitLeft();
      } else {
        focusAndSelect(index - 1);
      }
    } else if (e.key === "ArrowUp") {
      if (onExitUp) {
        e.preventDefault();
        onExitUp();
      }
    } else if (e.key === "Home") {
      e.preventDefault();
      focusAndSelect(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusAndSelect(paymentMethods.length - 1);
    }
  };

  return (
    <div role="radiogroup" aria-label="Payment method" className="flex rounded-md border border-border p-0.5">
      {paymentMethods.map(({ value: method, label, icon: Icon }, index) => {
        const selected = value === method;
        return (
          <button
            key={method}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => {
              onChange(method);
              onConfirm?.();
            }}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              selected
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}