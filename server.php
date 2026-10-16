<?php
// server.php - Router with full CORS support
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

if ($uri !== '/' && file_exists(__DIR__ . $uri)) {
    return false;
}

if ($uri === '/' || $uri === '') {
    header("Content-Type: application/json");
    echo json_encode(["status" => "online", "message" => "MediCare API is live with TiDB Cloud"]);
    exit;
}

http_response_code(404);
header("Content-Type: application/json");
echo json_encode(["status" => "error", "message" => "Endpoint not found"]);