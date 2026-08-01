<?php
require __DIR__ . '/../../lib/bootstrap.php';

$session = require_auth($pdo);

respond([
    'user' => [
        'id' => $session['user_id'],
        'fullName' => $session['full_name'],
        'email' => $session['email'],
        'role' => $session['role'],
    ],
]);
