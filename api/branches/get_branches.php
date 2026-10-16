<?php
header('Content-Type: application/json');
require_once '../config/db.php';
try {
    $stmt = $pdo->query("SELECT branch_id, branch_name, location, contact_no, is_active FROM branches ORDER BY branch_id");
    echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll()]);
} catch (Throwable $e) {
    http_response_code(500); echo json_encode(['status' => 'error', 'data' => [], 'message' => 'Unable to load branches']);
}
?>
