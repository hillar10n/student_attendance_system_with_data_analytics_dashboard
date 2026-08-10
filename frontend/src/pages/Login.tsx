import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, ApiError } from "../context/AuthContext";

export default function Login() {
	const { login, user } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	if (user) {
		return <Navigate to={`/${user.role}`} replace />;
	}

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setError(null);
		setSubmitting(true);
		try {
			await login(email, password);
			// Navigation happens on next render once `user` is set.
		} catch (err) {
			setError(
				err instanceof ApiError
					? err.message
					: "Something went wrong. Please try again.",
			);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
			<div className="w-full max-w-sm">
				<motion.div
					className="mb-8 text-center"
					initial={{ opacity: 0, y: -8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
				>
					<p className="font-display text-2xl font-semibold text-white">
						Northumbria University London Campus
					</p>
					<p className="mt-1 text-sm text-ink-200">
						Student Attendance Management System
					</p>
				</motion.div>
				<motion.form
					onSubmit={handleSubmit}
					className="rounded-2xl bg-white p-8 shadow-xl"
					initial={{ opacity: 0, y: 16, scale: 0.98 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
				>
					<h1 className="font-display text-xl font-semibold text-ink-800">
						Sign in
					</h1>
					<p className="mt-1 text-sm text-ink-400">
						Use your institutional details.
					</p>

					<AnimatePresence>
						{error && (
							<motion.div
								role="alert"
								initial={{ opacity: 0, height: 0, marginTop: 0 }}
								animate={{ opacity: 1, height: "auto", marginTop: 16 }}
								exit={{ opacity: 0, height: 0, marginTop: 0 }}
								className="overflow-hidden rounded-lg border border-bad-500/30 bg-bad-100 px-3 py-2 text-sm text-bad-500"
							>
								{error}
							</motion.div>
						)}
					</AnimatePresence>

					<label
						className="mt-5 block text-sm font-medium text-ink-700"
						htmlFor="email"
					>
						Email
					</label>
					<input
						id="email"
						type="email"
						required
						autoFocus
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm transition focus:border-ink-600 focus:outline-none focus:ring-2 focus:ring-ink-600/10"
						placeholder="yourname@institution.ac.uk"
					/>

					<label
						className="mt-4 block text-sm font-medium text-ink-700"
						htmlFor="password"
					>
						Password
					</label>
					<input
						id="password"
						type="password"
						required
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm transition focus:border-ink-600 focus:outline-none focus:ring-2 focus:ring-ink-600/10"
						placeholder="••••••••"
					/>

					<motion.button
						whileTap={{ scale: 0.97 }}
						type="submit"
						disabled={submitting}
						className="mt-6 w-full rounded-lg bg-ink-700 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:opacity-60"
					>
						<AnimatePresence mode="wait" initial={false}>
							<motion.span
								key={submitting ? "loading" : "idle"}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="inline-flex items-center gap-2"
							>
								{submitting && (
									<motion.span
										className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white"
										animate={{ rotate: 360 }}
										transition={{
											repeat: Infinity,
											duration: 0.7,
											ease: "linear",
										}}
									/>
								)}
								{submitting ? "Signing in…" : "Sign in"}
							</motion.span>
						</AnimatePresence>
					</motion.button>

					<Link
						to="/forgot-password"
						className="mt-4 block text-center text-sm text-ink-400 transition hover:text-ink-700"
					>
						Forgot your password?
					</Link>
				</motion.form>
			</div>
		</div>
	);
}
