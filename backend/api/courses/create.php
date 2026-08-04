<?php
require __DIR__ . '/../../lib/bootstrap.php';

$session = require_auth($pdo, ['admin']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond_error('Method not allowed', 405);

$body = json_body();
$courseName = trim($body['courseName'] ?? '');
$courseCode = trim($body['courseCode'] ?? '');
$lecturerId = (int) ($body['lecturerId'] ?? 0);

if ($courseName === '' || $courseCode === '' || !$lecturerId) {
    respond_error('courseName, courseCode, and lecturerId are required', 422);
}

$lecturerCheck = $pdo->prepare("SELECT user_id FROM users WHERE user_id = ? AND role = 'lecturer'");
$lecturerCheck->execute([$lecturerId]);
if (!$lecturerCheck->fetch()) {
    respond_error('Selected lecturer not found', 404);
}

$dupe = $pdo->prepare("SELECT course_id FROM courses WHERE course_code = ?");
$dupe->execute([$courseCode]);
if ($dupe->fetch()) {
    respond_error('A course with that code already exists', 409);
}

$ins = $pdo->prepare("INSERT INTO courses (course_name, course_code, lecturer_id) VALUES (?, ?, ?)");
$ins->execute([$courseName, $courseCode, $lecturerId]);

respond(['id' => (int) $pdo->lastInsertId(), 'name' => $courseName, 'code' => $courseCode], 201);
