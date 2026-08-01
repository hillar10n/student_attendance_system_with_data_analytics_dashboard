<?php
require __DIR__ . '/../../lib/bootstrap.php';

$session = require_auth($pdo, ['admin', 'lecturer']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond_error('Method not allowed', 405);

$body = json_body();
$courseId = (int) ($body['courseId'] ?? 0);
$studentId = (int) ($body['studentId'] ?? 0);

if (!$courseId || !$studentId) respond_error('courseId and studentId are required', 422);

if ($session['role'] === 'lecturer') {
    $check = $pdo->prepare("SELECT course_id FROM courses WHERE course_id = ? AND lecturer_id = ?");
    $check->execute([$courseId, $session['user_id']]);
    if (!$check->fetch()) respond_error('Forbidden: not your course', 403);
}

$studentCheck = $pdo->prepare("SELECT user_id FROM users WHERE user_id = ? AND role = 'student'");
$studentCheck->execute([$studentId]);
if (!$studentCheck->fetch()) respond_error('Student not found', 404);

$dupe = $pdo->prepare("SELECT enrolment_id FROM enrolments WHERE student_id = ? AND course_id = ?");
$dupe->execute([$studentId, $courseId]);
if ($dupe->fetch()) respond_error('Student is already enrolled on this course', 409);

$ins = $pdo->prepare("INSERT INTO enrolments (student_id, course_id) VALUES (?, ?)");
$ins->execute([$studentId, $courseId]);

respond(['message' => 'Student enrolled', 'enrolmentId' => (int) $pdo->lastInsertId()], 201);
