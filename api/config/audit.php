<?php
function ensureManagementTables(PDO $pdo): void {
    $pdo->exec("CREATE TABLE IF NOT EXISTS system_settings (setting_key VARCHAR(60) PRIMARY KEY, setting_value TEXT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS audit_logs (
        log_id INT AUTO_INCREMENT PRIMARY KEY,
        user_name VARCHAR(100) NOT NULL DEFAULT 'System',
        role VARCHAR(30) NOT NULL DEFAULT 'Admin',
        action_type ENUM('Create','Edit','Delete','Backup','Alert') NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
}

function writeAudit(PDO $pdo, string $type, string $description, string $userName = 'System', string $role = 'Admin'): void {
    ensureManagementTables($pdo);
    $stmt = $pdo->prepare("INSERT INTO audit_logs (user_name, role, action_type, description) VALUES (:user_name, :role, :action_type, :description)");
    $stmt->execute([
        'user_name' => $userName ?: 'System',
        'role' => $role ?: 'Admin',
        'action_type' => $type,
        'description' => $description,
    ]);
}
?>
