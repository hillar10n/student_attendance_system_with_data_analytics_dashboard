<?php
require __DIR__ . '/../../lib/bootstrap.php';

$session = require_auth($pdo, ['admin', 'lecturer']);

$courseId = (int) ($_GET['courseId'] ?? 0);
if (!$courseId) respond_error('courseId is required', 422);

if ($session['role'] === 'lecturer') {
    $check = $pdo->prepare("SELECT course_id FROM courses WHERE course_id = ? AND lecturer_id = ?");
    $check->execute([$courseId, $session['user_id']]);
    if (!$check->fetch()) respond_error('Forbidden: not your course', 403);
}

$enrolledStmt = $pdo->prepare(
    "SELECT u.user_id, u.full_name, u.email, e.enrolment_id
     FROM enrolments e JOIN users u ON u.user_id = e.student_id
     WHERE e.course_id = ? ORDER BY u.full_name"
);
$enrolledStmt->execute([$courseId]);
$enrolled = array_map(fn($r) => [
    'studentId' => (int) $r['user_id'],
    'fullName' => $r['full_name'],
    'email' => $r['email'],
    'enrolmentId' => (int) $r['enrolment_id'],
], $enrolledStmt->fetchAll());

$availableStmt = $pdo->prepare(
    "SELECT u.user_id, u.full_name, u.email
     FROM users u
     WHERE u.role = 'student'
       AND u.user_id NOT IN (SELECT student_id FROM enrolments WHERE course_id = ?)
     ORDER BY u.full_name"
);
$availableStmt->execute([$courseId]);
$available = array_map(fn($r) => [
    'studentId' => (int) $r['user_id'],
    'fullName' => $r['full_name'],
    'email' => $r['email'],
], $availableStmt->fetchAll());

respond(['courseId' => $courseId, 'enrolled' => $enrolled, 'available' => $available]);