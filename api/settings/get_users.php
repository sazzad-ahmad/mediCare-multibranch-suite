<?php
header('Content-Type: application/json');
require_once '../config/db.php';
try {
    $stmt = $pdo->query("SELECT u.user_id, u.name, u.email, u.role, u.status, u.branch_id, COALESCE(b.branch_name, 'Unassigned') AS branch_name FROM users u LEFT JOIN branches b ON b.branch_id = u.branch_id ORDER BY u.user_id");
    echo json_encode(['status'=>'success','data'=>$stmt->fetchAll()]);
} catch (Throwable $e) { http_response_code(500); echo json_encode(['status'=>'error','data'=>[],'message'=>'Unable to load users']); }
?>
