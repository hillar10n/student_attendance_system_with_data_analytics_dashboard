<?php
require __DIR__ . '/../../lib/bootstrap.php';

$session = require_auth($pdo, ['admin']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond_error('Method not allowed', 405);

$body = json_body();
$courseId = (int) ($body['courseId'] ?? 0);

if (!$courseId) respond_error('courseId is required', 422);

$check = $pdo->prepare("SELECT course_id FROM courses WHERE course_id = ?");
$check->execute([$courseId]);
if (!$check->fetch()) respond_error('Course not found', 404);

// Deleting a course cascades to enrolments, class_sessions, and (via
// class_sessions) attendance_records, per schema.sql ON DELETE CASCADE.
// This is a deliberate design decision: removing a course removes its
// entire attendance history with it. The frontend confirms this
// explicitly before calling this endpoint.
$del = $pdo->prepare("DELETE FROM courses WHERE course_id = ?");
$del->execute([$courseId]);

respond(['message' => 'Course deleted', 'courseId' => $courseId]);
