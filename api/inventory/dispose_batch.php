<?php
header("Content-Type: application/json");
require_once "../config/db.php";
require_once "../config/audit.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$payload = json_decode(file_get_contents("php://input"), true);
$batchId = is_array($payload) ? (int) ($payload["batch_id"] ?? 0) : 0;
if ($batchId < 1) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid batch id"]);
    exit();
}

$statement = $pdo->prepare("UPDATE medicine_batches SET stock_quantity = 0 WHERE batch_id = :batch_id");
$statement->execute(["batch_id" => $batchId]);

if ($statement->rowCount() === 0) {
    http_response_code(404);
    echo json_encode(["status" => "error", "message" => "Medicine batch not found"]);
    exit();
}

writeAudit($pdo, "Delete", "Batch {$batchId} stock disposed", (string) ($payload["actor_name"] ?? "System"), (string) ($payload["actor_role"] ?? "Pharmacist"));

echo json_encode(["status" => "success", "message" => "Batch stock disposed successfully"]);
?>