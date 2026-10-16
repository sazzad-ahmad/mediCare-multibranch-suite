<?php
header("Content-Type: application/json");
require_once "../config/db.php";
require_once "../config/audit.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$payload = json_decode(file_get_contents("php://input"), true);
$branchId = isset($payload["branch_id"]) ? (int) $payload["branch_id"] : 0;
$cashierId = isset($payload["user_id"]) ? (int) $payload["user_id"] : 0;
$items = isset($payload["items"]) && is_array($payload["items"]) ? $payload["items"] : [];
$totalAmount = isset($payload["total_amount"]) ? (float) $payload["total_amount"] : -1;

if ($branchId < 1 || $cashierId < 1 || $totalAmount < 0 || count($items) === 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid checkout payload"]);
    exit();
}

try {
    $pdo->beginTransaction();
    $customerName = trim((string) ($payload["customer_name"] ?? "Walk-in Customer"));
    $customerId = 1;
    if ($customerName !== "Walk-in Customer") {
        $customerStmt = $pdo->prepare("SELECT customer_id FROM customers WHERE phone_number = :phone LIMIT 1");
        $customerStmt->execute(["phone" => $customerName]);
        $customerId = (int) $customerStmt->fetchColumn();
    }
    if ($customerId < 1) {
        $customerInsert = $pdo->prepare("INSERT INTO customers (name, phone_number) VALUES (:name, :phone)");
        $customerInsert->execute(["name" => $customerName, "phone" => "POS-" . bin2hex(random_bytes(6))]);
        $customerId = (int) $pdo->lastInsertId();
    }

    $discount = (float) ($payload["discount"] ?? 0);
    $vat = (float) ($payload["vat"] ?? 0);
    $subtotal = (float) ($payload["subtotal"] ?? ($totalAmount - $vat + $discount));
    $paymentMethod = (string) ($payload["payment_method"] ?? "Cash");
    if (!in_array($paymentMethod, ["Cash", "bKash", "Nagad", "Card"], true)) {
        $paymentMethod = "Cash";
    }

    $orderStmt = $pdo->prepare(
        "INSERT INTO orders
         (invoice_number, branch_id, customer_id, cashier_id, subtotal, discount, vat, paid_amount, payment_method)
         VALUES (:invoice_number, :branch_id, :customer_id, :cashier_id, :subtotal, :discount, :vat, :paid_amount, :payment_method)"
    );
    $orderStmt->execute([
        "invoice_number" => "INV-" . date("YmdHis") . "-" . random_int(100, 999),
        "branch_id" => $branchId,
        "customer_id" => $customerId,
        "cashier_id" => $cashierId,
        "subtotal" => $subtotal,
        "discount" => $discount,
        "vat" => $vat,
        "paid_amount" => $totalAmount,
        "payment_method" => $paymentMethod,
    ]);
    $saleId = (int) $pdo->lastInsertId();

    $itemStmt = $pdo->prepare(
        "INSERT INTO order_items (order_id, batch_id, quantity, unit_price, subtotal)
         VALUES (:order_id, :batch_id, :quantity, :unit_price, :subtotal)"
    );
    $stockStmt = $pdo->prepare(
        "UPDATE medicine_batches
         SET stock_quantity = stock_quantity - :quantity
         WHERE batch_id = :batch_id AND branch_id = :branch_id AND stock_quantity >= :available_quantity"
    );

    foreach ($items as $item) {
        $batchId = isset($item["batch_id"]) ? (int) $item["batch_id"] : 0;
        $quantity = isset($item["quantity"]) ? (int) $item["quantity"] : 0;
        $unitPrice = isset($item["unit_price"]) ? (float) $item["unit_price"] : -1;
        $itemSubtotal = isset($item["subtotal"]) ? (float) $item["subtotal"] : -1;
        if ($batchId < 1 || $quantity < 1 || $unitPrice < 0 || $itemSubtotal < 0) {
            throw new RuntimeException("Invalid item in checkout");
        }

        $stockStmt->execute([
            "quantity" => $quantity,
            "batch_id" => $batchId,
            "branch_id" => $branchId,
            "available_quantity" => $quantity,
        ]);
        if ($stockStmt->rowCount() !== 1) {
            throw new RuntimeException("Insufficient stock or batch not found");
        }

        $itemStmt->execute([
            "order_id" => $saleId,
            "batch_id" => $batchId,
            "quantity" => $quantity,
            "unit_price" => $unitPrice,
            "subtotal" => $itemSubtotal,
        ]);
    }

    $pdo->commit();
    writeAudit($pdo, "Create", "Invoice {$saleId} completed", (string) ($payload["actor_name"] ?? "System"), (string) ($payload["actor_role"] ?? "Cashier"));
    echo json_encode(["status" => "success", "message" => "Sale completed successfully", "invoice_id" => $saleId]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
