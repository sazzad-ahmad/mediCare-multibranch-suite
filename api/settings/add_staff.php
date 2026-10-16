<?php
header('Content-Type: application/json');
require_once '../config/db.php';
require_once '../config/audit.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['status'=>'error','message'=>'Method not allowed']); exit; }
$data = json_decode(file_get_contents('php://input'), true) ?: [];
$name = trim((string)($data['name'] ?? '')); $email = trim((string)($data['email'] ?? '')); $password = (string)($data['password'] ?? '');
$role = (string)($data['role'] ?? ''); $branchId = (int)($data['branch_id'] ?? 0);
if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8 || !in_array($role, ['Pharmacist','Cashier'], true) || $branchId < 1) { http_response_code(400); echo json_encode(['status'=>'error','message'=>'Valid name, email, password, role and branch are required']); exit; }
try {
    ensureManagementTables($pdo);
    $stmt = $pdo->prepare("INSERT INTO users (branch_id, name, email, password, role, status) VALUES (:branch_id, :name, :email, :password, :role, 'Active')");
    $stmt->execute(['branch_id'=>$branchId,'name'=>$name,'email'=>$email,'password'=>password_hash($password, PASSWORD_DEFAULT),'role'=>$role]);
    writeAudit($pdo, 'Create', "Staff {$name} created", (string)($data['actor_name'] ?? 'System'), (string)($data['actor_role'] ?? 'Admin'));
    echo json_encode(['status'=>'success','user_id'=>(int)$pdo->lastInsertId()]);
} catch (Throwable $e) { http_response_code(400); echo json_encode(['status'=>'error','message'=>$e->getCode() === '23000' ? 'Email already exists' : $e->getMessage()]); }
?>
