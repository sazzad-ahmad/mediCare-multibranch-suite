<?php
header("Content-Type: application/json");
require_once "../config/db.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$payload = json_decode(file_get_contents("php://input"), true);
$required = ["name", "contact", "phone", "email"];
foreach ($required as $field) {
    if (!is_array($payload) || !isset($payload[$field]) || trim((string) $payload[$field]) === "") {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing field: " . $field]);
        exit();
    }
}

try {
    $stmt = $pdo->prepare(
        "INSERT INTO suppliers (company_name, contact_person, phone, email, address)
         VALUES (:name, :contact, :phone, :email, :address)"
    );
    $stmt->execute([
        "name" => trim($payload["name"]),
        "contact" => trim($payload["contact"]),
        "phone" => trim($payload["phone"]),
        "email" => trim($payload["email"]),
        "address" => null,
    ]);
    echo json_encode(["status" => "success", "supplier_id" => (int) $pdo->lastInsertId(), "message" => "Supplier added successfully"]);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
