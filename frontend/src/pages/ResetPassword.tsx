import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post('/auth/reset-password.php', { token, newPassword });
      setDone(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="font-display text-xl font-semibold text-ink-800">Choose a new password</h1>

        {done ? (
          <p className="mt-4 rounded-lg border border-good-500/30 bg-good-100 px-3 py-2 text-sm text-good-500">
            Password updated. Redirecting to sign in…
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div role="alert" className="mt-4 rounded-lg border border-bad-500/30 bg-bad-100 px-3 py-2 text-sm text-bad-500">
                {error}
              </div>
            )}
            <label className="mt-5 block text-sm font-medium text-ink-700" htmlFor="newPassword">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              required
              minLength={8}
              autoFocus
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-ink-600 focus:outline-none"
              placeholder="At least 8 characters"
            />
            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-lg bg-ink-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Save new password'}
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
