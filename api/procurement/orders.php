<?php
header("Content-Type: application/json");
require_once "../config/db.php";

function respond(array $body, int $status = 200): void {
    http_response_code($status);
    echo json_encode($body);
    exit();
}

function findOrCreateSupplier(PDO $pdo, string $name): int {
    $stmt = $pdo->prepare(
        "SELECT supplier_id FROM suppliers
         WHERE company_name = :name OR company_name LIKE :like_name
         ORDER BY supplier_id LIMIT 1"
    );
    $stmt->execute([":name" => $name, ":like_name" => "%" . $name . "%"]);
    $id = (int) $stmt->fetchColumn();
    if ($id > 0) return $id;
    if ($name === "") throw new RuntimeException("Supplier is required");
    $insert = $pdo->prepare(
        "INSERT INTO suppliers (company_name, contact_person, phone, email, address)
         VALUES (:name, NULL, 'N/A', NULL, NULL)"
    );
    $insert->execute(["name" => $name]);
    return (int) $pdo->lastInsertId();
}

function findOrCreateMedicine(PDO $pdo, string $name): int {
    $stmt = $pdo->prepare("SELECT medicine_id FROM medicines WHERE brand_name = :name LIMIT 1");
    $stmt->execute([":name" => $name]);
    $id = (int) $stmt->fetchColumn();
    if ($id > 0) return $id;
    $insert = $pdo->prepare(
        "INSERT INTO medicines (category_id, brand_name, generic_name, barcode, strength, image)
         VALUES (1, :brand_name, :generic_name, :barcode, NULL, '')"
    );
    $insert->execute([
        ":brand_name" => $name,
        ":generic_name" => $name,
        ":barcode" => "PO-" . date("ymdHis") . "-" . random_int(100, 999),
    ]);
    return (int) $pdo->lastInsertId();
}

