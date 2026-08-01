<?php
// Seeds the SAMS database with realistic demo data:
// 1 admin, 3 lecturers, 15 students, 3 courses, ~8 weeks of sessions,
// and attendance records with one deliberately at-risk student.

require __DIR__ . '/config/db.php';

function hashPw(string $p): string { return password_hash($p, PASSWORD_BCRYPT); }

$pdo->exec("SET FOREIGN_KEY_CHECKS=0");
foreach (['notifications','attendance_records','class_sessions','enrolments','courses','password_resets','auth_sessions','users'] as $t) {
    $pdo->exec("TRUNCATE TABLE $t");
}
$pdo->exec("SET FOREIGN_KEY_CHECKS=1");

// --- Users ---
$insUser = $pdo->prepare("INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)");

$insUser->execute(['Ada Okafor', 'admin@sams.test', hashPw('Password123!'), 'admin']);
$adminId = $pdo->lastInsertId();

$lecturers = [
    ['Dr. James Whitfield', 'j.whitfield@sams.test'],
    ['Dr. Priya Nair', 'p.nair@sams.test'],
    ['Mr. Callum Reid', 'c.reid@sams.test'],
];
$lecturerIds = [];
foreach ($lecturers as [$name, $email]) {
    $insUser->execute([$name, $email, hashPw('Password123!'), 'lecturer']);
    $lecturerIds[] = $pdo->lastInsertId();
}

$firstNames = ['Amara','Ben','Chidi','Daniel','Efe','Fatima','Grace','Hassan','Ini','Joy','Kemi','Liam','Mayowa','Nkechi','Oscar'];
$lastNames  = ['Bello','Musa','Okoye','Grant','Ahmed','Adeyemi','Chukwu','Ibrahim','Eze','Walker','Yusuf','Bassey','Obi','Danladi','Peters'];
$studentIds = [];
for ($i = 0; $i < 15; $i++) {
    $name = $firstNames[$i] . ' ' . $lastNames[$i];
    $email = strtolower($firstNames[$i][0] . '.' . $lastNames[$i]) . '@student.sams.test';
    $insUser->execute([$name, $email, hashPw('Password123!'), 'student']);
    $studentIds[] = $pdo->lastInsertId();
}

// --- Courses ---
$insCourse = $pdo->prepare("INSERT INTO courses (course_name, course_code, lecturer_id) VALUES (?, ?, ?)");
$courses = [
    ['Web Application Development', 'CS201', $lecturerIds[0]],
    ['Database Systems', 'CS210', $lecturerIds[1]],
    ['Enterprise Architecture', 'CS330', $lecturerIds[2]],
];
$courseIds = [];
foreach ($courses as [$name, $code, $lect]) {
    $insCourse->execute([$name, $code, $lect]);
    $courseIds[] = $pdo->lastInsertId();
}

// --- Enrolments: each student enrolled on 2 of the 3 courses ---
$insEnrol = $pdo->prepare("INSERT INTO enrolments (student_id, course_id) VALUES (?, ?)");
$enrolmentMap = []; // [studentId][courseId] = enrolmentId
foreach ($studentIds as $idx => $sid) {
    $courseSubset = $idx % 2 === 0 ? [$courseIds[0], $courseIds[1]] : [$courseIds[0], $courseIds[2]];
    foreach ($courseSubset as $cid) {
        $insEnrol->execute([$sid, $cid]);
        $enrolmentMap[$sid][$cid] = $pdo->lastInsertId();
    }
}

// --- Sessions: 8 weekly sessions per course, Tuesdays 09:00, starting 8 weeks ago ---
$insSession = $pdo->prepare("INSERT INTO class_sessions (course_id, session_date, start_time) VALUES (?, ?, '09:00:00')");
$sessionMap = []; // [courseId][] = sessionId
$today = new DateTime('now');
foreach ($courseIds as $cid) {
    for ($w = 8; $w >= 1; $w--) {
        $date = (clone $today)->modify("-{$w} weeks")->format('Y-m-d');
        $insSession->execute([$cid, $date]);
        $sessionMap[$cid][] = $pdo->lastInsertId();
    }
}

// --- Attendance: mostly present, a few late/absent, one at-risk student (idx 2 -> 'Chidi Okoye') ---
$insAtt = $pdo->prepare("INSERT INTO attendance_records (enrolment_id, session_id, status) VALUES (?, ?, ?)");
foreach ($enrolmentMap as $sid => $courseEnrolments) {
    $studentIdx = array_search($sid, $studentIds);
    foreach ($courseEnrolments as $cid => $enrolmentId) {
        foreach ($sessionMap[$cid] as $sessionId) {
            if ($studentIdx === 2) {
                // At-risk student: frequently absent
                $roll = mt_rand(1, 100);
                $status = $roll <= 55 ? 'absent' : ($roll <= 70 ? 'late' : 'present');
            } else {
                $roll = mt_rand(1, 100);
                $status = $roll <= 85 ? 'present' : ($roll <= 95 ? 'late' : 'absent');
            }
            $insAtt->execute([$enrolmentId, $sessionId, $status]);
        }
    }
}

echo "Seed complete.\n";
echo "Admin login:    admin@sams.test / Password123!\n";
echo "Lecturer login: j.whitfield@sams.test / Password123!\n";
echo "Student login:  a.bello@student.sams.test / Password123!\n";
echo "At-risk student: c.okoye@student.sams.test / Password123!\n";
