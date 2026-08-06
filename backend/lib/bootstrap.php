<?php
// Included at the top of every API endpoint.

// Defensive measure: every endpoint here returns JSON, but PHP's default
// behaviour is to print warnings/notices/deprecations directly into the
// response body as HTML (e.g. "<br /><b>Warning</b>: ..."), which corrupts
// the JSON and breaks the frontend with a confusing "not valid JSON" error
// rather than a clear message - this happened in practice with XAMPP's
// default php.ini, which displays notices that a stricter CLI php.ini
// suppresses. Errors are still logged (so they're not silently lost),
// just not printed into the API response body.
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

// CORS: allow the Vite dev server origin during development.
// In production (same-origin deployment under XAMPP), this is a no-op.
$allowedOrigin = getenv('SAMS_FRONTEND_ORIGIN') ?: 'http://localhost:5173';
header("Access-Control-Allow-Origin: {$allowedOrigin}");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/response.php';

function json_body(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}
