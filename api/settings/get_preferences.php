<?php
header('Content-Type: application/json');
require_once '../config/db.php';
require_once '../config/audit.php';
try {
    ensureManagementTables($pdo);
    $rows = $pdo->query('SELECT setting_key, setting_value FROM system_settings')->fetchAll(); $data = [];
    foreach ($rows as $row) $data[$row['setting_key']] = $row['setting_value'];
    echo json_encode(['status'=>'success','data'=>$data]);
} catch (Throwable $e) { http_response_code(500); echo json_encode(['status'=>'error','data'=>[],'message'=>'Unable to load preferences']); }
?>
