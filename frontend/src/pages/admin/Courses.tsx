import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../../components/Layout';
import { Card } from '../../components/Card';
import ConfirmDialog from '../../components/ConfirmDialog';
import { api, ApiError } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import type { Course, ManagedUser } from '../../types';

export default function Courses() {
  const toast = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturers, setLecturers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ courseName: '', courseCode: '', lecturerId: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Course | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Editing (reassigning lecturer / renaming) an existing course
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ courseName: '', courseCode: '', lecturerId: '' });
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  function loadCourses() {
    setLoading(true);
    api.get<{ courses: Course[] }>('/courses/list.php').then((res) => setCourses(res.courses)).finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCourses();
    api.get<{ users: ManagedUser[] }>('/users/list.php?role=lecturer').then((res) => {
      setLecturers(res.users);
      if (res.users.length > 0) setForm((f) => ({ ...f, lecturerId: String(res.users[0].id) }));
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post('/courses/create.php', {
        courseName: form.courseName,
        courseCode: form.courseCode,
        lecturerId: Number(form.lecturerId),
      });
      toast.show(`${form.courseName} was created.`, 'success');
      setForm({ courseName: '', courseCode: '', lecturerId: lecturers[0] ? String(lecturers[0].id) : '' });
      setShowForm(false);
      loadCourses();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const c = pendingDelete;
    setPendingDelete(null);
    setDeletingId(c.id);
    try {
      await api.post('/courses/delete.php', { courseId: c.id });
      setCourses((prev) => prev.filter((x) => x.id !== c.id));
      toast.show(`${c.name} was deleted.`, 'success');
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : 'Could not delete this course.', 'error');
    } finally {
      setDeletingId(null);
    }
  }

  function startEdit(c: Course) {
    setEditForm({ courseName: c.name, courseCode: c.code, lecturerId: String(c.lecturerId) });
    setEditError(null);
    setEditingId(c.id);
  }

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setEditError(null);
    setSavingEdit(true);
    try {
      await api.post('/courses/update.php', {
        courseId: editingId,
        courseName: editForm.courseName,
        courseCode: editForm.courseCode,
        lecturerId: Number(editForm.lecturerId),
      });
      toast.show('Course updated.', 'success');
      setEditingId(null);
      loadCourses();
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-800">Courses</h1>
          <p className="mt-1 text-sm text-ink-400">All courses across the institution.</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-ink-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800"
        >
          {showForm ? 'Cancel' : '+ New course'}
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
            <Card title="Create a new course">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {error && (
                  <div role="alert" className="sm:col-span-3 rounded-lg border border-bad-500/30 bg-bad-100 px-3 py-2 text-sm text-bad-500">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-ink-700">Course name</label>
                  <input
                    required
                    value={form.courseName}
                    onChange={(e) => setForm({ ...form, courseName: e.target.value })}
                    placeholder="e.g. Software Testing"
                    className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm transition focus:border-ink-600 focus:outline-none focus:ring-2 focus:ring-ink-600/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700">Course code</label>
                  <input
                    required
                    value={form.courseCode}
                    onChange={(e) => setForm({ ...form, courseCode: e.target.value })}
                    placeholder="e.g. CS250"
                    className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm transition focus:border-ink-600 focus:outline-none focus:ring-2 focus:ring-ink-600/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700">Lecturer</label>
                  {lecturers.length === 0 ? (
                    <p className="mt-1 text-sm text-ink-400">No lecturer accounts yet — create one under Users first.</p>
                  ) : (
                    <select
                      required
                      value={form.lecturerId}
                      onChange={(e) => setForm({ ...form, lecturerId: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm transition focus:border-ink-600 focus:outline-none focus:ring-2 focus:ring-ink-600/10"
                    >
                      {lecturers.map((l) => (
                        <option key={l.id} value={l.id}>{l.fullName}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="sm:col-span-3">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={submitting || lecturers.length === 0}
                    className="rounded-lg bg-ink-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:opacity-60"
                  >
                    {submitting ? 'Creating…' : 'Create course'}
                  </motion.button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6">
        <Card title={`${courses.length} courses`}>
          {loading ? (
            <p className="text-sm text-ink-400">Loading…</p>
          ) : (
            <div className="divide-y divide-ink-100">
              <AnimatePresence initial={false}>
                {courses.map((c) => (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.22 }}
                    className="py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <div>
                        <p className="font-medium text-ink-800">{c.name}</p>
                        <p className="text-ink-400">{c.code} · led by {c.lecturerName} · {c.studentCount} students</p>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/lecturer/analytics?courseId=${c.id}`} className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:bg-ink-100 active:scale-95">
                          View analytics
                        </Link>
                        <Link to={`/admin/roster?courseId=${c.id}`} className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:bg-ink-100 active:scale-95">
                          Manage roster
                        </Link>
                        <button
                          onClick={() => (editingId === c.id ? setEditingId(null) : startEdit(c))}
                          className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:bg-ink-100 active:scale-95"
                        >
                          {editingId === c.id ? 'Close' : 'Edit'}
                        </button>
                        <button
                          onClick={() => setPendingDelete(c)}
                          disabled={deletingId === c.id}
                          className="rounded-lg border border-bad-500/30 px-3 py-1.5 text-xs font-medium text-bad-500 transition hover:bg-bad-100 active:scale-95 disabled:opacity-50"
                        >
                          {deletingId === c.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {editingId === c.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <form onSubmit={handleSaveEdit} className="mt-3 grid grid-cols-1 gap-3 rounded-lg bg-ink-50 p-4 sm:grid-cols-4">
                            {editError && (
                              <div role="alert" className="sm:col-span-4 rounded-lg border border-bad-500/30 bg-bad-100 px-3 py-2 text-sm text-bad-500">
                                {editError}
                              </div>
                            )}
                            <div>
                              <label className="block text-xs font-medium text-ink-700">Course name</label>
                              <input
                                required
                                value={editForm.courseName}
                                onChange={(e) => setEditForm({ ...editForm, courseName: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-ink-200 px-2.5 py-1.5 text-sm focus:border-ink-600 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-ink-700">Course code</label>
                              <input
                                required
                                value={editForm.courseCode}
                                onChange={(e) => setEditForm({ ...editForm, courseCode: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-ink-200 px-2.5 py-1.5 text-sm focus:border-ink-600 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-ink-700">Lecturer</label>
                              <select
                                required
                                value={editForm.lecturerId}
                                onChange={(e) => setEditForm({ ...editForm, lecturerId: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-ink-200 px-2.5 py-1.5 text-sm focus:border-ink-600 focus:outline-none"
                              >
                                {lecturers.map((l) => (
                                  <option key={l.id} value={l.id}>{l.fullName}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-end">
                              <motion.button
                                whileTap={{ scale: 0.96 }}
                                type="submit"
                                disabled={savingEdit}
                                className="w-full rounded-lg bg-ink-700 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:opacity-60"
                              >
                                {savingEdit ? 'Saving…' : 'Save changes'}
                              </motion.button>
                            </div>
                          </form>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
              {courses.length === 0 && <p className="py-3 text-sm text-ink-400">No courses yet.</p>}
            </div>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this course?"
        message={pendingDelete ? `${pendingDelete.name} (${pendingDelete.code}) and all its enrolments and attendance history will be permanently deleted.` : ''}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </Layout>
  );
}
