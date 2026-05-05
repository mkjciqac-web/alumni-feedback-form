<?php
include 'config.php';
requireAdmin();

if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: admin.php');
    exit;
}

$db = getDB();

// Stats
$total     = $db->query("SELECT COUNT(*) as c FROM submissions")->fetch()['c'];
$thisMonth = $db->query("SELECT COUNT(*) as c FROM submissions WHERE strftime('%Y-%m', submitted_at) = strftime('%Y-%m', 'now')")->fetch()['c'];
$thisWeek  = $db->query("SELECT COUNT(*) as c FROM submissions WHERE submitted_at >= date('now', '-7 days')")->fetch()['c'];

$submissions = $db->query("SELECT * FROM submissions ORDER BY submitted_at DESC")->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard – <?php echo SITE_NAME; ?></title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="admin.css">
</head>
<body class="admin-body">

    <header class="admin-header">
        <div class="admin-header-inner">
            <div class="admin-brand">
                <span class="admin-logo">🎓</span>
                <div>
                    <div class="admin-title"><?php echo SITE_NAME; ?> – Admin Dashboard</div>
                    <div class="admin-subtitle"><?php echo COLLEGE_NAME; ?></div>
                </div>
            </div>
            <nav class="admin-nav">
                <a href="settings.php" class="btn-nav" data-ocid="nav.settings_button">⚙ Settings</a>
                <a href="export.php" class="btn-nav btn-nav-success" data-ocid="nav.export_button">⬇ Export Excel</a>
                <a href="dashboard.php?logout=1" class="btn-nav btn-nav-danger" data-ocid="nav.logout_button" onclick="return confirm('Logout?')">🚪 Logout</a>
            </nav>
        </div>
    </header>

    <main class="admin-main">
        <!-- Stats -->
        <div class="stats-bar">
            <div class="stat-card">
                <div class="stat-number"><?php echo $total; ?></div>
                <div class="stat-label">Total Submissions</div>
            </div>
            <div class="stat-card">
                <div class="stat-number"><?php echo $thisMonth; ?></div>
                <div class="stat-label">This Month</div>
            </div>
            <div class="stat-card">
                <div class="stat-number"><?php echo $thisWeek; ?></div>
                <div class="stat-label">This Week</div>
            </div>
        </div>

        <!-- Table -->
        <div class="dashboard-card">
            <div class="dashboard-card-header">
                <h2>All Alumni Submissions</h2>
                <p class="table-hint">Click any row to view full details. Scroll horizontally to see all columns.</p>
                <input type="text" id="search-input" class="search-input"
                       placeholder="🔍 Search by name, email, department..."
                       oninput="filterTable()" data-ocid="dashboard.search_input">
            </div>

            <div class="table-container">
                <table class="data-table" id="submissions-table">
                    <thead>
                        <tr>
                            <th class="col-group-blue"  colspan="11">Registration Information</th>
                            <th class="col-group-teal"  colspan="5">Employment / Study Details</th>
                            <th class="col-group-green" colspan="10">Curriculum Feedback (Q1–Q8 + 2 Open)</th>
                            <th class="col-group-purple" colspan="12">Teaching &amp; Learning Feedback (Q1–Q10 + 2 Open)</th>
                            <th class="col-group-teal"  colspan="2">Resource Persons</th>
                            <th class="col-group-orange" colspan="5">Contribution / Payment</th>
                            <th class="col-group-gray"  colspan="1">Submitted</th>
                        </tr>
                        <tr class="sub-header">
                            <!-- Registration -->
                            <th class="sticky-col">#</th>
                            <th>Name</th><th>Email</th><th>Phone</th>
                            <th>Degree</th><th>Department</th><th>Batch</th>
                            <th>Status</th><th>Occupation</th><th>Occ. Other</th><th>—</th>
                            <!-- Employment -->
                            <th>Company/College</th><th>Desig./Program</th><th>Address</th>
                            <th>Appt. Order</th><th>ID Card</th>
                            <!-- Curriculum -->
                            <th>CQ1</th><th>CQ2</th><th>CQ3</th><th>CQ4</th>
                            <th>CQ5</th><th>CQ6</th><th>CQ7</th><th>CQ8</th>
                            <th>Curr Open 1</th><th>Curr Open 2</th>
                            <!-- Teaching -->
                            <th>TQ1</th><th>TQ2</th><th>TQ3</th><th>TQ4</th><th>TQ5</th>
                            <th>TQ6</th><th>TQ7</th><th>TQ8</th><th>TQ9</th><th>TQ10</th>
                            <th>T Open 1</th><th>T Open 2</th>
                            <!-- Resource -->
                            <th>Resource?</th><th>Resource Type</th>
                            <!-- Contribution -->
                            <th>Contribution For</th><th>Amount (₹)</th>
                            <th>Payment Ref.</th><th>Pay Status</th><th>Screenshot</th>
                            <!-- Date -->
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody id="table-body">
                        <?php if (empty($submissions)): ?>
                        <tr>
                            <td colspan="46" class="empty-row" data-ocid="dashboard.empty_state">
                                No submissions yet. Feedback forms will appear here once submitted.
                            </td>
                        </tr>
                        <?php else: ?>
                        <?php foreach ($submissions as $idx => $s): ?>
                        <tr class="data-row" onclick="window.location.href='detail.php?id=<?php echo $s['id']; ?>'"
                            style="cursor:pointer;" tabindex="0"
                            data-ocid="dashboard.item.<?php echo ($idx + 1); ?>">
                            <td class="sticky-col"><?php echo $s['id']; ?></td>
                            <td class="td-name"><?php echo sanitize($s['name']); ?></td>
                            <td><?php echo sanitize($s['email']); ?></td>
                            <td><?php echo sanitize($s['phone']); ?></td>
                            <td><?php echo sanitize($s['degree']); ?></td>
                            <td><?php echo sanitize($s['department']); ?></td>
                            <td><?php echo sanitize($s['batch']); ?></td>
                            <td>
                                <?php $sc = ['Working'=>'badge-blue','Studying'=>'badge-green','Other'=>'badge-gray'][$s['status']] ?? 'badge-gray'; ?>
                                <span class="badge <?php echo $sc; ?>"><?php echo sanitize($s['status']); ?></span>
                            </td>
                            <td><?php echo sanitize($s['occupation']); ?></td>
                            <td><?php echo sanitize($s['occupation_other']); ?></td>
                            <td>—</td>
                            <!-- Employment/Study -->
                            <td><?php echo sanitize($s['company_name'] ?: $s['college_name_field']); ?></td>
                            <td><?php echo sanitize($s['designation'] ?: $s['program']); ?></td>
                            <td class="td-truncate"><?php echo sanitize($s['company_address'] ?: $s['college_address']); ?></td>
                            <td><?php echo $s['appointment_order'] ? '✅' : '—'; ?></td>
                            <td><?php echo ($s['company_id_card'] || $s['study_id_card']) ? '✅' : '—'; ?></td>
                            <!-- Curriculum Likert -->
                            <?php for ($i = 1; $i <= 8; $i++): ?>
                            <td class="likert-cell likert-<?php echo intval($s["curr_q$i"]); ?>"><?php echo intval($s["curr_q$i"]); ?></td>
                            <?php endfor; ?>
                            <!-- Curriculum Open -->
                            <td class="td-truncate"><?php echo sanitize($s['curr_open1'] ?? ''); ?></td>
                            <td class="td-truncate"><?php echo sanitize($s['curr_open2'] ?? ''); ?></td>
                            <!-- Teaching Likert -->
                            <?php for ($i = 1; $i <= 10; $i++): ?>
                            <td class="likert-cell likert-<?php echo intval($s["teach_q$i"]); ?>"><?php echo intval($s["teach_q$i"]); ?></td>
                            <?php endfor; ?>
                            <td class="td-truncate"><?php echo sanitize($s['teach_open1']); ?></td>
                            <td class="td-truncate"><?php echo sanitize($s['teach_open2']); ?></td>
                            <!-- Resource Persons -->
                            <td>
                                <?php if ($s['resource_persons'] === 'yes'): ?>
                                    <span class="badge badge-green">Yes</span>
                                <?php elseif ($s['resource_persons'] === 'no'): ?>
                                    <span class="badge badge-gray">No</span>
                                <?php else: echo '—'; endif; ?>
                            </td>
                            <td class="td-truncate"><?php echo sanitize($s['resource_persons_options'] ?? ''); ?></td>
                            <!-- Contribution -->
                            <td class="td-truncate"><?php echo sanitize($s['contribution_choice']); ?></td>
                            <td><?php echo $s['contribution_amount'] ? '₹'.number_format($s['contribution_amount'], 2) : '—'; ?></td>
                            <td><?php echo sanitize($s['payment_reference']); ?></td>
                            <td>
                                <?php if ($s['payment_status'] && $s['payment_status'] !== 'N/A'): ?>
                                <span class="badge <?php echo ($s['payment_status'] === 'Paid' || $s['payment_status'] === 'Verified') ? 'badge-green' : 'badge-orange'; ?>">
                                    <?php echo sanitize($s['payment_status']); ?>
                                </span>
                                <?php else: echo '—'; endif; ?>
                            </td>
                            <td>
                                <?php if (!empty($s['payment_screenshot'])): ?>
                                    <a href="uploads/<?php echo urlencode($s['payment_screenshot']); ?>" target="_blank" class="file-link" onclick="event.stopPropagation()">📷 View</a>
                                <?php else: echo '—'; endif; ?>
                            </td>
                            <!-- Date -->
                            <td><?php echo date('d M Y', strtotime($s['submitted_at'])); ?></td>
                        </tr>
                        <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </main>

    <footer class="site-footer">
        <p>&copy; <?php echo date('Y'); ?> <?php echo COLLEGE_NAME; ?></p>
    </footer>

    <script src="admin.js"></script>
</body>
</html>
