<?php

function respond($data, int $code = 200): never {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function respond_error(string $message, int $code = 400): never {
    http_response_code($code);
    echo json_encode(['error' => $message]);
    exit;
}
