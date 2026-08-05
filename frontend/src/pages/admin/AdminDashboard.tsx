import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { Card, StatCard } from "../../components/Card";
import { api } from "../../api/client";
import type { Course, ManagedUser } from "../../types";

export default function AdminDashboard() {
	const [courses, setCourses] = useState<Course[]>([]);
	const [users, setUsers] = useState<ManagedUser[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		Promise.all([
			api.get<{ courses: Course[] }>("/courses/list.php"),
			api.get<{ users: ManagedUser[] }>("/users/list.php"),
		])
			.then(([c, u]) => {
				setCourses(c.courses);
				setUsers(u.users);
			})
			.finally(() => setLoading(false));
	}, []);

	const counts = {
		admin: users.filter((u) => u.role === "admin").length,
		lecturer: users.filter((u) => u.role === "lecturer").length,
		student: users.filter((u) => u.role === "student").length,
	};

	return (
		<Layout>
			<h1 className="font-display text-2xl font-semibold text-ink-800">
				Admin overview
			</h1>
			<p className="mt-1 text-sm text-ink-400">
				System summary across all courses and students.
			</p>

			{loading ? (
				<p className="mt-6 text-sm text-ink-400">Loading…</p>
			) : (
				<>
					<div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
						<StatCard label="Courses" value={courses.length} />
						<StatCard label="Lecturers" value={counts.lecturer} />
						<StatCard label="Students" value={counts.student} />
						<StatCard label="Admins" value={counts.admin} />
					</div>

					<div className="mt-6">
						<Card title="Courses">
							<div className="divide-y divide-ink-100">
								{courses.map((c) => (
									<div
										key={c.id}
										className="flex items-center justify-between py-3 text-sm"
									>
										<div>
											<p className="font-medium text-ink-800">{c.name}</p>
											<p className="text-ink-400">
												{c.code} · led by {c.lecturerName}
											</p>
										</div>
										<span className="text-ink-600">
											{c.studentCount} students
										</span>
									</div>
								))}
							</div>
						</Card>
					</div>
				</>
			)}
		</Layout>
	);
}
