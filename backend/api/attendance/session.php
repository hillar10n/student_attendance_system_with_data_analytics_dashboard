<?php
require __DIR__ . '/../../lib/bootstrap.php';

$session = require_auth($pdo, ['lecturer', 'admin']);

$courseId = (int) ($_GET['courseId'] ?? 0);
$date = $_GET['date'] ?? date('Y-m-d');

if (!$courseId) respond_error('courseId is required', 422);

// Confirm the lecturer owns this course (admins may view any course).
if ($session['role'] === 'lecturer') {
    $check = $pdo->prepare("SELECT course_id FROM courses WHERE course_id = ? AND lecturer_id = ?");
    $check->execute([$courseId, $session['user_id']]);
    if (!$check->fetch()) respond_error('Forbidden: not your course', 403);
}

// Find or create the session row for this date (default 09:00 slot).
$find = $pdo->prepare("SELECT session_id FROM class_sessions WHERE course_id = ? AND session_date = ?");
$find->execute([$courseId, $date]);
$row = $find->fetch();

if ($row) {
    $sessionId = (int) $row['session_id'];
} else {
    $ins = $pdo->prepare("INSERT INTO class_sessions (course_id, session_date, start_time) VALUES (?, ?, '09:00:00')");
    $ins->execute([$courseId, $date]);
    $sessionId = (int) $pdo->lastInsertId();
}

// Roster: every enrolled student, with existing status if already recorded.
$stmt = $pdo->prepare(
    "SELECT u.user_id, u.full_name, e.enrolment_id, ar.status
     FROM enrolments e
     JOIN users u ON u.user_id = e.student_id
     LEFT JOIN attendance_records ar ON ar.enrolment_id = e.enrolment_id AND ar.session_id = ?
     WHERE e.course_id = ?
     ORDER BY u.full_name"
);
$stmt->execute([$sessionId, $courseId]);

$roster = array_map(fn($r) => [
    'studentId' => (int) $r['user_id'],
    'studentName' => $r['full_name'],
    'enrolmentId' => (int) $r['enrolment_id'],
    'status' => $r['status'], // null if not yet recorded
], $stmt->fetchAll());

respond(['sessionId' => $sessionId, 'courseId' => $courseId, 'date' => $date, 'roster' => $roster]);
