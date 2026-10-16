<?php
header("Content-Type: application/json");
require_once "../config/db.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST" && $_SERVER["REQUEST_METHOD"] !== "DELETE") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$payload = json_decode(file_get_contents("php://input"), true);
$batchId = isset($payload["batch_id"]) ? (int) $payload["batch_id"] : 0;

if ($batchId < 1) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "A valid batch_id is required"]);
    exit();
}

try {
    $stmt = $pdo->prepare("DELETE FROM medicine_batches WHERE batch_id = :batch_id");
    $stmt->execute(["batch_id" => $batchId]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Medicine batch not found"]);
        exit();
    }

    echo json_encode([
        "status" => "success",
        "message" => "Medicine batch deleted successfully",
    ]);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
