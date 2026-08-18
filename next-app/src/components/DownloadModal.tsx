'use client';

import { useState, type FormEvent } from 'react';
import { X, Loader2, CheckCircle2 } from 'lucide-react';

const LICENSE_SERVER_URL = process.env.NEXT_PUBLIC_LICENSE_SERVER_URL || 'http://localhost:4000';

type Status = 'idle' | 'submitting' | 'success' | 'error';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  downloadUrl: string;
}

export default function DownloadModal({ isOpen, onClose, downloadUrl }: DownloadModalProps) {
  const [email, setEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setStatus('idle');
    setError(null);
    setEmail('');
    setCustomerName('');
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setError(null);

    try {
      const res = await fetch(`${LICENSE_SERVER_URL}/trial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, customerName }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Could not issue a trial license. Please try again.');
      }

      setStatus('success');
      window.location.href = downloadUrl;
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(23,20,14,0.6)' }}
      onClick={resetAndClose}
    >
      <div
        className="relative w-full max-w-sm rounded-lg p-8"
        style={{ background: 'var(--paper-soft)', border: '1px solid var(--paper-line)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={resetAndClose}
          aria-label="Close"
          className="absolute top-4 right-4"
          style={{ color: 'var(--ink-soft)' }}
        >
          <X style={{ width: 18, height: 18 }} />
        </button>

        {status === 'success' ? (
          <div className="text-center py-4">
            <CheckCircle2 style={{ width: 36, height: 36, color: 'var(--ledger-green)', margin: '0 auto 12px' }} />
            <h3 className="font-display font-semibold text-lg mb-2" style={{ color: 'var(--ink)' }}>
              Your download is starting
            </h3>
            <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
              We&apos;ve sent your license key to <strong>{email}</strong>. Keep that email — you&apos;ll
              need the key the first time you open the app.
            </p>
          </div>
        ) : (
          <>
            <h3 className="font-display font-semibold text-xl mb-1" style={{ color: 'var(--ink)' }}>
              Start your free trial
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--ink-soft)' }}>
              We&apos;ll email your license key here, then start the download.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="customerName" className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--ink)' }}>
                  Your name / shop name
                </label>
                <input
                  id="customerName"
                  type="text"
                  required
                  minLength={2}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Sharma General Store"
                  className="w-full px-3 py-2.5 rounded-md text-sm outline-none"
                  style={{ border: '1px solid var(--paper-line)', background: '#fff', color: 'var(--ink)' }}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--ink)' }}>
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 rounded-md text-sm outline-none"
                  style={{ border: '1px solid var(--paper-line)', background: '#fff', color: 'var(--ink)' }}
                />
              </div>

              {status === 'error' && error && (
                <p className="text-sm" style={{ color: 'var(--stamp-red)' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 font-semibold rounded-md disabled:opacity-60"
                style={{ background: 'var(--stamp-red)', color: '#FBF3EA' }}
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
                    Sending your license key…
                  </>
                ) : (
                  'Get license key & download'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}