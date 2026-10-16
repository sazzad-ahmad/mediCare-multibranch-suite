<?php
header('Content-Type: application/json');
require_once '../config/db.php';
require_once '../config/audit.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['status'=>'error','message'=>'Method not allowed']); exit; }
$data = json_decode(file_get_contents('php://input'), true) ?: [];
$id = (int)($data['user_id'] ?? 0);
if ($id < 1) { http_response_code(400); echo json_encode(['status'=>'error','message'=>'Invalid staff id']); exit; }
try {
    $lookup = $pdo->prepare('SELECT name FROM users WHERE user_id = :id'); $lookup->execute(['id'=>$id]); $name = $lookup->fetchColumn();
    if (!$name) { http_response_code(404); echo json_encode(['status'=>'error','message'=>'Staff member not found']); exit; }
    $stmt = $pdo->prepare("UPDATE users SET status = 'Inactive' WHERE user_id = :id"); $stmt->execute(['id'=>$id]);
    writeAudit($pdo, 'Delete', "Staff {$name} deactivated by Admin", (string)($data['actor_name'] ?? 'System'), (string)($data['actor_role'] ?? 'Admin'));
    echo json_encode(['status'=>'success']);
} catch (Throwable $e) { http_response_code(400); echo json_encode(['status'=>'error','message'=>$e->getMessage()]); }
?>
