import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import { Card } from '../components/Card';
import ConfirmDialog from '../components/ConfirmDialog';
import { api, ApiError } from '../api/client';
import { useToast } from '../context/ToastContext';
import type { Course, ManageRosterResponse, RosterStudent } from '../types';

export default function ManageRoster() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const courseId = params.get('courseId');
  const [courses, setCourses] = useState<Course[]>([]);
  const [roster, setRoster] = useState<ManageRosterResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [pendingRemove, setPendingRemove] = useState<RosterStudent | null>(null);

  useEffect(() => {
    api.get<{ courses: Course[] }>('/courses/list.php').then((res) => {
      setCourses(res.courses);
      if (!courseId && res.courses.length > 0) setParams({ courseId: String(res.courses[0].id) });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadRoster() {
    if (!courseId) return;
    setLoading(true);
    api
      .get<ManageRosterResponse>(`/courses/roster.php?courseId=${courseId}`)
      .then(setRoster)
      .finally(() => setLoading(false));
  }

  useEffect(loadRoster, [courseId]);

  async function handleEnrol(student: RosterStudent) {
    if (!courseId) return;
    setBusyId(student.studentId);
    try {
      await api.post('/courses/enrol.php', { courseId: Number(courseId), studentId: student.studentId });
      toast.show(`${student.fullName} added to the course.`, 'success');
      loadRoster();
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : 'Could not enrol this student.', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function confirmUnenrol() {
    if (!pendingRemove || !courseId) return;
    const student = pendingRemove;
    setPendingRemove(null);
    setBusyId(student.studentId);
    try {
      await api.post('/courses/unenrol.php', { courseId: Number(courseId), studentId: student.studentId });
      toast.show(`${student.fullName} removed from the course.`, 'success');
      loadRoster();
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : 'Could not remove this student.', 'error');
    } finally {
      setBusyId(null);
    }
  }

  const selectedCourse = courses.find((c) => c.id === Number(courseId));
  const filteredAvailable = (roster?.available ?? []).filter(
    (s) => s.fullName.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-800">Manage roster</h1>
          <p className="mt-1 text-sm text-ink-400">{selectedCourse ? `${selectedCourse.name} (${selectedCourse.code})` : 'Select a course'}</p>
        </div>
        <select
          value={courseId ?? ''}
          onChange={(e) => setParams({ courseId: e.target.value })}
          className="rounded-lg border border-ink-200 px-3 py-2 text-sm transition focus:border-ink-600 focus:outline-none"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title={`Enrolled (${roster?.enrolled.length ?? 0})`}>
          {loading || !roster ? (
            <p className="text-sm text-ink-400">Loading…</p>
          ) : roster.enrolled.length === 0 ? (
            <p className="text-sm text-ink-400">No students enrolled yet.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              <AnimatePresence initial={false}>
                {roster.enrolled.map((s) => (
                  <motion.li
                    key={s.studentId}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.22 }}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink-800">{s.fullName}</p>
                      <p className="text-xs text-ink-400">{s.email}</p>
                    </div>
                    <button
                      onClick={() => setPendingRemove(s)}
                      disabled={busyId === s.studentId}
                      className="rounded-lg border border-bad-500/30 px-3 py-1 text-xs font-medium text-bad-500 transition hover:bg-bad-100 active:scale-95 disabled:opacity-50"
                    >
                      {busyId === s.studentId ? 'Removing…' : 'Remove'}
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </Card>

        <Card title={`Available students (${roster?.available.length ?? 0})`}>
          <input
            type="search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-3 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm transition focus:border-ink-600 focus:outline-none focus:ring-2 focus:ring-ink-600/10"
          />
          {loading || !roster ? (
            <p className="text-sm text-ink-400">Loading…</p>
          ) : filteredAvailable.length === 0 ? (
            <p className="text-sm text-ink-400">No matching students to add.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-ink-100 overflow-y-auto">
              <AnimatePresence initial={false}>
                {filteredAvailable.map((s) => (
                  <motion.li
                    key={s.studentId}
                    layout
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.22 }}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink-800">{s.fullName}</p>
                      <p className="text-xs text-ink-400">{s.email}</p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEnrol(s)}
                      disabled={busyId === s.studentId}
                      className="rounded-lg bg-ink-700 px-3 py-1 text-xs font-medium text-white transition hover:bg-ink-800 disabled:opacity-50"
                    >
                      {busyId === s.studentId ? 'Adding…' : 'Add'}
                    </motion.button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={!!pendingRemove}
        title="Remove student from course?"
        message={pendingRemove ? `${pendingRemove.fullName}'s attendance history for this course will be deleted along with their enrolment.` : ''}
        confirmLabel="Remove"
        onConfirm={confirmUnenrol}
        onCancel={() => setPendingRemove(null)}
      />
    </Layout>
  );
}
