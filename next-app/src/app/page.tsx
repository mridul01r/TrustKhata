'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Download, ArrowRight, Store, ShoppingBasket, Pill, Coffee,
  Keyboard, FileCheck, Boxes, PieChart, Users, WifiOff,
  Monitor, CheckCircle2, Sparkles, Loader2,
  MessageCircle, ChevronDown, NotebookText,
  ScrollText, Landmark
} from 'lucide-react';

const PRODUCT_NAME = "TrustKhata";
const DOWNLOAD_URL = "/api/download";

/* ---------------------------------------------------------
   Scroll-reveal utilities
--------------------------------------------------------- */
const useScrollObserver = (threshold = 0.15): [React.RefObject<HTMLDivElement | null>, boolean] => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setIsVisible(true);
      });
    }, { threshold, rootMargin: "0px 0px -60px 0px" });

    if (domRef.current) observer.observe(domRef.current);
    return () => observer.disconnect();
  }, [threshold]);

  return [domRef, isVisible];
};

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => {
  const [ref, isVisible] = useScrollObserver();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        transition: `opacity 700ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 700ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(22px)'
      }}
    >
      {children}
    </div>
  );
};

/* A number that ticks up like a till total, once it scrolls into view */
const TallyCounter = ({ target, prefix = "", suffix = "", duration = 1100 }: { target: number; prefix?: string; suffix?: string; duration?: number }) => {
  const [ref, isVisible] = useScrollObserver(0.5);
  const [value, setValue] = useState(0);
  const started = useRef<boolean>(false);

  useEffect(() => {
    if (!isVisible || started.current) return;
    started.current = true;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isVisible, target, duration]);

  return (
    <span ref={ref}>{prefix}{value.toLocaleString('en-IN')}{suffix}</span>
  );
};

/* ---------------------------------------------------------
   AI helper — calls Claude directly (Anthropic Messages API)
--------------------------------------------------------- */
const askAssistant = async (userText: string, systemInstruction: string = ""): Promise<string> => {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: systemInstruction,
        messages: [{ role: "user", content: userText }]
      })
    });
    const data = await response.json();
    const text = (data.content || [])
      .map((block: { type: string; text?: string }) => (block.type === "text" ? block.text : ""))
      .filter(Boolean)
      .join("\n");
    return text || "No reply came through. Try again in a moment.";
  } catch (err) {
    return "The assistant is offline right now. Try again shortly.";
  }
};

/* ---------------------------------------------------------
   Root
--------------------------------------------------------- */
const App = () => {
  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: 'var(--paper)', color: 'var(--ink)' }} className="min-h-screen overflow-x-hidden">
      <GlobalStyle />
      <Navbar />
      <main>
        <Hero />
        <WhoItsFor />
        <LedgerDemo />
        <Features />
        <AskMunshi />
        <Screenshot />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
};

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

    :root {
      --ink-navy: #17233D;
      --ink-navy-2: #202F4F;
      --paper: #F6F1E4;
      --paper-soft: #FBF8F0;
      --paper-line: #DAD0B4;
      --stamp-red: #B23A2E;
      --stamp-red-dark: #8E2C22;
      --ledger-green: #2F6D5C;
      --brass: #B9903F;
      --ink: #211D16;
      --ink-soft: #5C5648;
      --cream: #F1EAD5;
    }

    * { box-sizing: border-box; }

    .font-display { font-family: 'Fraunces', serif; }
    .font-mono { font-family: 'IBM Plex Mono', monospace; }

    .ruled-paper {
      background-image: repeating-linear-gradient(
        transparent, transparent 27px, var(--paper-line) 28px
      );
      background-position: 0 8px;
    }

    .ruled-dark {
      background-image: repeating-linear-gradient(
        transparent, transparent 27px, rgba(185,144,63,0.14) 28px
      );
    }

    @keyframes floatSlow {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }

    @keyframes blinkDot {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.25; }
    }

    @keyframes stampIn {
      0% { transform: translate(-50%, -50%) rotate(-14deg) scale(2.6); opacity: 0; }
      55% { transform: translate(-50%, -50%) rotate(-10deg) scale(0.94); opacity: 1; }
      75% { transform: translate(-50%, -50%) rotate(-13deg) scale(1.04); }
      100% { transform: translate(-50%, -50%) rotate(-11deg) scale(1); }
    }

    .stamp-el { animation: none; }
    .stamp-visible .stamp-el { animation: stampIn 650ms cubic-bezier(0.2,0.9,0.35,1.1) 200ms both; }

    @keyframes lineIn {
      from { opacity: 0; transform: translateX(-10px); }
      to { opacity: 1; transform: translateX(0); }
    }

    .receipt-line { opacity: 0; }
    .demo-visible .receipt-line { animation: lineIn 420ms ease-out forwards; }

    input, button { font-family: inherit; }

    ::selection { background: var(--stamp-red); color: #fff; }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
    }
  `}</style>
);

