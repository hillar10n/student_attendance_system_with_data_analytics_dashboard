<?php
require __DIR__ . '/../../lib/bootstrap.php';
require __DIR__ . '/../../lib/analytics.php';

$session = require_auth($pdo, ['lecturer', 'admin']);

$courseId = (int) ($_GET['courseId'] ?? 0);
$from = $_GET['from'] ?? null;
$to = $_GET['to'] ?? null;
if (!$courseId) respond_error('courseId is required', 422);

if ($session['role'] === 'lecturer') {
    $check = $pdo->prepare("SELECT course_id FROM courses WHERE course_id = ? AND lecturer_id = ?");
    $check->execute([$courseId, $session['user_id']]);
    if (!$check->fetch()) respond_error('Forbidden: not your course', 403);
}

$studentsStmt = $pdo->prepare(
    "SELECT u.user_id, u.full_name FROM enrolments e JOIN users u ON u.user_id = e.student_id
     WHERE e.course_id = ? ORDER BY u.full_name"
);
$studentsStmt->execute([$courseId]);
$students = $studentsStmt->fetchAll();

$perStudent = [];
$atRisk = [];
$courseTrendAgg = []; // week => [present, total]

foreach ($students as $s) {
    $summary = get_student_course_summary($pdo, (int) $s['user_id'], $courseId, $from, $to);
    $perStudent[] = [
        'studentId' => (int) $s['user_id'],
        'studentName' => $s['full_name'],
        'attendanceRate' => $summary['attendanceRate'],
        'present' => $summary['present'],
        'late' => $summary['late'],
        'absent' => $summary['absent'],
        'total' => $summary['total'],
    ];
    if ($summary['total'] >= 3 && $summary['attendanceRate'] <= NOTIFICATION_THRESHOLD) {
        $atRisk[] = ['studentId' => (int) $s['user_id'], 'studentName' => $s['full_name'], 'attendanceRate' => $summary['attendanceRate']];
    }
    foreach ($summary['trend'] as $t) {
        if (!isset($courseTrendAgg[$t['week']])) $courseTrendAgg[$t['week']] = ['present' => 0, 'total' => 0];
    }
}

// Course-wide trend: recompute directly (simpler + avoids double counting).
$trendStmt = $pdo->prepare(
    "SELECT cs.session_date, ar.status
     FROM attendance_records ar
     JOIN class_sessions cs ON cs.session_id = ar.session_id
     WHERE cs.course_id = ?
     ORDER BY cs.session_date"
);
$trendStmt->execute([$courseId]);
$trendRows = $trendStmt->fetchAll();
$weekAgg = [];
foreach ($trendRows as $r) {
    $week = date('o-\WW', strtotime($r['session_date']));
    if (!isset($weekAgg[$week])) $weekAgg[$week] = ['present' => 0, 'total' => 0];
    $weekAgg[$week]['total']++;
    if ($r['status'] === 'present') $weekAgg[$week]['present']++;
}
$courseTrend = array_map(
    fn($week, $v) => ['week' => $week, 'rate' => $v['total'] > 0 ? round(($v['present'] / $v['total']) * 100, 1) : 0],
    array_keys($weekAgg), array_values($weekAgg)
);

$overallRate = count($perStudent) > 0
    ? round(array_sum(array_column($perStudent, 'attendanceRate')) / count($perStudent), 1)
    : 0.0;

respond([
    'courseId' => $courseId,
    'overallAttendanceRate' => $overallRate,
    'studentCount' => count($students),
    'trend' => array_values($courseTrend),
    'perStudent' => $perStudent,
    'atRisk' => $atRisk,
]);
