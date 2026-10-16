<?php
header('Content-Type: application/json');
require_once '../config/db.php';
require_once '../config/audit.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['status'=>'error','message'=>'Method not allowed']); exit; }
$data = json_decode(file_get_contents('php://input'), true) ?: [];
$id = (int)($data['branch_id'] ?? 0); $active = (int)!!($data['is_active'] ?? false);
if ($id < 1) { http_response_code(400); echo json_encode(['status'=>'error','message'=>'Invalid branch']); exit; }
try {
    $lookup = $pdo->prepare('SELECT branch_name FROM branches WHERE branch_id = :id'); $lookup->execute(['id'=>$id]); $name = $lookup->fetchColumn();
    if (!$name) { http_response_code(404); echo json_encode(['status'=>'error','message'=>'Branch not found']); exit; }
    $stmt = $pdo->prepare('UPDATE branches SET is_active = :active WHERE branch_id = :id'); $stmt->execute(['active'=>$active,'id'=>$id]);
    writeAudit($pdo, 'Edit', "Branch {$name} " . ($active ? 'activated' : 'deactivated'), (string)($data['actor_name'] ?? 'System'), (string)($data['actor_role'] ?? 'Admin'));
    echo json_encode(['status'=>'success','is_active'=>$active]);
} catch (Throwable $e) { http_response_code(400); echo json_encode(['status'=>'error','message'=>$e->getMessage()]); }
?>
