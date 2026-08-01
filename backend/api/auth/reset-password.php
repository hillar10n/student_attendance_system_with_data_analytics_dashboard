<?php
require __DIR__ . '/../../lib/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond_error('Method not allowed', 405);

$body = json_body();
$token = $body['token'] ?? '';
$newPassword = $body['newPassword'] ?? '';

if (strlen($newPassword) < 8) {
    respond_error('Password must be at least 8 characters', 422);
}

$stmt = $pdo->prepare(
    "SELECT reset_token, user_id, expires_at, used FROM password_resets WHERE reset_token = ?"
);
$stmt->execute([$token]);
$reset = $stmt->fetch();

if (!$reset || $reset['used'] || strtotime($reset['expires_at']) < time()) {
    respond_error('Reset link is invalid or has expired', 400);
}

$pdo->beginTransaction();
$upd = $pdo->prepare("UPDATE users SET password_hash = ? WHERE user_id = ?");
$upd->execute([password_hash($newPassword, PASSWORD_BCRYPT), $reset['user_id']]);

$markUsed = $pdo->prepare("UPDATE password_resets SET used = 1 WHERE reset_token = ?");
$markUsed->execute([$token]);
$pdo->commit();

respond(['message' => 'Password updated successfully']);
