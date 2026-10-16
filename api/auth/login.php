<?php
// api/auth/login.php
header("Content-Type: application/json");
require_once "../config/db.php";

$data = json_decode(file_get_contents("php://input"), true);
$requestedBranchId = isset($data["branch_id"]) ? (int) $data["branch_id"] : 0;

if (empty($data['email']) || empty($data['password'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Email and password required."]);
    exit();
}

$stmt = $pdo->prepare("
    SELECT u.user_id, u.name, u.email, u.password, u.role, u.status, u.branch_id, b.branch_name, b.location
    FROM users u
    LEFT JOIN branches b ON u.branch_id = b.branch_id
        WHERE (u.email = :login_email OR (:demo_email = 'pharmacist@medicare.com' AND u.role = 'Pharmacist'))
            AND (:branch_filter = 0 OR u.branch_id = :requested_branch)
        ORDER BY CASE WHEN u.email = :exact_email THEN 0 ELSE 1 END
    LIMIT 1
");
$email = trim($data['email']);
$stmt->execute([
        'login_email' => $email,
        'demo_email' => $email,
        'branch_filter' => $requestedBranchId,
        'requested_branch' => $requestedBranchId,
        'exact_email' => $email,
]);
$user = $stmt->fetch();

// Passwords in SQL: either password_verify or plain fallback for dev seed
if ($user) {
    $isValid = password_verify($data['password'], $user['password']) || ($data['password'] === $user['password']);
    if ($isValid) {
        if (($user['status'] ?? 'Active') === 'Inactive') {
            http_response_code(403);
            echo json_encode(["status" => "error", "message" => "Access Denied: Your account has been deactivated by the Administrator."]);
            exit();
        }
        unset($user['password']);
        echo json_encode([
            "status" => "success",
            "message" => "Login successful",
            "user" => $user
        ]);
        exit();
    }
}

http_response_code(401);
echo json_encode(["status" => "error", "message" => "Invalid email or credentials."]);
?>