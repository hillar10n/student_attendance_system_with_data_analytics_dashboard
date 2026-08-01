import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Layout from '../../components/Layout';
import { Card, StatCard } from '../../components/Card';
import { api, downloadUrl } from '../../api/client';
import type { Course, CourseDashboard } from '../../types';

const PIE_COLORS = ['#0f7a63', '#b3691e', '#b3312a']; // present / late / absent

export default function Analytics() {
  const [params, setParams] = useSearchParams();
  const courseId = params.get('courseId');
  const [courses, setCourses] = useState<Course[]>([]);
  const [dashboard, setDashboard] = useState<CourseDashboard | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<{ courses: Course[] }>('/courses/list.php').then((res) => {
      setCourses(res.courses);
      if (!courseId && res.courses.length > 0) setParams({ courseId: String(res.courses[0].id) });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    const query = new URLSearchParams({ courseId });
    if (from) query.set('from', from);
    if (to) query.set('to', to);
    api
      .get<CourseDashboard>(`/analytics/dashboard.php?${query.toString()}`)
      .then(setDashboard)
      .finally(() => setLoading(false));
  }, [courseId, from, to]);

  const selectedCourse = courses.find((c) => c.id === Number(courseId));
  const breakdown = dashboard
    ? [
        { name: 'Present', value: dashboard.perStudent.reduce((s, p) => s + p.present, 0) },
        { name: 'Late', value: dashboard.perStudent.reduce((s, p) => s + p.late, 0) },
        { name: 'Absent', value: dashboard.perStudent.reduce((s, p) => s + p.absent, 0) },
      ]
    : [];

  return (
    <Layout>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-800">Analytics dashboard</h1>
          <p className="mt-1 text-sm text-ink-400">{selectedCourse ? `${selectedCourse.name} (${selectedCourse.code})` : 'Select a course'}</p>
        </div>
        <select
          value={courseId ?? ''}
          onChange={(e) => setParams({ courseId: e.target.value })}
          className="rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-ink-600 focus:outline-none"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Date-range selector: made visually prominent (own card, not buried) per the
          usability finding in Section 7.4 where participants initially overlooked it. */}
      <div className="mt-6 rounded-xl border-2 border-gold-400/50 bg-gold-400/5 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gold-600">Date range</p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-ink-600">
            From
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-ink-200 px-2 py-1.5 text-sm" />
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-600">
            To
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-ink-200 px-2 py-1.5 text-sm" />
          </label>
          {(from || to) && (
            <button onClick={() => { setFrom(''); setTo(''); }} className="text-sm text-ink-400 underline hover:text-ink-700">
              Clear
            </button>
          )}
        </div>
      </div>

      {loading || !dashboard ? (
        <p className="mt-6 text-sm text-ink-400">Loading analytics…</p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Overall attendance" value={dashboard.overallAttendanceRate} suffix="%" decimals={1} tone={dashboard.overallAttendanceRate >= 75 ? 'good' : 'warn'} />
            <StatCard label="Students enrolled" value={dashboard.studentCount} />
            <StatCard label="At risk (≤75%)" value={dashboard.atRisk.length} tone={dashboard.atRisk.length > 0 ? 'bad' : 'good'} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title="Attendance trend by week">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dashboard.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6eaf5" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Attendance']} />
                  <Bar dataKey="rate" fill="#2f3f66" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Status breakdown (all sessions)">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={breakdown} dataKey="value" nameKey="name" outerRadius={90} label>
                    {breakdown.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className="mt-6">
            <Card
              title="At-risk students (≤75% attendance)"
            >
              {dashboard.atRisk.length === 0 ? (
                <p className="text-sm text-ink-400">No students currently at risk.</p>
              ) : (
                <ul className="divide-y divide-ink-100">
                  {dashboard.atRisk.map((s) => (
                    <li key={s.studentId} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-ink-800">{s.studentName}</span>
                      <span className="font-semibold text-bad-500">{s.attendanceRate}%</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div className="mt-6">
            <Card
              title="Per-student breakdown"
              action={
                <div className="flex gap-2">
                  <a href={downloadUrl(`/reports/export.php?courseId=${courseId}&format=csv`)} className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-100">
                    Export CSV
                  </a>
                  <a href={downloadUrl(`/reports/export.php?courseId=${courseId}&format=pdf`)} className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-100">
                    Export PDF
                  </a>
                </div>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
                      <th className="py-2">Student</th>
                      <th className="py-2 text-right">Present</th>
                      <th className="py-2 text-right">Late</th>
                      <th className="py-2 text-right">Absent</th>
                      <th className="py-2 text-right">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {dashboard.perStudent.map((s) => (
                      <tr key={s.studentId}>
                        <td className="py-2 text-ink-800">{s.studentName}</td>
                        <td className="py-2 text-right text-ink-600">{s.present}</td>
                        <td className="py-2 text-right text-ink-600">{s.late}</td>
                        <td className="py-2 text-right text-ink-600">{s.absent}</td>
                        <td className={`py-2 text-right font-semibold ${s.attendanceRate <= 75 ? 'text-bad-500' : 'text-good-500'}`}>{s.attendanceRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}
    </Layout>
  );
}
