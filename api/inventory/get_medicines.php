<?php
// api/inventory/get_medicines.php
header("Content-Type: application/json");
require_once "../config/db.php";

$branch_id = isset($_GET['branch_id']) ? intval($_GET['branch_id']) : 0;

$sql = "
    SELECT 
        b.batch_id AS id,
        b.branch_id,
        br.branch_name,
        m.medicine_id,
        m.brand_name AS brand,
        m.generic_name AS generic,
        c.category_name AS category,
        s.company_name AS manufacturer,
        b.batch_number AS batch,
        b.stock_quantity AS stock,
        b.buy_price AS buyPrice,
        b.sell_price AS sellPrice,
        b.expiry_date AS expiry,
        COALESCE(NULLIF(m.image, ''), 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&auto=format&fit=crop&q=60') AS img
    FROM medicine_batches b
    JOIN medicines m ON b.medicine_id = m.medicine_id
    JOIN categories c ON m.category_id = c.category_id
    JOIN suppliers s ON b.supplier_id = s.supplier_id
    LEFT JOIN branches br ON b.branch_id = br.branch_id
    " . ($branch_id === 0 ? "" : "WHERE b.branch_id = :branch_id") . "
    ORDER BY b.batch_id DESC
";

$stmt = $pdo->prepare($sql);
if ($branch_id === 0) {
    $stmt->execute();
} else {
    $stmt->execute(['branch_id' => $branch_id]);
}
$medicines = $stmt->fetchAll();

echo json_encode([
    "status" => "success",
    "data" => $medicines
]);
?>