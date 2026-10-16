<?php
header("Content-Type: application/json");
require_once "../config/db.php";
require_once "../config/audit.php";

if (!in_array($_SERVER["REQUEST_METHOD"], ["POST", "PUT"], true)) {
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

$required = ["batch_id", "brand", "generic", "category", "manufacturer", "batch", "stock", "buyPrice", "sellPrice", "expiry"];
foreach ($required as $field) {
    if (!array_key_exists($field, $payload) || $payload[$field] === "") {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing field: " . $field]);
        exit();
    }
}

$batchId = (int) $payload["batch_id"];
$stock = (int) $payload["stock"];
$buyPrice = (float) $payload["buyPrice"];
$sellPrice = (float) $payload["sellPrice"];
$imageProvided = array_key_exists("img", $payload) && trim((string) $payload["img"]) !== "";
$image = $imageProvided ? trim((string) $payload["img"]) : null;

if ($batchId < 1 || $stock < 0 || $buyPrice < 0 || $sellPrice < 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid medicine values"]);
    exit();
}

try {
    $batchLookup = $pdo->prepare(
        "SELECT medicine_id FROM medicine_batches WHERE batch_id = :batch_id LIMIT 1"
    );
    $batchLookup->execute(["batch_id" => $batchId]);
    $medicineId = $batchLookup->fetchColumn();
    if (!$medicineId) {
        throw new RuntimeException("Medicine batch not found");
    }

    $categoryStmt = $pdo->prepare(
        "SELECT category_id FROM categories WHERE category_name = :category LIMIT 1"
    );
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

    $imageColumn = $pdo->query(
        "SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'medicines'
           AND COLUMN_NAME = 'image'
         LIMIT 1"
    )->fetch(PDO::FETCH_ASSOC);
    if ($imageProvided && $imageColumn && $imageColumn["DATA_TYPE"] === "varchar" && (int) $imageColumn["CHARACTER_MAXIMUM_LENGTH"] < 65535) {
        $pdo->exec("ALTER TABLE medicines MODIFY image TEXT NULL");
    }

    $pdo->beginTransaction();

    $medicineSql = "UPDATE medicines
                    SET brand_name = :brand,
                        generic_name = :generic,
                        category_id = :category_id" .
                   ($imageProvided ? ", image = :image" : "") .
                   " WHERE medicine_id = :medicine_id";
    $medicineParams = [
        "brand" => $payload["brand"],
        "generic" => $payload["generic"],
        "category_id" => $categoryId,
        "medicine_id" => $medicineId,
    ];
    if ($imageProvided) {
        $medicineParams["image"] = $image;
    }
    $medicineUpdate = $pdo->prepare($medicineSql);
    $medicineUpdate->execute($medicineParams);

    $batchUpdate = $pdo->prepare(
        "UPDATE medicine_batches
         SET supplier_id = :supplier_id,
             batch_number = :batch_number,
             stock_quantity = :stock,
             buy_price = :buy_price,
             sell_price = :sell_price,
             expiry_date = :expiry
         WHERE batch_id = :batch_id"
    );
    $batchUpdate->execute([
        "supplier_id" => $supplierId,
        "batch_number" => $payload["batch"],
        "stock" => $stock,
        "buy_price" => $buyPrice,
        "sell_price" => $sellPrice,
        "expiry" => $payload["expiry"],
        "batch_id" => $batchId,
    ]);

    $pdo->commit();
    writeAudit($pdo, "Edit", "Medicine {$payload["brand"]} updated", (string) ($payload["actor_name"] ?? "System"), (string) ($payload["actor_role"] ?? "Pharmacist"));
    echo json_encode(["status" => "success", "message" => "Medicine updated successfully"]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
