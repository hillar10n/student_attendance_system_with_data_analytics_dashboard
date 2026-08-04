<?php
require __DIR__ . '/../../lib/bootstrap.php';

$session = require_auth($pdo, ['admin']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond_error('Method not allowed', 405);

$body = json_body();
$courseId = (int) ($body['courseId'] ?? 0);
$courseName = isset($body['courseName']) ? trim($body['courseName']) : null;
$courseCode = isset($body['courseCode']) ? trim($body['courseCode']) : null;
$lecturerId = isset($body['lecturerId']) ? (int) $body['lecturerId'] : null;

if (!$courseId) respond_error('courseId is required', 422);

$check = $pdo->prepare("SELECT course_id FROM courses WHERE course_id = ?");
$check->execute([$courseId]);
if (!$check->fetch()) respond_error('Course not found', 404);

if ($lecturerId !== null) {
    $lecturerCheck = $pdo->prepare("SELECT user_id FROM users WHERE user_id = ? AND role = 'lecturer'");
    $lecturerCheck->execute([$lecturerId]);
    if (!$lecturerCheck->fetch()) respond_error('Selected lecturer not found', 404);
}

if ($courseCode !== null && $courseCode !== '') {
    $dupe = $pdo->prepare("SELECT course_id FROM courses WHERE course_code = ? AND course_id != ?");
    $dupe->execute([$courseCode, $courseId]);
    if ($dupe->fetch()) respond_error('Another course already uses that code', 409);
}

// Build the update dynamically from whichever fields were actually supplied,
// so a partial update (e.g. lecturer only) doesn't require resending
// courseName/courseCode. Enrolments, sessions, and attendance are untouched -
// only the courses row itself changes.
$fields = [];
$params = [];
if ($courseName !== null && $courseName !== '') { $fields[] = 'course_name = ?'; $params[] = $courseName; }
if ($courseCode !== null && $courseCode !== '') { $fields[] = 'course_code = ?'; $params[] = $courseCode; }
if ($lecturerId !== null) { $fields[] = 'lecturer_id = ?'; $params[] = $lecturerId; }

if (empty($fields)) respond_error('No fields to update were provided', 422);

$params[] = $courseId;
$sql = "UPDATE courses SET " . implode(', ', $fields) . " WHERE course_id = ?";
$upd = $pdo->prepare($sql);
$upd->execute($params);

respond(['message' => 'Course updated', 'courseId' => $courseId]);