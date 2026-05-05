<?php
include 'config.php';

// ── Logout ────────────────────────────────────────────────────────────────────
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: admin.php');
    exit;
}

// ── GET ?action=get_payment_details (AJAX — no auth required for reading public info) ──
if ($_SERVER['REQUEST_METHOD'] === 'GET' && ($_GET['action'] ?? '') === 'get_payment_details') {
    jsonResponse([
        'upi_id'         => getSetting('upi_id',          ''),
        'account_holder' => getSetting('account_holder',  ''),
        'account_number' => getSetting('account_number',  ''),
        'ifsc_code'      => getSetting('ifsc_code',        ''),
        'bank_name'      => getSetting('bank_name',        ''),
        'razorpay_key_id'=> getSetting('razorpay_key_id', ''),
        // key_secret intentionally omitted for security
    ]);
}

// ── POST: save settings (requires admin) ─────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Always check auth for POST
    if (!isAdmin()) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'error' => 'Session expired. Please log in again.']);
        exit;
    }

    try {
        $db = getDB();

        $fields = [
            'account_holder',
            'account_number',
            'ifsc_code',
            'bank_name',
            'upi_id',
            'razorpay_key_id',
            'razorpay_key_secret',
        ];

        foreach ($fields as $field) {
            // Don't overwrite existing key_secret when field is left blank
            if ($field === 'razorpay_key_secret' && empty($_POST[$field])) {
                continue;
            }
            saveSetting($field, sanitize($_POST[$field] ?? ''));
        }

        $isAjax = ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'XMLHttpRequest';
        if ($isAjax) {
            header('Content-Type: application/json');
            echo json_encode(['success' => true, 'message' => 'Settings saved successfully!']);
            exit;
        }
        header('Location: settings.php?saved=1');
        exit;

    } catch (Exception $e) {
        $isAjax = ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'XMLHttpRequest';
        if ($isAjax) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'error' => 'Failed to save settings: ' . $e->getMessage()]);
            exit;
        }
        header('Location: settings.php?error=' . urlencode($e->getMessage()));
        exit;
    }
}

// ── GET: settings page (requires admin for HTML view) ────────────────────────
requireAdmin();

$success = '';
$error   = '';
if (isset($_GET['saved'])) {
    $success = 'Settings saved successfully!';
} elseif (isset($_GET['error'])) {
    $error = 'Failed to save settings: ' . htmlspecialchars($_GET['error']);
}

