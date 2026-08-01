<?php
require __DIR__ . '/../../lib/bootstrap.php';

destroy_session($pdo);
respond(['message' => 'Logged out']);
