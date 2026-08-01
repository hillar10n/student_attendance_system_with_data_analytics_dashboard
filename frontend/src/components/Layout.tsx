import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  to: string;
  label: string;
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  admin: [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/courses', label: 'Courses' },
    { to: '/admin/roster', label: 'Roster' },
  ],
  lecturer: [
    { to: '/lecturer', label: 'Dashboard' },
    { to: '/lecturer/attendance', label: 'Attendance' },
    { to: '/lecturer/roster', label: 'Roster' },
    { to: '/lecturer/analytics', label: 'Analytics' },
  ],
  student: [
    { to: '/student', label: 'Dashboard' },
    { to: '/student/notifications', label: 'Notifications' },
  ],
};

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;
  const items = NAV_BY_ROLE[user.role] ?? [];
  const activeIndex = items.findIndex((item) =>
    item.to === `/${user.role}` ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen bg-ink-50">
      <aside className="flex w-60 flex-col border-r border-ink-100 bg-white">
        <motion.div
          className="px-6 py-6"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="font-display text-lg font-semibold text-ink-800">SAMS</p>
          <p className="text-xs text-ink-400">Attendance &amp; Analytics</p>
        </motion.div>
        <nav className="relative flex-1 space-y-1 px-3">
          {items.map((item, i) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === `/${user.role}`}
              className="relative block rounded-lg px-3 py-2 text-sm font-medium"
            >
              {i === activeIndex && (
                <motion.div
                  layoutId="active-nav-pill"
                  className="absolute inset-0 rounded-lg bg-ink-700"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className={`relative z-10 transition-colors ${i === activeIndex ? 'text-white' : 'text-ink-600 hover:text-ink-800'}`}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-ink-100 p-4">
          <p className="truncate text-sm font-medium text-ink-800">{user.fullName}</p>
          <p className="truncate text-xs capitalize text-ink-400">{user.role}</p>
          <button
            onClick={handleLogout}
            className="mt-3 w-full rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 transition hover:bg-ink-100 active:scale-95"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname + location.search}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
