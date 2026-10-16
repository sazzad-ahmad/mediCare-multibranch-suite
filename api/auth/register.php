<?php
header("Content-Type: application/json");
require_once "../config/db.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$payload = json_decode(file_get_contents("php://input"), true);
$required = ["name", "email", "password", "role", "branch_id"];
foreach ($required as $field) {
    if (!is_array($payload) || !isset($payload[$field]) || trim((string) $payload[$field]) === "") {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing field: " . $field]);
        exit();
    }
}

$name = trim($payload["name"]);
$email = strtolower(trim($payload["email"]));
$password = (string) $payload["password"];
$role = (string) $payload["role"];
$branchId = (int) $payload["branch_id"];

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8 || !in_array($role, ["Pharmacist", "Cashier"], true) || $branchId < 1) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid registration details"]);
    exit();
}

try {
    $exists = $pdo->prepare("SELECT user_id FROM users WHERE email = :email LIMIT 1");
    $exists->execute(["email" => $email]);
    if ($exists->fetchColumn()) {
        http_response_code(409);
        echo json_encode(["status" => "error", "message" => "An account with this email already exists"]);
        exit();
    }

    $branch = $pdo->prepare("SELECT branch_id FROM branches WHERE branch_id = :branch_id AND is_active = 1 LIMIT 1");
    $branch->execute(["branch_id" => $branchId]);
    if (!$branch->fetchColumn()) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Assigned branch not found"]);
        exit();
    }

    $insert = $pdo->prepare(
        "INSERT INTO users (branch_id, name, email, password, role, status)
         VALUES (:branch_id, :name, :email, :password, :role, 'Active')"
    );
    $insert->execute([
        "branch_id" => $branchId,
        "name" => $name,
        "email" => $email,
        "password" => password_hash($password, PASSWORD_BCRYPT),
        "role" => $role,
    ]);
    echo json_encode(["status" => "success", "message" => "User registered successfully"]);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
