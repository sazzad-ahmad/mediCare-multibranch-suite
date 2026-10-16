<?php
header('Content-Type: application/json');
require_once '../config/db.php';
require_once '../config/audit.php';
try {
    ensureManagementTables($pdo);
    $rows = $pdo->query('SELECT log_id, action_type, description, user_name, role, created_at FROM audit_logs ORDER BY created_at DESC, log_id DESC')->fetchAll();
    echo json_encode(['status'=>'success','data'=>$rows]);
} catch (Throwable $e) { http_response_code(500); echo json_encode(['status'=>'error','data'=>[],'message'=>'Unable to load audit logs']); }
?>
