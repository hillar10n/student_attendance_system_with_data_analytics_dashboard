<?php
require __DIR__ . '/../../lib/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond_error('Method not allowed', 405);

$body = json_body();
$email = trim($body['email'] ?? '');
$password = $body['password'] ?? '';

if ($email === '' || $password === '') {
    respond_error('Email and password are required', 422);
}

$stmt = $pdo->prepare("SELECT user_id, full_name, email, password_hash, role FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    respond_error('Invalid email or password', 401);
}

create_session($pdo, $user['user_id'], $user['role']);

respond([
    'user' => [
        'id' => (int) $user['user_id'],
        'fullName' => $user['full_name'],
        'email' => $user['email'],
        'role' => $user['role'],
    ],
]);
