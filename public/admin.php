<?php
include 'config.php';

// Redirect if already logged in
if (isAdmin()) {
    header('Location: dashboard.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($username === ADMIN_USERNAME && $password === ADMIN_PASSWORD) {
        session_regenerate_id(true);
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_user']      = $username;
        header('Location: dashboard.php');
        exit;
    } else {
        $error = 'Invalid username or password. Please try again.';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login – <?php echo SITE_NAME; ?></title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="admin.css">
</head>
<body class="admin-body">
    <div class="login-wrapper">
        <div class="login-card">
            <div class="login-header">
                <div class="login-logo">🔐</div>
                <h1>Admin Portal</h1>
                <p class="login-subtitle"><?php echo COLLEGE_NAME; ?></p>
                <p class="login-sub2"><?php echo SITE_NAME; ?></p>
            </div>

            <?php if ($error): ?>
            <div class="alert alert-error">
                <span>⚠️</span> <?php echo htmlspecialchars($error); ?>
            </div>
            <?php endif; ?>

            <form method="POST" class="login-form" autocomplete="on">
                <div class="form-group">
                    <label for="username">Username</label>
                    <input type="text" id="username" name="username"
                           placeholder="Enter username"
                           value="<?php echo htmlspecialchars($_POST['username'] ?? ''); ?>"
                           required autofocus data-ocid="login.input">
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <div class="password-wrap">
                        <input type="password" id="password" name="password"
                               placeholder="Enter password" required data-ocid="login.input">
                        <button type="button" class="pw-toggle" onclick="togglePw()" title="Show/hide password">👁</button>
                    </div>
                </div>
                <button type="submit" class="btn-primary btn-full" data-ocid="login.submit_button">Sign In →</button>
            </form>
        </div>
    </div>

    <footer class="site-footer" style="position:fixed;bottom:0;left:0;right:0;">
        <p>&copy; <?php echo date('Y'); ?> <?php echo COLLEGE_NAME; ?></p>
    </footer>

    <script>
        function togglePw() {
            const pw = document.getElementById('password');
            pw.type = pw.type === 'password' ? 'text' : 'password';
        }
    </script>
</body>
</html>
