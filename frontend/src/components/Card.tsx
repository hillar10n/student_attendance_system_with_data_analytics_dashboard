import type { ReactNode } from "react";
import { motion } from "framer-motion";
import AnimatedNumber from "./AnimatedNumber";

export function Card({
	title,
	children,
	action,
}: {
	title?: string;
	children: ReactNode;
	action?: ReactNode;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
			className="rounded-xl border border-ink-100 bg-white p-6 shadow-sm"
		>
			{(title || action) && (
				<div className="mb-4 flex items-center justify-between">
					{title && (
						<h3 className="font-display text-base font-semibold text-ink-800">
							{title}
						</h3>
					)}
					{action}
				</div>
			)}
			{children}
		</motion.div>
	);
}

export function StatCard({
	label,
	value,
	suffix = "",
	decimals = 0,
	tone = "default",
}: {
	label: string;
	value: string | number;
	suffix?: string;
	decimals?: number;
	tone?: "default" | "good" | "warn" | "bad";
}) {
	const toneClass = {
		default: "text-ink-800",
		good: "text-good-500",
		warn: "text-warn-500",
		bad: "text-bad-500",
	}[tone];

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			whileHover={{ y: -2 }}
			transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
			className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
		>
			<p className="text-xs font-medium uppercase tracking-wide text-ink-400">
				{label}
			</p>
			<p className={`mt-2 font-display text-3xl font-semibold ${toneClass}`}>
				{typeof value === "number" ? (
					<AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
				) : (
					value
				)}
			</p>
		</motion.div>
	);
}
