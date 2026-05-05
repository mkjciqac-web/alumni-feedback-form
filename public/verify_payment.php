<?php
include 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Invalid request method'], 405);
}

$keySecret = getSetting('razorpay_key_secret', '');

if (empty($keySecret)) {
    jsonResponse(['success' => false, 'message' => 'Payment gateway not configured']);
}

// Accept JSON body or form POST
$rawInput  = file_get_contents('php://input');
$input     = !empty($rawInput) ? (json_decode($rawInput, true) ?? []) : $_POST;

$paymentId = sanitize($input['razorpay_payment_id'] ?? '');
$orderId   = sanitize($input['razorpay_order_id']   ?? '');
$signature = $input['razorpay_signature']            ?? '';  // raw — do not sanitize

if (empty($paymentId) || empty($orderId) || empty($signature)) {
    jsonResponse(['success' => false, 'message' => 'Missing required payment fields'], 400);
}

// Razorpay signature = HMAC-SHA256(order_id + "|" + payment_id, key_secret)
$body              = $orderId . '|' . $paymentId;
$expectedSignature = hash_hmac('sha256', $body, $keySecret);

if (hash_equals($expectedSignature, $signature)) {
    jsonResponse([
        'success'    => true,
        'verified'   => true,
        'message'    => 'Payment verified successfully',
        'payment_id' => $paymentId,
    ]);
}

jsonResponse(['success' => false, 'message' => 'Payment verification failed. Signature mismatch.']);