$settings = [
    'account_holder'      => getSetting('account_holder',      ''),
    'account_number'      => getSetting('account_number',      ''),
    'ifsc_code'           => getSetting('ifsc_code',            ''),
    'bank_name'           => getSetting('bank_name',            ''),
    'upi_id'              => getSetting('upi_id',               ''),
    'razorpay_key_id'     => getSetting('razorpay_key_id',      ''),
    'razorpay_key_secret' => getSetting('razorpay_key_secret',  ''),
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Settings – <?php echo SITE_NAME; ?></title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="admin.css">
</head>
<body class="admin-body">

    <header class="admin-header">
        <div class="admin-header-inner">
            <div class="admin-brand">
                <span class="admin-logo">⚙️</span>
                <div>
                    <div class="admin-title">Admin Settings</div>
                    <div class="admin-subtitle"><?php echo COLLEGE_NAME; ?></div>
                </div>
            </div>
            <nav class="admin-nav">
                <a href="dashboard.php" class="btn-nav">← Dashboard</a>
                <a href="export.php" class="btn-nav btn-nav-success">⬇ Export CSV</a>
                <a href="settings.php?logout=1" class="btn-nav btn-nav-danger" onclick="return confirm('Logout?')">🚪 Logout</a>
            </nav>
        </div>
    </header>

    <main class="admin-main">
        <div class="settings-wrap">

            <div id="settings-alert" class="alert<?php echo $success ? ' alert-success' : ($error ? ' alert-error' : ''); ?>"
                 style="<?php echo ($success || $error) ? '' : 'display:none'; ?>">
                <?php if ($success): ?>✅ <?php echo htmlspecialchars($success); ?><?php elseif ($error): ?>⚠️ <?php echo $error; ?><?php endif; ?>
            </div>

            <div class="detail-card">
                <div class="detail-card-header blue">
                    <h3>💳 Razorpay Payment Settings</h3>
                    <p>Configure your Razorpay keys so alumni can pay online. Get keys from your
                       <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener">Razorpay Dashboard</a>.</p>
                </div>

                <form id="settings-form" method="POST" class="settings-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="razorpay_key_id">Razorpay Key ID</label>
                            <input type="text" id="razorpay_key_id" name="razorpay_key_id"
                                   value="<?php echo htmlspecialchars($settings['razorpay_key_id']); ?>"
                                   placeholder="rzp_live_... or rzp_test_...">
                        </div>
                        <div class="form-group">
                            <label for="razorpay_key_secret">Razorpay Key Secret</label>
                            <input type="password" id="razorpay_key_secret" name="razorpay_key_secret"
                                   value=""
                                   placeholder="<?php
                                       $secret = $settings['razorpay_key_secret'];
                                       echo $secret
                                           ? htmlspecialchars(substr($secret, 0, 4)) . str_repeat('*', max(0, strlen($secret) - 4))
                                           : 'Your Razorpay Key Secret';
                                   ?>">
                            <small style="color:#666">Leave blank to keep existing secret unchanged.</small>
                        </div>
                    </div>

                    <hr style="margin:1rem 0;border:none;border-top:1px solid #e2e8f0">
                    <p style="font-weight:600;margin-bottom:.75rem">🏦 Bank Account &amp; UPI Details</p>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="account_holder">Account Holder Name</label>
                            <input type="text" id="account_holder" name="account_holder"
                                   value="<?php echo htmlspecialchars($settings['account_holder']); ?>"
                                   placeholder="e.g. Marudhar Kesari Jain College">
                        </div>
                        <div class="form-group">
                            <label for="bank_name">Bank Name</label>
                            <input type="text" id="bank_name" name="bank_name"
                                   value="<?php echo htmlspecialchars($settings['bank_name']); ?>"
                                   placeholder="e.g. State Bank of India">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="account_number">Account Number</label>
                            <input type="text" id="account_number" name="account_number"
                                   value="<?php echo htmlspecialchars($settings['account_number']); ?>"
                                   placeholder="Bank account number">
                        </div>
                        <div class="form-group">
                            <label for="ifsc_code">IFSC Code</label>
                            <input type="text" id="ifsc_code" name="ifsc_code"
                                   value="<?php echo htmlspecialchars($settings['ifsc_code']); ?>"
                                   placeholder="e.g. SBIN0001234">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="upi_id">UPI ID</label>
                            <input type="text" id="upi_id" name="upi_id"
                                   value="<?php echo htmlspecialchars($settings['upi_id']); ?>"
                                   placeholder="e.g. college@sbi">
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="button" id="save-btn" class="btn-primary" onclick="saveSettings()">
                            💾 Save Settings
                        </button>
                    </div>
                </form>
            </div>

            <!-- Payment Info Preview -->
            <div class="detail-card" id="preview-card" style="<?php echo $settings['upi_id'] ? '' : 'display:none'; ?>">
                <div class="detail-card-header green">
                    <h3>👁 Payment Info Preview</h3>
                    <p>This is how payment details appear to alumni:</p>
                </div>
                <div class="payment-preview" id="preview-content">
                    <div class="pp-row"><strong>UPI ID:</strong> <span id="prev-upi"><?php echo htmlspecialchars($settings['upi_id']); ?></span></div>
                    <div class="pp-row"><strong>Account Holder:</strong> <span id="prev-holder"><?php echo htmlspecialchars($settings['account_holder']); ?></span></div>
                    <div class="pp-row"><strong>Bank:</strong> <span id="prev-bank"><?php echo htmlspecialchars($settings['bank_name']); ?></span></div>
                    <div class="pp-row"><strong>Account Number:</strong> <span id="prev-acc"><?php echo htmlspecialchars($settings['account_number']); ?></span></div>
                    <div class="pp-row"><strong>IFSC:</strong> <span id="prev-ifsc"><?php echo htmlspecialchars($settings['ifsc_code']); ?></span></div>
                </div>
            </div>

        </div><!-- /settings-wrap -->
    </main>

    <footer class="site-footer">
        <p>&copy; <?php echo date('Y'); ?> <?php echo COLLEGE_NAME; ?></p>
    </footer>

    <script>
    async function saveSettings() {
        const btn      = document.getElementById('save-btn');
        const alertBox = document.getElementById('settings-alert');

        btn.disabled    = true;
        btn.textContent = '⏳ Saving...';
        alertBox.style.display = 'none';
        alertBox.className     = 'alert';

        const form     = document.getElementById('settings-form');
        const formData = new FormData(form);

        try {
            const res = await fetch('settings.php', {
                method:      'POST',
                headers:     { 'X-Requested-With': 'XMLHttpRequest' },
                body:        formData,
                credentials: 'same-origin',
            });

            let data;
            try   { data = await res.json(); }
            catch { throw new Error('Server returned an unexpected response. Please try again.'); }

            if (res.status === 401) {
                alertBox.className   = 'alert alert-error';
                alertBox.textContent = '⚠️ ' + (data.error || 'Session expired. Please log in again.');
                alertBox.style.display = 'block';
                setTimeout(() => { window.location.href = 'admin.php'; }, 2000);
                return;
            }

            if (data.success) {
                alertBox.className   = 'alert alert-success';
                alertBox.textContent = '✅ Settings saved successfully!';
                alertBox.style.display = 'block';

                // Update preview
                const upiId = form.upi_id.value.trim();
                if (upiId) {
                    document.getElementById('prev-upi').textContent    = upiId;
                    document.getElementById('prev-holder').textContent  = form.account_holder.value.trim();
                    document.getElementById('prev-bank').textContent    = form.bank_name.value.trim();
                    document.getElementById('prev-acc').textContent     = form.account_number.value.trim();
                    document.getElementById('prev-ifsc').textContent    = form.ifsc_code.value.trim();
                    document.getElementById('preview-card').style.display = 'block';
                }
            } else {
                alertBox.className   = 'alert alert-error';
                alertBox.textContent = '⚠️ Failed to save payment settings. ' + (data.error || 'Please try again.');
                alertBox.style.display = 'block';
            }
        } catch (err) {
            alertBox.className   = 'alert alert-error';
            alertBox.textContent = '⚠️ Failed to save payment settings. ' + err.message;
            alertBox.style.display = 'block';
        } finally {
            btn.disabled    = false;
            btn.textContent = '💾 Save Settings';
            alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    </script>

</body>
</html>
