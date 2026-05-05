<?php
include 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Invalid request method'], 405);
}

$keyId     = getSetting('razorpay_key_id', '');
$keySecret = getSetting('razorpay_key_secret', '');

if (empty($keyId) || empty($keySecret)) {
    jsonResponse(['success' => false, 'message' => 'Payment gateway not configured. Please ask admin to set Razorpay keys.']);
}

// Accept JSON body (sent by frontend fetch) or form POST
$rawInput = file_get_contents('php://input');
$input    = !empty($rawInput) ? (json_decode($rawInput, true) ?? []) : $_POST;

// Amount comes in rupees from frontend; convert to paise
$amountRupees = floatval($input['amount'] ?? 0);
if ($amountRupees < 1) {
    jsonResponse(['success' => false, 'message' => 'Amount must be at least ₹1']);
}
$amountPaise = (int)round($amountRupees * 100);
$currency    = preg_replace('/[^A-Z]/', '', strtoupper($input['currency'] ?? 'INR'));
if (empty($currency)) $currency = 'INR';

$payload = json_encode([
    'amount'          => $amountPaise,
    'currency'        => $currency,
    'receipt'         => 'rcpt_' . uniqid(),
    'payment_capture' => 1,
]);

$ch = curl_init('https://api.razorpay.com/v1/orders');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_TIMEOUT        => 20,
    CURLOPT_USERPWD        => $keyId . ':' . $keySecret,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_SSL_VERIFYPEER => true,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($curlErr) {
    jsonResponse(['success' => false, 'message' => 'Network error: ' . $curlErr]);
}

$data = json_decode($response, true);

if ($httpCode === 200 && !empty($data['id'])) {
    jsonResponse([
        'success'  => true,
        'order_id' => $data['id'],
        'amount'   => $data['amount'],   // paise
        'currency' => $data['currency'],
        'key_id'   => $keyId,
    ]);
}

$errMsg = $data['error']['description'] ?? ('Failed to create payment order (HTTP ' . $httpCode . ')');
jsonResponse(['success' => false, 'message' => $errMsg]);
