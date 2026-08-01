<?php
// Database connection (PDO, MySQL/MariaDB).
// In a XAMPP setup, defaults below work out of the box against
// phpMyAdmin's default root account with no password.

$DB_HOST = getenv('SAMS_DB_HOST') ?: '127.0.0.1';
$DB_NAME = getenv('SAMS_DB_NAME') ?: 'sams';
$DB_USER = getenv('SAMS_DB_USER') ?: 'root';
$DB_PASS = getenv('SAMS_DB_PASS') ?: '';

try {
    $pdo = new PDO(
        "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}
