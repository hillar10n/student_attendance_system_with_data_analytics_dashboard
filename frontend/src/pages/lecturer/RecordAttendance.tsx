import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "../../components/Layout";
import { Card } from "../../components/Card";
import StatusBadge from "../../components/StatusBadge";
import { api } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import type { Course, SessionRoster } from "../../types";

type Status = "present" | "absent" | "late";
const STATUS_OPTIONS: Status[] = ["present", "late", "absent"];

export default function RecordAttendance() {
	const toast = useToast();
	const [params, setParams] = useSearchParams();
	const courseId = params.get("courseId");
	const [courses, setCourses] = useState<Course[]>([]);
	const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
	const [roster, setRoster] = useState<SessionRoster | null>(null);
	const [draft, setDraft] = useState<Record<number, Status>>({});
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		api.get<{ courses: Course[] }>("/courses/list.php").then((res) => {
			setCourses(res.courses);
			if (!courseId && res.courses.length > 0) {
				setParams({ courseId: String(res.courses[0].id) });
			}
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (!courseId) return;
		setLoading(true);
		api
			.get<SessionRoster>(
				`/attendance/session.php?courseId=${courseId}&date=${date}`,
			)
			.then((res) => {
				setRoster(res);
				const initial: Record<number, Status> = {};
				res.roster.forEach((r) => {
					if (r.status) initial[r.studentId] = r.status;
				});
				setDraft(initial);
			})
			.finally(() => setLoading(false));
	}, [courseId, date]);

	function setStatus(studentId: number, status: Status) {
		setDraft((prev) => ({ ...prev, [studentId]: status }));
	}

	function markAllPresent() {
		if (!roster) return;
		const all: Record<number, Status> = {};
		roster.roster.forEach((r) => {
			all[r.studentId] = "present";
		});
		setDraft(all);
	}

	async function handleSave() {
		if (!roster || !courseId) return;
		setSaving(true);
		try {
			const records = roster.roster
				.filter((r) => draft[r.studentId])
				.map((r) => ({
					enrolmentId: r.enrolmentId,
					studentId: r.studentId,
					status: draft[r.studentId],
				}));

			await api.post("/attendance/record.php", {
				sessionId: roster.sessionId,
				courseId: Number(courseId),
				records,
			});
			toast.show(`Attendance saved for ${records.length} students.`, "success");
			setRoster({
				...roster,
				roster: roster.roster.map((r) => ({
					...r,
					status: draft[r.studentId] ?? r.status,
				})),
			});
		} catch {
			toast.show("Could not save attendance. Please try again.", "error");
		} finally {
			setSaving(false);
		}
	}

	const selectedCourse = courses.find((c) => c.id === Number(courseId));

	return (
		<Layout>
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="font-display text-2xl font-semibold text-ink-800">
						Record attendance
					</h1>
					<p className="mt-1 text-sm text-ink-400">
						{selectedCourse
							? `${selectedCourse.name} (${selectedCourse.code})`
							: "Select a course"}
					</p>
				</div>
				<div className="flex gap-3">
					<select
						value={courseId ?? ""}
						onChange={(e) => setParams({ courseId: e.target.value })}
						className="rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-ink-600 focus:outline-none"
					>
						{courses.map((c) => (
							<option key={c.id} value={c.id}>
								{c.name}
							</option>
						))}
					</select>
					<input
						type="date"
						value={date}
						onChange={(e) => setDate(e.target.value)}
						className="rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-ink-600 focus:outline-none"
					/>
				</div>
			</div>

			<div className="mt-6">
				<Card
					title={
						roster
							? `Session roster (${roster.roster.length} students)`
							: "Roster"
					}
					action={
						<button
							onClick={markAllPresent}
							className="text-sm font-medium text-ink-600 underline hover:text-ink-800"
						>
							Mark all present
						</button>
					}
				>
					{loading || !roster ? (
						<p className="text-sm text-ink-400">Loading roster…</p>
					) : (
						<div className="divide-y divide-ink-100">
							{roster.roster.map((r, i) => (
								<motion.div
									key={r.studentId}
									initial={{ opacity: 0, y: 6 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{
										duration: 0.25,
										delay: Math.min(i * 0.02, 0.3),
									}}
									className="flex flex-wrap items-center justify-between gap-3 py-3"
								>
									<div className="flex items-center gap-3">
										<span className="font-medium text-ink-800">
											{r.studentName}
										</span>
										<StatusBadge status={draft[r.studentId] ?? null} />
									</div>
									{/* min-h/min-w 48px meets WCAG 2.2 SC 2.5.8 target size (Section 5.3) */}
									<div
										className="flex gap-2"
										role="group"
										aria-label={`Attendance status for ${r.studentName}`}
									>
										{STATUS_OPTIONS.map((s) => (
											<motion.button
												key={s}
												whileTap={{ scale: 0.9 }}
												whileHover={{
													scale: draft[r.studentId] === s ? 1 : 1.04,
												}}
												onClick={() => setStatus(r.studentId, s)}
												aria-pressed={draft[r.studentId] === s}
												className={`min-h-[48px] min-w-[48px] rounded-lg border px-3 text-xs font-semibold capitalize transition-colors ${
													draft[r.studentId] === s
														? s === "present"
															? "border-good-500 bg-good-500 text-white shadow-sm"
															: s === "late"
																? "border-warn-500 bg-warn-500 text-white shadow-sm"
																: "border-bad-500 bg-bad-500 text-white shadow-sm"
														: "border-ink-200 bg-white text-ink-600 hover:bg-ink-100"
												}`}
											>
												{s}
											</motion.button>
										))}
									</div>
								</motion.div>
							))}
						</div>
					)}

					<div className="mt-5 flex items-center gap-3 border-t border-ink-100 pt-5">
						<motion.button
							whileTap={{ scale: 0.96 }}
							onClick={handleSave}
							disabled={saving || !roster}
							className="rounded-lg bg-ink-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:opacity-60"
						>
							{saving ? "Saving…" : "Save attendance"}
						</motion.button>
					</div>
				</Card>
			</div>
		</Layout>
	);
}
