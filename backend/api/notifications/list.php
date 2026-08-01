<?php
require __DIR__ . '/../../lib/bootstrap.php';

$session = require_auth($pdo, ['student']);

$stmt = $pdo->prepare(
    "SELECT n.notification_id, n.message, n.attendance_rate, n.is_read, n.created_at, c.course_name
     FROM notifications n JOIN courses c ON c.course_id = n.course_id
     WHERE n.student_id = ? ORDER BY n.created_at DESC"
);
$stmt->execute([$session['user_id']]);

$notifications = array_map(fn($n) => [
    'id' => (int) $n['notification_id'],
    'message' => $n['message'],
    'attendanceRate' => (float) $n['attendance_rate'],
    'isRead' => (bool) $n['is_read'],
    'createdAt' => $n['created_at'],
    'courseName' => $n['course_name'],
], $stmt->fetchAll());

respond(['notifications' => $notifications]);
