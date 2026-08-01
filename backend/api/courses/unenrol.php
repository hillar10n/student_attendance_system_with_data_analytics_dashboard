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

$find = $pdo->prepare("SELECT enrolment_id FROM enrolments WHERE student_id = ? AND course_id = ?");
$find->execute([$studentId, $courseId]);
$row = $find->fetch();
if (!$row) respond_error('Student is not enrolled on this course', 404);

// Cascades to attendance_records for this enrolment (schema.sql ON DELETE CASCADE) -
// this is a deliberate design decision: unenrolling removes that course's
// attendance history for the student along with it.
$del = $pdo->prepare("DELETE FROM enrolments WHERE enrolment_id = ?");
$del->execute([$row['enrolment_id']]);

respond(['message' => 'Student removed from course']);
