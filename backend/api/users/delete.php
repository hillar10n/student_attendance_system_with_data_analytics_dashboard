<?php
require __DIR__ . '/../../lib/bootstrap.php';

$session = require_auth($pdo, ['admin']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond_error('Method not allowed', 405);

$body = json_body();
$userId = (int) ($body['userId'] ?? 0);

if (!$userId) respond_error('userId is required', 422);

if ($userId === $session['user_id']) {
    respond_error('You cannot delete your own account while signed in', 400);
}

$stmt = $pdo->prepare("SELECT user_id, role FROM users WHERE user_id = ?");
$stmt->execute([$userId]);
$target = $stmt->fetch();
if (!$target) respond_error('User not found', 404);

// Guard: don't allow deleting the last remaining admin account.
if ($target['role'] === 'admin') {
    $count = (int) $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'admin'")->fetchColumn();
    if ($count <= 1) {
        respond_error('Cannot delete the last remaining admin account', 400);
    }
}

// Guard: a lecturer with active courses can't be deleted outright (courses.lecturer_id
// is ON DELETE RESTRICT by design - deleting a lecturer should not silently orphan
// or cascade-delete their courses and all associated attendance history).
if ($target['role'] === 'lecturer') {
    $courseCount = $pdo->prepare("SELECT COUNT(*) FROM courses WHERE lecturer_id = ?");
    $courseCount->execute([$userId]);
    if ((int) $courseCount->fetchColumn() > 0) {
        respond_error('This lecturer still owns one or more courses. Reassign or delete those courses first.', 409);
    }
}

// For students: enrolments, attendance_records, and notifications all cascade
// automatically via ON DELETE CASCADE (schema.sql) - this is a deliberate design
// decision (removing a student account removes their attendance history with it).
$del = $pdo->prepare("DELETE FROM users WHERE user_id = ?");
$del->execute([$userId]);

respond(['message' => 'User deleted', 'userId' => $userId]);
