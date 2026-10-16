<?php
header('Content-Type: application/json');
require_once '../config/db.php';
require_once '../config/audit.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['status'=>'error','message'=>'Method not allowed']); exit; }
$data = json_decode(file_get_contents('php://input'), true) ?: [];
$allowed = ['vat_rate','low_stock_threshold','expiry_warning_days','invoice_footer'];
try {
    ensureManagementTables($pdo); $pdo->beginTransaction();
    $stmt = $pdo->prepare('INSERT INTO system_settings (setting_key, setting_value) VALUES (:key, :value) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)');
    foreach ($allowed as $key) { if (array_key_exists($key, $data)) $stmt->execute(['key'=>$key,'value'=>(string)$data[$key]]); }
    $pdo->commit();
    writeAudit($pdo, 'Edit', 'Billing and inventory preferences updated', (string)($data['actor_name'] ?? 'System'), (string)($data['actor_role'] ?? 'Admin'));
    echo json_encode(['status'=>'success','data'=>array_intersect_key($data, array_flip($allowed))]);
} catch (Throwable $e) { if ($pdo->inTransaction()) $pdo->rollBack(); http_response_code(400); echo json_encode(['status'=>'error','message'=>$e->getMessage()]); }
?>
