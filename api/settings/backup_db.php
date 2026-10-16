<?php
require_once '../config/db.php';
require_once '../config/audit.php';
try {
    ensureManagementTables($pdo);
    $backupDir = __DIR__ . DIRECTORY_SEPARATOR . 'backups';
    if (!is_dir($backupDir)) mkdir($backupDir, 0750, true);
    $downloadLast = ($_GET['action'] ?? '') === 'download_last';
    if ($downloadLast) {
        $files = glob($backupDir . DIRECTORY_SEPARATOR . 'medicare_db_backup_*.sql') ?: [];
        usort($files, fn($a, $b) => filemtime($b) <=> filemtime($a));
        if (!$files) { http_response_code(404); header('Content-Type: application/json'); echo json_encode(['status'=>'error','message'=>'No backup has been created yet']); exit; }
        $filename = basename($files[0]);
        header('Content-Type: application/sql'); header('Content-Disposition: attachment; filename="'.$filename.'"'); header('Content-Length: '.filesize($files[0]));
        readfile($files[0]); exit;
    }
    $timestamp = date('Ymd_His'); $filename = "medicare_db_backup_{$timestamp}.sql"; $dump = "-- MediCare database backup {$timestamp}\nSET FOREIGN_KEY_CHECKS=0;\n";
    $tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    foreach ($tables as $table) {
        $quoted = '`' . str_replace('`','``',$table) . '`';
        $create = $pdo->query("SHOW CREATE TABLE {$quoted}")->fetch(PDO::FETCH_ASSOC);
        $dump .= "\nDROP TABLE IF EXISTS {$quoted};\n" . $create['Create Table'] . ";\n";
        $rows = $pdo->query("SELECT * FROM {$quoted}")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $row) {
            $columns = implode(', ', array_map(fn($column) => '`'.str_replace('`','``',$column).'`', array_keys($row)));
            $values = implode(', ', array_map(fn($value) => $value === null ? 'NULL' : $pdo->quote((string)$value), array_values($row)));
            $dump .= "INSERT INTO {$quoted} ({$columns}) VALUES ({$values});\n";
        }
    }
    $dump .= "SET FOREIGN_KEY_CHECKS=1;\n";
    $path = $backupDir . DIRECTORY_SEPARATOR . $filename;
    file_put_contents($path, $dump);
    writeAudit($pdo, 'Backup', 'Database backup completed by ' . (string)($_GET['actor_name'] ?? 'System'), (string)($_GET['actor_name'] ?? 'System'), (string)($_GET['actor_role'] ?? 'Admin'));
    header('Content-Type: application/sql'); header('Content-Disposition: attachment; filename="'.$filename.'"'); header('Content-Length: '.strlen($dump));
    echo $dump;
} catch (Throwable $e) { http_response_code(500); header('Content-Type: application/json'); echo json_encode(['status'=>'error','message'=>'Unable to create database backup']); }
?>
