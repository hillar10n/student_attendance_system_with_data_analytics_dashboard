<?php
// Query-time attendance aggregation (Section 5.4 design decision: no
// pre-computed summary table - see Section 6.2.2 for the trade-off
// discussion). Rates are computed fresh on every call.

const NOTIFICATION_THRESHOLD = 75.0; // percent, configurable per FR05

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

    // Weekly trend: group by ISO week (fixes the cross-month aggregation
    // defect described in Section 6.3, Challenge 3 - grouping by ISO week
    // rather than calendar-day modulo arithmetic).
    $trend = [];
    foreach ($records as $r) {
        $week = date('o-\WW', strtotime($r['session_date']));
        if (!isset($trend[$week])) $trend[$week] = ['week' => $week, 'present' => 0, 'total' => 0];
        $trend[$week]['total']++;
        if ($r['status'] === 'present') $trend[$week]['present']++;
    }
    $trendOut = array_values(array_map(fn($t) => [
        'week' => $t['week'],
        'rate' => $t['total'] > 0 ? round(($t['present'] / $t['total']) * 100, 1) : 0.0,
    ], $trend));

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
