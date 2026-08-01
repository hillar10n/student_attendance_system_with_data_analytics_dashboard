import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { Card } from '../../components/Card';
import { api } from '../../api/client';
import type { NotificationItem } from '../../types';

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ notifications: NotificationItem[] }>('/notifications/list.php')
      .then((res) => setNotifications(res.notifications))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <h1 className="font-display text-2xl font-semibold text-ink-800">Notifications</h1>
      <p className="mt-1 text-sm text-ink-400">Low-attendance alerts for your courses.</p>

      <div className="mt-6">
        <Card>
          {loading ? (
            <p className="text-sm text-ink-400">Loading…</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-ink-400">No notifications — your attendance is above the threshold on all courses.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {notifications.map((n) => (
                <li key={n.id} className="flex items-start gap-3 py-3">
                  <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-bad-500" aria-hidden />
                  <div>
                    <p className="text-sm text-ink-800">{n.message}</p>
                    <p className="mt-1 text-xs text-ink-400">
                      {n.courseName} · {new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Layout>
  );
}
