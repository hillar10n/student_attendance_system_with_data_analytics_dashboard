import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, StatCard } from '../../components/Card';
import { api } from '../../api/client';
import type { Course } from '../../types';

export default function LecturerDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ courses: Course[] }>('/courses/list.php')
      .then((res) => setCourses(res.courses))
      .finally(() => setLoading(false));
  }, []);

  const totalStudents = courses.reduce((sum, c) => sum + (c.studentCount ?? 0), 0);

  return (
    <Layout>
      <h1 className="font-display text-2xl font-semibold text-ink-800">Your dashboard</h1>
      <p className="mt-1 text-sm text-ink-400">Today's sessions and course overview.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Courses" value={courses.length} />
        <StatCard label="Total students" value={totalStudents} />
        <StatCard label="Today" value={new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} />
      </div>

      <div className="mt-8">
        <Card title="Your courses">
          {loading ? (
            <p className="text-sm text-ink-400">Loading…</p>
          ) : (
            <div className="divide-y divide-ink-100">
              {courses.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg py-3 px-2 -mx-2 transition-colors hover:bg-ink-50">
                  <div>
                    <p className="font-medium text-ink-800">{c.name}</p>
                    <p className="text-sm text-ink-400">
                      {c.code} · {c.studentCount} students
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/lecturer/attendance?courseId=${c.id}`}
                      className="rounded-lg bg-ink-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-ink-800 active:scale-95"
                    >
                      Mark attendance
                    </Link>
                    <Link
                      to={`/lecturer/roster?courseId=${c.id}`}
                      className="rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-700 transition hover:bg-ink-100 active:scale-95"
                    >
                      Roster
                    </Link>
                    <Link
                      to={`/lecturer/analytics?courseId=${c.id}`}
                      className="rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-700 transition hover:bg-ink-100 active:scale-95"
                    >
                      Analytics
                    </Link>
                  </div>
                </div>
              ))}
              {courses.length === 0 && <p className="py-3 text-sm text-ink-400">No courses assigned yet.</p>}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
