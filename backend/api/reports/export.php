<?php
require __DIR__ . '/../../lib/bootstrap.php';
require __DIR__ . '/../../lib/analytics.php';
require __DIR__ . '/../../lib/simple_pdf.php';

$session = require_auth($pdo, ['lecturer', 'admin']);

$courseId = (int) ($_GET['courseId'] ?? 0);
$format = $_GET['format'] ?? 'csv';
if (!$courseId) respond_error('courseId is required', 422);
if (!in_array($format, ['csv', 'pdf'], true)) respond_error('format must be csv or pdf', 422);

if ($session['role'] === 'lecturer') {
    $check = $pdo->prepare("SELECT course_id FROM courses WHERE course_id = ? AND lecturer_id = ?");
    $check->execute([$courseId, $session['user_id']]);
    if (!$check->fetch()) respond_error('Forbidden: not your course', 403);
}

$courseStmt = $pdo->prepare("SELECT course_name, course_code FROM courses WHERE course_id = ?");
$courseStmt->execute([$courseId]);
$course = $courseStmt->fetch();
if (!$course) respond_error('Course not found', 404);

$studentsStmt = $pdo->prepare(
    "SELECT u.user_id, u.full_name FROM enrolments e JOIN users u ON u.user_id = e.student_id
     WHERE e.course_id = ? ORDER BY u.full_name"
);
$studentsStmt->execute([$courseId]);
$students = $studentsStmt->fetchAll();

$rows = [];
foreach ($students as $s) {
    $summary = get_student_course_summary($pdo, (int) $s['user_id'], $courseId);
    $rows[] = [
        'name' => $s['full_name'],
        'present' => $summary['present'],
        'late' => $summary['late'],
        'absent' => $summary['absent'],
        'total' => $summary['total'],
        'rate' => $summary['attendanceRate'],
    ];
}

$filenameBase = 'attendance_' . preg_replace('/[^A-Za-z0-9_-]/', '_', $course['course_code']) . '_' . date('Y-m-d');

if ($format === 'csv') {
    header('Content-Type: text/csv');
    header("Content-Disposition: attachment; filename=\"{$filenameBase}.csv\"");
    $out = fopen('php://output', 'w');
    fputcsv($out, ['Student Name', 'Present', 'Late', 'Absent', 'Total Sessions', 'Attendance Rate (%)']);
    foreach ($rows as $r) {
        fputcsv($out, [$r['name'], $r['present'], $r['late'], $r['absent'], $r['total'], $r['rate']]);
    }
    fclose($out);
    exit;
}

// PDF
$lines = ["Course: {$course['course_name']} ({$course['course_code']})", "Generated: " . date('Y-m-d H:i'), ""];
$lines[] = str_pad('Student', 28) . str_pad('Present', 9) . str_pad('Late', 7) . str_pad('Absent', 8) . str_pad('Total', 7) . 'Rate %';
foreach ($rows as $r) {
    $lines[] = str_pad(substr($r['name'], 0, 27), 28) . str_pad((string)$r['present'], 9) . str_pad((string)$r['late'], 7) . str_pad((string)$r['absent'], 8) . str_pad((string)$r['total'], 7) . $r['rate'];
}
$pdfBytes = generate_simple_pdf("Attendance Report: {$course['course_name']}", $lines);

header('Content-Type: application/pdf');
header("Content-Disposition: attachment; filename=\"{$filenameBase}.pdf\"");
header('Content-Length: ' . strlen($pdfBytes));
echo $pdfBytes;
