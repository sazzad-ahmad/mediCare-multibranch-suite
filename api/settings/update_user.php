<?php
header('Content-Type: application/json');
require_once '../config/db.php';
require_once '../config/audit.php';
if (!in_array($_SERVER['REQUEST_METHOD'], ['POST','PUT'], true)) { http_response_code(405); echo json_encode(['status'=>'error','message'=>'Method not allowed']); exit; }
$data = json_decode(file_get_contents('php://input'), true) ?: [];
$id = (int)($data['user_id'] ?? 0); $name = trim((string)($data['name'] ?? '')); $email = trim((string)($data['email'] ?? ''));
$role = (string)($data['role'] ?? ''); $status = (string)($data['status'] ?? ''); $branchId = (int)($data['branch_id'] ?? 0);
if ($id < 1 || $name === '' || !in_array($role, ['Admin','Pharmacist','Cashier','Viewer'], true) || !in_array($status, ['Active','Inactive'], true) || $branchId < 1) { http_response_code(400); echo json_encode(['status'=>'error','message'=>'Invalid user details']); exit; }
try {
    if ($email === '') { $emailStmt = $pdo->prepare('SELECT email FROM users WHERE user_id = :id'); $emailStmt->execute(['id' => $id]); $email = (string)$emailStmt->fetchColumn(); }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { http_response_code(400); echo json_encode(['status'=>'error','message'=>'Invalid email']); exit; }
    $stmt = $pdo->prepare('UPDATE users SET name = :name, email = :email, branch_id = :branch_id, role = :role, status = :status WHERE user_id = :id');
    $stmt->execute(['name'=>$name,'email'=>$email,'branch_id'=>$branchId,'role'=>$role,'status'=>$status,'id'=>$id]);
    if ($stmt->rowCount() === 0) { $check = $pdo->prepare('SELECT user_id FROM users WHERE user_id = :id'); $check->execute(['id'=>$id]); if (!$check->fetchColumn()) { http_response_code(404); echo json_encode(['status'=>'error','message'=>'User not found']); exit; } }
    $description = "Staff {$name} access toggled to {$status} by Administrator";
    writeAudit($pdo, 'Edit', $description, (string)($data['actor_name'] ?? 'System'), (string)($data['actor_role'] ?? 'Admin'));
    echo json_encode(['status'=>'success','message'=>'User updated successfully']);
} catch (Throwable $e) { http_response_code(400); echo json_encode(['status'=>'error','message'=>$e->getCode() === '23000' ? 'Email already exists' : 'Unable to update user']); }
?>
