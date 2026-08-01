<?php
// Authentication & Role-Based Access Control.
// Server-side session tokens stored in an httpOnly cookie, verified
// against the auth_sessions table on every request (Section 6.2.1) -
// role is never trusted from client input.

const SESSION_LIFETIME_SECONDS = 60 * 60 * 8; // 8 hours

function create_session(PDO $pdo, int $userId, string $role): string {
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', time() + SESSION_LIFETIME_SECONDS);

    $stmt = $pdo->prepare(
        "INSERT INTO auth_sessions (token, user_id, role, expires_at) VALUES (?, ?, ?, ?)"
    );
    $stmt->execute([$token, $userId, $role, $expiresAt]);

    setcookie('session_token', $token, [
        'expires' => time() + SESSION_LIFETIME_SECONDS,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        // 'secure' => true, // enable once served over HTTPS
    ]);

    return $token;
}

function destroy_session(PDO $pdo): void {
    $token = $_COOKIE['session_token'] ?? null;
    if ($token) {
        $stmt = $pdo->prepare("DELETE FROM auth_sessions WHERE token = ?");
        $stmt->execute([$token]);
    }
    setcookie('session_token', '', ['expires' => time() - 3600, 'path' => '/']);
}

/**
 * Verifies the session token against the database and, if $requiredRoles
 * is given, checks the authenticated user's role is permitted.
 * Exits with 401/403 on failure (NFR02/NFR03 - role-based access control).
 */
function require_auth(PDO $pdo, ?array $requiredRoles = null): array {
    $token = $_COOKIE['session_token'] ?? null;
    if (!$token) {
        respond_error('Unauthenticated', 401);
    }

    $stmt = $pdo->prepare(
        "SELECT s.user_id, s.role, s.expires_at, u.full_name, u.email
         FROM auth_sessions s JOIN users u ON u.user_id = s.user_id
         WHERE s.token = ?"
    );
    $stmt->execute([$token]);
    $session = $stmt->fetch();

    if (!$session || strtotime($session['expires_at']) < time()) {
        respond_error('Session expired or invalid', 401);
    }

    if ($requiredRoles !== null && !in_array($session['role'], $requiredRoles, true)) {
        respond_error('Forbidden: insufficient role', 403);
    }

    return [
        'user_id' => (int) $session['user_id'],
        'role' => $session['role'],
        'full_name' => $session['full_name'],
        'email' => $session['email'],
    ];
}
