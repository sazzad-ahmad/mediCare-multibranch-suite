<?php
header("Content-Type: application/json");
require_once "../config/db.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$payload = json_decode(file_get_contents("php://input"), true);
if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid JSON payload"]);
    exit();
}

$poId = trim((string) ($payload["po_id"] ?? ""));
$medicineName = trim((string) ($payload["medicine_name"] ?? $payload["medicine"] ?? ""));
$supplierName = trim((string) ($payload["supplier_name"] ?? ""));
$branchId = (int) ($payload["branch_id"] ?? 0);
$branchName = trim((string) ($payload["branch"] ?? ""));
$quantity = (int) ($payload["quantity"] ?? 0);
$unitPrice = (float) ($payload["unit_price"] ?? 0);
$expiryDate = trim((string) ($payload["expiry_date"] ?? ""));

if ($medicineName === "" || $quantity < 1 || $unitPrice < 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Medicine, quantity, and unit price are required"]);
    exit();
}

try {
    $pdo->beginTransaction();

    if ($branchId < 1 && $branchName !== "") {
        $branchStmt = $pdo->prepare(
            "SELECT branch_id FROM branches
             WHERE branch_name = :branch OR branch_name LIKE :branch_suffix
             ORDER BY branch_id LIMIT 1"
        );
        $branchStmt->execute([
            "branch" => $branchName,
            "branch_suffix" => "%" . $branchName,
        ]);
        $branchId = (int) $branchStmt->fetchColumn();
    }
    if ($branchId < 1) {
        throw new RuntimeException("A valid branch is required");
    }

    $branchCheck = $pdo->prepare("SELECT branch_id FROM branches WHERE branch_id = :branch_id LIMIT 1");
    $branchCheck->execute(["branch_id" => $branchId]);
    if (!$branchCheck->fetchColumn()) {
        throw new RuntimeException("Branch not found");
    }

    $supplierStmt = $pdo->prepare(
        "SELECT supplier_id FROM suppliers
         WHERE company_name = :supplier OR company_name LIKE :supplier_suffix
         ORDER BY supplier_id LIMIT 1"
    );
    $supplierStmt->execute([
        "supplier" => $supplierName,
        "supplier_suffix" => "%" . $supplierName . "%",
    ]);
    $supplierId = (int) $supplierStmt->fetchColumn();
    if ($supplierId < 1) {
        if ($supplierName === "") {
            throw new RuntimeException("Supplier is required");
        }
        $insertSupplier = $pdo->prepare(
            "INSERT INTO suppliers (company_name, contact_person, phone, email, address)
             VALUES (:company_name, NULL, :phone, NULL, NULL)"
        );
        $insertSupplier->execute([
            "company_name" => $supplierName,
            "phone" => "N/A",
        ]);
        $supplierId = (int) $pdo->lastInsertId();
    }

    $medicineStmt = $pdo->prepare(
        "SELECT medicine_id FROM medicines
         WHERE brand_name = :medicine_name
         LIMIT 1"
    );
    $medicineStmt->execute(["medicine_name" => $medicineName]);
    $medicineId = (int) $medicineStmt->fetchColumn();

    if ($medicineId < 1) {
        $barcode = "PO-" . date("ymdHis") . "-" . random_int(100, 999);
        $insertMedicine = $pdo->prepare(
            "INSERT INTO medicines
             (category_id, brand_name, generic_name, barcode, strength, image)
             VALUES (1, :brand_name, :generic_name, :barcode, NULL, '')"
        );
        $insertMedicine->execute([
            "brand_name" => $medicineName,
            "generic_name" => $medicineName,
            "barcode" => $barcode,
        ]);
        $medicineId = (int) $pdo->lastInsertId();
    }

    if ($expiryDate === "") {
        $expiryDate = date("Y-m-d", strtotime("+1 year"));
    }
    $expiryCheck = DateTime::createFromFormat("Y-m-d", $expiryDate);
    if (!$expiryCheck || $expiryCheck->format("Y-m-d") !== $expiryDate) {
        throw new RuntimeException("Invalid expiry date");
    }

    $batchStmt = $pdo->prepare(
        "SELECT batch_id FROM medicine_batches
         WHERE medicine_id = :medicine_id AND branch_id = :branch_id
         ORDER BY batch_id ASC LIMIT 1
         FOR UPDATE"
    );
    $batchStmt->execute([
        "medicine_id" => $medicineId,
        "branch_id" => $branchId,
    ]);
    $batchId = (int) $batchStmt->fetchColumn();

    if ($batchId > 0) {
        $updateBatch = $pdo->prepare(
            "UPDATE medicine_batches
             SET stock_quantity = stock_quantity + :quantity,
                 buy_price = :buy_price,
                 sell_price = :sell_price,
                 expiry_date = :expiry_date,
                 supplier_id = :supplier_id
             WHERE batch_id = :batch_id"
        );
        $updateBatch->execute([
            "quantity" => $quantity,
            "buy_price" => $unitPrice,
            "sell_price" => round($unitPrice * 1.3, 2),
            "expiry_date" => $expiryDate,
            "supplier_id" => $supplierId,
            "batch_id" => $batchId,
        ]);
    } else {
        $batchNumber = "PO-BATCH-" . substr(preg_replace("/[^A-Za-z0-9]/", "", $poId), -8);
        if ($batchNumber === "PO-BATCH-") {
            $batchNumber .= date("His");
        }
        $insertBatch = $pdo->prepare(
            "INSERT INTO medicine_batches
             (medicine_id, branch_id, supplier_id, batch_number, stock_quantity, buy_price, sell_price, expiry_date)
             VALUES (:medicine_id, :branch_id, :supplier_id, :batch_number, :stock_quantity, :buy_price, :sell_price, :expiry_date)"
        );
        $insertBatch->execute([
            "medicine_id" => $medicineId,
            "branch_id" => $branchId,
            "supplier_id" => $supplierId,
            "batch_number" => $batchNumber,
            "stock_quantity" => $quantity,
            "buy_price" => $unitPrice,
            "sell_price" => round($unitPrice * 1.3, 2),
            "expiry_date" => $expiryDate,
        ]);
    }

    if ($poId !== "") {
        $poUpdate = $pdo->prepare(
            "UPDATE purchase_orders
             SET status = 'Received', received_at = NOW()
             WHERE po_number = :po_number"
        );
        $poUpdate->execute(["po_number" => $poId]);
    }

    $pdo->commit();
    echo json_encode([
        "status" => "success",
        "message" => "Stock added to inventory successfully",
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
