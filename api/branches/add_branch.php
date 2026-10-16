<?php
header('Content-Type: application/json');
require_once '../config/db.php';
require_once '../config/audit.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['status'=>'error','message'=>'Method not allowed']); exit; }
$data = json_decode(file_get_contents('php://input'), true) ?: [];
$name = trim((string)($data['branch_name'] ?? ''));
$location = trim((string)($data['location'] ?? ''));
$contact = trim((string)($data['contact_no'] ?? ''));
if ($name === '' || $location === '' || $contact === '') { http_response_code(400); echo json_encode(['status'=>'error','message'=>'Branch name, location and contact are required']); exit; }
try {
    ensureManagementTables($pdo);
    $stmt = $pdo->prepare('INSERT INTO branches (branch_name, location, contact_no, is_active) VALUES (:name, :location, :contact, 1)');
    $stmt->execute(['name'=>$name,'location'=>$location,'contact'=>$contact]);
    writeAudit($pdo, 'Create', "Branch {$name} created", (string)($data['actor_name'] ?? 'System'), (string)($data['actor_role'] ?? 'Admin'));
    echo json_encode(['status'=>'success','branch_id'=>(int)$pdo->lastInsertId(),'message'=>'Branch created successfully']);
} catch (Throwable $e) { http_response_code(400); echo json_encode(['status'=>'error','message'=>$e->getMessage()]); }
?>
