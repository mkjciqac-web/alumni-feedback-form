<?php
include 'config.php';
requireAdmin();

if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: admin.php');
    exit;
}

$id = intval($_GET['id'] ?? 0);
if ($id < 1) { header('Location: dashboard.php'); exit; }

$db   = getDB();
$stmt = $db->prepare("SELECT * FROM submissions WHERE id = ?");
$stmt->execute([$id]);
$s = $stmt->fetch();
if (!$s) { header('Location: dashboard.php'); exit; }

/* ── Helper functions ─────────────────────────────────────────────────────── */
function likertClass($val) {
    $val = intval($val);
    if ($val <= 2) return 'likert-low';
    if ($val == 3) return 'likert-mid';
    return 'likert-high';
}

function agreeLabel($val) {
    $labels = [1=>'Strongly Disagree', 2=>'Disagree', 3=>'Neutral', 4=>'Agree', 5=>'Strongly Agree'];
    return $labels[intval($val)] ?? $val;
}

function excellentLabel($val) {
    $labels = [1=>'Un Satisfactory', 2=>'Satisfactory', 3=>'Good', 4=>'Very Good', 5=>'Excellent'];
    return $labels[intval($val)] ?? $val;
}

/* ── Question definitions ─────────────────────────────────────────────────── */
$curriculumQuestions = [
    1 => ['text' => 'Curriculum inculcates creative analytical, problem solving, decision making skills', 'scale' => 'agree'],
    2 => ['text' => 'Programme content includes Project work/field trip/internship/Practical, and it was effective, useful', 'scale' => 'excellent'],
    3 => ['text' => 'The subjects offered were up-to-date and industry-relevant', 'scale' => 'excellent'],
    4 => ['text' => 'Curriculum integrates human values, ethics, environment and Sustainability', 'scale' => 'excellent'],
    5 => ['text' => 'Curriculum Focus on Employability skills like communication, team work, adaptability', 'scale' => 'excellent'],
    6 => ['text' => 'The curriculum allowed me to develop soft skills like time management, conflict resolution, ethics', 'scale' => 'excellent'],
    7 => ['text' => 'Curriculum prepared me to transition from academic to professional life', 'scale' => 'excellent'],
    8 => ['text' => 'Availability of books for Curriculum', 'scale' => 'excellent'],
];

