<?php
require __DIR__ . '/../../lib/bootstrap.php';

$session = require_auth($pdo, ['admin']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond_error('Method not allowed', 405);

$body = json_body();
$fullName = trim($body['fullName'] ?? '');
$email = trim($body['email'] ?? '');
$role = $body['role'] ?? '';
$password = $body['password'] ?? '';

if ($fullName === '' || $email === '' || $password === '') {
    respond_error('fullName, email, and password are required', 422);
}
if (!in_array($role, ['admin', 'lecturer', 'student'], true)) {
    respond_error('role must be admin, lecturer, or student', 422);
}
if (strlen($password) < 8) {
    respond_error('Password must be at least 8 characters', 422);
}

$dupe = $pdo->prepare("SELECT user_id FROM users WHERE email = ?");
$dupe->execute([$email]);
if ($dupe->fetch()) {
    respond_error('A user with that email already exists', 409);
}

$stmt = $pdo->prepare(
    "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)"
);
$stmt->execute([$fullName, $email, password_hash($password, PASSWORD_BCRYPT), $role]);

respond(['id' => (int) $pdo->lastInsertId(), 'fullName' => $fullName, 'email' => $email, 'role' => $role], 201);
