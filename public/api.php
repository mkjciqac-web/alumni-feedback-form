<?php
include 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Invalid request method'], 405);
}

try {
    $db = getDB();

    // ── 1. Basic required fields ─────────────────────────────────────────────
    $required = ['name', 'email', 'phone', 'degree', 'department', 'batch', 'status', 'occupation'];
    foreach ($required as $field) {
        if (empty(trim($_POST[$field] ?? ''))) {
            jsonResponse(['success' => false, 'message' => "Field '$field' is required"], 400);
        }
    }

    // Email
    if (!filter_var(trim($_POST['email']), FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['success' => false, 'message' => 'Invalid email address'], 400);
    }

    // Phone (10 digits)
    $phone = preg_replace('/\D/', '', $_POST['phone']);
    if (strlen($phone) !== 10) {
        jsonResponse(['success' => false, 'message' => 'Phone number must be exactly 10 digits'], 400);
    }

    // Occupation other
    $occupation = sanitize($_POST['occupation']);
    if ($occupation === 'Other' && empty(trim($_POST['occupation_other'] ?? ''))) {
        jsonResponse(['success' => false, 'message' => 'Please specify your occupation'], 400);
    }

    // ── 2. Status-conditional validation ─────────────────────────────────────
    $status = sanitize($_POST['status'] ?? '');

    if (strtolower($status) === 'working') {
        if (empty(trim($_POST['designation'] ?? ''))) {
            jsonResponse(['success' => false, 'message' => 'Designation is required for working alumni'], 400);
        }
        if (empty(trim($_POST['company_address'] ?? ''))) {
            jsonResponse(['success' => false, 'message' => 'Company address is required for working alumni'], 400);
        }
        if (empty($_FILES['appointment_order']['name'] ?? '')) {
            jsonResponse(['success' => false, 'message' => 'Appointment Order file is required for working alumni'], 400);
        }
        if (empty($_FILES['company_id_card']['name'] ?? '')) {
            jsonResponse(['success' => false, 'message' => 'Company ID Card file is required for working alumni'], 400);
        }
    }

    if (strtolower($status) === 'studying') {
        if (empty(trim($_POST['program'] ?? ''))) {
            jsonResponse(['success' => false, 'message' => 'Program is required for studying alumni'], 400);
        }
        if (empty(trim($_POST['college_address'] ?? ''))) {
            jsonResponse(['success' => false, 'message' => 'College address is required for studying alumni'], 400);
        }
        if (empty($_FILES['study_id_card']['name'] ?? '')) {
            jsonResponse(['success' => false, 'message' => 'Study ID Card file is required for studying alumni'], 400);
        }
    }

    // ── 3. Curriculum Likert questions (Q1–Q8, 1–5) ─────────────────────────
    for ($i = 1; $i <= 8; $i++) {
        $val = $_POST["curr_q$i"] ?? '';
        if (!in_array((string)$val, ['1','2','3','4','5'])) {
            jsonResponse(['success' => false, 'message' => "Please answer all curriculum questions (Q$i missing or invalid)"], 400);
        }
    }

    // Curriculum open-ended (required)
    if (empty(trim($_POST['curr_open1'] ?? ''))) {
        jsonResponse(['success' => false, 'message' => 'Curriculum Question 9 (improvements suggestion) is required'], 400);
    }
    if (empty(trim($_POST['curr_open2'] ?? ''))) {
        jsonResponse(['success' => false, 'message' => 'Curriculum Question 10 (additional comments) is required'], 400);
    }

    // ── 4. Teaching Likert questions (Q1–Q10, 1–5) ──────────────────────────
    for ($i = 1; $i <= 10; $i++) {
        $val = $_POST["teach_q$i"] ?? '';
        if (!in_array((string)$val, ['1','2','3','4','5'])) {
            jsonResponse(['success' => false, 'message' => "Please answer all teaching questions (Q$i missing or invalid)"], 400);
        }
    }

    // Teaching open-ended (required)
    if (empty(trim($_POST['teach_open1'] ?? ''))) {
        jsonResponse(['success' => false, 'message' => 'Teaching Open Question 1 is required'], 400);
    }
    if (empty(trim($_POST['teach_open2'] ?? ''))) {
        jsonResponse(['success' => false, 'message' => 'Teaching Open Question 2 is required'], 400);
    }

    // ── 5. Resource persons validation ───────────────────────────────────────
    $resourcePersons = strtolower(sanitize($_POST['resource_persons'] ?? ''));
    if (!in_array($resourcePersons, ['yes', 'no'])) {
        jsonResponse(['success' => false, 'message' => 'Please indicate whether you can arrange resource persons'], 400);
    }

    $resourcePersonsOptions = '';
    if ($resourcePersons === 'yes') {
        $rawOptions     = $_POST['resource_persons_options'] ?? [];
        $allowedOptions = ['SEMINARS', 'GUEST LECTURES', 'COLLEGE FUNCTIONS'];
        // accept both array and single string
        if (!is_array($rawOptions)) $rawOptions = [$rawOptions];
        $cleanOptions = array_filter(
            array_map('trim', $rawOptions),
            fn($opt) => in_array($opt, $allowedOptions)
        );
        if (empty($cleanOptions)) {
            jsonResponse(['success' => false, 'message' => 'Please select at least one type of resource person you can arrange'], 400);
        }
        $resourcePersonsOptions = implode(', ', $cleanOptions);
    }

    // ── 6. Contribution / payment validation ─────────────────────────────────
    $contributionChoice = sanitize($_POST['contribution_choice'] ?? '');
    $contributionAmount = null;
    $paymentReference   = sanitize($_POST['payment_reference']   ?? '');
    $razorpayPaymentId  = sanitize($_POST['razorpay_payment_id'] ?? '');
    $razorpayOrderId    = sanitize($_POST['razorpay_order_id']   ?? '');
    $razorpaySignature  = $_POST['razorpay_signature']           ?? '';
    $paymentStatus      = 'N/A';

    $paymentRequired = in_array($contributionChoice, [
        'POOR STUDENTS EDUCATION EXPENSES',
        'ORPHANAGES / OLD AGE HOMES',
    ]);

    if ($paymentRequired) {
        $contributionAmount = floatval($_POST['contribution_amount'] ?? 0);
        if ($contributionAmount < 1) {
            jsonResponse(['success' => false, 'message' => 'Please enter a valid contribution amount (minimum ₹1)'], 400);
        }
        $psRequired = isset($_POST['payment_status']) ? sanitize($_POST['payment_status']) : '';
        if (empty($psRequired)) {
            jsonResponse(['success' => false, 'message' => 'Payment status is required for this contribution'], 400);
        }
        // If Razorpay was used, payment_id must be present
        if (!empty($razorpayPaymentId)) {
            $paymentStatus = 'Paid (Razorpay)';
        } elseif (!empty($paymentReference)) {
            $paymentStatus = 'Paid (Reference: ' . $paymentReference . ')';
        } else {
            $paymentStatus = $psRequired;
        }
    }

    // ── 7. File upload helper ────────────────────────────────────────────────
    $handleUpload = function (string $field) use (&$paymentRequired): ?string {
        if (empty($_FILES[$field]['name'])) return null;

        $file         = $_FILES[$field];
        $allowedTypes = ['image/jpeg','image/png','image/gif','image/webp','application/pdf'];
        $maxSize      = 5 * 1024 * 1024; // 5 MB

        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            throw new Exception("Upload error for '$field': code " . $file['error']);
        }
        if ($file['size'] > $maxSize) {
            throw new Exception("File '$field' exceeds the 5 MB limit");
        }

        $finfo    = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);
        if (!in_array($mimeType, $allowedTypes)) {
            throw new Exception("File '$field' must be an image (JPEG/PNG/GIF/WebP) or PDF");
        }

        $ext      = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $safeName = $field . '_' . uniqid() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
        $dest     = UPLOAD_DIR . $safeName;

        if (!move_uploaded_file($file['tmp_name'], $dest)) {
            throw new Exception("Failed to save uploaded file '$field'");
        }

        return $safeName;
    };

    $appointmentOrder  = $handleUpload('appointment_order');
    $companyIdCard     = $handleUpload('company_id_card');
    $studyIdCard       = $handleUpload('study_id_card');
    $paymentScreenshot = $handleUpload('payment_screenshot');

    // ── 8. Build data row ────────────────────────────────────────────────────
    $data = [
        'name'                     => sanitize($_POST['name']),
        'email'                    => sanitize($_POST['email']),
        'phone'                    => $phone,
        'degree'                   => sanitize($_POST['degree']),
        'department'               => sanitize($_POST['department']),
        'batch'                    => sanitize($_POST['batch']),
        'status'                   => $status,
        'occupation'               => $occupation,
        'occupation_other'         => sanitize($_POST['occupation_other'] ?? ''),
        'company_name'             => sanitize($_POST['company_name']     ?? ''),
        'designation'              => sanitize($_POST['designation']      ?? ''),
        'company_address'          => sanitize($_POST['company_address']  ?? ''),
        'appointment_order'        => $appointmentOrder,
        'company_id_card'          => $companyIdCard,
        'college_name_field'       => sanitize($_POST['college_name_field'] ?? ''),
        'program'                  => sanitize($_POST['program']            ?? ''),
        'college_address'          => sanitize($_POST['college_address']    ?? ''),
        'study_id_card'            => $studyIdCard,
        'curr_q1'                  => (int)$_POST['curr_q1'],
        'curr_q2'                  => (int)$_POST['curr_q2'],
        'curr_q3'                  => (int)$_POST['curr_q3'],
        'curr_q4'                  => (int)$_POST['curr_q4'],
        'curr_q5'                  => (int)$_POST['curr_q5'],
        'curr_q6'                  => (int)$_POST['curr_q6'],
        'curr_q7'                  => (int)$_POST['curr_q7'],
        'curr_q8'                  => (int)$_POST['curr_q8'],
        'curr_open1'               => sanitize($_POST['curr_open1']),
        'curr_open2'               => sanitize($_POST['curr_open2']),
        'teach_q1'                 => (int)$_POST['teach_q1'],
        'teach_q2'                 => (int)$_POST['teach_q2'],
        'teach_q3'                 => (int)$_POST['teach_q3'],
        'teach_q4'                 => (int)$_POST['teach_q4'],
        'teach_q5'                 => (int)$_POST['teach_q5'],
        'teach_q6'                 => (int)$_POST['teach_q6'],
        'teach_q7'                 => (int)$_POST['teach_q7'],
        'teach_q8'                 => (int)$_POST['teach_q8'],
        'teach_q9'                 => (int)$_POST['teach_q9'],
        'teach_q10'                => (int)$_POST['teach_q10'],
        'teach_open1'              => sanitize($_POST['teach_open1'] ?? ''),
        'teach_open2'              => sanitize($_POST['teach_open2'] ?? ''),
        'resource_persons'         => $resourcePersons,
        'resource_persons_options' => $resourcePersonsOptions,
        'contribution_choice'      => $contributionChoice,
        'contribution_amount'      => $contributionAmount,
        'payment_reference'        => $paymentReference,
        'payment_status'           => $paymentStatus,
        'razorpay_payment_id'      => $razorpayPaymentId,
        'razorpay_order_id'        => $razorpayOrderId,
        'razorpay_signature'       => $razorpaySignature,
        'payment_screenshot'       => $paymentScreenshot,
    ];

    $cols         = implode(', ', array_keys($data));
    $placeholders = ':' . implode(', :', array_keys($data));
    $stmt         = $db->prepare("INSERT INTO submissions ($cols) VALUES ($placeholders)");
    $stmt->execute($data);

    jsonResponse([
        'success' => true,
        'message' => 'Feedback submitted successfully!',
        'id'      => $db->lastInsertId(),
    ]);

} catch (Exception $e) {
    jsonResponse(['success' => false, 'message' => $e->getMessage()], 500);
}
