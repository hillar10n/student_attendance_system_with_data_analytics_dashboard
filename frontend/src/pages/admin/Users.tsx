import { useEffect, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Layout from '../../components/Layout';
import { Card } from '../../components/Card';
import ConfirmDialog from '../../components/ConfirmDialog';
import { api, ApiError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { ManagedUser, Role } from '../../types';

export default function Users() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', role: 'student' as Role, password: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ManagedUser | null>(null);

  function loadUsers() {
    setLoading(true);
    api.get<{ users: ManagedUser[] }>('/users/list.php').then((res) => setUsers(res.users)).finally(() => setLoading(false));
  }

  useEffect(loadUsers, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post('/users/create.php', form);
      setForm({ fullName: '', email: '', role: 'student', password: '' });
      setShowForm(false);
      toast.show(`${form.fullName} was added as a ${form.role}.`, 'success');
      loadUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const u = pendingDelete;
    setPendingDelete(null);
    setDeletingId(u.id);
    try {
      await api.post('/users/delete.php', { userId: u.id });
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      toast.show(`${u.fullName} was deleted.`, 'success');
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : 'Could not delete this user.', 'error');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-800">Manage users</h1>
          <p className="mt-1 text-sm text-ink-400">Create and review Admin, Lecturer, and Student accounts.</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-ink-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800"
        >
          {showForm ? 'Cancel' : '+ New user'}
        </motion.button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            className="mt-6 overflow-hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card title="Create a new account">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {error && (
                  <div role="alert" className="sm:col-span-2 rounded-lg border border-bad-500/30 bg-bad-100 px-3 py-2 text-sm text-bad-500">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-ink-700">Full name</label>
                  <input
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm transition focus:border-ink-600 focus:outline-none focus:ring-2 focus:ring-ink-600/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm transition focus:border-ink-600 focus:outline-none focus:ring-2 focus:ring-ink-600/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                    className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm transition focus:border-ink-600 focus:outline-none focus:ring-2 focus:ring-ink-600/10"
                  >
                    <option value="student">Student</option>
                    <option value="lecturer">Lecturer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700">Temporary password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm transition focus:border-ink-600 focus:outline-none focus:ring-2 focus:ring-ink-600/10"
                  />
                </div>
                <div className="sm:col-span-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-ink-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:opacity-60"
                  >
                    {submitting ? 'Creating…' : 'Create account'}
                  </motion.button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6">
        <Card title={`All users (${users.length})`}>
          {loading ? (
            <p className="text-sm text-ink-400">Loading…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
                    <th className="py-2">Name</th>
                    <th className="py-2">Email</th>
                    <th className="py-2">Role</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  <AnimatePresence initial={false}>
                    {users.map((u) => (
                      <motion.tr
                        key={u.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.25 }}
                        className="hover:bg-ink-50"
                      >
                        <td className="py-2 text-ink-800">{u.fullName}</td>
                        <td className="py-2 text-ink-600">{u.email}</td>
                        <td className="py-2">
                          <span className="rounded-md bg-ink-100 px-2 py-0.5 text-xs font-medium capitalize text-ink-700">{u.role}</span>
                        </td>
                        <td className="py-2 text-right">
                          {u.id === currentUser?.id ? (
                            <span className="text-xs text-ink-400">(you)</span>
                          ) : (
                            <button
                              onClick={() => setPendingDelete(u)}
                              disabled={deletingId === u.id}
                              className="rounded-lg border border-bad-500/30 px-3 py-1 text-xs font-medium text-bad-500 transition hover:bg-bad-100 active:scale-95 disabled:opacity-50"
                            >
                              {deletingId === u.id ? 'Deleting…' : 'Delete'}
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this account?"
        message={pendingDelete ? `${pendingDelete.fullName} (${pendingDelete.email}) will be permanently deleted. This cannot be undone.` : ''}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </Layout>
  );
}
