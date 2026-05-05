<?php
include 'config.php';
requireAdmin();

$db          = getDB();
$submissions = $db->query("SELECT * FROM submissions ORDER BY submitted_at DESC")->fetchAll();

// Likert label maps — value 5 is best, value 1 is worst
$q1Labels = [5 => 'Strongly Agree', 4 => 'Agree', 3 => 'Neutral', 2 => 'Disagree', 1 => 'Strongly Disagree'];
$exLabels  = [5 => 'Excellent',     4 => 'Very Good', 3 => 'Good',  2 => 'Satisfactory', 1 => 'Un Satisfactory'];

function likert(array $map, $val): string {
    $v = (int)$val;
    return isset($map[$v]) ? $map[$v] : (string)$val;
}

$filename = 'alumni_feedback_export_' . date('Y-m-d') . '.csv';

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Pragma: no-cache');
header('Expires: 0');

$out = fopen('php://output', 'w');

// UTF-8 BOM for Excel compatibility
fputs($out, "\xEF\xBB\xBF");

// Header row — human-readable labels
fputcsv($out, [
    'ID',
    'Name',
    'Email',
    'Phone',
    'Degree',
    'Department',
    'Batch',
    'Status',
    'Occupation',
    'Occupation (Other)',
    'Company Name',
    'Designation',
    'Company Address',
    'Appointment Order (Uploaded)',
    'Company ID Card (Uploaded)',
    'College Name',
    'Program',
    'College Address',
    'Study ID Card (Uploaded)',
    // Curriculum
    'Curr Q1 – Creative Analytical / Problem Solving Skills',
    'Curr Q2 – Project / Practical Content Effectiveness',
    'Curr Q3 – Subjects Up-to-date & Industry-relevant',
    'Curr Q4 – Human Values, Ethics & Sustainability',
    'Curr Q5 – Employability Skills (Communication, Teamwork)',
    'Curr Q6 – Soft Skills (Time Mgmt, Conflict Resolution)',
    'Curr Q7 – Academic to Professional Transition',
    'Curr Q8 – Availability of Books for Curriculum',
    'Curr Q9 – Improvements Suggested (Open)',
    'Curr Q10 – Additional Comments (Open)',
    // Teaching
    'Teach Q1',
    'Teach Q2',
    'Teach Q3',
    'Teach Q4',
    'Teach Q5',
    'Teach Q6',
    'Teach Q7',
    'Teach Q8',
    'Teach Q9',
    'Teach Q10',
    'Teach Open Q1',
    'Teach Open Q2',
    // Resource Persons
    'Can Arrange Resource Persons (Yes/No)',
    'Resource Persons Options',
    // Contribution & Payment
    'Contribution For',
    'Contribution Amount (₹)',
    'Payment Reference',
    'Payment Status',
    'Razorpay Payment ID',
    'Razorpay Order ID',
    'Razorpay Signature',
    'Payment Screenshot (Uploaded)',
    'Submitted At',
]);

// Data rows
foreach ($submissions as $s) {
    fputcsv($out, [
        $s['id'],
        $s['name'],
        $s['email'],
        $s['phone'],
        $s['degree'],
        $s['department'],
        $s['batch'],
        $s['status'],
        $s['occupation'],
        $s['occupation_other']   ?? '',
        $s['company_name']       ?? '',
        $s['designation']        ?? '',
        $s['company_address']    ?? '',
        $s['appointment_order']  ? 'Yes (file: ' . $s['appointment_order'] . ')' : 'No',
        $s['company_id_card']    ? 'Yes (file: ' . $s['company_id_card']   . ')' : 'No',
        $s['college_name_field'] ?? '',
        $s['program']            ?? '',
        $s['college_address']    ?? '',
        $s['study_id_card']      ? 'Yes (file: ' . $s['study_id_card'] . ')' : 'No',
        // Curriculum Likert (Q1 uses SA/D scale, Q2–Q8 use Excellent scale)
        likert($q1Labels, $s['curr_q1']),
        likert($exLabels, $s['curr_q2']),
        likert($exLabels, $s['curr_q3']),
        likert($exLabels, $s['curr_q4']),
        likert($exLabels, $s['curr_q5']),
        likert($exLabels, $s['curr_q6']),
        likert($exLabels, $s['curr_q7']),
        likert($exLabels, $s['curr_q8']),
        $s['curr_open1'] ?? '',
        $s['curr_open2'] ?? '',
        // Teaching Likert (all Excellent scale)
        likert($exLabels, $s['teach_q1']),
        likert($exLabels, $s['teach_q2']),
        likert($exLabels, $s['teach_q3']),
        likert($exLabels, $s['teach_q4']),
        likert($exLabels, $s['teach_q5']),
        likert($exLabels, $s['teach_q6']),
        likert($exLabels, $s['teach_q7']),
        likert($exLabels, $s['teach_q8']),
        likert($exLabels, $s['teach_q9']),
        likert($exLabels, $s['teach_q10']),
        $s['teach_open1'] ?? '',
        $s['teach_open2'] ?? '',
        // Resource Persons
        $s['resource_persons']         ?? '',
        $s['resource_persons_options'] ?? '',
        // Contribution & Payment
        $s['contribution_choice']   ?? '',
        $s['contribution_amount']   !== null ? '₹' . number_format((float)$s['contribution_amount'], 2) : '',
        $s['payment_reference']     ?? '',
        $s['payment_status']        ?? '',
        $s['razorpay_payment_id']   ?? '',
        $s['razorpay_order_id']     ?? '',
        $s['razorpay_signature']    ?? '',
        $s['payment_screenshot']    ? 'Yes (file: ' . $s['payment_screenshot'] . ')' : 'No',
        $s['submitted_at'],
    ]);
}

fclose($out);
exit;
