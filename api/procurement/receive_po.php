<?php
header("Content-Type: application/json");
require_once "../config/db.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$payload = json_decode(file_get_contents("php://input"), true);
$poNumber = trim((string) ($payload["po_number"] ?? ""));
$medicineName = trim((string) ($payload["medicine_name"] ?? ""));
$supplierName = trim((string) ($payload["supplier_name"] ?? ""));
$branchId = (int) ($payload["branch_id"] ?? 0);
$quantity = (int) ($payload["quantity"] ?? 0);
$unitPrice = (float) ($payload["unit_price"] ?? 0);
$expiryDate = trim((string) ($payload["expiry_date"] ?? ""));

if (!is_array($payload) || $medicineName === "" || $branchId < 1 || $quantity < 1 || $unitPrice < 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid stock receipt details"]);
    exit();
}

if ($expiryDate === "") {
    $expiryDate = date("Y-m-d", strtotime("+1 year"));
}
$expiry = DateTime::createFromFormat("Y-m-d", $expiryDate);
if (!$expiry || $expiry->format("Y-m-d") !== $expiryDate) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid expiry date"]);
    exit();
}

try {
    $pdo->beginTransaction();

    $branchCheck = $pdo->prepare("SELECT branch_id FROM branches WHERE branch_id = :branch_id LIMIT 1");
    $branchCheck->execute(["branch_id" => $branchId]);
    if (!$branchCheck->fetchColumn()) {
        throw new RuntimeException("Branch not found");
    }

    $supplier = $pdo->prepare(
        "SELECT supplier_id FROM suppliers
         WHERE company_name = :name OR company_name LIKE :name_like
         ORDER BY supplier_id LIMIT 1"
    );
    $supplier->execute(["name" => $supplierName, "name_like" => "%" . $supplierName . "%"]);
    $supplierId = (int) $supplier->fetchColumn();
    if ($supplierId < 1) {
        if ($supplierName === "") {
            throw new RuntimeException("Supplier is required");
        }
        $insertSupplier = $pdo->prepare(
            "INSERT INTO suppliers (company_name, contact_person, phone, email, address)
             VALUES (:company_name, NULL, 'N/A', NULL, NULL)"
        );
        $insertSupplier->execute(["company_name" => $supplierName]);
        $supplierId = (int) $pdo->lastInsertId();
    }

    $medicine = $pdo->prepare(
        "SELECT medicine_id FROM medicines WHERE brand_name = :brand_name LIMIT 1 FOR UPDATE"
    );
    $medicine->execute(["brand_name" => $medicineName]);
    $medicineId = (int) $medicine->fetchColumn();
    if ($medicineId < 1) {
        $insertMedicine = $pdo->prepare(
            "INSERT INTO medicines
             (category_id, brand_name, generic_name, barcode, strength, image)
             VALUES (1, :brand_name, :generic_name, :barcode, NULL, '')"
        );
        $insertMedicine->execute([
            "brand_name" => $medicineName,
            "generic_name" => $medicineName,
            "barcode" => "PO-" . date("ymdHis") . "-" . random_int(100, 999),
        ]);
        $medicineId = (int) $pdo->lastInsertId();
    }

    $batch = $pdo->prepare(
        "SELECT batch_id FROM medicine_batches
         WHERE medicine_id = :medicine_id AND branch_id = :branch_id
         ORDER BY batch_id LIMIT 1 FOR UPDATE"
    );
    $batch->execute(["medicine_id" => $medicineId, "branch_id" => $branchId]);
    $batchId = (int) $batch->fetchColumn();
    $sellPrice = round($unitPrice * 1.3, 2);

    if ($batchId > 0) {
        $update = $pdo->prepare(
            "UPDATE medicine_batches
             SET stock_quantity = stock_quantity + :quantity,
                 buy_price = :buy_price, sell_price = :sell_price,
                 expiry_date = :expiry_date, supplier_id = :supplier_id
             WHERE batch_id = :batch_id"
        );
        $update->execute([
            "quantity" => $quantity, "buy_price" => $unitPrice,
            "sell_price" => $sellPrice, "expiry_date" => $expiryDate,
            "supplier_id" => $supplierId, "batch_id" => $batchId,
        ]);
    } else {
        $batchNumber = "PO-BATCH-" . substr(preg_replace("/[^A-Za-z0-9]/", "", $poNumber), -8);
        if ($batchNumber === "PO-BATCH-") {
            $batchNumber .= date("His");
        }
        $insertBatch = $pdo->prepare(
            "INSERT INTO medicine_batches
             (medicine_id, branch_id, supplier_id, batch_number, stock_quantity, buy_price, sell_price, expiry_date)
             VALUES (:medicine_id, :branch_id, :supplier_id, :batch_number, :quantity, :buy_price, :sell_price, :expiry_date)"
        );
        $insertBatch->execute([
            "medicine_id" => $medicineId, "branch_id" => $branchId,
            "supplier_id" => $supplierId, "batch_number" => $batchNumber,
            "quantity" => $quantity, "buy_price" => $unitPrice,
            "sell_price" => $sellPrice, "expiry_date" => $expiryDate,
        ]);
    }

    if ($poNumber !== "") {
        $po = $pdo->prepare(
            "UPDATE purchase_orders SET status = 'Received', received_at = NOW()
             WHERE po_number = :po_number"
        );
        $po->execute(["po_number" => $poNumber]);
    }

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => "Medicine stocked successfully into database"]);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => $error->getMessage()]);
}
?>
