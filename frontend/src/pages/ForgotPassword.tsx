import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post<{ message: string; devResetToken?: string }>('/auth/request-reset.php', { email });
      setMessage(res.message);
      setDevToken(res.devResetToken ?? null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="font-display text-xl font-semibold text-ink-800">Reset your password</h1>
        <p className="mt-1 text-sm text-ink-400">Enter your email and we'll generate a reset link.</p>

        {message ? (
          <div className="mt-5 rounded-lg border border-good-500/30 bg-good-100 px-3 py-2 text-sm text-good-500">
            {message}
            {devToken && (
              <Link to={`/reset-password?token=${devToken}`} className="mt-2 block underline">
                Continue to reset password (dev link — no email service configured)
              </Link>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="mt-5 block text-sm font-medium text-ink-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-ink-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-lg bg-ink-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-60"
            >
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <Link to="/login" className="mt-4 block text-center text-sm text-ink-400 hover:text-ink-700">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
