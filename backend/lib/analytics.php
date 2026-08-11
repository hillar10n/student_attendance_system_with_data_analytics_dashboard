<?php
// Query-time attendance aggregation (Section 5.4 design decision: no
// pre-computed summary table - see Section 6.2.2 for the trade-off
// discussion). Rates are computed fresh on every call.

const NOTIFICATION_THRESHOLD = 70.0; // percent, configurable per FR05

/**
 * Given attendance aggregated by raw date ('Y-m-d' => ['present'=>int,
 * 'total'=>int]), returns one entry per weekday (Monday-Friday only,
 * weekends excluded) across the given range, labelled with day name +
 * date (e.g. "Mon 3 Aug") so gaps in the teaching week are visible
 * rather than silently skipped. A day with no session recorded gets
 * 'rate' => null (rendered as an empty gap on the chart) rather than a
 * misleading 0%, since 0% would imply a session happened and every
 * student was absent, which is a different thing entirely.
 *
 * Range resolution: uses $from/$to if both given; otherwise spans from
 * the earliest to latest date actually present in $dailyAgg (snapped
 * out to the Monday of that first week and Friday of that last week);
 * if there is no data and no explicit range, defaults to the current
 * calendar week.
 */
function fill_weekday_trend(array $dailyAgg, ?string $from, ?string $to): array {
    if ($from && $to) {
        $start = new DateTime($from);
        $end = new DateTime($to);
    } else {
        $dates = array_keys($dailyAgg);
        if (empty($dates)) {
            $start = new DateTime('monday this week');
            $end = new DateTime('friday this week');
        } else {
            sort($dates);
            $start = (new DateTime(reset($dates)))->modify('monday this week');
            $end = (new DateTime(end($dates)))->modify('friday this week');
        }
    }

    $out = [];
    $cursor = clone $start;
    while ($cursor <= $end) {
        $dow = (int) $cursor->format('N'); // ISO-8601: 1=Monday ... 7=Sunday
        if ($dow <= 5) {
            $key = $cursor->format('Y-m-d');
            $label = $cursor->format('D j M'); // e.g. "Mon 3 Aug"
            $rate = (isset($dailyAgg[$key]) && $dailyAgg[$key]['total'] > 0)
                ? round(($dailyAgg[$key]['present'] / $dailyAgg[$key]['total']) * 100, 1)
                : null;
            $out[] = ['date' => $label, 'rate' => $rate];
        }
        $cursor->modify('+1 day');
    }
    return $out;
}

/**
 * Returns attendance rate (0-100) and status breakdown for one
 * student on one course, across an optional date range.
 */
function get_student_course_summary(PDO $pdo, int $studentId, int $courseId, ?string $from = null, ?string $to = null): array {
    $sql = "SELECT ar.status, cs.session_date
            FROM attendance_records ar
            JOIN enrolments e ON e.enrolment_id = ar.enrolment_id
            JOIN class_sessions cs ON cs.session_id = ar.session_id
            WHERE e.student_id = ? AND e.course_id = ?";
    $params = [$studentId, $courseId];
    if ($from) { $sql .= " AND cs.session_date >= ?"; $params[] = $from; }
    if ($to)   { $sql .= " AND cs.session_date <= ?"; $params[] = $to; }
    $sql .= " ORDER BY cs.session_date";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $records = $stmt->fetchAll();

    $total = count($records);
    $present = count(array_filter($records, fn($r) => $r['status'] === 'present'));
    $late = count(array_filter($records, fn($r) => $r['status'] === 'late'));
    $absent = count(array_filter($records, fn($r) => $r['status'] === 'absent'));
    $rate = $total > 0 ? round(($present / $total) * 100, 1) : 0.0;

    // Daily trend, filled out to a full Monday-Friday teaching week (see
    // fill_weekday_trend) so gaps in the schedule are visible rather than
    // silently skipped, and each point is labelled with day name + date.
    $dailyAgg = [];
    foreach ($records as $r) {
        $key = date('Y-m-d', strtotime($r['session_date']));
        if (!isset($dailyAgg[$key])) $dailyAgg[$key] = ['present' => 0, 'total' => 0];
        $dailyAgg[$key]['total']++;
        if ($r['status'] === 'present') $dailyAgg[$key]['present']++;
    }
    $trendOut = fill_weekday_trend($dailyAgg, $from, $to);

    return [
        'attendanceRate' => $rate,
        'present' => $present,
        'late' => $late,
        'absent' => $absent,
        'total' => $total,
        'trend' => $trendOut,
    ];
}

/**
 * After attendance is recorded, checks whether the student's rate on
 * this course is at or below NOTIFICATION_THRESHOLD and, if so, and no
 * unread notification already exists, creates one (FR05).
 * Uses >= / <= (not strict >) - see Section 6.3, Challenge 2.
 */
function check_and_notify(PDO $pdo, int $studentId, int $courseId): void {
    $summary = get_student_course_summary($pdo, $studentId, $courseId);
    if ($summary['total'] < 3) return; // don't notify on too little data

    if ($summary['attendanceRate'] <= NOTIFICATION_THRESHOLD) {
        $existing = $pdo->prepare(
            "SELECT notification_id FROM notifications
             WHERE student_id = ? AND course_id = ? AND is_read = 0"
        );
        $existing->execute([$studentId, $courseId]);
        if ($existing->fetch()) return; // avoid duplicate unread notifications

        $courseStmt = $pdo->prepare("SELECT course_name FROM courses WHERE course_id = ?");
        $courseStmt->execute([$courseId]);
        $courseName = $courseStmt->fetchColumn();

        $msg = sprintf(
            'Your attendance for %s has fallen to %.1f%%, at or below the %.0f%% threshold.',
            $courseName, $summary['attendanceRate'], NOTIFICATION_THRESHOLD
        );

        $ins = $pdo->prepare(
            "INSERT INTO notifications (student_id, course_id, message, attendance_rate) VALUES (?, ?, ?, ?)"
        );
        $ins->execute([$studentId, $courseId, $msg, $summary['attendanceRate']]);
    }
}
