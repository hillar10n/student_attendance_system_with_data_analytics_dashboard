<?php
require __DIR__ . '/../../lib/bootstrap.php';

$session = require_auth($pdo, ['admin']);

$role = $_GET['role'] ?? null;
if ($role) {
    $stmt = $pdo->prepare("SELECT user_id, full_name, email, role, created_at FROM users WHERE role = ? ORDER BY full_name");
    $stmt->execute([$role]);
} else {
    $stmt = $pdo->query("SELECT user_id, full_name, email, role, created_at FROM users ORDER BY role, full_name");
}

$users = array_map(fn($u) => [
    'id' => (int) $u['user_id'],
    'fullName' => $u['full_name'],
    'email' => $u['email'],
    'role' => $u['role'],
    'createdAt' => $u['created_at'],
], $stmt->fetchAll());

respond(['users' => $users]);
