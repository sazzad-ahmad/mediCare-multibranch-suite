<?php
// server.php - Router for Render PHP built-in server
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