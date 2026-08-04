import { useEffect, useState } from "react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import Layout from "../../components/Layout";
import { Card, StatCard } from "../../components/Card";
import { api } from "../../api/client";
import type { StudentCourseHistory } from "../../types";

export default function StudentDashboard() {
	const [courses, setCourses] = useState<StudentCourseHistory[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		api
			.get<{ courses: StudentCourseHistory[] }>("/attendance/my-history.php")
			.then((res) => setCourses(res.courses))
			.finally(() => setLoading(false));
	}, []);

	const overallRate =
		courses.length > 0
			? Math.round(
					(courses.reduce((s, c) => s + c.summary.attendanceRate, 0) /
						courses.length) *
						10,
				) / 10
			: 0;

	return (
		<Layout>
			<h1 className="font-display text-2xl font-semibold text-ink-800">
				Your attendance
			</h1>
			<p className="mt-1 text-sm text-ink-400">
				A view across all your enrolled courses.
			</p>

			<div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
				<StatCard
					label="Overall attendance"
					value={overallRate}
					suffix="%"
					decimals={1}
					tone={overallRate >= 75 ? "good" : "bad"}
				/>
				<StatCard label="Enrolled courses" value={courses.length} />
			</div>

			{loading ? (
				<p className="mt-6 text-sm text-ink-400">Loading…</p>
			) : (
				<div className="mt-6 space-y-6">
					{courses.map((c) => (
						<Card key={c.courseId} title={`${c.courseName} (${c.courseCode})`}>
							<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
								<div className="lg:col-span-1">
									<p
										className={`font-display text-3xl font-semibold ${c.summary.attendanceRate >= 75 ? "text-good-500" : "text-bad-500"}`}
									>
										{c.summary.attendanceRate}%
									</p>
									<p className="mt-1 text-sm text-ink-400">
										{c.summary.present} present · {c.summary.late} late ·{" "}
										{c.summary.absent} absent
									</p>
									{c.summary.attendanceRate < 75 && (
										<p className="mt-3 rounded-lg border border-bad-500/30 bg-bad-100 px-3 py-2 text-xs text-bad-500">
											Your attendance is below the 75% threshold for this
											course.
										</p>
									)}
								</div>
								<div className="lg:col-span-2">
									<ResponsiveContainer width="100%" height={180}>
										<BarChart data={c.summary.trend}>
											<CartesianGrid strokeDasharray="3 3" stroke="#e6eaf5" />
											<XAxis dataKey="week" tick={{ fontSize: 10 }} />
											<YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
											<Tooltip formatter={(v) => [`${v}%`, "Attendance"]} />
											<Bar
												dataKey="rate"
												fill="#2f3f66"
												radius={[3, 3, 0, 0]}
											/>
										</BarChart>
									</ResponsiveContainer>
								</div>
							</div>
						</Card>
					))}
					{courses.length === 0 && (
						<p className="text-sm text-ink-400">
							You are not enrolled on any courses yet.
						</p>
					)}
				</div>
			)}
		</Layout>
	);
}
