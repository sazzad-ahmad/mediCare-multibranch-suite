<?php
// api/config/db.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host    = 'gateway01.ap-northeast-1.prod.aws.tidbcloud.com';
$port    = 4000;
$db      = 'test';
$user    = 'S5Zu9RAuhXDoqNJ.root';
$pass    = 'HXiwt9CkHMVX3rhw'; // TiDB-র Generate Password দিয়ে পাওয়া পাসওয়ার্ডটি এখানে বসাও
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE                      => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE           => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES             => false,
    PDO::MYSQL_ATTR_SSL_CA                 => true,
    PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database connection failed: " . $e->getMessage()]);
    exit();
}
?>