function receiveAndStock(PDO $pdo, array $payload): void {
    $poReference = trim((string) ($payload["po_id"] ?? ""));
    $medicineName = trim((string) ($payload["medicine_name"] ?? ""));
    $supplierName = trim((string) ($payload["supplier_name"] ?? ""));
    $branchId = (int) ($payload["branch_id"] ?? 0);
    $quantity = (int) ($payload["quantity"] ?? 0);
    $unitPrice = (float) ($payload["unit_price"] ?? 0);
    $expiryDate = trim((string) ($payload["expiry_date"] ?? ""));
    if ($poReference === "" || $medicineName === "" || $branchId < 1 || $quantity < 1 || $unitPrice < 0) {
        throw new RuntimeException("Invalid receive-and-stock details");
    }
    if ($expiryDate === "") $expiryDate = date("Y-m-d", strtotime("+1 year"));
    $expiry = DateTime::createFromFormat("Y-m-d", $expiryDate);
    if (!$expiry || $expiry->format("Y-m-d") !== $expiryDate) throw new RuntimeException("Invalid expiry date");

    $branch = $pdo->prepare("SELECT branch_id FROM branches WHERE branch_id = :id LIMIT 1");
    $branch->execute(["id" => $branchId]);
    if (!$branch->fetchColumn()) throw new RuntimeException("Branch not found");

    $poLookup = $pdo->prepare(
        "SELECT po_id FROM purchase_orders
         WHERE po_id = :po_id OR po_number = :po_number
         LIMIT 1 FOR UPDATE"
    );
    $poLookup->execute([
        "po_id" => is_numeric($poReference) ? (int) $poReference : 0,
        "po_number" => $poReference,
    ]);
    $poId = (int) $poLookup->fetchColumn();
    if ($poId < 1) throw new RuntimeException("Purchase order not found");

    $supplierId = findOrCreateSupplier($pdo, $supplierName);
    $medicineId = findOrCreateMedicine($pdo, $medicineName);
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
             SET stock_quantity = stock_quantity + :quantity, buy_price = :buy_price,
                 sell_price = :sell_price, expiry_date = :expiry_date, supplier_id = :supplier_id
             WHERE batch_id = :batch_id"
        );
        $update->execute([
            "quantity" => $quantity, "buy_price" => $unitPrice, "sell_price" => $sellPrice,
            "expiry_date" => $expiryDate, "supplier_id" => $supplierId, "batch_id" => $batchId,
        ]);
    } else {
        $batchNumber = "PO-BATCH-" . date("ymdHis");
        $insert = $pdo->prepare(
            "INSERT INTO medicine_batches
             (medicine_id, branch_id, supplier_id, batch_number, stock_quantity, buy_price, sell_price, expiry_date)
             VALUES (:medicine_id, :branch_id, :supplier_id, :batch_number, :quantity, :buy_price, :sell_price, :expiry_date)"
        );
        $insert->execute([
            "medicine_id" => $medicineId, "branch_id" => $branchId, "supplier_id" => $supplierId,
            "batch_number" => $batchNumber, "quantity" => $quantity, "buy_price" => $unitPrice,
            "sell_price" => $sellPrice, "expiry_date" => $expiryDate,
        ]);
    }

    $status = $pdo->prepare("UPDATE purchase_orders SET status = 'Received', received_at = NOW() WHERE po_id = :po_id");
    $status->execute(["po_id" => $poId]);
}

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    try {
        $count = (int) $pdo->query("SELECT COUNT(*) FROM purchase_orders")->fetchColumn();
        if ($count === 0) {
            $seed = $pdo->prepare(
                "INSERT INTO purchase_orders
                 (po_number, branch_id, supplier_id, requested_by, status, total_amount)
                 VALUES ('PO-2026-081', 2, 1, 1, 'Pending', 400.00)"
            );
            $seed->execute();
            $poId = (int) $pdo->lastInsertId();
            $item = $pdo->prepare(
                "INSERT INTO purchase_order_items
                 (po_id, medicine_id, requested_quantity, unit_cost, subtotal)
                 VALUES (:po_id, 2, 100, 4.00, 400.00)"
            );
            $item->execute(["po_id" => $poId]);
        }
        $stmt = $pdo->query(
            "SELECT po.po_id, po.po_number, po.status, po.total_amount, po.requested_at,
                    po.branch_id, br.branch_name, s.company_name AS supplier_name,
                    m.brand_name AS medicine_name, poi.requested_quantity AS quantity,
                    poi.unit_cost, poi.subtotal
             FROM purchase_orders po
             JOIN branches br ON br.branch_id = po.branch_id
             JOIN suppliers s ON s.supplier_id = po.supplier_id
             LEFT JOIN purchase_order_items poi ON poi.po_id = po.po_id
             LEFT JOIN medicines m ON m.medicine_id = poi.medicine_id
             ORDER BY po.po_id DESC"
        );
        respond(["status" => "success", "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } catch (Throwable $error) {
        respond(["status" => "error", "message" => $error->getMessage(), "data" => []], 400);
    }
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") respond(["status" => "error", "message" => "Method not allowed"], 405);
$payload = json_decode(file_get_contents("php://input"), true);
if (!is_array($payload)) respond(["status" => "error", "message" => "Invalid JSON payload"], 400);
$action = (string) ($payload["action"] ?? "");

try {
    $pdo->beginTransaction();
    if ($action === "update_status") {
        $status = (string) ($payload["status"] ?? "");
        if (!in_array($status, ["Approved", "Ordered", "Received"], true)) throw new RuntimeException("Invalid procurement status");
        $stmt = $pdo->prepare("UPDATE purchase_orders SET status = :status WHERE po_id = :po_id");
        $stmt->execute(["status" => $status, "po_id" => (int) ($payload["po_id"] ?? 0)]);
    } elseif ($action === "receive_and_stock") {
        receiveAndStock($pdo, $payload);
    } elseif ($action === "create") {
        $supplierId = findOrCreateSupplier($pdo, trim((string) ($payload["supplier_name"] ?? "")));
        $targetBranch = $payload["target_branch"] ?? ($payload["branch_id"] ?? 0);
        $branchId = is_numeric($targetBranch) ? (int) $targetBranch : 0;
        if ($branchId < 1 && trim((string) $targetBranch) !== "") {
            $branch = $pdo->prepare("SELECT branch_id FROM branches WHERE branch_name LIKE :branch ORDER BY branch_id LIMIT 1");
            $branch->execute(["branch" => "%" . trim((string) $targetBranch) . "%"]);
            $branchId = (int) $branch->fetchColumn();
        }
        if ($branchId < 1) $branchId = 1;
        $userId = (int) ($payload["requested_by"] ?? 1);
        $quantity = (int) ($payload["quantity"] ?? 0);
        $unitCost = (float) ($payload["unit_cost"] ?? ($payload["est_cost"] ?? 0));
        if ($branchId < 1 || $quantity < 1 || trim((string) ($payload["medicine_name"] ?? "")) === "") throw new RuntimeException("Invalid requisition details");
        $medicineId = findOrCreateMedicine($pdo, trim((string) $payload["medicine_name"]));
        $poNumber = trim((string) ($payload["po_number"] ?? ""));
        if ($poNumber === "") {
            $poNumber = "PO-" . date("Y") . "-" . random_int(100, 999);
        }
        $po = $pdo->prepare(
            "INSERT INTO purchase_orders (po_number, branch_id, supplier_id, requested_by, status, total_amount)
             VALUES (:po_number, :branch_id, :supplier_id, :requested_by, 'Pending', :total)"
        );
        $po->execute(["po_number" => $poNumber, "branch_id" => $branchId, "supplier_id" => $supplierId, "requested_by" => $userId, "total" => $quantity * $unitCost]);
        $item = $pdo->prepare(
            "INSERT INTO purchase_order_items (po_id, medicine_id, requested_quantity, unit_cost, subtotal)
             VALUES (:po_id, :medicine_id, :quantity, :unit_cost, :subtotal)"
        );
        $newPoId = (int) $pdo->lastInsertId();
        $item->execute(["po_id" => $newPoId, "medicine_id" => $medicineId, "quantity" => $quantity, "unit_cost" => $unitCost, "subtotal" => $quantity * $unitCost]);
        $newOrder = $pdo->prepare(
            "SELECT po.po_id, po.po_number, po.status, po.total_amount, po.branch_id,
                    br.branch_name, s.company_name AS supplier_name,
                    m.brand_name AS medicine_name, poi.requested_quantity AS quantity,
                    poi.unit_cost, poi.subtotal
             FROM purchase_orders po
             JOIN branches br ON br.branch_id = po.branch_id
             JOIN suppliers s ON s.supplier_id = po.supplier_id
             JOIN purchase_order_items poi ON poi.po_id = po.po_id
             JOIN medicines m ON m.medicine_id = poi.medicine_id
             WHERE po.po_id = :po_id"
        );
        $newOrder->execute(["po_id" => $newPoId]);
        $createdOrder = $newOrder->fetch(PDO::FETCH_ASSOC);
    } else {
        throw new RuntimeException("Unsupported procurement action");
    }
    $pdo->commit();
    respond([
        "status" => "success",
        "message" => $action === "create" ? "Order created" : "Procurement order updated successfully",
        "order" => $createdOrder ?? null,
    ]);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    respond(["status" => "error", "message" => $error->getMessage()], 400);
}
?>
