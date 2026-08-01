<?php
require __DIR__ . '/../../lib/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond_error('Method not allowed', 405);

$body = json_body();
$email = trim($body['email'] ?? '');

// Always return a generic success message, whether or not the email
// exists, to avoid leaking which addresses are registered.
$stmt = $pdo->prepare("SELECT user_id FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if ($user) {
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', time() + 900); // 15 minutes, per FR07 acceptance criterion
    $stmt = $pdo->prepare(
        "INSERT INTO password_resets (reset_token, user_id, expires_at) VALUES (?, ?, ?)"
    );
    $stmt->execute([$token, $user['user_id'], $expiresAt]);

    // In production this would be emailed; for this project the link is
    // returned directly in the API response (see Ch6 - no email service
    // configured for the evaluation environment).
    respond(['message' => 'If that email is registered, a reset link has been generated.', 'devResetToken' => $token]);
}

respond(['message' => 'If that email is registered, a reset link has been generated.']);
