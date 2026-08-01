import { motion, AnimatePresence } from 'framer-motion';

type Status = 'present' | 'absent' | 'late';

const STYLES: Record<Status, string> = {
  present: 'bg-good-100 text-good-500 border-good-500/30',
  absent: 'bg-bad-100 text-bad-500 border-bad-500/30',
  late: 'bg-warn-100 text-warn-500 border-warn-500/30',
};

const LABELS: Record<Status, string> = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
};

export default function StatusBadge({ status }: { status: Status | null }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={status ?? 'none'}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.16 }}
        className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${
          status ? STYLES[status] : 'border-ink-200 bg-ink-50 text-ink-400'
        }`}
      >
        {status ? LABELS[status] : 'Not recorded'}
      </motion.span>
    </AnimatePresence>
  );
}
