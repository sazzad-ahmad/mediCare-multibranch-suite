<?php
header("Content-Type: application/json");
require_once "../config/db.php";
require_once "../config/audit.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$payload = json_decode(file_get_contents("php://input"), true);
$required = ["brand", "generic", "category", "manufacturer", "batch", "stock", "buyPrice", "sellPrice", "expiry"];

foreach ($required as $field) {
    if (!isset($payload[$field]) || $payload[$field] === "") {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing field: " . $field]);
        exit();
    }
}

$branchId = isset($payload["branch_id"]) ? (int) $payload["branch_id"] : 1;
$stock = (int) $payload["stock"];
$buyPrice = (float) $payload["buyPrice"];
$sellPrice = (float) $payload["sellPrice"];
$image = trim((string) ($payload["img"] ?? $payload["image_url"] ?? ""));

if ($branchId < 1 || $stock < 0 || $buyPrice < 0 || $sellPrice < 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid medicine values"]);
    exit();
}

try {
    // Local uploads are Data URLs and can exceed VARCHAR(255). Upgrade the
    // existing image column before storing one so the payload is not truncated.
    $imageColumn = $pdo->query(
        "SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'medicines'
           AND COLUMN_NAME = 'image'
         LIMIT 1"
    )->fetch(PDO::FETCH_ASSOC);
    if ($imageColumn && $imageColumn["DATA_TYPE"] === "varchar" && (int) $imageColumn["CHARACTER_MAXIMUM_LENGTH"] < 65535) {
        $pdo->exec("ALTER TABLE medicines MODIFY image TEXT NULL");
    }

    $pdo->beginTransaction();

    $categoryStmt = $pdo->prepare("SELECT category_id FROM categories WHERE category_name = :category LIMIT 1");
    $categoryStmt->execute(["category" => $payload["category"]]);
    $categoryId = $categoryStmt->fetchColumn();
    if (!$categoryId) {
        throw new RuntimeException("Category not found");
    }

    $supplierStmt = $pdo->prepare(
        "SELECT supplier_id FROM suppliers
         WHERE company_name = :manufacturer OR company_name LIKE :manufacturer_prefix
         ORDER BY supplier_id LIMIT 1"
    );
    $supplierStmt->execute([
        "manufacturer" => $payload["manufacturer"],
        "manufacturer_prefix" => $payload["manufacturer"] . "%",
    ]);
    $supplierId = $supplierStmt->fetchColumn();
    if (!$supplierId) {
        throw new RuntimeException("Manufacturer not found");
    }

    $medicineStmt = $pdo->prepare(
        "SELECT medicine_id FROM medicines
         WHERE brand_name = :brand AND generic_name = :generic LIMIT 1"
    );
    $medicineStmt->execute([
        "brand" => $payload["brand"],
        "generic" => $payload["generic"],
    ]);
    $medicineId = $medicineStmt->fetchColumn();

    if (!$medicineId) {
        $barcode = "MED-" . strtoupper(bin2hex(random_bytes(6)));
        $medicineInsert = $pdo->prepare(
            "INSERT INTO medicines
             (category_id, brand_name, generic_name, barcode, image)
             VALUES (:category_id, :brand, :generic, :barcode, :image)"
        );
        $medicineInsert->execute([
            "category_id" => $categoryId,
            "brand" => $payload["brand"],
            "generic" => $payload["generic"],
            "barcode" => $barcode,
            "image" => $image !== "" ? $image : null,
        ]);
        $medicineId = $pdo->lastInsertId();
    } elseif ($image !== "") {
        $medicineUpdate = $pdo->prepare("UPDATE medicines SET image = :image WHERE medicine_id = :medicine_id");
        $medicineUpdate->execute(["image" => $image, "medicine_id" => $medicineId]);
    }

    $batchInsert = $pdo->prepare(
        "INSERT INTO medicine_batches
         (medicine_id, branch_id, supplier_id, batch_number, buy_price, sell_price, stock_quantity, expiry_date)
         VALUES (:medicine_id, :branch_id, :supplier_id, :batch_number, :buy_price, :sell_price, :stock, :expiry)"
    );
    $batchInsert->execute([
        "medicine_id" => $medicineId,
        "branch_id" => $branchId,
        "supplier_id" => $supplierId,
        "batch_number" => $payload["batch"],
        "buy_price" => $buyPrice,
        "sell_price" => $sellPrice,
        "stock" => $stock,
        "expiry" => $payload["expiry"],
    ]);

    $pdo->commit();
    writeAudit($pdo, "Create", "Medicine {$payload["brand"]} added", (string) ($payload["actor_name"] ?? "System"), (string) ($payload["actor_role"] ?? "Pharmacist"));
    echo json_encode(["status" => "success", "message" => "Medicine added successfully"]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
