<?php
header("Content-Type: application/json");
require_once "../config/db.php";

$range = $_GET["range"] ?? "last_30_days";
$branchId = isset($_GET["branch_id"]) ? (int) $_GET["branch_id"] : 0;
$rangeDays = [
    "today" => 0,
    "last_7_days" => 6,
    "last_30_days" => 29,
    "this_month" => null,
    "all_time" => null,
];
if (!array_key_exists($range, $rangeDays)) {
    $range = "last_30_days";
}

try {
    $conditions = [];
    $params = [];
    if ($range === "today") {
        $conditions[] = "o.order_date >= CURDATE()";
    } elseif ($range === "this_month") {
        $conditions[] = "o.order_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')";
    } elseif ($range === "last_7_days" || $range === "last_30_days") {
        $conditions[] = "o.order_date >= DATE_SUB(CURDATE(), INTERVAL :range_days DAY)";
        $params["range_days"] = $rangeDays[$range];
    }
    if ($branchId > 0) {
        $conditions[] = "o.branch_id = :branch_id";
        $params["branch_id"] = $branchId;
    }
    $where = $conditions ? "WHERE " . implode(" AND ", $conditions) : "";

    $summaryStmt = $pdo->prepare("SELECT
        COALESCE(SUM(o.paid_amount), 0) AS revenue,
        COUNT(DISTINCT o.order_id) AS orders
        FROM orders o $where");
    $summaryStmt->execute($params);
    $summary = $summaryStmt->fetch();

    $profitStmt = $pdo->prepare("SELECT COALESCE(SUM((oi.unit_price - mb.buy_price) * oi.quantity), 0) AS profit
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.order_id
        JOIN medicine_batches mb ON mb.batch_id = oi.batch_id
        $where");
    $profitStmt->execute($params);
    $profit = (float) $profitStmt->fetchColumn();

    $retentionStmt = $pdo->prepare("SELECT
        COUNT(DISTINCT CASE WHEN customer_orders.order_count > 1 THEN customer_orders.customer_id END) AS repeat_customers,
        COUNT(DISTINCT CASE WHEN customer_orders.phone_number IS NOT NULL AND customer_orders.phone_number <> '' AND customer_orders.phone_number <> '00000000000' THEN customer_orders.customer_id END) AS valid_customers
        FROM (
            SELECT o.customer_id, c.phone_number, COUNT(*) AS order_count
            FROM orders o JOIN customers c ON c.customer_id = o.customer_id
            $where
            GROUP BY o.customer_id, c.phone_number
        ) customer_orders");
    $retentionStmt->execute($params);
    $retentionRow = $retentionStmt->fetch();
    $retention = (int) $retentionRow["valid_customers"] > 0
        ? round(((int) $retentionRow["repeat_customers"] / (int) $retentionRow["valid_customers"]) * 100, 1)
        : 0;

    $trendStmt = $pdo->prepare("SELECT DATE(o.order_date) AS day,
        COALESCE(SUM(o.paid_amount), 0) AS sales,
        COALESCE(SUM(items.profit), 0) AS profit
        FROM orders o
        LEFT JOIN (
            SELECT oi.order_id, SUM((oi.unit_price - mb.buy_price) * oi.quantity) AS profit
            FROM order_items oi JOIN medicine_batches mb ON mb.batch_id = oi.batch_id
            GROUP BY oi.order_id
        ) items ON items.order_id = o.order_id
        $where
        GROUP BY DATE(o.order_date) ORDER BY day ASC");
    $trendStmt->execute($params);
    $trendRows = $trendStmt->fetchAll();

    $branchStmt = $pdo->prepare("SELECT br.branch_name AS branch,
        COALESCE(SUM(o.paid_amount), 0) AS revenue,
        COALESCE(SUM(items.profit), 0) AS profit
        FROM branches br
        LEFT JOIN orders o ON o.branch_id = br.branch_id AND " . ($conditions ? implode(" AND ", $conditions) : "1=1") . "
        LEFT JOIN (
            SELECT oi.order_id, SUM((oi.unit_price - mb.buy_price) * oi.quantity) AS profit
            FROM order_items oi JOIN medicine_batches mb ON mb.batch_id = oi.batch_id
            GROUP BY oi.order_id
        ) items ON items.order_id = o.order_id
        GROUP BY br.branch_id, br.branch_name ORDER BY revenue DESC");
    $branchStmt->execute($params);
    $branchRows = $branchStmt->fetchAll();

    $paymentStmt = $pdo->prepare("SELECT o.payment_method AS name, COUNT(*) AS count
        FROM orders o $where GROUP BY o.payment_method");
    $paymentStmt->execute($params);
    $paymentColors = ["Cash" => "#4F46E5", "bKash" => "#0D9488", "Nagad" => "#F59E0B", "Card" => "#8B5CF6"];
    $paymentRows = $paymentStmt->fetchAll();
    $orderCount = (int) $summary["orders"];
    foreach ($paymentRows as &$payment) {
        $payment["count"] = (int) $payment["count"];
        $payment["value"] = $orderCount > 0 ? round(($payment["count"] / $orderCount) * 100, 1) : 0;
        $payment["color"] = $paymentColors[$payment["name"]] ?? "#94A3B8";
    }
    unset($payment);

    $topStmt = $pdo->prepare("SELECT m.brand_name AS brand,
        AVG(mb.buy_price) AS cost, AVG(oi.unit_price) AS sell,
        SUM((oi.unit_price - mb.buy_price) * oi.quantity) AS profit
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.order_id
        JOIN medicine_batches mb ON mb.batch_id = oi.batch_id
        JOIN medicines m ON m.medicine_id = mb.medicine_id
        $where
        GROUP BY m.medicine_id, m.brand_name
        ORDER BY profit DESC LIMIT 5");
    $topStmt->execute($params);
    $topRows = $topStmt->fetchAll();
    foreach ($topRows as &$medicine) {
        $medicine["cost"] = round((float) $medicine["cost"], 2);
        $medicine["sell"] = round((float) $medicine["sell"], 2);
        $medicine["profit"] = round((float) $medicine["profit"], 2);
        $medicine["margin"] = $medicine["sell"] > 0 ? round((($medicine["sell"] - $medicine["cost"]) / $medicine["sell"]) * 100, 1) : 0;
    }
    unset($medicine);

    echo json_encode(["status" => "success", "data" => [
        "summary" => [
            "revenue" => round((float) $summary["revenue"], 2),
            "profit" => round($profit, 2),
            "orders" => $orderCount,
            "retention" => $retention,
        ],
        "trend" => $trendRows,
        "branches" => $branchRows,
        "payments" => $paymentRows,
        "top_medicines" => $topRows,
    ]]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Unable to load analytics", "data" => null]);
}
?>
