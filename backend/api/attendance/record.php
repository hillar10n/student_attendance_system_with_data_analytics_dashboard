<?php
require __DIR__ . '/../../lib/bootstrap.php';
require __DIR__ . '/../../lib/analytics.php';

$session = require_auth($pdo, ['lecturer', 'admin']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond_error('Method not allowed', 405);

$body = json_body();
$sessionId = (int) ($body['sessionId'] ?? 0);
$courseId = (int) ($body['courseId'] ?? 0);
$records = $body['records'] ?? []; // [{ enrolmentId, studentId, status }]

if (!$sessionId || !$courseId || !is_array($records) || count($records) === 0) {
    respond_error('sessionId, courseId, and a non-empty records array are required', 422);
}

if ($session['role'] === 'lecturer') {
    $check = $pdo->prepare("SELECT course_id FROM courses WHERE course_id = ? AND lecturer_id = ?");
    $check->execute([$courseId, $session['user_id']]);
    if (!$check->fetch()) respond_error('Forbidden: not your course', 403);
}

$validStatuses = ['present', 'absent', 'late'];
$upsert = $pdo->prepare(
    "INSERT INTO attendance_records (enrolment_id, session_id, status)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status), recorded_at = CURRENT_TIMESTAMP"
);

$pdo->beginTransaction();
try {
    foreach ($records as $r) {
        $enrolmentId = (int) ($r['enrolmentId'] ?? 0);
        $status = $r['status'] ?? '';
        if (!$enrolmentId || !in_array($status, $validStatuses, true)) {
            throw new InvalidArgumentException("Invalid record: enrolmentId={$enrolmentId}, status={$status}");
        }
        $upsert->execute([$enrolmentId, $sessionId, $status]);
    }
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    respond_error('Failed to save attendance: ' . $e->getMessage(), 422);
}

// FR05: check each affected student's rate and notify if at/below threshold.
$studentIds = array_column($records, 'studentId');
foreach (array_unique($studentIds) as $sid) {
    if ($sid) check_and_notify($pdo, (int) $sid, $courseId);
}

respond(['message' => 'Attendance saved', 'sessionId' => $sessionId, 'recordCount' => count($records)]);
