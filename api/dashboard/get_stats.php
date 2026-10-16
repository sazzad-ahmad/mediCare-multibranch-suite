<?php
header("Content-Type: application/json");
require_once "../config/db.php";

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$branchId = isset($_GET["branch_id"]) ? (int) $_GET["branch_id"] : 1;
$lowStockThreshold = isset($_GET["low_stock_threshold"]) ? max(0, (int) $_GET["low_stock_threshold"]) : 10;
$expiryWarningDays = isset($_GET["expiry_warning_days"]) ? max(1, (int) $_GET["expiry_warning_days"]) : 90;
if ($branchId < 1) {
    $branchId = 1;
}

try {
    // The installed schema stores completed sales in orders.paid_amount/order_date.
    $todaySales = $pdo->prepare("SELECT COALESCE(SUM(paid_amount), 0) AS val FROM orders WHERE branch_id = :bid AND DATE(order_date) = CURDATE()");
    $todaySales->execute(["bid" => $branchId]);

    $totalMedicines = $pdo->prepare("SELECT COUNT(DISTINCT medicine_id) AS val FROM medicine_batches WHERE branch_id = :bid");
    $totalMedicines->execute(["bid" => $branchId]);

    $lowStock = $pdo->prepare("SELECT COUNT(*) AS val FROM medicine_batches WHERE branch_id = :bid AND stock_quantity <= :threshold");
    $lowStock->execute(["bid" => $branchId, "threshold" => $lowStockThreshold]);

    $nearExpiry = $pdo->prepare("SELECT COUNT(*) AS val FROM medicine_batches WHERE branch_id = :bid AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL :expiry_days DAY)");
    $nearExpiry->execute(["bid" => $branchId, "expiry_days" => $expiryWarningDays]);

    $critical = $pdo->prepare(
        "SELECT b.batch_id, b.batch_number, m.brand_name, b.stock_quantity, b.expiry_date,
                s.company_name AS supplier_name
         FROM medicine_batches b
         JOIN medicines m ON b.medicine_id = m.medicine_id
         LEFT JOIN suppliers s ON b.supplier_id = s.supplier_id
         WHERE b.branch_id = :bid
           AND (b.stock_quantity <= :critical_stock OR b.expiry_date <= DATE_ADD(CURDATE(), INTERVAL :critical_expiry DAY))
         ORDER BY b.stock_quantity ASC
         LIMIT 5"
    );
    $critical->execute(["bid" => $branchId, "critical_stock" => $lowStockThreshold, "critical_expiry" => $expiryWarningDays]);

    echo json_encode([
        "status" => "success",
        "branch_id" => $branchId,
        "data" => [
            "today_sales" => (float) $todaySales->fetchColumn(),
            "total_medicines" => (int) $totalMedicines->fetchColumn(),
            "low_stock_count" => (int) $lowStock->fetchColumn(),
            "near_expiry_count" => (int) $nearExpiry->fetchColumn(),
            "critical_batches" => $critical->fetchAll(),
        ],
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