/* ---------------------------------------------------------
   Navbar
--------------------------------------------------------- */
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className="fixed top-0 w-full z-50"
      style={{
        transition: 'all 300ms ease',
        background: scrolled ? 'var(--ink-navy)' : 'transparent',
        boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.15)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(185,144,63,0.25)' : '1px solid transparent'
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div style={{ width: 38, height: 38, background: 'var(--brass)', borderRadius: 8 }} className="flex items-center justify-center">
              <NotebookText className="text-white" style={{ width: 20, height: 20 }} />
            </div>
            <span className="font-display font-semibold text-xl tracking-tight text-white">{PRODUCT_NAME}</span>
          </div>
          <nav className="hidden md:flex items-center gap-9">
            {['Features', 'How it works', 'Pricing', 'FAQ'].map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase().replace(/\s/g, '-')}`}
                className="font-medium text-sm tracking-wide"
                style={{ color: '#D9CFB2' }}
              >
                {label}
              </a>
            ))}
          </nav>
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-md"
            style={{ background: 'var(--stamp-red)', color: '#FBF3EA' }}
          >
            <Download style={{ width: 15, height: 15 }} />
            Get the trial
          </a>
        </div>
      </div>
    </header>
  );
};

/* ---------------------------------------------------------
   Hero — headline + the live ledger receipt (signature element)
--------------------------------------------------------- */
const Hero = () => {
  const [demoRef, demoVisible] = useScrollObserver(0.35);

  const items = [
    { name: 'Basmati Rice 5kg', qty: 1, price: 640 },
    { name: 'Amul Butter 500g', qty: 2, price: 540 },
    { name: 'Parle-G Biscuits', qty: 4, price: 100 },
    { name: 'Tata Salt 1kg', qty: 3, price: 63 },
  ];
  const total = items.reduce((s, i) => s + i.price, 0);

  return (
    <section className="relative pt-40 pb-28" style={{ background: 'var(--ink-navy)', overflow: 'hidden' }}>
      <div className="absolute inset-0 ruled-dark" style={{ opacity: 0.7 }} />
      <div
        className="absolute top-0 bottom-0"
        style={{ left: '64px', width: 2, background: 'linear-gradient(to bottom, transparent, rgba(178,58,46,0.55), transparent)' }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
          <div>
            <FadeIn>
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide mb-8"
                style={{ background: 'rgba(185,144,63,0.15)', color: 'var(--brass)', border: '1px solid rgba(185,144,63,0.35)' }}
              >
                <ScrollText style={{ width: 13, height: 13 }} />
                THE DIGITAL KHAATA FOR INDIAN SHOPS
              </div>
            </FadeIn>

            <FadeIn delay={120}>
              <h1 className="font-display font-semibold text-white leading-[1.05] mb-7" style={{ fontSize: 'clamp(2.6rem, 5vw, 4.2rem)' }}>
                Every entry, <span style={{ color: 'var(--brass)' }} className="italic">tallied</span>.
                <br />Every rupee, accounted for.
              </h1>
            </FadeIn>

            <FadeIn delay={220}>
              <p className="text-lg mb-10 max-w-xl leading-relaxed" style={{ color: '#C7BFA6' }}>
                {PRODUCT_NAME} turns the shopkeeper's ledger into fast, offline billing software —
                keyboard-driven, GST-ready, and built for the counter, not the boardroom.
              </p>
            </FadeIn>

            <FadeIn delay={320}>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href={DOWNLOAD_URL}
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 font-semibold rounded-md"
                  style={{ background: 'var(--stamp-red)', color: '#FBF3EA', letterSpacing: '0.02em' }}
                >
                  <Download style={{ width: 17, height: 17 }} />
                  Download free trial
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 font-semibold rounded-md"
                  style={{ color: '#F1EAD5', border: '1px solid rgba(241,234,213,0.25)' }}
                >
                  See it in action
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </a>
              </div>
            </FadeIn>

            <FadeIn delay={420}>
              <div className="flex items-center gap-6 mt-12 font-mono text-xs" style={{ color: '#9C9377' }}>
                <span>14-day trial</span>
                <span style={{ width: 3, height: 3, borderRadius: 999, background: '#5A5442' }} />
                <span>No card needed</span>
                <span style={{ width: 3, height: 3, borderRadius: 999, background: '#5A5442' }} />
                <span>~55MB, Windows</span>
              </div>
            </FadeIn>
          </div>

          {/* Signature element: the live billing ledger / receipt */}
          <FadeIn delay={200}>
            <div ref={demoRef} className={demoVisible ? 'demo-visible' : ''} style={{ animation: 'floatSlow 6s ease-in-out infinite' }}>
              <div
                style={{
                  background: 'var(--paper-soft)',
                  transform: 'rotate(-2.2deg)',
                  boxShadow: '0 30px 60px rgba(0,0,0,0.35)',
                  clipPath: 'polygon(0 0,100% 0,100% 93%,94% 100%,88% 93%,82% 100%,76% 93%,70% 100%,64% 93%,58% 100%,52% 93%,46% 100%,40% 93%,34% 100%,28% 93%,22% 100%,16% 93%,10% 100%,4% 93%,0 100%)',
                  padding: '32px 30px 48px',
                  maxWidth: 400,
                  marginLeft: 'auto',
                  marginRight: 'auto'
                }}
                className="font-mono"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-display font-semibold text-lg" style={{ color: 'var(--ink)' }}>{PRODUCT_NAME}</span>
                  <span
                    style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--ledger-green)', animation: 'blinkDot 1.6s ease-in-out infinite' }}
                  />
                </div>
                <p className="text-xs mb-5" style={{ color: 'var(--ink-soft)' }}>Sharma General Store — Counter 1</p>

                <div className="border-t border-dashed pt-4 mb-4" style={{ borderColor: 'var(--paper-line)' }}>
                  {items.map((item, i) => (
                    <div
                      key={item.name}
                      className="receipt-line flex justify-between text-sm mb-2.5"
                      style={{ animationDelay: `${i * 260 + 150}ms`, color: 'var(--ink)' }}
                    >
                      <span>{item.qty}&times; {item.name}</span>
                      <span>₹{item.price}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 flex justify-between items-baseline" style={{ borderColor: 'var(--ink)' }}>
                  <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-soft)' }}>Total</span>
                  <span className="font-display font-semibold text-2xl" style={{ color: 'var(--stamp-red)' }}>
                    <TallyCounter target={total} prefix="₹" />
                  </span>
                </div>
                <p className="text-center text-xs mt-6" style={{ color: 'var(--ink-soft)', letterSpacing: '0.08em' }}>
                  GST INCL &middot; PRINTED IN 2.1s
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

/* ---------------------------------------------------------
   Who it's for — folder tabs
--------------------------------------------------------- */
const WhoItsFor = () => {
  const audiences = [
    { icon: <Store />, title: 'Kirana & general stores', desc: 'Fast checkout for packed goods.', color: 'var(--stamp-red)' },
    { icon: <ShoppingBasket />, title: 'Supermarkets', desc: 'Barcodes and bulk inventory.', color: 'var(--ledger-green)' },
    { icon: <Pill />, title: 'Pharmacies', desc: 'Batch numbers and expiry tracking.', color: 'var(--brass)' },
    { icon: <Coffee />, title: 'Cafes & dining', desc: 'No-inventory mode for quick service.', color: 'var(--stamp-red)' },
  ];

  return (
    <section className="py-10 relative z-20" style={{ marginTop: -44 }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {audiences.map((item, idx) => (
            <FadeIn key={item.title} delay={idx * 100}>
              <div
                className="h-full p-5 pt-6 relative"
                style={{ background: 'var(--paper-soft)', border: '1px solid var(--paper-line)', borderTop: `3px solid ${item.color}`, borderRadius: '4px 4px 10px 10px', boxShadow: '0 14px 26px rgba(23,35,61,0.08)' }}
              >
                <div style={{ color: item.color, width: 22, height: 22 }} className="mb-3">{item.icon}</div>
                <h3 className="font-display font-semibold text-base mb-1" style={{ color: 'var(--ink)' }}>{item.title}</h3>
                <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>{item.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ---------------------------------------------------------
   Ledger demo strip — "how it works", 3 tally steps
--------------------------------------------------------- */
const LedgerDemo = () => {
  const steps = [
    { no: '01', title: 'Punch in the sale', desc: 'Type or scan items. No mouse needed — everything routes through the keyboard.' },
    { no: '02', title: 'Bill prints itself', desc: 'GST splits into CGST/SGST or IGST automatically, with HSN codes attached.' },
    { no: '03', title: 'Ledger balances', desc: 'Stock, cash drawer and daily sales tally without a second entry.' },
  ];

  return (
    <section id="how-it-works" className="py-24" style={{ background: 'var(--paper)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <FadeIn>
          <div className="max-w-2xl mb-14">
            <p className="font-mono text-xs font-semibold tracking-widest mb-3" style={{ color: 'var(--ledger-green)' }}>HOW A SALE MOVES THROUGH THE BOOK</p>
            <h2 className="font-display font-semibold text-3xl md:text-4xl" style={{ color: 'var(--ink)' }}>Three lines, one balanced entry.</h2>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-0 border-t" style={{ borderColor: 'var(--ink)' }}>
          {steps.map((step, idx) => (
            <FadeIn key={step.no} delay={idx * 140}>
              <div
                className="py-8 px-6 h-full"
                style={{ borderRight: idx < 2 ? '1px dashed var(--paper-line)' : 'none' }}
              >
                <span className="font-mono text-sm block mb-4" style={{ color: 'var(--brass)' }}>{step.no}</span>
                <h3 className="font-display font-semibold text-xl mb-2" style={{ color: 'var(--ink)' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>{step.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ---------------------------------------------------------
   Features — ledger rows
--------------------------------------------------------- */
const Features = () => {
  const feats = [
    { icon: <Keyboard />, title: 'Keyboard-driven billing', desc: 'Punch in items at speed. Split payments and hold bills when the counter gets busy.' },
    { icon: <FileCheck />, title: 'Auto GST compliance', desc: 'Smart routing between CGST/SGST and IGST, with perfect tax invoices and HSN codes.' },
    { icon: <WifiOff />, title: '100% offline-first', desc: "Business doesn't stop when the internet does. Everything stays on your hard drive." },
    { icon: <Boxes />, title: 'Smart inventory', desc: 'Low-stock alerts, bulk Excel imports, automatic cost-averaging on purchases.' },
    { icon: <PieChart />, title: 'Deep analytics', desc: 'Margins, GST reports and daily sales graphs, ready whenever you need them.' },
    { icon: <Users />, title: 'Staff roles', desc: 'Owner, manager and cashier logins, each seeing only what they should.' },
  ];

  return (
    <section id="features" className="py-24" style={{ background: 'var(--ink-navy)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <FadeIn>
          <div className="max-w-2xl mb-16">
            <p className="font-mono text-xs font-semibold tracking-widest mb-3" style={{ color: 'var(--brass)' }}>WHAT'S ON THE PAGE</p>
            <h2 className="font-display font-semibold text-3xl md:text-4xl text-white">Everything a counter needs, nothing it doesn't.</h2>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: 'rgba(185,144,63,0.18)' }}>
          {feats.map((f, idx) => (
            <FadeIn key={f.title} delay={(idx % 3) * 110}>
              <div className="h-full p-8" style={{ background: 'var(--ink-navy)' }}>
                <div style={{ color: 'var(--brass)', width: 26, height: 26 }} className="mb-5">{f.icon}</div>
                <h3 className="font-display font-semibold text-lg text-white mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#B7AE93' }}>{f.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ---------------------------------------------------------
   Ask Munshi — AI naming / support tool
--------------------------------------------------------- */
const AskMunshi = () => {
  const [shopDesc, setShopDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleGenerate = async () => {
    if (!shopDesc.trim()) return;
    setLoading(true);
    setResult('');
    const system = "You are Munshi, a sharp branding assistant for small Indian retail shops. Given a short shop description, suggest 3 catchy shop names with a one-line tagline each. Keep it grounded in the Indian retail context (kirana, cafe, pharmacy, supermarket). Format as a short plain list. Keep the whole reply under 90 words.";
    const response = await askAssistant(shopDesc, system);
    setResult(response);
    setLoading(false);
  };

  return (
    <section className="py-24" style={{ background: 'var(--paper)' }}>
      <div className="max-w-4xl mx-auto px-6 lg:px-10">
        <FadeIn>
          <div
            className="p-9 md:p-12 relative ruled-paper"
            style={{ background: 'var(--paper-soft)', border: '1px solid var(--paper-line)', borderRadius: 4 }}
          >
            <div
              className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-semibold tracking-widest"
              style={{ background: 'rgba(47,109,92,0.12)', color: 'var(--ledger-green)', borderRadius: 999 }}
            >
              <Sparkles style={{ width: 12, height: 12 }} /> ASK MUNSHI
            </div>
            <h2 className="font-display font-semibold text-3xl mb-3" style={{ color: 'var(--ink)' }}>Opening a new shop? Let Munshi name it.</h2>
            <p className="mb-8" style={{ color: 'var(--ink-soft)' }}>Describe what you sell, and Munshi will suggest a name and tagline worth painting on the signboard.</p>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={shopDesc}
                onChange={(e) => setShopDesc(e.target.value)}
                placeholder="e.g. A modern organic grocery store in Indore"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                className="flex-1 px-5 py-3.5 outline-none"
                style={{ background: '#fff', border: '1px solid var(--paper-line)', borderRadius: 4, color: 'var(--ink)' }}
              />
              <button
                onClick={handleGenerate}
                disabled={loading || !shopDesc.trim()}
                className="px-7 py-3.5 font-semibold inline-flex items-center justify-center gap-2"
                style={{ background: 'var(--ink)', color: '#F1EAD5', borderRadius: 4, opacity: (loading || !shopDesc.trim()) ? 0.5 : 1 }}
              >
                {loading ? <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> : <Sparkles style={{ width: 16, height: 16 }} />}
                Ask Munshi
              </button>
            </div>

            {result && (
              <div className="mt-7 p-6 font-mono text-sm whitespace-pre-line leading-relaxed" style={{ background: 'var(--cream)', borderLeft: '3px solid var(--stamp-red)', color: 'var(--ink)' }}>
                {result}
              </div>
            )}
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

/* ---------------------------------------------------------
   Screenshot mockup
--------------------------------------------------------- */
const Screenshot = () => (
  <section className="py-24" style={{ background: 'var(--ink-navy)' }}>
    <div className="max-w-6xl mx-auto px-6 lg:px-10">
      <FadeIn>
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="font-display font-semibold text-3xl md:text-4xl text-white mb-4">Looks nothing like old accounting software.</h2>
          <p style={{ color: '#B7AE93' }}>Clean, fast, and legible from across the counter.</p>
        </div>
      </FadeIn>
      <FadeIn delay={150}>
        <div style={{ boxShadow: '0 40px 80px rgba(0,0,0,0.45)', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(185,144,63,0.25)' }}>
          <div style={{ background: '#0F1729', padding: '14px 22px' }} className="flex items-center gap-2">
            <span style={{ width: 10, height: 10, borderRadius: 999, background: '#B23A2E' }} />
            <span style={{ width: 10, height: 10, borderRadius: 999, background: '#B9903F' }} />
            <span style={{ width: 10, height: 10, borderRadius: 999, background: '#2F6D5C' }} />
            <span className="font-mono text-xs ml-3" style={{ color: '#8A8368' }}>{PRODUCT_NAME} — Billing counter</span>
          </div>
          <div style={{ background: 'var(--paper)', minHeight: 320 }} className="ruled-paper flex flex-col items-center justify-center p-14 text-center">
            <Monitor style={{ width: 56, height: 56, color: 'var(--brass)' }} className="mb-5" />
            <h3 className="font-display font-semibold text-xl mb-2" style={{ color: 'var(--ink)' }}>[ Main billing screen goes here ]</h3>
            <p style={{ color: 'var(--ink-soft)' }} className="max-w-sm">Drop in a real screenshot of the POS screen to replace this placeholder.</p>
          </div>
        </div>
      </FadeIn>
    </div>
  </section>
);

/* ---------------------------------------------------------
   Pricing — the paid-invoice card with a stamp
--------------------------------------------------------- */
const Pricing = () => {
  const [ref, visible] = useScrollObserver(0.4);

  const trialIncluded = [
    'Full access to all current features',
    'Unlimited products and invoices',
    'Install on one PC (Windows)',
    '14 days, no credit card required',
    'Email and WhatsApp support',
  ];

  return (
    <section id="pricing" className="py-24" style={{ background: 'var(--paper)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col items-center">
        <FadeIn>
          <div className="text-center max-w-xl mb-14">
            <p className="font-mono text-xs font-semibold tracking-widest mb-3" style={{ color: 'var(--stamp-red)' }}>START FREE, NO CARD NEEDED</p>
            <h2 className="font-display font-semibold text-3xl md:text-4xl" style={{ color: 'var(--ink)' }}>Try the full app for 14 days.</h2>
          </div>
        </FadeIn>

        {/* Free trial card - active while paid checkout isn't live yet */}
        <FadeIn delay={150}>
          <div
            ref={ref}
            className={`relative w-full max-w-md ${visible ? 'stamp-visible' : ''}`}
            style={{ background: 'var(--paper-soft)', border: '1px solid var(--paper-line)', borderRadius: 6, boxShadow: '0 30px 60px rgba(23,35,61,0.14)', padding: '44px 40px' }}
          >
            <div
              className="stamp-el absolute font-display font-bold"
              style={{
                top: '30%', left: '80%', width: 132, height: 132,
                border: '4px double var(--ledger-green)', borderRadius: '50%',
                color: 'var(--ledger-green)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', fontSize: 15, lineHeight: 1.15, letterSpacing: '0.03em',
                textTransform: 'uppercase', opacity: 0.92, pointerEvents: 'none'
              }}
            >
              No card needed
            </div>

            <div className="flex justify-between items-start mb-7">
              <div>
                <h3 className="font-display font-semibold text-2xl" style={{ color: 'var(--ink)' }}>Free trial</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--ink-soft)' }}>Per shop location</p>
              </div>
            </div>

            <div className="font-display font-semibold mb-8" style={{ fontSize: '3.4rem', color: 'var(--ink)' }}>
              &#8377;0 <span style={{ fontSize: '1.1rem', color: 'var(--ink-soft)' }}>/ 14 days</span>
            </div>

            <ul className="space-y-4 mb-10">
              {trialIncluded.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 style={{ width: 18, height: 18, color: 'var(--ledger-green)', marginTop: 2, flexShrink: 0 }} />
                  <span style={{ color: 'var(--ink)' }}>{item}</span>
                </li>
              ))}
            </ul>

            <a
              href={DOWNLOAD_URL}
              className="w-full flex justify-center py-4 px-6 font-semibold"
              style={{ background: 'var(--ink)', color: '#F1EAD5', borderRadius: 4 }}
            >
              Download free trial
            </a>
            <p className="text-center text-xs mt-4 font-mono" style={{ color: 'var(--ink-soft)' }}>
              14-day free trial &middot; ~55MB download
            </p>
          </div>
        </FadeIn>

        {/*
        Paid lifetime-license card - commented out until Razorpay checkout is live.
        Restore this block (and swap the heading text back to "ONE PRICE, PAID
        ONCE" / "Lifetime ownership, no monthly bill.") once ready.

        <FadeIn delay={150}>
          <div
            ref={ref}
            className={`relative w-full max-w-md ${visible ? 'stamp-visible' : ''}`}
            style={{ background: 'var(--paper-soft)', border: '1px solid var(--paper-line)', borderRadius: 6, boxShadow: '0 30px 60px rgba(23,35,61,0.14)', padding: '44px 40px' }}
          >
            <div
              className="stamp-el absolute font-display font-bold"
              style={{
                top: '30%', left: '80%', width: 132, height: 132,
                border: '4px double var(--stamp-red)', borderRadius: '50%',
                color: 'var(--stamp-red)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', fontSize: 15, lineHeight: 1.15, letterSpacing: '0.03em',
                textTransform: 'uppercase', opacity: 0.92, pointerEvents: 'none'
              }}
            >
              Paid in full
            </div>

            <div className="flex justify-between items-start mb-7">
              <div>
                <h3 className="font-display font-semibold text-2xl" style={{ color: 'var(--ink)' }}>Lifetime license</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--ink-soft)' }}>Per shop location</p>
              </div>
            </div>

            <div className="font-display font-semibold mb-8" style={{ fontSize: '3.4rem', color: 'var(--ink)' }}>
              Rs. 4,999
            </div>

            <ul className="space-y-4 mb-10">
              {[
                'Full access to all current features',
                'Unlimited products and invoices',
                'Install on one PC (Windows)',
                '1 year of free software updates',
                'Email and WhatsApp support',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 style={{ width: 18, height: 18, color: 'var(--ledger-green)', marginTop: 2, flexShrink: 0 }} />
                  <span style={{ color: 'var(--ink)' }}>{item}</span>
                </li>
              ))}
            </ul>

            <a
              href={DOWNLOAD_URL}
              className="w-full flex justify-center py-4 px-6 font-semibold"
              style={{ background: 'var(--ink)', color: '#F1EAD5', borderRadius: 4 }}
            >
              Download installer
            </a>
            <p className="text-center text-xs mt-4 font-mono" style={{ color: 'var(--ink-soft)' }}>
              14-day free trial &middot; ~55MB download
            </p>
          </div>
        </FadeIn>
        */}
      </div>
    </section>
  );
};

/* ---------------------------------------------------------
   FAQ — ledger index
--------------------------------------------------------- */
const FAQItem = ({ q, a, index }: { q: string; a: string; index: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--paper-line)' }}>
      <button
        className="w-full py-5 text-left flex items-center gap-5"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-mono text-sm" style={{ color: 'var(--brass)', flexShrink: 0 }}>{index}</span>
        <span className="font-display font-semibold text-lg flex-1" style={{ color: 'var(--ink)' }}>{q}</span>
        <ChevronDown
          style={{ width: 18, height: 18, color: 'var(--ink-soft)', transition: 'transform 300ms', transform: isOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }}
        />
      </button>
      <div style={{ maxHeight: isOpen ? 200 : 0, overflow: 'hidden', transition: 'max-height 300ms ease' }}>
        <p className="pb-5 pl-11 leading-relaxed" style={{ color: 'var(--ink-soft)' }}>{a}</p>
      </div>
    </div>
  );
};

const FAQ = () => {
  const faqs = [
    { q: 'Does this work without internet?', a: 'Yes. Once installed, billing, inventory and accounting all run offline. You only need internet briefly to activate your license, or to send WhatsApp receipts.' },
    { q: "Can I use it for a shop that doesn't track stock?", a: 'Yes — toggle off strict inventory in settings. You can bill items like a coffee or thali without logging raw material stock.' },
    { q: 'Is my data safe? Where does it live?', a: "Everything — bills, customers, accounts — stays on your own PC's hard drive. We don't upload your core business data. Back up manually to a USB drive or your own Drive." },
    { q: 'Can staff log in with different roles?', a: 'Yes. Owner, manager and cashier roles exist out of the box — a cashier sees only the billing screen and their own shift.' },
  ];

  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState('');

  const handleAiAsk = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiAnswer('');
    const system = `You are a helpful sales assistant for ${PRODUCT_NAME}, offline-first desktop billing software for Indian retail shops. Facts: lifetime license ₹4,999, GST compliant, offline-first, multi-staff roles, inventory and customer credit tracking, Windows only. Answer the question politely and concisely, under 70 words, and end by nudging them toward the free trial.`;
    const answer = await askAssistant(aiQuery, system);
    setAiAnswer(answer);
    setAiLoading(false);
  };

  return (
    <section id="faq" className="py-24" style={{ background: 'var(--paper-soft)' }}>
      <div className="max-w-3xl mx-auto px-6 lg:px-10">
        <FadeIn>
          <div className="mb-12">
            <p className="font-mono text-xs font-semibold tracking-widest mb-3" style={{ color: 'var(--ledger-green)' }}>THE INDEX</p>
            <h2 className="font-display font-semibold text-3xl md:text-4xl" style={{ color: 'var(--ink)' }}>Frequently asked questions</h2>
          </div>
        </FadeIn>

        <FadeIn delay={100}>
          <div style={{ borderTop: '1px solid var(--paper-line)' }}>
            {faqs.map((faq, idx) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} index={String(idx + 1).padStart(2, '0')} />
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={200}>
          <div className="mt-14 p-8" style={{ background: 'var(--ink-navy)', borderRadius: 8 }}>
            <div className="flex items-center gap-4 mb-6">
              <div style={{ width: 42, height: 42, background: 'rgba(185,144,63,0.15)', borderRadius: 8 }} className="flex items-center justify-center">
                <MessageCircle style={{ width: 20, height: 20, color: 'var(--brass)' }} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-xl text-white">Something more specific?</h3>
                <p className="text-sm" style={{ color: '#B7AE93' }}>Ask the assistant directly.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="e.g. Does it support barcode scanners?"
                onKeyDown={(e) => e.key === 'Enter' && handleAiAsk()}
                className="flex-1 px-5 py-3.5 outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(185,144,63,0.25)', borderRadius: 4, color: '#F1EAD5' }}
              />
              <button
                onClick={handleAiAsk}
                disabled={aiLoading || !aiQuery.trim()}
                className="px-7 py-3.5 font-semibold inline-flex items-center justify-center gap-2"
                style={{ background: 'var(--brass)', color: '#1B1404', borderRadius: 4, opacity: (aiLoading || !aiQuery.trim()) ? 0.5 : 1 }}
              >
                {aiLoading ? <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> : <Sparkles style={{ width: 16, height: 16 }} />}
                Ask
              </button>
            </div>

            {aiAnswer && (
              <div className="mt-6 p-5 leading-relaxed text-sm" style={{ background: 'rgba(255,255,255,0.05)', borderLeft: '3px solid var(--brass)', color: '#EDE6D0' }}>
                {aiAnswer}
              </div>
            )}
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

/* ---------------------------------------------------------
   Footer
--------------------------------------------------------- */
const Footer = () => (
  <footer style={{ background: 'var(--ink-navy)', borderTop: '3px solid var(--brass)' }} className="py-12">
    <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex items-center gap-3">
        <div style={{ width: 32, height: 32, background: 'var(--brass)', borderRadius: 7 }} className="flex items-center justify-center">
          <Landmark style={{ width: 16, height: 16, color: '#1B1404' }} />
        </div>
        <span className="font-display font-semibold text-white text-lg">{PRODUCT_NAME}</span>
      </div>

      <div className="flex gap-8 text-sm font-medium" style={{ color: '#9C9377' }}>
        <a href="#">Privacy policy</a>
        <a href="#">Terms of service</a>
        <a href="#">Contact support</a>
      </div>

      <p className="font-mono text-xs" style={{ color: '#71694F' }}>Balanced to the last rupee &middot; &copy; {new Date().getFullYear()}</p>
    </div>
  </footer>
);

export default App;