$teachingQuestions = [
    1  => 'Teachers are well prepared and knowledgeable in their subject area',
    2  => 'Teachers effectively communicate complex concepts in an understandable manner',
    3  => 'Teachers use a variety of teaching methods to accommodate different learning styles',
    4  => 'Teachers provide constructive feedback on assignments and examinations',
    5  => 'Teachers are accessible and available for consultation outside of class hours',
    6  => 'Teachers encourage student participation and critical thinking in class',
    7  => 'Teachers integrate real-world examples and current developments into their teaching',
    8  => 'Teachers maintain a positive and inclusive classroom environment',
    9  => 'Use of technology and multimedia tools enhances your learning experience',
    10 => 'Overall satisfaction with the teaching quality',
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Submission #<?php echo $id; ?> – <?php echo SITE_NAME; ?></title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="admin.css">
</head>
<body class="admin-body">

    <header class="admin-header">
        <div class="admin-header-inner">
            <div class="admin-brand">
                <span class="admin-logo">🎓</span>
                <div>
                    <div class="admin-title">Submission Detail – #<?php echo $id; ?></div>
                    <div class="admin-subtitle"><?php echo COLLEGE_NAME; ?></div>
                </div>
            </div>
            <nav class="admin-nav">
                <a href="dashboard.php" class="btn-nav" data-ocid="nav.back_button">← Back to Dashboard</a>
                <a href="settings.php" class="btn-nav" data-ocid="nav.settings_button">⚙ Settings</a>
                <a href="dashboard.php?logout=1" class="btn-nav btn-nav-danger" data-ocid="nav.logout_button" onclick="return confirm('Logout?')">🚪 Logout</a>
            </nav>
        </div>
    </header>

    <main class="admin-main">
        <div class="detail-wrap">

            <!-- ── Registration Info ─────────────────────────────────────── -->
            <div class="detail-card">
                <div class="detail-card-header blue">
                    <h3>👤 Registration Information</h3>
                    <span class="detail-id">ID: #<?php echo $s['id']; ?></span>
                </div>
                <div class="detail-grid">
                    <div class="detail-field">
                        <div class="detail-label">Full Name</div>
                        <div class="detail-value"><?php echo sanitize($s['name']); ?></div>
                    </div>
                    <div class="detail-field">
                        <div class="detail-label">Email</div>
                        <div class="detail-value"><?php echo sanitize($s['email']); ?></div>
                    </div>
                    <div class="detail-field">
                        <div class="detail-label">Phone</div>
                        <div class="detail-value"><?php echo sanitize($s['phone']); ?></div>
                    </div>
                    <div class="detail-field">
                        <div class="detail-label">Degree</div>
                        <div class="detail-value"><?php echo sanitize($s['degree']); ?></div>
                    </div>
                    <div class="detail-field">
                        <div class="detail-label">Department</div>
                        <div class="detail-value"><?php echo sanitize($s['department']); ?></div>
                    </div>
                    <div class="detail-field">
                        <div class="detail-label">Batch</div>
                        <div class="detail-value"><?php echo sanitize($s['batch']); ?></div>
                    </div>
                    <div class="detail-field">
                        <div class="detail-label">Current Status</div>
                        <div class="detail-value">
                            <?php $sc = ['Working'=>'badge-blue','Studying'=>'badge-green','Other'=>'badge-gray'][$s['status']] ?? 'badge-gray'; ?>
                            <span class="badge <?php echo $sc; ?>"><?php echo sanitize($s['status']); ?></span>
                        </div>
                    </div>
                    <div class="detail-field">
                        <div class="detail-label">Occupation</div>
                        <div class="detail-value">
                            <?php echo sanitize($s['occupation']); ?>
                            <?php if ($s['occupation_other']): ?>
                                <em class="text-muted">(<?php echo sanitize($s['occupation_other']); ?>)</em>
                            <?php endif; ?>
                        </div>
                    </div>
                    <div class="detail-field">
                        <div class="detail-label">Submitted At</div>
                        <div class="detail-value"><?php echo date('d M Y, h:i A', strtotime($s['submitted_at'])); ?></div>
                    </div>
                </div>

                <?php if ($s['status'] === 'Working'): ?>
                <div class="detail-sub-section">
                    <h4>Employment Details</h4>
                    <div class="detail-grid">
                        <div class="detail-field">
                            <div class="detail-label">Company Name</div>
                            <div class="detail-value"><?php echo sanitize($s['company_name']) ?: '<em class="not-provided">Not provided</em>'; ?></div>
                        </div>
                        <div class="detail-field">
                            <div class="detail-label">Designation</div>
                            <div class="detail-value"><?php echo sanitize($s['designation']) ?: '<em class="not-provided">Not provided</em>'; ?></div>
                        </div>
                        <div class="detail-field full-width">
                            <div class="detail-label">Company Address</div>
                            <div class="detail-value"><?php echo sanitize($s['company_address']) ?: '<em class="not-provided">Not provided</em>'; ?></div>
                        </div>
                        <div class="detail-field">
                            <div class="detail-label">Appointment Order</div>
                            <div class="detail-value">
                                <?php if ($s['appointment_order']): ?>
                                    <a href="uploads/<?php echo urlencode($s['appointment_order']); ?>" target="_blank" class="file-link">📄 View File</a>
                                <?php else: ?><em class="not-provided">Not uploaded</em><?php endif; ?>
                            </div>
                        </div>
                        <div class="detail-field">
                            <div class="detail-label">Company ID Card</div>
                            <div class="detail-value">
                                <?php if ($s['company_id_card']): ?>
                                    <a href="uploads/<?php echo urlencode($s['company_id_card']); ?>" target="_blank" class="file-link">📄 View File</a>
                                <?php else: ?><em class="not-provided">Not uploaded</em><?php endif; ?>
                            </div>
                        </div>
                    </div>
                </div>
                <?php endif; ?>

                <?php if ($s['status'] === 'Studying'): ?>
                <div class="detail-sub-section">
                    <h4>Study Details</h4>
                    <div class="detail-grid">
                        <div class="detail-field">
                            <div class="detail-label">College / University</div>
                            <div class="detail-value"><?php echo sanitize($s['college_name_field']) ?: '<em class="not-provided">Not provided</em>'; ?></div>
                        </div>
                        <div class="detail-field">
                            <div class="detail-label">Program</div>
                            <div class="detail-value"><?php echo sanitize($s['program']) ?: '<em class="not-provided">Not provided</em>'; ?></div>
                        </div>
                        <div class="detail-field full-width">
                            <div class="detail-label">College Address</div>
                            <div class="detail-value"><?php echo sanitize($s['college_address']) ?: '<em class="not-provided">Not provided</em>'; ?></div>
                        </div>
                        <div class="detail-field">
                            <div class="detail-label">College ID Card</div>
                            <div class="detail-value">
                                <?php if ($s['study_id_card']): ?>
                                    <a href="uploads/<?php echo urlencode($s['study_id_card']); ?>" target="_blank" class="file-link">📄 View File</a>
                                <?php else: ?><em class="not-provided">Not uploaded</em><?php endif; ?>
                            </div>
                        </div>
                    </div>
                </div>
                <?php endif; ?>
            </div>

            <!-- ── Feedback Row ──────────────────────────────────────────── -->
            <div class="feedback-row">
                <!-- Curriculum Feedback -->
                <div class="detail-card">
                    <div class="detail-card-header green">
                        <h3>📚 Curriculum Feedback</h3>
                    </div>
                    <div class="feedback-list">
                        <?php foreach ($curriculumQuestions as $num => $qData): ?>
                        <?php $val = intval($s["curr_q$num"]); ?>
                        <div class="feedback-item">
                            <div class="feedback-q">Q<?php echo $num; ?>. <?php echo htmlspecialchars($qData['text']); ?></div>
                            <div class="feedback-a <?php echo likertClass($val); ?>">
                                <span class="likert-num"><?php echo $val; ?></span>
                                <span class="likert-text">
                                    <?php echo $qData['scale'] === 'agree' ? agreeLabel($val) : excellentLabel($val); ?>
                                </span>
                            </div>
                        </div>
                        <?php endforeach; ?>
                        <div class="feedback-item open-ended">
                            <div class="feedback-q">Q9. What improvements would you suggest for curriculum and teaching?</div>
                            <div class="feedback-answer"><?php echo sanitize($s['curr_open1'] ?? '') ?: '<em class="not-provided">Not answered</em>'; ?></div>
                        </div>
                        <div class="feedback-item open-ended">
                            <div class="feedback-q">Q10. Any additional comments or suggestions?</div>
                            <div class="feedback-answer"><?php echo sanitize($s['curr_open2'] ?? '') ?: '<em class="not-provided">Not answered</em>'; ?></div>
                        </div>
                    </div>
                </div>

                <!-- Teaching Feedback -->
                <div class="detail-card">
                    <div class="detail-card-header purple">
                        <h3>🎓 Teaching &amp; Learning Feedback</h3>
                    </div>
                    <div class="feedback-list">
                        <?php foreach ($teachingQuestions as $num => $question): ?>
                        <?php $val = intval($s["teach_q$num"]); ?>
                        <div class="feedback-item">
                            <div class="feedback-q">Q<?php echo $num; ?>. <?php echo htmlspecialchars($question); ?></div>
                            <div class="feedback-a <?php echo likertClass($val); ?>">
                                <span class="likert-num"><?php echo $val; ?></span>
                                <span class="likert-text"><?php echo excellentLabel($val); ?></span>
                            </div>
                        </div>
                        <?php endforeach; ?>
                        <div class="feedback-item open-ended">
                            <div class="feedback-q">Open Q1. What teaching methods did you find most effective during your studies?</div>
                            <div class="feedback-answer"><?php echo sanitize($s['teach_open1']) ?: '<em class="not-provided">Not answered</em>'; ?></div>
                        </div>
                        <div class="feedback-item open-ended">
                            <div class="feedback-q">Open Q2. What suggestions do you have for improving the overall teaching and learning experience?</div>
                            <div class="feedback-answer"><?php echo sanitize($s['teach_open2']) ?: '<em class="not-provided">Not answered</em>'; ?></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ── Resource Persons ──────────────────────────────────────── -->
            <?php if (!empty($s['resource_persons'])): ?>
            <div class="detail-card">
                <div class="detail-card-header teal">
                    <h3>👥 Resource Persons</h3>
                </div>
                <div class="detail-grid">
                    <div class="detail-field">
                        <div class="detail-label">Can Arrange Resource Persons?</div>
                        <div class="detail-value">
                            <?php if ($s['resource_persons'] === 'yes'): ?>
                                <span class="badge badge-green">Yes</span>
                            <?php else: ?>
                                <span class="badge badge-gray">No</span>
                            <?php endif; ?>
                        </div>
                    </div>
                    <?php if ($s['resource_persons'] === 'yes' && !empty($s['resource_persons_options'])): ?>
                    <div class="detail-field">
                        <div class="detail-label">Type of Resource Persons</div>
                        <div class="detail-value"><?php echo sanitize($s['resource_persons_options']); ?></div>
                    </div>
                    <?php endif; ?>
                </div>
            </div>
            <?php endif; ?>

            <!-- ── Contribution & Payment ─────────────────────────────────── -->
            <?php if (!empty($s['contribution_choice']) && $s['contribution_choice'] !== 'None'): ?>
            <div class="detail-card">
                <div class="detail-card-header orange">
                    <h3>💝 Contribution &amp; Payment Details</h3>
                </div>
                <div class="detail-grid">
                    <div class="detail-field">
                        <div class="detail-label">Contribution For</div>
                        <div class="detail-value"><?php echo sanitize($s['contribution_choice']); ?></div>
                    </div>
                    <?php if ($s['contribution_amount']): ?>
                    <div class="detail-field">
                        <div class="detail-label">Amount</div>
                        <div class="detail-value detail-amount">₹<?php echo number_format($s['contribution_amount'], 2); ?></div>
                    </div>
                    <div class="detail-field">
                        <div class="detail-label">Payment Reference / ID</div>
                        <div class="detail-value"><?php echo sanitize($s['payment_reference']) ?: '<em class="not-provided">Not provided</em>'; ?></div>
                    </div>
                    <div class="detail-field">
                        <div class="detail-label">Razorpay Payment ID</div>
                        <div class="detail-value"><?php echo sanitize($s['razorpay_payment_id']) ?: '<em class="not-provided">N/A</em>'; ?></div>
                    </div>
                    <div class="detail-field">
                        <div class="detail-label">Payment Status</div>
                        <div class="detail-value">
                            <span class="badge <?php echo ($s['payment_status'] === 'Paid' || $s['payment_status'] === 'Verified') ? 'badge-green' : 'badge-orange'; ?>">
                                <?php echo sanitize($s['payment_status'] ?: 'Pending'); ?>
                            </span>
                        </div>
                    </div>
                    <div class="detail-field">
                        <div class="detail-label">Payment Screenshot</div>
                        <div class="detail-value">
                            <?php if (!empty($s['payment_screenshot'])): ?>
                                <a href="uploads/<?php echo urlencode($s['payment_screenshot']); ?>" target="_blank" class="file-link">📷 View Screenshot</a>
                            <?php else: ?><em class="not-provided">Not uploaded</em><?php endif; ?>
                        </div>
                    </div>
                    <?php endif; ?>
                </div>
            </div>
            <?php elseif (!empty($s['contribution_choice']) && $s['contribution_choice'] === 'None'): ?>
            <div class="detail-card">
                <div class="detail-card-header orange">
                    <h3>💝 Willingness to Contribute</h3>
                </div>
                <div class="detail-grid">
                    <div class="detail-field">
                        <div class="detail-label">Contribution Choice</div>
                        <div class="detail-value"><span class="badge badge-gray">None</span></div>
                    </div>
                </div>
            </div>
            <?php endif; ?>

        </div>
    </main>

    <footer class="site-footer">
        <p>&copy; <?php echo date('Y'); ?> <?php echo COLLEGE_NAME; ?></p>
    </footer>

</body>
</html>
