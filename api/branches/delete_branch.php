<?php
header('Content-Type: application/json');
require_once '../config/db.php';
require_once '../config/audit.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['status'=>'error','message'=>'Method not allowed']); exit; }
$data = json_decode(file_get_contents('php://input'), true) ?: [];
$id = (int)($data['branch_id'] ?? 0);
if ($id < 1) { http_response_code(400); echo json_encode(['status'=>'error','message'=>'Invalid branch']); exit; }
$message = 'Cannot delete branch with historical transactions or active inventory. Please use the Deactivate toggle switch instead.';
try {
    $lookup = $pdo->prepare('SELECT branch_name FROM branches WHERE branch_id = :id');
    $lookup->execute(['id' => $id]);
    $name = $lookup->fetchColumn();
    if (!$name) { http_response_code(404); echo json_encode(['status'=>'error','message'=>'Branch not found']); exit; }
    $checks = [
        'orders' => 'SELECT COUNT(*) FROM orders WHERE branch_id = :id',
        'medicine_batches' => 'SELECT COUNT(*) FROM medicine_batches WHERE branch_id = :id',
        'users' => 'SELECT COUNT(*) FROM users WHERE branch_id = :id',
    ];
    foreach ($checks as $sql) { $stmt = $pdo->prepare($sql); $stmt->execute(['id' => $id]); if ((int)$stmt->fetchColumn() > 0) { echo json_encode(['status'=>'warning','message'=>$message]); exit; } }
    $stmt = $pdo->prepare('DELETE FROM branches WHERE branch_id = :id');
    $stmt->execute(['id' => $id]);
    writeAudit($pdo, 'Delete', "Branch {$name} deleted", (string)($data['actor_name'] ?? 'System'), (string)($data['actor_role'] ?? 'Admin'));
    echo json_encode(['status'=>'success','message'=>'Branch deleted successfully','branch_id'=>$id]);
} catch (Throwable $e) { http_response_code(400); echo json_encode(['status'=>'error','message'=>'Unable to delete branch']); }
?>
