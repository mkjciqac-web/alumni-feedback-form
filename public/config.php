<?php
define('DB_PATH',    __DIR__ . '/data/alumni_feedback.db');
define('UPLOAD_DIR', __DIR__ . '/uploads/');
// Keep UPLOAD_PATH alias for any legacy references
define('UPLOAD_PATH', UPLOAD_DIR);
define('ADMIN_USERNAME', 'admin');
define('ADMIN_PASSWORD', 'admin@318');
define('SITE_NAME',    'Alumni Feedback Form');
define('COLLEGE_NAME', 'Marudhar Kesari jain College for Women(Autonomous), Vaniyambadi.');

if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'secure'   => false,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
}

// Ensure data and uploads directories exist
if (!is_dir(__DIR__ . '/data'))  mkdir(__DIR__ . '/data',  0755, true);
if (!is_dir(UPLOAD_DIR))         mkdir(UPLOAD_DIR,          0755, true);

function getDB(): PDO {
    static $db = null;
    if ($db === null) {
        $db = new PDO('sqlite:' . DB_PATH);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $db->exec('PRAGMA journal_mode=WAL');
        initDB($db);
    }
    return $db;
}

function initDB(PDO $db): void {
    $db->exec("CREATE TABLE IF NOT EXISTS submissions (
        id                       INTEGER PRIMARY KEY AUTOINCREMENT,
        name                     TEXT,
        email                    TEXT,
        phone                    TEXT,
        degree                   TEXT,
        department               TEXT,
        batch                    TEXT,
        status                   TEXT,
        occupation               TEXT,
        occupation_other         TEXT,
        company_name             TEXT,
        designation              TEXT,
        company_address          TEXT,
        appointment_order        TEXT,
        company_id_card          TEXT,
        college_name_field       TEXT,
        program                  TEXT,
        college_address          TEXT,
        study_id_card            TEXT,
        curr_q1                  INTEGER,
        curr_q2                  INTEGER,
        curr_q3                  INTEGER,
        curr_q4                  INTEGER,
        curr_q5                  INTEGER,
        curr_q6                  INTEGER,
        curr_q7                  INTEGER,
        curr_q8                  INTEGER,
        curr_open1               TEXT,
        curr_open2               TEXT,
        teach_q1                 INTEGER,
        teach_q2                 INTEGER,
        teach_q3                 INTEGER,
        teach_q4                 INTEGER,
        teach_q5                 INTEGER,
        teach_q6                 INTEGER,
        teach_q7                 INTEGER,
        teach_q8                 INTEGER,
        teach_q9                 INTEGER,
        teach_q10                INTEGER,
        teach_open1              TEXT,
        teach_open2              TEXT,
        resource_persons         TEXT,
        resource_persons_options TEXT,
        contribution_choice      TEXT,
        contribution_amount      REAL,
        payment_reference        TEXT,
        payment_status           TEXT,
        razorpay_payment_id      TEXT,
        razorpay_order_id        TEXT,
        razorpay_signature       TEXT,
        payment_screenshot       TEXT,
        submitted_at             DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    $db->exec("CREATE TABLE IF NOT EXISTS settings (
        key   TEXT PRIMARY KEY,
        value TEXT
    )");

    // Migration: add any missing columns to existing tables
    $existingCols = [];
    foreach ($db->query("PRAGMA table_info(submissions)")->fetchAll() as $col) {
        $existingCols[] = $col['name'];
    }

    $requiredColumns = [
        'occupation'              => 'TEXT',
        'occupation_other'        => 'TEXT',
        'curr_open1'              => 'TEXT',
        'curr_open2'              => 'TEXT',
        'resource_persons'        => 'TEXT',
        'resource_persons_options'=> 'TEXT',
        'payment_screenshot'      => 'TEXT',
        'razorpay_payment_id'     => 'TEXT',
        'razorpay_order_id'       => 'TEXT',
        'razorpay_signature'      => 'TEXT',
        'teach_open1'             => 'TEXT',
        'teach_open2'             => 'TEXT',
        'payment_reference'       => 'TEXT',
        'payment_status'          => 'TEXT',
        'contribution_choice'     => 'TEXT',
        'contribution_amount'     => 'REAL',
    ];

    foreach ($requiredColumns as $colName => $colType) {
        if (!in_array($colName, $existingCols)) {
            $db->exec("ALTER TABLE submissions ADD COLUMN $colName $colType");
        }
    }
}

function getSetting(string $key, string $default = ''): string {
    try {
        $db   = getDB();
        $stmt = $db->prepare("SELECT value FROM settings WHERE key = ?");
        $stmt->execute([$key]);
        $row = $stmt->fetch();
        return $row ? (string)$row['value'] : $default;
    } catch (Exception $e) {
        return $default;
    }
}

function saveSetting(string $key, string $value): void {
    $db   = getDB();
    $stmt = $db->prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    $stmt->execute([$key, $value]);
}

function isAdmin(): bool {
    return (
        (isset($_SESSION['admin']) && $_SESSION['admin'] === true) ||
        (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true)
    );
}

function requireAdmin(): void {
    if (!isAdmin()) {
        $isAjax = (
            ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' ||
            (($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'XMLHttpRequest')
        );
        if ($isAjax) {
            http_response_code(401);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'error' => 'Unauthorized. Please log in again.']);
            exit;
        }
        header('Location: admin.php');
        exit;
    }
}

function sanitize(string $str): string {
    return trim(strip_tags($str));
}

function jsonResponse(array $data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}
