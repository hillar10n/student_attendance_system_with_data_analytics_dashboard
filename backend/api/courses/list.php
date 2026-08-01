<?php
require __DIR__ . '/../../lib/bootstrap.php';

$session = require_auth($pdo);

if ($session['role'] === 'admin') {
    $stmt = $pdo->query(
        "SELECT c.course_id, c.course_name, c.course_code, u.full_name AS lecturer_name,
                (SELECT COUNT(*) FROM enrolments e WHERE e.course_id = c.course_id) AS student_count
         FROM courses c JOIN users u ON u.user_id = c.lecturer_id
         ORDER BY c.course_name"
    );
    $rows = $stmt->fetchAll();
} elseif ($session['role'] === 'lecturer') {
    $stmt = $pdo->prepare(
        "SELECT c.course_id, c.course_name, c.course_code, u.full_name AS lecturer_name,
                (SELECT COUNT(*) FROM enrolments e WHERE e.course_id = c.course_id) AS student_count
         FROM courses c JOIN users u ON u.user_id = c.lecturer_id
         WHERE c.lecturer_id = ?
         ORDER BY c.course_name"
    );
    $stmt->execute([$session['user_id']]);
    $rows = $stmt->fetchAll();
} else { // student
    $stmt = $pdo->prepare(
        "SELECT c.course_id, c.course_name, c.course_code, u.full_name AS lecturer_name, NULL AS student_count
         FROM courses c
         JOIN users u ON u.user_id = c.lecturer_id
         JOIN enrolments e ON e.course_id = c.course_id
         WHERE e.student_id = ?
         ORDER BY c.course_name"
    );
    $stmt->execute([$session['user_id']]);
    $rows = $stmt->fetchAll();
}

$courses = array_map(fn($c) => [
    'id' => (int) $c['course_id'],
    'name' => $c['course_name'],
    'code' => $c['course_code'],
    'lecturerName' => $c['lecturer_name'],
    'studentCount' => $c['student_count'] !== null ? (int) $c['student_count'] : null,
], $rows);

respond(['courses' => $courses]);
