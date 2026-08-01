<?php
require __DIR__ . '/../../lib/bootstrap.php';
require __DIR__ . '/../../lib/analytics.php';

$session = require_auth($pdo, ['student']);

$stmt = $pdo->prepare(
    "SELECT c.course_id, c.course_name, c.course_code
     FROM enrolments e JOIN courses c ON c.course_id = e.course_id
     WHERE e.student_id = ? ORDER BY c.course_name"
);
$stmt->execute([$session['user_id']]);
$courses = $stmt->fetchAll();

$out = [];
foreach ($courses as $c) {
    $summary = get_student_course_summary($pdo, $session['user_id'], (int) $c['course_id']);
    $out[] = [
        'courseId' => (int) $c['course_id'],
        'courseName' => $c['course_name'],
        'courseCode' => $c['course_code'],
        'summary' => $summary,
    ];
}

respond(['courses' => $out]);
