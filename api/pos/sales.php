<?php
header("Content-Type: application/json");
require_once "../config/db.php";

$branchId = isset($_GET["branch_id"]) ? (int) $_GET["branch_id"] : 0;

try {
    $whereSql = $branchId > 0 ? "WHERE o.branch_id = :branch_id" : "";
    $stmt = $pdo->prepare(
        "SELECT
            o.order_id, o.invoice_number, o.branch_id, o.order_date, o.subtotal, o.discount, o.vat,
            o.paid_amount, o.payment_method,
            c.name AS customer_name,
            u.name AS cashier_name,
            br.branch_name, br.location,
            m.brand_name, m.generic_name,
            mb.batch_number, oi.quantity, oi.unit_price, oi.subtotal AS item_subtotal,
            cat.category_name
         FROM orders o
         JOIN customers c ON c.customer_id = o.customer_id
         JOIN users u ON u.user_id = o.cashier_id
         JOIN branches br ON br.branch_id = o.branch_id
         JOIN order_items oi ON oi.order_id = o.order_id
         JOIN medicine_batches mb ON mb.batch_id = oi.batch_id
         JOIN medicines m ON m.medicine_id = mb.medicine_id
         JOIN categories cat ON cat.category_id = m.category_id
            $whereSql
         ORDER BY o.order_date DESC, o.order_id DESC, oi.order_item_id ASC"
    );
        $stmt->execute($branchId > 0 ? ["branch_id" => $branchId] : []);
    echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Unable to load branch sales", "data" => []]);
}
?>